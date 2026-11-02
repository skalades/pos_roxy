<?php

namespace App\Services\DataCleanup\Modules;

use App\Models\Shift;
use App\Services\DataCleanup\CleanupModuleInterface;
use Carbon\Carbon;

class ShiftsModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'shifts';
    }

    public function getName(): string
    {
        return 'Riwayat Shift Kasir (Closed)';
    }

    public function getDescription(): string
    {
        return 'Menghapus riwayat shift kasir yang berstatus Closed pada periode terpilih. Shift yang sedang aktif/terbuka tidak akan disentuh.';
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
        return 'Store';
    }

    protected function getQuery(Carbon $startDate, Carbon $endDate, ?int $branchId = null)
    {
        $query = Shift::where('status', 'closed')
            ->whereBetween('opened_at', [$startDate, $endDate]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query;
    }

    public function preview(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        $count = $this->getQuery($startDate, $endDate, $branchId)->count();
        $estimatedBytes = $count * 512;

        return [
            'records' => $count,
            'files' => 0,
            'bytes' => $estimatedBytes,
            'details' => "{$count} sesi shift kasir tertutup.",
        ];
    }

    public function cleanup(Carbon $startDate, Carbon $endDate, ?int $branchId = null, array $options = []): array
    {
        $deleted = 0;

        $this->getQuery($startDate, $endDate, $branchId)
            ->chunkById(100, function ($shifts) use (&$deleted) {
                $ids = $shifts->pluck('id')->toArray();
                $deleted += Shift::whereIn('id', $ids)->delete();
            });

        return [
            'records_deleted' => $deleted,
            'files_deleted' => 0,
            'bytes_freed' => $deleted * 512,
            'message' => "Berhasil menghapus {$deleted} riwayat shift kasir tertutup.",
        ];
    }
}
