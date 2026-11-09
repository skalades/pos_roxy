<?php

namespace App\Services\Backup;

use App\Services\BaseService;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use ZipArchive;
use Exception;

class BackupService extends BaseService
{
    protected string $backupDir;

    public function __construct(
        protected DatabaseDumper $dumper,
        protected DatabaseRestorer $restorer,
        protected StorageArchiver $archiver
    ) {
        $this->backupDir = storage_path('app/backups');
        $this->ensureBackupDirectoryExists();
    }

    /**
     * Ensure the storage/app/backups directory exists.
     */
    protected function ensureBackupDirectoryExists(): void
    {
        if (!is_dir($this->backupDir)) {
            File::makeDirectory($this->backupDir, 0755, true);
            $htaccessPath = $this->backupDir . DIRECTORY_SEPARATOR . '.htaccess';
            if (!file_exists($htaccessPath)) {
                File::put($htaccessPath, "Deny from all\n");
            }
        }
    }

    /**
     * Create a new backup.
     *
     * @param array $options ['include_files' => bool, 'period_mode' => 'all'|'custom', 'start_year' => int, ...]
     * @return array Backup metadata
     * @throws Exception
     */
    public function createBackup(array $options = []): array
    {
        $includeFiles = (bool) ($options['include_files'] ?? false);
        $timestamp = date('Y-m-d_His');
        $appName = config('app.name', 'RoxyPOS');
        $sanitizedAppName = preg_replace('/[^a-zA-Z0-9_-]/', '_', strtolower($appName));

        // Period filter resolution
        $periodFilter = $this->resolvePeriodFilter($options);
        $periodSuffix = '';
        if ($periodFilter) {
            $periodSuffix = "_period_{$options['start_year']}_{$options['start_month']}_sd_{$options['end_year']}_{$options['end_month']}";
        }

        if ($includeFiles) {
            $filename = "{$sanitizedAppName}_full_backup_{$timestamp}{$periodSuffix}.zip";
            $targetPath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;
            return $this->createFullBackup($targetPath, $options, $periodFilter);
        } else {
            $filename = "{$sanitizedAppName}_db_backup_{$timestamp}{$periodSuffix}.sql.gz";
            $targetPath = $this->backupDir . DIRECTORY_SEPARATOR . $filename;
            return $this->createDatabaseBackup($targetPath, $periodFilter);
        }
    }

    /**
     * Resolve period filter array from options.
     */
    protected function resolvePeriodFilter(array $options): ?array
    {
        if (($options['period_mode'] ?? 'all') !== 'custom') {
            return null;
        }

        $startYear = (int) ($options['start_year'] ?? Carbon::now()->year);
        $startMonth = (int) ($options['start_month'] ?? 1);
        $endYear = (int) ($options['end_year'] ?? Carbon::now()->year);
        $endMonth = (int) ($options['end_month'] ?? Carbon::now()->month);

        $startDate = Carbon::create($startYear, $startMonth, 1)->startOfMonth();
        $endDate = Carbon::create($endYear, $endMonth, 1)->endOfMonth();

        if ($startDate->gt($endDate)) {
            $temp = $startDate;
            $startDate = $endDate->copy()->startOfMonth();
            $endDate = $temp->copy()->endOfMonth();
        }

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $label = $monthNames[$startDate->month] . ' ' . $startDate->year . ' s/d ' . $monthNames[$endDate->month] . ' ' . $endDate->year;

        return [
            'start' => $startDate->toDateTimeString(),
            'end' => $endDate->toDateTimeString(),
            'label' => $label,
            'start_month' => $startDate->month,
            'start_year' => $startDate->year,
            'end_month' => $endDate->month,
            'end_year' => $endDate->year,
        ];
    }

    /**
     * Create a database-only gzipped backup.
     */
    protected function createDatabaseBackup(string $targetPath, ?array $periodFilter): array
    {
        $dumpStats = $this->dumper->dump($targetPath, true, $periodFilter);

        return [
            'type' => 'database',
            'filename' => basename($targetPath),
            'path' => $targetPath,
            'size' => $dumpStats['file_size'],
            'formatted_size' => $this->formatBytes($dumpStats['file_size']),
            'tables_count' => $dumpStats['tables_count'],
            'rows_count' => $dumpStats['rows_count'],
            'duration' => $dumpStats['duration'],
            'period_filter' => $dumpStats['period_filter'],
            'created_at' => Carbon::now()->toIso8601String(),
            'formatted_date' => Carbon::now()->translatedFormat('d M Y, H:i'),
        ];
    }

    /**
     * Create a full backup archive (.zip) containing database and public storage.
     */
    protected function createFullBackup(string $targetPath, array $options = [], ?array $periodFilter = null): array
    {
        $tempDir = storage_path('app/temp_backup_' . uniqid());
        File::makeDirectory($tempDir, 0755, true);

        try {
            $tempSqlPath = $tempDir . DIRECTORY_SEPARATOR . 'database.sql';
            $dumpStats = $this->dumper->dump($tempSqlPath, false, $periodFilter);

            $zip = new ZipArchive();
            if ($zip->open($targetPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new Exception("Tidak dapat membuat file zip di: {$targetPath}");
            }

            // 1. Add SQL dump to zip
            $zip->addFile($tempSqlPath, 'database.sql');

            // 2. Add storage files to zip
            $publicStorageDir = storage_path('app/public');
            $filesCount = 0;
            $filesBytes = 0;

            if (is_dir($publicStorageDir)) {
                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($publicStorageDir, \RecursiveDirectoryIterator::SKIP_DOTS),
                    \RecursiveIteratorIterator::SELF_FIRST
                );

                foreach ($iterator as $item) {
                    $itemPath = $item->getRealPath();
                    $relativePath = substr($itemPath, strlen($publicStorageDir) + 1);
                    $relativePath = str_replace('\\', '/', $relativePath);

                    if ($item->getFilename() === '.gitignore' || str_starts_with($item->getFilename(), '.DS_Store')) {
                        continue;
                    }

                    if ($item->isDir()) {
                        $zip->addEmptyDir('storage/' . $relativePath);
                    } elseif ($item->isFile()) {
                        $zip->addFile($itemPath, 'storage/' . $relativePath);
                        $filesCount++;
                        $filesBytes += $item->getSize();
                    }
                }
            }

            // 3. Add manifest JSON
            $manifest = [
                'app_name' => config('app.name'),
                'created_at' => Carbon::now()->toIso8601String(),
                'type' => 'full',
                'period_filter' => $periodFilter ? $periodFilter['label'] : 'Semua Data',
                'db_driver' => DB::getDriverName(),
                'database_name' => DB::connection()->getDatabaseName(),
                'tables_count' => $dumpStats['tables_count'],
                'rows_count' => $dumpStats['rows_count'],
                'files_count' => $filesCount,
                'files_bytes' => $filesBytes,
                'notes' => $options['notes'] ?? 'Dibuat otomatis oleh Sistem Roxy POS',
            ];
            $zip->addFromString('backup_manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));

            $zip->close();

            $totalSize = file_exists($targetPath) ? filesize($targetPath) : 0;

            return [
                'type' => 'full',
                'filename' => basename($targetPath),
                'path' => $targetPath,
                'size' => $totalSize,
                'formatted_size' => $this->formatBytes($totalSize),
                'tables_count' => $dumpStats['tables_count'],
                'rows_count' => $dumpStats['rows_count'],
                'files_count' => $filesCount,
                'duration' => $dumpStats['duration'],
                'period_filter' => $manifest['period_filter'],
                'created_at' => Carbon::now()->toIso8601String(),
                'formatted_date' => Carbon::now()->translatedFormat('d M Y, H:i'),
            ];
        } finally {
            File::deleteDirectory($tempDir);
        }
    }

    /**
     * Restore database and assets from an uploaded file or existing server backup.
     *
     * @param UploadedFile|string $source Uploaded file instance or server backup filename
     * @param string $mode 'overwrite' | 'merge'
     * @return array Results of the restore operation
     * @throws Exception
     */
    public function restoreBackup(UploadedFile|string $source, string $mode = 'merge'): array
    {
        $startTime = microtime(true);

        // 1. Resolve source file path
        if ($source instanceof UploadedFile) {
            $tempDir = storage_path('app/temp_restore_' . uniqid());
            File::makeDirectory($tempDir, 0755, true);
            $extension = strtolower($source->getClientOriginalExtension());
            $originalName = $source->getClientOriginalName();
            $sourcePath = $source->move($tempDir, $originalName)->getRealPath();
            $isUploaded = true;
        } else {
            $cleanName = basename($source);
            $sourcePath = $this->backupDir . DIRECTORY_SEPARATOR . $cleanName;
            $originalName = $cleanName;
            $isUploaded = false;
            $tempDir = null;
        }

        if (!file_exists($sourcePath)) {
            throw new Exception("File sumber backup tidak ditemukan: {$sourcePath}");
        }

        // 2. Always create an automatic safety snapshot before touching live data!
        $safetySnapshotName = null;
        try {
            $safetySnapshotName = "auto_safety_snapshot_" . date('Y-m-d_His') . ".sql.gz";
            $safetySnapshotPath = $this->backupDir . DIRECTORY_SEPARATOR . $safetySnapshotName;
            $this->dumper->dump($safetySnapshotPath, true, null);
        } catch (Exception $e) {
            Log::warning("Gagal membuat safety snapshot sebelum restore: " . $e->getMessage());
        }

        $filesRestored = 0;
        $statementsExecuted = 0;
        $statementsSkipped = 0;

        try {
            $lowerName = strtolower($originalName);

            if (str_ends_with($lowerName, '.zip')) {
                // Handle ZIP package
                $extractDir = storage_path('app/temp_extract_' . uniqid());
                File::makeDirectory($extractDir, 0755, true);

                $zip = new ZipArchive();
                if ($zip->open($sourcePath) !== true) {
                    throw new Exception("Gagal membuka file arsip ZIP untuk dipulihkan.");
                }

                $zip->extractTo($extractDir);
                $zip->close();

                // Find SQL file inside zip
                $sqlFile = null;
                if (file_exists($extractDir . DIRECTORY_SEPARATOR . 'database.sql')) {
                    $sqlFile = $extractDir . DIRECTORY_SEPARATOR . 'database.sql';
                } else {
                    $sqlFiles = glob($extractDir . DIRECTORY_SEPARATOR . '*.sql');
                    if (!empty($sqlFiles)) {
                        $sqlFile = $sqlFiles[0];
                    }
                }

                if ($sqlFile && file_exists($sqlFile)) {
                    $restoreStats = $this->restorer->restore($sqlFile, $mode);
                    $statementsExecuted = $restoreStats['statements_executed'];
                    $statementsSkipped = $restoreStats['statements_skipped'] ?? 0;
                } else {
                    throw new Exception("Arsip ZIP tidak memuat file database.sql yang valid.");
                }

                // If storage directory exists in ZIP, restore files
                $storageSubDir = $extractDir . DIRECTORY_SEPARATOR . 'storage';
                if (is_dir($storageSubDir)) {
                    $archiverStats = $this->restoreDirectoryToPublic($storageSubDir, $mode);
                    $filesRestored = $archiverStats['files_restored'];
                }

                File::deleteDirectory($extractDir);
            } elseif (str_ends_with($lowerName, '.sql') || str_ends_with($lowerName, '.sql.gz') || str_ends_with($lowerName, '.gz')) {
                // Direct SQL or SQL.GZ file
                $restoreStats = $this->restorer->restore($sourcePath, $mode);
                $statementsExecuted = $restoreStats['statements_executed'];
                $statementsSkipped = $restoreStats['statements_skipped'] ?? 0;
            } else {
                throw new Exception("Format file tidak didukung. Harap gunakan file berekstensi .sql, .sql.gz, atau .zip.");
            }
        } finally {
            if ($isUploaded && $tempDir && is_dir($tempDir)) {
                File::deleteDirectory($tempDir);
            }
        }

        $duration = round(microtime(true) - $startTime, 2);

        return [
            'success' => true,
            'mode' => $mode,
            'source_file' => $originalName,
            'statements_executed' => $statementsExecuted,
            'statements_skipped' => $statementsSkipped,
            'files_restored' => $filesRestored,
            'safety_snapshot' => $safetySnapshotName,
            'duration' => $duration,
        ];
    }

    /**
     * Copy extracted storage directory to storage/app/public safely.
     */
    protected function restoreDirectoryToPublic(string $sourceDir, string $mode = 'merge'): array
    {
        $targetDir = storage_path('app/public');
        if (!is_dir($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        $filesRestored = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($sourceDir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $itemPath = $item->getRealPath();
            $relativePath = substr($itemPath, strlen($sourceDir) + 1);
            $destination = $targetDir . DIRECTORY_SEPARATOR . $relativePath;

            if ($item->isDir()) {
                if (!is_dir($destination)) {
                    @mkdir($destination, 0755, true);
                }
            } elseif ($item->isFile()) {
                // In merge mode, do not overwrite existing files if already present
                if ($mode === 'merge' && file_exists($destination)) {
                    continue;
                }

                $parent = dirname($destination);
                if (!is_dir($parent)) {
                    @mkdir($parent, 0755, true);
                }
                copy($itemPath, $destination);
                $filesRestored++;
            }
        }

        return ['files_restored' => $filesRestored];
    }

    /**
     * Get list of all available backups in storage/app/backups.
     */
    public function getBackupsList(): array
    {
        $this->ensureBackupDirectoryExists();
        $files = File::files($this->backupDir);
        $backups = [];

        foreach ($files as $file) {
            $name = $file->getFilename();
            if ($name === '.htaccess' || $name === '.gitignore') {
                continue;
            }

            $size = $file->getSize();
            $mtime = $file->getMTime();
            $date = Carbon::createFromTimestamp($mtime);

            $isFull = str_contains(strtolower($name), 'full') || str_ends_with(strtolower($name), '.zip');
            $isSafety = str_contains(strtolower($name), 'safety_snapshot');
            $hasPeriod = str_contains($name, '_period_');

            $backups[] = [
                'filename' => $name,
                'type' => $isSafety ? 'safety' : ($isFull ? 'full' : 'database'),
                'type_label' => $isSafety ? 'Safety Snapshot' : ($isFull ? 'Cadangan Penuh (DB + File)' : 'Database Sahaja'),
                'has_period' => $hasPeriod,
                'size' => $size,
                'formatted_size' => $this->formatBytes($size),
                'created_at' => $date->toIso8601String(),
                'formatted_date' => $date->translatedFormat('d M Y, H:i:s'),
                'relative_time' => $date->diffForHumans(),
            ];
        }

        usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return $backups;
    }

    /**
     * Get full path to a backup file.
     */
    public function getBackupPath(string $filename): ?string
    {
        $cleanName = basename($filename);
        $path = $this->backupDir . DIRECTORY_SEPARATOR . $cleanName;
        return file_exists($path) ? $path : null;
    }

    /**
     * Delete a backup file.
     */
    public function deleteBackup(string $filename): bool
    {
        $cleanName = basename($filename);
        $path = $this->backupDir . DIRECTORY_SEPARATOR . $cleanName;
        if (file_exists($path)) {
            return File::delete($path);
        }
        return false;
    }

    /**
     * Get system statistics: Database size, tables count, storage size, disk free space.
     */
    public function getSystemStats(): array
    {
        $driver = DB::getDriverName();
        $totalTables = 0;
        $dbSizeBytes = 0;

        try {
            if ($driver === 'sqlite') {
                $pdo = DB::connection()->getPdo();
                $stmt = $pdo->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                $totalTables = (int) $stmt->fetchColumn();

                $dbPath = DB::connection()->getDatabaseName();
                if ($dbPath !== ':memory:' && file_exists($dbPath)) {
                    $dbSizeBytes = filesize($dbPath);
                }
            } else {
                $dbName = DB::connection()->getDatabaseName();
                $tables = DB::select("
                    SELECT table_name, (data_length + index_length) AS total_size
                    FROM information_schema.TABLES
                    WHERE table_schema = ?
                ", [$dbName]);

                $totalTables = count($tables);
                foreach ($tables as $t) {
                    $dbSizeBytes += (int) $t->total_size;
                }
            }
        } catch (Exception $e) {
            Log::warning("Could not calculate database size: " . $e->getMessage());
        }

        // Storage stats
        $publicDir = storage_path('app/public');
        $storageFilesCount = 0;
        $storageSizeBytes = 0;

        if (is_dir($publicDir)) {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($publicDir, \RecursiveDirectoryIterator::SKIP_DOTS)
            );
            foreach ($iterator as $item) {
                if ($item->isFile()) {
                    $storageFilesCount++;
                    $storageSizeBytes += $item->getSize();
                }
            }
        }

        // Disk stats
        $basePath = base_path();
        $diskFree = @disk_free_space($basePath) ?: 0;
        $diskTotal = @disk_total_space($basePath) ?: 0;
        $diskUsed = max(0, $diskTotal - $diskFree);
        $diskUsedPercent = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

        // Backups stats
        $backups = $this->getBackupsList();
        $totalBackupsSize = array_sum(array_column($backups, 'size'));

        return [
            'database' => [
                'driver' => $driver,
                'name' => DB::connection()->getDatabaseName(),
                'tables_count' => $totalTables,
                'size_bytes' => $dbSizeBytes,
                'formatted_size' => $this->formatBytes($dbSizeBytes),
            ],
            'storage' => [
                'files_count' => $storageFilesCount,
                'size_bytes' => $storageSizeBytes,
                'formatted_size' => $this->formatBytes($storageSizeBytes),
            ],
            'disk' => [
                'free_bytes' => $diskFree,
                'total_bytes' => $diskTotal,
                'used_bytes' => $diskUsed,
                'used_percent' => $diskUsedPercent,
                'formatted_free' => $this->formatBytes($diskFree),
                'formatted_total' => $this->formatBytes($diskTotal),
            ],
            'backups_count' => count($backups),
            'total_backups_size' => $this->formatBytes($totalBackupsSize),
        ];
    }

    /**
     * Format bytes into human readable format.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = floor(log($bytes, 1024));
        $i = min($i, count($units) - 1);

        return round($bytes / pow(1024, $i), $precision) . ' ' . $units[$i];
    }
}
