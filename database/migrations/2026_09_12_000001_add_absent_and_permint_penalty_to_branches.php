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
            // Denda per-menit (alternatif dari sistem interval)
            // Jika diset > 0, PayrollService akan memakai mode per-menit
            // bukan mode per-interval.
            if (!Schema::hasColumn('branches', 'late_penalty_per_minute')) {
                $table->decimal('late_penalty_per_minute', 15, 2)
                    ->default(0)
                    ->after('late_penalty_per_interval')
                    ->comment('Nominal denda per menit keterlambatan (jika > 0, gunakan mode per-menit)');
            }

            // Toggle denda tidak masuk (alpha)
            if (!Schema::hasColumn('branches', 'enable_absent_penalty')) {
                $table->boolean('enable_absent_penalty')
                    ->default(false)
                    ->after('late_penalty_per_minute')
                    ->comment('Aktifkan potongan untuk karyawan yang tidak masuk tanpa keterangan');
            }

            // Nominal denda per hari tidak masuk (alpha)
            if (!Schema::hasColumn('branches', 'absent_penalty_amount')) {
                $table->decimal('absent_penalty_amount', 15, 2)
                    ->default(0)
                    ->after('enable_absent_penalty')
                    ->comment('Nominal potongan per hari tidak masuk tanpa keterangan (alpha)');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn([
                'late_penalty_per_minute',
                'enable_absent_penalty',
                'absent_penalty_amount',
            ]);
        });
    }
};
