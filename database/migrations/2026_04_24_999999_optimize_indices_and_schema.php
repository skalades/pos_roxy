<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Transaction Items Optimization & Soft Deletes
        if (Schema::hasTable('transaction_items')) {
            Schema::table('transaction_items', function (Blueprint $blueprint) {
                if (!Schema::hasColumn('transaction_items', 'deleted_at')) {
                    $blueprint->softDeletes();
                }
            });
        }

        // 2. Attendances Optimization
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $blueprint) {
                // Check for single column indexes (Laravel 11+ getIndexes)
                $indexes = Schema::getIndexes('attendances');
                $indexNames = array_column($indexes, 'name');

                if (!in_array('attendances_branch_id_index', $indexNames)) {
                    $blueprint->index('branch_id');
                }
                if (!in_array('attendances_user_id_index', $indexNames)) {
                    $blueprint->index('user_id');
                }
                if (!in_array('attendances_status_index', $indexNames)) {
                    $blueprint->index('status');
                }
            });
        }

        // 3. Services Optimization
        if (Schema::hasTable('services')) {
            Schema::table('services', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('services');
                $indexNames = array_column($indexes, 'name');

                if (!in_array('services_branch_id_is_active_index', $indexNames)) {
                    $blueprint->index(['branch_id', 'is_active']);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('transaction_items')) {
            Schema::table('transaction_items', function (Blueprint $blueprint) {
                if (Schema::hasColumn('transaction_items', 'deleted_at')) {
                    $blueprint->dropSoftDeletes();
                }
            });
        }

        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('attendances');
                $indexNames = array_column($indexes, 'name');

                if (in_array('attendances_branch_id_index', $indexNames)) {
                    $blueprint->dropIndex(['branch_id']);
                }
                if (in_array('attendances_user_id_index', $indexNames)) {
                    $blueprint->dropIndex(['user_id']);
                }
                if (in_array('attendances_status_index', $indexNames)) {
                    $blueprint->dropIndex(['status']);
                }
            });
        }

        if (Schema::hasTable('services')) {
            Schema::table('services', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('services');
                $indexNames = array_column($indexes, 'name');

                if (in_array('services_branch_id_is_active_index', $indexNames)) {
                    $blueprint->dropIndex(['branch_id', 'is_active']);
                }
            });
        }
    }
};
