<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\StockMutation;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validasi Input
        $validated = $request->validate([
            'from_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'to_warehouse_id'   => ['required', 'integer', 'exists:warehouses,id', 'different:from_warehouse_id'], // Wajib beda dengan gudang asal!
            'product_id'        => ['required', 'integer', 'exists:products,id'],
            'quantity'          => ['required', 'integer', 'min:1'],
            'notes'             => ['nullable', 'string'],
        ], [
            'to_warehouse_id.different' => 'Gudang tujuan tidak boleh sama dengan gudang asal.',
        ]);

        $userId = DB::table('users')->value('id');

        // 2. Ambil Nama Gudang untuk Catatan Mutasi
        $fromWarehouse = Warehouse::findOrFail($validated['from_warehouse_id']);
        $toWarehouse   = Warehouse::findOrFail($validated['to_warehouse_id']);

        // 3. Eksekusi Transaksi Database (Aman dari kegagalan di tengah jalan)
        $result = DB::transaction(function () use ($validated, $userId, $fromWarehouse, $toWarehouse) {
            
            // --- A. PROSES GUDANG ASAL (PENGURANGAN STOK) ---
            $sourceInventory = Inventory::where('warehouse_id', $validated['from_warehouse_id'])
                ->where('product_id', $validated['product_id'])
                ->lockForUpdate() // Kunci baris database agar tidak bentrok dengan transaksi lain
                ->first();

            // Cek apakah produk ada di gudang asal
            if (!$sourceInventory) {
                return [
                    'error' => 'Produk tidak ditemukan di gudang asal.',
                    'status' => 422,
                ];
            }

            // Cek apakah stoknya cukup
            if ($sourceInventory->quantity < $validated['quantity']) {
                return [
                    'error' => "Stok di gudang {$fromWarehouse->name} tidak mencukupi (Tersisa: {$sourceInventory->quantity}).",
                    'status' => 422,
                ];
            }

            $sourceBefore = $sourceInventory->quantity;
            $sourceAfter  = $sourceBefore - $validated['quantity'];
            $sourceInventory->quantity = $sourceAfter;
            $sourceInventory->save();

            // Catat Mutasi KELUAR (OUT) di Gudang Asal
            StockMutation::create([
                'warehouse_id' => $validated['from_warehouse_id'],
                'product_id'   => $validated['product_id'],
                'user_id'      => $userId,
                'type'         => 'out',
                'quantity'     => $validated['quantity'],
                'stock_before' => $sourceBefore,
                'stock_after'  => $sourceAfter,
                'notes'        => 'Transfer keluar ke ' . $toWarehouse->name . ($validated['notes'] ? ': ' . $validated['notes'] : ''),
            ]);


            // --- B. PROSES GUDANG TUJUAN (PENAMBAHAN STOK) ---
            $targetInventory = Inventory::where('warehouse_id', $validated['to_warehouse_id'])
                ->where('product_id', $validated['product_id'])
                ->lockForUpdate()
                ->first();

            // Jika produk belum pernah ada di gudang tujuan, buatkan data stok baru
            if (!$targetInventory) {
                $targetInventory = Inventory::create([
                    'warehouse_id'  => $validated['to_warehouse_id'],
                    'product_id'    => $validated['product_id'],
                    'quantity'      => 0,
                    'reorder_level' => 10,
                ]);
            }

            $targetBefore = $targetInventory->quantity;
            $targetAfter  = $targetBefore + $validated['quantity'];
            $targetInventory->quantity = $targetAfter;
            $targetInventory->save();

            // Catat Mutasi MASUK (IN) di Gudang Tujuan
            StockMutation::create([
                'warehouse_id' => $validated['to_warehouse_id'],
                'product_id'   => $validated['product_id'],
                'user_id'      => $userId,
                'type'         => 'in',
                'quantity'     => $validated['quantity'],
                'stock_before' => $targetBefore,
                'stock_after'  => $targetAfter,
                'notes'        => 'Transfer masuk dari ' . $fromWarehouse->name . ($validated['notes'] ? ': ' . $validated['notes'] : ''),
            ]);

            return ['status' => 200];
        });

        // 4. Cek Jika Ada Error Validasi Bisnis dari dalam Transaksi
        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], $result['status']);
        }

        return response()->json([
            'message' => 'Transfer stok antar gudang berhasil dilakukan.',
        ], 200);
    }
}