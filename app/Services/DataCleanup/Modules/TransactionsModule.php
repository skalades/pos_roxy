<?php

namespace App\Services\DataCleanup\Modules;

use App\Models\Transaction;
use App\Services\DataCleanup\CleanupModuleInterface;
use Illuminate\Support\Facades\DB;

class TransactionsModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'transactions';
    }

    public function getName(): string
    {
        return 'Transaksi Kasir & Riwayat Penjualan';
    }

    public function getDescription(): string
    {
        return 'Menghapus riwayat transaksi penjualan POS, rincian produk/layanan (transaction_items), catatan komisi barber (commissions), dan poin loyalitas pada bulan & tahun terpilih.';
    }

    public function getCategory(): string
    {
        return 'database';
    }

    public function getImpactLevel(): string
    {
        return 'high';
    }

    public function getIcon(): string
    {
        return 'ShoppingBag';
    }

    protected function getQuery(int $year, int $month, ?int $branchId = null)
    {
        $query = Transaction::withTrashed()
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query;
    }

    public function preview(int $year, int $month, ?int $branchId = null): array
    {
        $query = $this->getQuery($year, $month, $branchId);
        $txCount = $query->count();

        $txIds = (clone $query)->pluck('id');

        $itemsCount = DB::table('transaction_items')->whereIn('transaction_id', $txIds)->count();
        $commissionsCount = DB::table('commissions')->whereIn('transaction_id', $txIds)->count();
        $loyaltyCount = DB::table('customer_loyalty_transactions')->whereIn('transaction_id', $txIds)->count();
        $requestsCount = DB::table('transaction_deletion_requests')->whereIn('transaction_id', $txIds)->count();

        $totalRecords = $txCount + $itemsCount + $commissionsCount + $loyaltyCount + $requestsCount;
        // Estimated DB bytes: tx ~ 2KB, items ~ 1KB, comm ~ 500B
        $estimatedBytes = ($txCount * 2048) + ($itemsCount * 1024) + ($commissionsCount * 512);

        return [
            'records' => $totalRecords,
            'files' => 0,
            'bytes' => $estimatedBytes,
            'details' => "{$txCount} transaksi, {$itemsCount} item, {$commissionsCount} komisi, {$loyaltyCount} riwayat loyalty.",
        ];
    }

    public function cleanup(int $year, int $month, ?int $branchId = null, array $options = []): array
    {
        $totalDeleted = 0;
        $bytesFreed = 0;

        $this->getQuery($year, $month, $branchId)
            ->chunkById(100, function ($transactions) use (&$totalDeleted, &$bytesFreed) {
                $ids = $transactions->pluck('id')->toArray();

                // 1. Delete commissions
                $commDeleted = DB::table('commissions')->whereIn('transaction_id', $ids)->delete();
                $totalDeleted += $commDeleted;

                // 2. Delete loyalty transactions
                $loyaltyDeleted = DB::table('customer_loyalty_transactions')->whereIn('transaction_id', $ids)->delete();
                $totalDeleted += $loyaltyDeleted;

                // 3. Delete transaction deletion requests
                $reqDeleted = DB::table('transaction_deletion_requests')->whereIn('transaction_id', $ids)->delete();
                $totalDeleted += $reqDeleted;

                // 4. Delete transaction items
                $itemsDeleted = DB::table('transaction_items')->whereIn('transaction_id', $ids)->delete();
                $totalDeleted += $itemsDeleted;

                // 5. Force delete transactions (including soft-deleted)
                $txDeleted = DB::table('transactions')->whereIn('id', $ids)->delete();
                $totalDeleted += $txDeleted;

                $bytesFreed += ($txDeleted * 2048) + ($itemsDeleted * 1024) + ($commDeleted * 512);
            });

        return [
            'records_deleted' => $totalDeleted,
            'files_deleted' => 0,
            'bytes_freed' => $bytesFreed,
            'message' => "Berhasil menghapus {$totalDeleted} rekor transaksi kasir dan detail terkait.",
        ];
    }
}
