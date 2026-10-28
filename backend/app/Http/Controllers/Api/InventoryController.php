<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    // Menampilkan semua stok beserta data gudang dan produk
    public function index()
    {
        $inventories = Inventory::with(['warehouse', 'product'])
            ->latest()
            ->get();

        return response()->json($inventories);
    }

    // Menambahkan stok awal produk di gudang
    public function store(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => [
                'required',
                'integer',
                'exists:warehouses,id',
            ],
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
            'quantity' => 'required|integer|min:0',
            'reorder_level' => 'sometimes|integer|min:0',
        ]);

        $existingInventory = Inventory::where(
            'warehouse_id',
            $validated['warehouse_id']
        )->where(
            'product_id',
            $validated['product_id']
        )->first();

        if ($existingInventory) {
            return response()->json([
                'message' => 'Produk ini sudah terdaftar di gudang tersebut.',
            ], 422);
        }

        $inventory = Inventory::create($validated);

        return response()->json([
            'message' => 'Stok inventaris berhasil ditambahkan.',
            'data' => $inventory->load(['warehouse', 'product']),
        ], 201);
    }

    // Melihat detail satu inventaris
    public function show(Inventory $inventory)
    {
        return response()->json(
            $inventory->load(['warehouse', 'product'])
        );
    }

    // Memperbarui data inventaris
    public function update(Request $request, Inventory $inventory)
    {
        $validated = $request->validate([
            'warehouse_id' => [
                'sometimes',
                'integer',
                'exists:warehouses,id',
            ],
            'product_id' => [
                'sometimes',
                'integer',
                'exists:products,id',
            ],
            'quantity' => 'sometimes|integer|min:0',
            'reorder_level' => 'sometimes|integer|min:0',
        ]);

        $warehouseId = $validated['warehouse_id']
            ?? $inventory->warehouse_id;

        $productId = $validated['product_id']
            ?? $inventory->product_id;

        $duplicate = Inventory::where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->where('id', '!=', $inventory->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'Produk sudah terdaftar di gudang tersebut.',
            ], 422);
        }

        $inventory->update($validated);

        return response()->json([
            'message' => 'Inventaris berhasil diperbarui.',
            'data' => $inventory->fresh()->load(['warehouse', 'product']),
        ]);
    }

    // Menghapus inventaris jika stok sudah nol
    public function destroy(Inventory $inventory)
    {
        if ($inventory->quantity > 0) {
            return response()->json([
                'message' => 'Stok masih tersedia. Kosongkan stok terlebih dahulu.',
            ], 409);
        }

        $inventory->delete();

        return response()->json([
            'message' => 'Inventaris berhasil dihapus.',
        ]);
    }
}
