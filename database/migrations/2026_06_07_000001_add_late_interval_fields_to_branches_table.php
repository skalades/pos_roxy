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
            // Interval waktu (menit) untuk satu satuan potongan
            // Contoh: 5 → setiap 5 menit telat = 1 interval
            if (!Schema::hasColumn('branches', 'late_penalty_interval')) {
                $table->unsignedInteger('late_penalty_interval')
                    ->default(5)
                    ->after('late_penalty_amount')
                    ->comment('Interval menit untuk satu satuan denda (default: 5 menit)');
            }

            // Besaran denda per satu interval
            // Contoh: 2000 → setiap interval = Rp 2.000
            if (!Schema::hasColumn('branches', 'late_penalty_per_interval')) {
                $table->decimal('late_penalty_per_interval', 15, 2)
                    ->default(0)
                    ->after('late_penalty_interval')
                    ->comment('Nominal denda per interval keterlambatan');
            }

            // Toleransi menit sebelum mulai dihitung telat
            // Contoh: 10 → telat < 10 menit tidak dihitung
            if (!Schema::hasColumn('branches', 'late_grace_period_minutes')) {
                $table->unsignedInteger('late_grace_period_minutes')
                    ->default(0)
                    ->after('late_penalty_per_interval')
                    ->comment('Toleransi menit sebelum potongan mulai berlaku (0 = tidak ada toleransi)');
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
                'late_penalty_interval',
                'late_penalty_per_interval',
                'late_grace_period_minutes',
            ]);
        });
    }
};
