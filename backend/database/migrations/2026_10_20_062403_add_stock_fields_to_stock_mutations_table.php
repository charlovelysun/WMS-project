
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->string('type')->after('user_id');
            $table->unsignedInteger('quantity')->after('type');
            $table->unsignedInteger('stock_before')->after('quantity');
            $table->unsignedInteger('stock_after')->after('stock_before');
        });
    }

    public function down(): void
    {
        Schema::table('stock_mutations', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'quantity',
                'stock_before',
                'stock_after',
            ]);
        });
    }
};
