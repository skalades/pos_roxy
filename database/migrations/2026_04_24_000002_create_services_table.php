<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('services')) {
            Schema::create('services', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
                $table->foreignId('category_id')->nullable()->constrained()->onDelete('set null');
                $table->string('name');
                $table->text('description')->nullable();
                $table->decimal('price', 15, 2);
                $table->integer('duration_minutes')->default(30);
                $table->decimal('commission_rate', 5, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->string('image')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
