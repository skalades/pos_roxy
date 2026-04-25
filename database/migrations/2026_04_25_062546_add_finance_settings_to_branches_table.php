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
            if (!Schema::hasColumn('branches', 'enable_tax')) {
                $table->boolean('enable_tax')->default(false)->after('tax_rate');
            }
            if (!Schema::hasColumn('branches', 'late_penalty_amount')) {
                $table->decimal('late_penalty_amount', 15, 2)->default(0)->after('enable_tax');
            }
            if (!Schema::hasColumn('branches', 'enable_attendance_deduction')) {
                $table->boolean('enable_attendance_deduction')->default(false)->after('late_penalty_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['enable_tax', 'late_penalty_amount', 'enable_attendance_deduction']);
        });
    }
};
