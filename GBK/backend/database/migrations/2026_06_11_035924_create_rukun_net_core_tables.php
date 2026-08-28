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
        Schema::create('family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('relation'); // Suami, Istri, Anak, Orang Tua, dll.
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['L', 'P']);
            $table->timestamps();
        });

        Schema::create('iuran_settings', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['kebersihan', 'air']);
            $table->decimal('amount', 12, 2);
            $table->date('effective_from');
            $table->foreignId('set_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained('houses')->onDelete('cascade');
            $table->integer('month');
            $table->integer('year');
            $table->decimal('kebersihan_amount', 12, 2);
            $table->decimal('air_amount', 12, 2);
            $table->decimal('total_amount', 12, 2);
            $table->enum('status', ['unpaid', 'pending', 'paid_transfer', 'paid_manual'])->default('unpaid');
            $table->enum('payment_method', ['transfer', 'cash', 'none'])->default('none');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique(['house_id', 'month', 'year']);
        });

        Schema::create('payment_proofs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->string('file_path');
            $table->text('notes')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('cash_ledger', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 12, 2);
            $table->string('description');
            $table->enum('payment_method', ['transfer', 'cash']);
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('proof_path')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action');
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->enum('category', ['agenda', 'berita_duka', 'informasi_umum']);
            $table->foreignId('author_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->string('location');
            $table->string('photo_path')->nullable();
            $table->enum('status', ['new', 'reviewing', 'in_progress', 'resolved'])->default('new');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->json('options'); // Array of string options
            $table->timestamp('deadline');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('vote_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vote_id')->constrained('votes')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('chosen_option');
            $table->timestamp('voted_at')->useCurrent();
            $table->timestamps();

            $table->unique(['vote_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vote_responses');
        Schema::dropIfExists('votes');
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('cash_ledger');
        Schema::dropIfExists('payment_proofs');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('iuran_settings');
        Schema::dropIfExists('family_members');
    }
};

