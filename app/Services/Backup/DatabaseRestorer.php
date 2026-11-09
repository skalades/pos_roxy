<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDO;
use Exception;

class DatabaseRestorer
{
    /**
     * Restore database from a .sql or .sql.gz file.
     *
     * @param string $filePath Path to the backup SQL file
     * @param string $mode 'overwrite' | 'merge'
     * @return array Restoration statistics
     * @throws Exception
     */
    public function restore(string $filePath, string $mode = 'overwrite'): array
    {
        if (!file_exists($filePath)) {
            throw new Exception("File backup tidak ditemukan: {$filePath}");
        }

        @ini_set('max_execution_time', '300');
        @ini_set('memory_limit', '512M');

        $driver = DB::getDriverName();
        $startTime = microtime(true);
        $isGzipped = $this->isGzipped($filePath);

        $fileHandle = $isGzipped ? gzopen($filePath, 'rb') : fopen($filePath, 'rb');
        if (!$fileHandle) {
            throw new Exception("Tidak dapat membaca file backup: {$filePath}");
        }

        $connection = DB::connection();
        $pdo = $connection->getPdo();

        // Disable foreign key checks for clean restore
        if ($driver === 'sqlite') {
            $pdo->exec("PRAGMA foreign_keys = OFF;");
        } else {
            $pdo->exec("SET FOREIGN_KEY_CHECKS=0;");
            $pdo->exec("SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';");
        }

        $statementsExecuted = 0;
        $statementsSkipped = 0;
        $currentQuery = '';
        $inMultiLineComment = false;

        try {
            while (!($isGzipped ? gzeof($fileHandle) : feof($fileHandle))) {
                $line = $isGzipped ? gzgets($fileHandle, 32768) : fgets($fileHandle, 32768);
                if ($line === false) {
                    break;
                }

                $trimmed = trim($line);

                // Handle multi-line comment /* ... */
                if ($inMultiLineComment) {
                    if (str_contains($trimmed, '*/')) {
                        $inMultiLineComment = false;
                        $trimmed = trim(substr($trimmed, strpos($trimmed, '*/') + 2));
                    } else {
                        continue;
                    }
                }

                if (str_starts_with($trimmed, '/*') && !str_starts_with($trimmed, '/*!')) {
                    if (!str_contains($trimmed, '*/')) {
                        $inMultiLineComment = true;
                        continue;
                    } else {
                        $trimmed = trim(substr($trimmed, strpos($trimmed, '*/') + 2));
                    }
                }

                // Skip single-line comments and empty lines
                if (empty($trimmed) || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '#')) {
                    continue;
                }

                $currentQuery .= $line;

                // Check if the current query ends with a semicolon
                $trimmedQuery = rtrim($currentQuery);
                if (str_ends_with($trimmedQuery, ';')) {
                    if ($this->isStatementComplete($trimmedQuery)) {
                        $this->executeStatement($pdo, $trimmedQuery, $mode, $driver, $statementsExecuted, $statementsSkipped);
                        $currentQuery = '';
                    }
                }
            }

            // Execute any leftover statement
            $remaining = trim($currentQuery);
            if (!empty($remaining)) {
                $this->executeStatement($pdo, $remaining, $mode, $driver, $statementsExecuted, $statementsSkipped);
            }
        } catch (Exception $e) {
            Log::error('Database restore error: ' . $e->getMessage(), [
                'mode' => $mode,
                'executed' => $statementsExecuted,
                'last_query' => substr($currentQuery, 0, 500),
            ]);
            throw new Exception("Gagal mengeksekusi statement SQL (#{$statementsExecuted}): " . $e->getMessage());
        } finally {
            if ($isGzipped) {
                gzclose($fileHandle);
            } else {
                fclose($fileHandle);
            }

            // Re-enable foreign key checks
            if ($driver === 'sqlite') {
                $pdo->exec("PRAGMA foreign_keys = ON;");
            } else {
                $pdo->exec("SET FOREIGN_KEY_CHECKS=1;");
            }
        }

        $duration = round(microtime(true) - $startTime, 2);

        return [
            'mode' => $mode,
            'statements_executed' => $statementsExecuted,
            'statements_skipped' => $statementsSkipped,
            'duration' => $duration,
            'file_name' => basename($filePath),
            'is_gzipped' => $isGzipped,
        ];
    }

    /**
     * Execute or transform statement depending on restore mode (overwrite vs merge).
     */
    protected function executeStatement(
        PDO $pdo,
        string $sql,
        string $mode,
        string $driver,
        int &$statementsExecuted,
        int &$statementsSkipped
    ): void {
        $upper = strtoupper(ltrim($sql));

        if ($mode === 'merge') {
            // In merge mode: NEVER DROP EXISTING TABLES!
            if (str_starts_with($upper, 'DROP TABLE') || str_starts_with($upper, 'DROP VIEW')) {
                $statementsSkipped++;
                return;
            }

            // In merge mode: NEVER TRUNCATE EXISTING TABLES!
            if (str_starts_with($upper, 'TRUNCATE')) {
                $statementsSkipped++;
                return;
            }

            // In merge mode: Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
            if (str_starts_with($upper, 'CREATE TABLE ') && !str_starts_with($upper, 'CREATE TABLE IF NOT EXISTS')) {
                $sql = preg_replace('/^CREATE\s+TABLE\s+/i', 'CREATE TABLE IF NOT EXISTS ', $sql, 1);
            }

            // In merge mode: Convert INSERT INTO to INSERT IGNORE INTO (or INSERT OR IGNORE INTO on SQLite)
            if (str_starts_with($upper, 'INSERT INTO ')) {
                $replacement = $driver === 'sqlite' ? 'INSERT OR IGNORE INTO ' : 'INSERT IGNORE INTO ';
                $sql = preg_replace('/^INSERT\s+INTO\s+/i', $replacement, $sql, 1);
            }
        }

        $pdo->exec($sql);
        $statementsExecuted++;
    }

    /**
     * Check if a file is gzip-compressed by checking magic bytes.
     */
    protected function isGzipped(string $filePath): bool
    {
        if (str_ends_with(strtolower($filePath), '.gz')) {
            return true;
        }

        $handle = @fopen($filePath, 'rb');
        if (!$handle) {
            return false;
        }
        $magic = fread($handle, 2);
        fclose($handle);

        return $magic === "\x1f\x8b";
    }

    /**
     * Verify whether a semicolon at the end is a true statement delimiter,
     * not part of a quoted string.
     */
    protected function isStatementComplete(string $sql): bool
    {
        $len = strlen($sql);
        $inSingleQuote = false;
        $inDoubleQuote = false;
        $escaped = false;

        for ($i = 0; $i < $len - 1; $i++) {
            $char = $sql[$i];

            if ($char === '\\' && !$escaped) {
                $escaped = true;
                continue;
            }

            if ($char === "'" && !$inDoubleQuote && !$escaped) {
                $inSingleQuote = !$inSingleQuote;
            } elseif ($char === '"' && !$inSingleQuote && !$escaped) {
                $inDoubleQuote = !$inDoubleQuote;
            }

            $escaped = false;
        }

        return !$inSingleQuote && !$inDoubleQuote;
    }
}
