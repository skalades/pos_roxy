<?php

namespace App\Services\DataCleanup\Modules;

use App\Services\DataCleanup\CleanupModuleInterface;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SystemLogsModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'system_logs';
    }

    public function getName(): string
    {
        return 'Log Server & Antrean Gagal (Storage & DB)';
    }

    public function getDescription(): string
    {
        return 'Menghapus file log aplikasi di folder storage/logs (laravel-YYYY-MM-*.log) dan antrean pekerjaan gagal (failed_jobs) pada periode terpilih untuk mengurangi beban hard drive server.';
    }

    public function getCategory(): string
    {
        return 'system';
    }

    public function getImpactLevel(): string
    {
        return 'low';
    }

    public function getIcon(): string
    {
        return 'Terminal';
    }

    protected function getMatchingLogFiles(Carbon $startDate, Carbon $endDate): array
    {
        $logDir = storage_path('logs');
        if (!File::isDirectory($logDir)) {
            return [];
        }

        $matchedFiles = [];
        // Loop through each month in the period
        $period = CarbonPeriod::create($startDate->copy()->startOfMonth(), '1 month', $endDate->copy()->startOfMonth());

        foreach ($period as $dt) {
            $year = $dt->year;
            $month = str_pad($dt->month, 2, '0', STR_PAD_LEFT);
            $pattern = "laravel-{$year}-{$month}-*.log";
            $files = File::glob($logDir . DIRECTORY_SEPARATOR . $pattern);
            if ($files) {
                $matchedFiles = array_merge($matchedFiles, $files);
            }
        }

        return array_unique($matchedFiles);
    }

    public function preview(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        $files = $this->getMatchingLogFiles($startDate, $endDate);
        $totalBytes = 0;
        foreach ($files as $file) {
            $totalBytes += File::size($file);
        }

        $failedJobsCount = 0;
        try {
            $failedJobsCount = DB::table('failed_jobs')
                ->whereBetween('failed_at', [$startDate, $endDate])
                ->count();
            $totalBytes += ($failedJobsCount * 1024);
        } catch (\Throwable $e) {}

        $fileCount = count($files);

        return [
            'records' => $failedJobsCount,
            'files' => $fileCount,
            'bytes' => $totalBytes,
            'details' => "{$fileCount} file log server dan {$failedJobsCount} failed jobs.",
        ];
    }

    public function cleanup(Carbon $startDate, Carbon $endDate, ?int $branchId = null, array $options = []): array
    {
        $files = $this->getMatchingLogFiles($startDate, $endDate);
        $filesDeleted = 0;
        $bytesFreed = 0;

        foreach ($files as $file) {
            try {
                $size = File::size($file);
                if (File::delete($file)) {
                    $filesDeleted++;
                    $bytesFreed += $size;
                }
            } catch (\Throwable $e) {}
        }

        $recordsDeleted = 0;
        try {
            $recordsDeleted = DB::table('failed_jobs')
                ->whereBetween('failed_at', [$startDate, $endDate])
                ->delete();
            $bytesFreed += ($recordsDeleted * 1024);
        } catch (\Throwable $e) {}

        return [
            'records_deleted' => $recordsDeleted,
            'files_deleted' => $filesDeleted,
            'bytes_freed' => $bytesFreed,
            'message' => "Berhasil menghapus {$filesDeleted} file log dan {$recordsDeleted} failed jobs.",
        ];
    }
}
