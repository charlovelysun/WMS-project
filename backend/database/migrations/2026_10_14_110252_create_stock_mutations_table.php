<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stock_mutations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('warehouse_id')
            ->constrained()
            ->restrictOnDelete();

            $table->foreignId('product_id')
            ->constrained()
            ->restrictOnDelete();

            $table->foreignId('user_id')
            ->constrained()
            ->restrictOnDelete();

            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['warehouse_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_mutations');
    }
};
