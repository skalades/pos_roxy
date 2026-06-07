<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            // NULL  = berlaku untuk semua data termasuk historis
            // Date  = hanya hitung keterlambatan mulai tanggal ini
            $table->date('late_penalty_apply_from')->nullable()->after('late_grace_period_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('late_penalty_apply_from');
        });
    }
};
