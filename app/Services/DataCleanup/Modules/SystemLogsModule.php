<?php

namespace App\Services\DataCleanup\Modules;

use App\Services\DataCleanup\CleanupModuleInterface;
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
        return 'Menghapus file log aplikasi di folder storage/logs (laravel-YYYY-MM-*.log) dan antrean pekerjaan gagal (failed_jobs) pada bulan & tahun terpilih untuk mengurangi beban hard drive server.';
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

    protected function getMatchingLogFiles(int $year, int $month): array
    {
        $logDir = storage_path('logs');
        if (!File::isDirectory($logDir)) {
            return [];
        }

        $formattedMonth = str_pad($month, 2, '0', STR_PAD_LEFT);
        $pattern = "laravel-{$year}-{$formattedMonth}-*.log";
        $files = File::glob($logDir . DIRECTORY_SEPARATOR . $pattern);

        // Also check if single laravel.log has last modified date matching year and month if older
        return $files ?: [];
    }

    public function preview(int $year, int $month, ?int $branchId = null): array
    {
        $files = $this->getMatchingLogFiles($year, $month);
        $totalBytes = 0;
        foreach ($files as $file) {
            $totalBytes += File::size($file);
        }

        $failedJobsCount = 0;
        try {
            $failedJobsCount = DB::table('failed_jobs')
                ->whereYear('failed_at', $year)
                ->whereMonth('failed_at', $month)
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

    public function cleanup(int $year, int $month, ?int $branchId = null, array $options = []): array
    {
        $files = $this->getMatchingLogFiles($year, $month);
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
                ->whereYear('failed_at', $year)
                ->whereMonth('failed_at', $month)
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
