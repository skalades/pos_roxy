<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->default(10.00)
                ->after('closing_time')
                ->comment('Tax rate percentage for this branch (e.g. 10.00 = 10%)');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('tax_rate');
        });
    }
};
