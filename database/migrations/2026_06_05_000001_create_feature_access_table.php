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
        Schema::create('feature_access', function (Blueprint $table) {
            $table->id();
            $table->string('feature_key', 50)->index();
            $table->string('role', 20)->index();
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['feature_key', 'role'], 'feature_role_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feature_access');
    }
};
