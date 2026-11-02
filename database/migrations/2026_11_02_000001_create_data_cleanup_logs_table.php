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
        if (!Schema::hasTable('data_cleanup_logs')) {
            Schema::create('data_cleanup_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->integer('year')->nullable();
                $table->integer('month')->nullable();
                $table->integer('start_year')->nullable();
                $table->integer('start_month')->nullable();
                $table->integer('end_year')->nullable();
                $table->integer('end_month')->nullable();
                $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
                $table->json('modules');
                $table->unsignedBigInteger('records_deleted')->default(0);
                $table->unsignedBigInteger('files_deleted')->default(0);
                $table->unsignedBigInteger('bytes_freed')->default(0);
                $table->json('summary')->nullable();
                $table->json('options')->nullable();
                $table->timestamps();

                $table->index(['start_year', 'start_month']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_cleanup_logs');
    }
};
