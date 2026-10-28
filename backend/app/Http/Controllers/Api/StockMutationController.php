<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\StockMutation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockMutationController extends Controller
{
    public function index()
    {
        $mutations = StockMutation::with([
            'warehouse',
            'product',
            'user',
        ])->latest()->get();

        return response()->json($mutations);
    }

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
            'type' => [
                'required',
                Rule::in(['in', 'out']),
            ],
            'quantity' => [
                'required',
                'integer',
                'min:1',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $userId = DB::table('users')->value('id');

        if (!$userId) {
            return response()->json([
                'message' => 'Belum ada pengguna di database.',
            ], 422);
        }

        $result = DB::transaction(function () use (
            $validated,
            $userId
        ) {
            $inventory = Inventory::where(
                'warehouse_id',
                $validated['warehouse_id']
            )->where(
                'product_id',
                $validated['product_id']
            )->lockForUpdate()->first();

            if (!$inventory) {
                return [
                    'error' => 'Produk belum terdaftar di inventaris gudang ini.',
                    'status' => 422,
                ];
            }

            $stockBefore = $inventory->quantity;
            $quantity = $validated['quantity'];

            if ($validated['type'] === 'in') {
                $stockAfter = $stockBefore + $quantity;
            } else {
                if ($stockBefore < $quantity) {
                    return [
                        'error' => 'Stok tidak mencukupi untuk barang keluar.',
                        'status' => 422,
                    ];
                }

                $stockAfter = $stockBefore - $quantity;
            }

            $inventory->quantity = $stockAfter;
            $inventory->save();

            $mutation = StockMutation::create([
                'warehouse_id' => $validated['warehouse_id'],
                'product_id' => $validated['product_id'],
                'user_id' => $userId,
                'type' => $validated['type'],
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'notes' => $validated['notes'] ?? null,
            ]);

            return [
                'data' => $mutation->load([
                    'warehouse',
                    'product',
                    'user',
                ]),
                'stock_after' => $stockAfter,
            ];
        });

        if (isset($result['error'])) {
            return response()->json([
                'message' => $result['error'],
            ], $result['status']);
        }

        return response()->json([
            'message' => 'Mutasi stok berhasil disimpan.',
            'data' => $result['data'],
            'stock_after' => $result['stock_after'],
        ], 201);
    }
}
