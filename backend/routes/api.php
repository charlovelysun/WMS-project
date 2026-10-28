<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\StockMutationController;
use App\Http\Controllers\Api\StockTransferController;

Route::apiResource('warehouses', WarehouseController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('inventories', InventoryController::class);
Route::apiResource(
    'stock-mutations',
    StockMutationController::class
)->only(['index', 'store']);
Route::post('stock-transfers', [StockTransferController::class, 'store']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
