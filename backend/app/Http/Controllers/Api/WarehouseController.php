<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WarehouseController extends Controller
{
    public function index()
    {
        return response()->json(
            Warehouse::latest()->get()
        );  
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:warehouses,code'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json([
            'message' => 'Gudang berhasil ditambahkan.',
            'data' => $warehouse,
        ], 201);
    }

    public function show(Warehouse $warehouse)
    {
        return response()->json($warehouse);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('warehouses', 'code')
                    ->ignore($warehouse->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $warehouse->update($validated);

        return response()->json([
            'message' => 'Gudang berhasil diperbarui.',
            'data' => $warehouse,
        ]);
    }

    public function destroy(Warehouse $warehouse)
    {
        if (
            $warehouse->inventories()->exists() ||
            $warehouse->stockMutations()->exists()
        ) {
            return response()->json([
                'message' => 'Gudang memiliki riwayat stok dan tidak dapat dihapus.',
            ], 409);
        }

        $warehouse->delete();

        return response()->json([
            'message' => 'Gudang berhasil dihapus.',
        ]);
    }
}

