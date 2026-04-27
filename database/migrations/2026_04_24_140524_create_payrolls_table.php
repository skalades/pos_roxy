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
        if (!Schema::hasTable('payrolls')) {
            Schema::create('payrolls', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('branch_id')->constrained()->onDelete('cascade');
                $table->string('period'); // YYYY-MM
                $table->decimal('base_salary', 15, 2)->default(0);
                $table->decimal('total_commission', 15, 2)->default(0);
                $table->decimal('total_deduction', 15, 2)->default(0);
                $table->decimal('net_salary', 15, 2)->default(0);
                $table->enum('status', ['draft', 'paid'])->default('draft');
                $table->text('notes')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->foreignId('processed_by')->nullable()->constrained('users');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
