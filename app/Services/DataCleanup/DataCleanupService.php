<?php

namespace App\Services\DataCleanup;

use App\Models\DataCleanupLog;
use App\Services\BaseService;
use App\Services\DataCleanup\Modules\AttendancePhotosModule;
use App\Services\DataCleanup\Modules\AttendanceRecordsModule;
use App\Services\DataCleanup\Modules\TransactionsModule;
use App\Services\DataCleanup\Modules\CashOperationsModule;
use App\Services\DataCleanup\Modules\ShiftsModule;
use App\Services\DataCleanup\Modules\AppointmentsModule;
use App\Services\DataCleanup\Modules\PayrollRecordsModule;
use App\Services\DataCleanup\Modules\SystemLogsModule;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class DataCleanupService extends BaseService
{
    /**
     * @var array<string, CleanupModuleInterface>
     */
    protected array $modules = [];

    public function __construct()
    {
        $this->registerDefaultModules();
    }

    /**
     * Register default cleanup modules.
     * Easy to extend or configure.
     */
    protected function registerDefaultModules(): void
    {
        $defaultModules = [
            new AttendancePhotosModule(),
            new AttendanceRecordsModule(),
            new TransactionsModule(),
            new CashOperationsModule(),
            new ShiftsModule(),
            new AppointmentsModule(),
            new PayrollRecordsModule(),
            new SystemLogsModule(),
        ];

        foreach ($defaultModules as $module) {
            $this->registerModule($module);
        }
    }

    /**
     * Register a module into the service.
     */
    public function registerModule(CleanupModuleInterface $module): void
    {
        $this->modules[$module->getId()] = $module;
    }

    /**
     * Get all registered modules.
     *
     * @return array<string, CleanupModuleInterface>
     */
    public function getModules(): array
    {
        return $this->modules;
    }

    /**
     * Get a specific module by ID.
     */
    public function getModule(string $id): ?CleanupModuleInterface
    {
        return $this->modules[$id] ?? null;
    }

    /**
     * Get serializable metadata of all modules for UI presentation.
     */
    public function getModulesMetadata(): array
    {
        $list = [];
        foreach ($this->modules as $module) {
            $list[] = [
                'id' => $module->getId(),
                'name' => $module->getName(),
                'description' => $module->getDescription(),
                'category' => $module->getCategory(),
                'impact' => $module->getImpactLevel(),
                'icon' => $module->getIcon(),
            ];
        }

        return $list;
    }

    /**
     * Preview cleanup impact for selected modules, month, year, and optional branch.
     */
    public function preview(int $year, int $month, ?int $branchId = null, array $selectedModuleIds = []): array
    {
        $targetModules = empty($selectedModuleIds)
            ? array_keys($this->modules)
            : array_intersect($selectedModuleIds, array_keys($this->modules));

        $totalRecords = 0;
        $totalFiles = 0;
        $totalBytes = 0;
        $breakdown = [];

        foreach ($targetModules as $moduleId) {
            $module = $this->modules[$moduleId];
            try {
                $previewData = $module->preview($year, $month, $branchId);
                $totalRecords += $previewData['records'];
                $totalFiles += $previewData['files'];
                $totalBytes += $previewData['bytes'];

                $breakdown[$moduleId] = [
                    'id' => $moduleId,
                    'name' => $module->getName(),
                    'category' => $module->getCategory(),
                    'records' => $previewData['records'],
                    'files' => $previewData['files'],
                    'bytes' => $previewData['bytes'],
                    'formatted_size' => $this->formatBytes($previewData['bytes']),
                    'details' => $previewData['details'],
                ];
            } catch (\Throwable $e) {
                Log::warning("Error previewing module {$moduleId}: " . $e->getMessage());
                $breakdown[$moduleId] = [
                    'id' => $moduleId,
                    'name' => $module->getName(),
                    'category' => $module->getCategory(),
                    'records' => 0,
                    'files' => 0,
                    'bytes' => 0,
                    'formatted_size' => '0 B',
                    'details' => 'Tidak dapat menganalisa modul ini.',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'year' => $year,
            'month' => $month,
            'branch_id' => $branchId,
            'total_records' => $totalRecords,
            'total_files' => $totalFiles,
            'total_bytes' => $totalBytes,
            'formatted_total_size' => $this->formatBytes($totalBytes),
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Execute cleanup for selected modules.
     */
    public function cleanup(int $year, int $month, ?int $branchId = null, array $selectedModuleIds = [], array $options = [], ?int $userId = null): array
    {
        $targetModules = empty($selectedModuleIds)
            ? array_keys($this->modules)
            : array_intersect($selectedModuleIds, array_keys($this->modules));

        $totalRecordsDeleted = 0;
        $totalFilesDeleted = 0;
        $totalBytesFreed = 0;
        $results = [];

        foreach ($targetModules as $moduleId) {
            $module = $this->modules[$moduleId];
            try {
                $result = $module->cleanup($year, $month, $branchId, $options);
                $totalRecordsDeleted += $result['records_deleted'];
                $totalFilesDeleted += $result['files_deleted'];
                $totalBytesFreed += $result['bytes_freed'];

                $results[$moduleId] = [
                    'name' => $module->getName(),
                    'records_deleted' => $result['records_deleted'],
                    'files_deleted' => $result['files_deleted'],
                    'bytes_freed' => $result['bytes_freed'],
                    'formatted_size' => $this->formatBytes($result['bytes_freed']),
                    'message' => $result['message'],
                    'status' => 'success',
                ];
            } catch (\Throwable $e) {
                Log::error("Failed executing cleanup for module {$moduleId}: " . $e->getMessage());
                $results[$moduleId] = [
                    'name' => $module->getName(),
                    'records_deleted' => 0,
                    'files_deleted' => 0,
                    'bytes_freed' => 0,
                    'formatted_size' => '0 B',
                    'message' => 'Gagal: ' . $e->getMessage(),
                    'status' => 'error',
                ];
            }
        }

        // Record audit trail in database
        $this->recordLog($userId, $year, $month, $branchId, $targetModules, $totalRecordsDeleted, $totalFilesDeleted, $totalBytesFreed, $results, $options);

        return [
            'year' => $year,
            'month' => $month,
            'branch_id' => $branchId,
            'total_records_deleted' => $totalRecordsDeleted,
            'total_files_deleted' => $totalFilesDeleted,
            'total_bytes_freed' => $totalBytesFreed,
            'formatted_freed_size' => $this->formatBytes($totalBytesFreed),
            'results' => $results,
        ];
    }

    /**
     * Record cleanup audit log.
     */
    protected function recordLog(?int $userId, int $year, int $month, ?int $branchId, array $modules, int $recordsDeleted, int $filesDeleted, int $bytesFreed, array $summary, array $options): void
    {
        try {
            if ($userId) {
                DataCleanupLog::create([
                    'user_id' => $userId,
                    'year' => $year,
                    'month' => $month,
                    'branch_id' => $branchId,
                    'modules' => $modules,
                    'records_deleted' => $recordsDeleted,
                    'files_deleted' => $filesDeleted,
                    'bytes_freed' => $bytesFreed,
                    'summary' => $summary,
                    'options' => $options,
                ]);
            }
        } catch (\Throwable $e) {
            Log::info("Could not write to data_cleanup_logs table: " . $e->getMessage());
        }
    }

    /**
     * Get system and disk storage health indicators.
     */
    public function getSystemDiskUsage(): array
    {
        $basePath = base_path();
        $freeSpace = @disk_free_space($basePath) ?: 0;
        $totalSpace = @disk_total_space($basePath) ?: 0;
        $usedSpace = max(0, $totalSpace - $freeSpace);
        $usedPercentage = $totalSpace > 0 ? round(($usedSpace / $totalSpace) * 100, 1) : 0;

        // Measure app storage directory size
        $storageDir = storage_path('app');
        $storageBytes = $this->getDirectorySize($storageDir);

        // Measure attendance photo storage size specifically
        $attendancePhotosDir = storage_path('app/public/attendance');
        $attendanceBytes = $this->getDirectorySize($attendancePhotosDir);

        // Measure logs directory size
        $logsDir = storage_path('logs');
        $logsBytes = $this->getDirectorySize($logsDir);

        return [
            'disk_free_bytes' => $freeSpace,
            'disk_total_bytes' => $totalSpace,
            'disk_used_bytes' => $usedSpace,
            'disk_used_percentage' => $usedPercentage,
            'formatted_free' => $this->formatBytes($freeSpace),
            'formatted_total' => $this->formatBytes($totalSpace),
            'formatted_used' => $this->formatBytes($usedSpace),
            'app_storage_bytes' => $storageBytes,
            'formatted_app_storage' => $this->formatBytes($storageBytes),
            'attendance_photos_bytes' => $attendanceBytes,
            'formatted_attendance_photos' => $this->formatBytes($attendanceBytes),
            'logs_bytes' => $logsBytes,
            'formatted_logs' => $this->formatBytes($logsBytes),
        ];
    }

    /**
     * Get recent cleanup history logs.
     */
    public function getRecentCleanupLogs(int $limit = 10): array
    {
        try {
            return DataCleanupLog::with(['user:id,name,role', 'branch:id,name'])
                ->latest()
                ->take($limit)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'user_name' => $log->user?->name ?? 'Super Admin',
                        'branch_name' => $log->branch?->name ?? 'Semua Cabang',
                        'period' => $this->getMonthName($log->month) . ' ' . $log->year,
                        'records_deleted' => $log->records_deleted,
                        'files_deleted' => $log->files_deleted,
                        'formatted_freed' => $this->formatBytes($log->bytes_freed),
                        'created_at' => $log->created_at?->format('d M Y H:i'),
                        'modules_count' => count($log->modules ?? []),
                        'summary' => $log->summary,
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Helper to compute directory size in bytes.
     */
    protected function getDirectorySize(string $path): int
    {
        if (!File::isDirectory($path)) {
            return 0;
        }

        $size = 0;
        try {
            foreach (File::allFiles($path) as $file) {
                $size += $file->getSize();
            }
        } catch (\Throwable $e) {}

        return $size;
    }

    /**
     * Helper to format bytes into readable KB, MB, GB.
     */
    public function formatBytes(int|float $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Helper for Indonesian month name.
     */
    public function getMonthName(int $month): string
    {
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        return $months[$month] ?? "Bulan {$month}";
    }
}
