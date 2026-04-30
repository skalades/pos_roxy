<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('user_profiles')) {
            Schema::create('user_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->decimal('monthly_salary', 12, 2)->default(0);
                $table->decimal('commission_rate', 5, 2)->default(0);
                $table->date('hire_date')->nullable();
                $table->time('work_start_time')->default('09:30:00');
                $table->time('work_end_time')->default('20:00:00');
                $table->string('day_off')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
