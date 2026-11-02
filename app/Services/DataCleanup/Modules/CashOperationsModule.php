<?php

namespace App\Services\DataCleanup\Modules;

use App\Models\CashOperation;
use App\Services\DataCleanup\CleanupModuleInterface;

class CashOperationsModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'cash_operations';
    }

    public function getName(): string
    {
        return 'Pengeluaran & Operasional Kas';
    }

    public function getDescription(): string
    {
        return 'Menghapus catatan pengeluaran harian cabang (cash_out), penambahan kas (cash_in), dan rekonsiliasi kas pada bulan & tahun terpilih.';
    }

    public function getCategory(): string
    {
        return 'database';
    }

    public function getImpactLevel(): string
    {
        return 'medium';
    }

    public function getIcon(): string
    {
        return 'Banknote';
    }

    protected function getQuery(int $year, int $month, ?int $branchId = null)
    {
        $query = CashOperation::whereYear('created_at', $year)
            ->whereMonth('created_at', $month);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query;
    }

    public function preview(int $year, int $month, ?int $branchId = null): array
    {
        $count = $this->getQuery($year, $month, $branchId)->count();
        $estimatedBytes = $count * 512;

        return [
            'records' => $count,
            'files' => 0,
            'bytes' => $estimatedBytes,
            'details' => "{$count} catatan operasional kas / pengeluaran.",
        ];
    }

    public function cleanup(int $year, int $month, ?int $branchId = null, array $options = []): array
    {
        $deleted = 0;

        $this->getQuery($year, $month, $branchId)
            ->chunkById(100, function ($operations) use (&$deleted) {
                $ids = $operations->pluck('id')->toArray();
                $deleted += CashOperation::whereIn('id', $ids)->delete();
            });

        return [
            'records_deleted' => $deleted,
            'files_deleted' => 0,
            'bytes_freed' => $deleted * 512,
            'message' => "Berhasil menghapus {$deleted} catatan pengeluaran & kas.",
        ];
    }
}
