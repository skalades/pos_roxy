<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_stock_logs')) {
            Schema::create('product_stock_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('type'); // in, out, adjustment, sale
                $table->integer('quantity'); // positive for in, negative for out
                $table->integer('old_stock');
                $table->integer('new_stock');
                $table->string('reason')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_stock_logs');
    }
};
