<?php

namespace App\Services\DataCleanup\Modules;

use App\Services\DataCleanup\CleanupModuleInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollRecordsModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'payroll_records';
    }

    public function getName(): string
    {
        return 'Rekapitulasi HR & Payroll';
    }

    public function getDescription(): string
    {
        return 'Menghapus riwayat slip gaji bulanan (payroll_records) beserta rincian komponen tunjangan, bonus, dan potongan pegawai (payroll_components) pada periode terpilih.';
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
        return 'Wallet';
    }

    protected function getQuery(Carbon $startDate, Carbon $endDate, ?int $branchId = null)
    {
        $startPeriod = ($startDate->year * 12) + $startDate->month;
        $endPeriod = ($endDate->year * 12) + $endDate->month;

        $query = DB::table('payroll_records')
            ->whereRaw('((period_year * 12) + period_month) >= ?', [$startPeriod])
            ->whereRaw('((period_year * 12) + period_month) <= ?', [$endPeriod]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query;
    }

    public function preview(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        $query = $this->getQuery($startDate, $endDate, $branchId);
        $recordsCount = $query->count();

        $recordIds = (clone $query)->pluck('id');
        $componentsCount = DB::table('payroll_components')->whereIn('payroll_record_id', $recordIds)->count();

        $totalRecords = $recordsCount + $componentsCount;
        $estimatedBytes = ($recordsCount * 1536) + ($componentsCount * 512);

        return [
            'records' => $totalRecords,
            'files' => 0,
            'bytes' => $estimatedBytes,
            'details' => "{$recordsCount} slip gaji dan {$componentsCount} rincian komponen payroll.",
        ];
    }

    public function cleanup(Carbon $startDate, Carbon $endDate, ?int $branchId = null, array $options = []): array
    {
        $query = $this->getQuery($startDate, $endDate, $branchId);
        $recordIds = $query->pluck('id')->toArray();

        $compDeleted = 0;
        $recDeleted = 0;

        if (!empty($recordIds)) {
            foreach (array_chunk($recordIds, 200) as $chunk) {
                $compDeleted += DB::table('payroll_components')->whereIn('payroll_record_id', $chunk)->delete();
                $recDeleted += DB::table('payroll_records')->whereIn('id', $chunk)->delete();
            }
        }

        $totalDeleted = $compDeleted + $recDeleted;
        $bytesFreed = ($recDeleted * 1536) + ($compDeleted * 512);

        return [
            'records_deleted' => $totalDeleted,
            'files_deleted' => 0,
            'bytes_freed' => $bytesFreed,
            'message' => "Berhasil menghapus {$recDeleted} slip payroll dan {$compDeleted} komponen rincian.",
        ];
    }
}
