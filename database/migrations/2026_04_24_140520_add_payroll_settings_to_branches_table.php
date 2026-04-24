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
        Schema::table('branches', function (Blueprint $table) {
            $table->boolean('enable_attendance_deduction')->default(false)->after('tax_rate');
            $table->decimal('late_penalty_amount', 15, 2)->default(0)->after('enable_attendance_deduction');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['enable_attendance_deduction', 'late_penalty_amount']);
        });
    }
};
