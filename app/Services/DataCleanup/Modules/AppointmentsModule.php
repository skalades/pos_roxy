<?php

namespace App\Services\DataCleanup\Modules;

use App\Models\Appointment;
use App\Services\DataCleanup\CleanupModuleInterface;
use Carbon\Carbon;

class AppointmentsModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'appointments';
    }

    public function getName(): string
    {
        return 'Reservasi & Janji Temu';
    }

    public function getDescription(): string
    {
        return 'Menghapus data riwayat janji temu / booking layanan pelanggan pada periode terpilih.';
    }

    public function getCategory(): string
    {
        return 'database';
    }

    public function getImpactLevel(): string
    {
        return 'low';
    }

    public function getIcon(): string
    {
        return 'Clock';
    }

    protected function getQuery(Carbon $startDate, Carbon $endDate, ?int $branchId = null)
    {
        $query = Appointment::whereBetween('appointment_date', [$startDate->toDateString(), $endDate->toDateString()]);

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
            'details' => "{$count} data riwayat booking / reservasi.",
        ];
    }

    public function cleanup(Carbon $startDate, Carbon $endDate, ?int $branchId = null, array $options = []): array
    {
        $deleted = 0;

        $this->getQuery($startDate, $endDate, $branchId)
            ->chunkById(100, function ($appointments) use (&$deleted) {
                $ids = $appointments->pluck('id')->toArray();
                $deleted += Appointment::whereIn('id', $ids)->delete();
            });

        return [
            'records_deleted' => $deleted,
            'files_deleted' => 0,
            'bytes_freed' => $deleted * 512,
            'message' => "Berhasil menghapus {$deleted} data reservasi pelanggan.",
        ];
    }
}
