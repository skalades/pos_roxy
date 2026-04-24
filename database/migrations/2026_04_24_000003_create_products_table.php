<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
                $table->foreignId('category_id')->nullable()->constrained()->onDelete('set null');
                $table->string('name');
                $table->text('description')->nullable();
                $table->decimal('price', 15, 2);
                $table->decimal('cost_price', 15, 2)->default(0);
                $table->integer('stock_quantity')->default(0);
                $table->integer('min_stock_level')->default(5);
                $table->string('barcode')->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('image')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
