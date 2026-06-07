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
        Schema::table('attendances', function (Blueprint $table) {
            // Jumlah menit keterlambatan (0 jika on time)
            if (!Schema::hasColumn('attendances', 'late_minutes')) {
                $table->unsignedInteger('late_minutes')
                    ->default(0)
                    ->after('clock_in_on_time')
                    ->comment('Jumlah menit keterlambatan saat clock-in (0 jika tepat waktu)');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn('late_minutes');
        });
    }
};
