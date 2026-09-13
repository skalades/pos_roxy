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
        // 1. Transactions Index
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $blueprint) {
                // Laravel 11+ getIndexes
                $indexes = Schema::getIndexes('transactions');
                $indexNames = array_column($indexes, 'name');

                if (!in_array('transactions_created_at_index', $indexNames)) {
                    $blueprint->index('created_at');
                }
                if (!in_array('transactions_branch_id_index', $indexNames)) {
                    $blueprint->index('branch_id');
                }
                if (!in_array('transactions_status_index', $indexNames)) {
                    $blueprint->index('status');
                }
                if (!in_array('transactions_transaction_number_index', $indexNames)) {
                    $blueprint->index('transaction_number');
                }
            });
        }

        // 2. Transaction Items Index
        if (Schema::hasTable('transaction_items')) {
            Schema::table('transaction_items', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('transaction_items');
                $indexNames = array_column($indexes, 'name');

                if (!in_array('transaction_items_transaction_id_index', $indexNames)) {
                    $blueprint->index('transaction_id');
                }
                if (!in_array('transaction_items_barber_id_index', $indexNames)) {
                    $blueprint->index('barber_id');
                }
            });
        }

        // 3. Attendances Additional Index
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('attendances');
                $indexNames = array_column($indexes, 'name');

                if (!in_array('attendances_date_index', $indexNames)) {
                    $blueprint->index('date');
                }
                if (!in_array('attendances_clock_in_on_time_index', $indexNames)) {
                    $blueprint->index('clock_in_on_time');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('transactions');
                $indexNames = array_column($indexes, 'name');

                if (in_array('transactions_created_at_index', $indexNames)) {
                    $blueprint->dropIndex(['created_at']);
                }
                if (in_array('transactions_branch_id_index', $indexNames)) {
                    $blueprint->dropIndex(['branch_id']);
                }
                if (in_array('transactions_status_index', $indexNames)) {
                    $blueprint->dropIndex(['status']);
                }
                if (in_array('transactions_transaction_number_index', $indexNames)) {
                    $blueprint->dropIndex(['transaction_number']);
                }
            });
        }

        if (Schema::hasTable('transaction_items')) {
            Schema::table('transaction_items', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('transaction_items');
                $indexNames = array_column($indexes, 'name');

                if (in_array('transaction_items_transaction_id_index', $indexNames)) {
                    $blueprint->dropIndex(['transaction_id']);
                }
                if (in_array('transaction_items_barber_id_index', $indexNames)) {
                    $blueprint->dropIndex(['barber_id']);
                }
            });
        }

        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $blueprint) {
                $indexes = Schema::getIndexes('attendances');
                $indexNames = array_column($indexes, 'name');

                if (in_array('attendances_date_index', $indexNames)) {
                    $blueprint->dropIndex(['date']);
                }
                if (in_array('attendances_clock_in_on_time_index', $indexNames)) {
                    $blueprint->dropIndex(['clock_in_on_time']);
                }
            });
        }
    }
};
