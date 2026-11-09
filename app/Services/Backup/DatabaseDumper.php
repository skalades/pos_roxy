<?php

namespace App\Services\Backup;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDO;
use Exception;

class DatabaseDumper
{
    /**
     * Chunk size for selecting rows to keep memory usage low.
     */
    protected int $chunkSize = 500;

    /**
     * Dump the current database schema and data to a file.
     *
     * @param string $outputPath Path to the destination file (.sql or .sql.gz)
     * @param bool $compress Whether to compress output with gzip
     * @param array|null $periodFilter Optional ['start' => 'YYYY-MM-DD HH:mm:ss', 'end' => 'YYYY-MM-DD HH:mm:ss', 'label' => '...']
     * @return array Statistics of the dump
     * @throws Exception
     */
    public function dump(string $outputPath, bool $compress = true, ?array $periodFilter = null): array
    {
        @ini_set('max_execution_time', '300');
        @ini_set('memory_limit', '512M');

        $driver = DB::getDriverName();
        $startTime = microtime(true);

        if ($driver === 'sqlite') {
            return $this->dumpSqlite($outputPath, $compress, $periodFilter);
        }

        return $this->dumpMySql($outputPath, $compress, $periodFilter);
    }

    /**
     * Dump MySQL / MariaDB database.
     */
    protected function dumpMySql(string $outputPath, bool $compress, ?array $periodFilter): array
    {
        $connection = DB::connection();
        $pdo = $connection->getPdo();
        $databaseName = $connection->getDatabaseName();

        $fileHandle = $compress ? gzopen($outputPath, 'wb9') : fopen($outputPath, 'wb');
        if (!$fileHandle) {
            throw new Exception("Tidak dapat membuka file tujuan dump di: {$outputPath}");
        }

        $write = function (string $text) use ($fileHandle, $compress) {
            if ($compress) {
                gzwrite($fileHandle, $text);
            } else {
                fwrite($fileHandle, $text);
            }
        };

        // Write Header
        $write("-- ========================================================\n");
        $write("-- Roxy POS Database Backup\n");
        $write("-- Database: `{$databaseName}`\n");
        $write("-- Tanggal: " . date('Y-m-d H:i:s') . "\n");
        $write("-- Driver: MySQL / MariaDB\n");
        if ($periodFilter && !empty($periodFilter['label'])) {
            $write("-- Filter Periode: {$periodFilter['label']}\n");
            $write("-- Rentang Waktu: {$periodFilter['start']} s/d {$periodFilter['end']}\n");
        } else {
            $write("-- Filter Periode: Semua Data (Seluruh Riwayat)\n");
        }
        $write("-- ========================================================\n\n");

        $write("SET FOREIGN_KEY_CHECKS=0;\n");
        $write("SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n");
        $write("SET AUTOCOMMIT=0;\n");
        $write("START TRANSACTION;\n\n");

        // Fetch all tables
        $tables = [];
        $stmt = $pdo->query("SHOW FULL TABLES WHERE Table_Type = 'BASE TABLE'");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }

        $totalTables = count($tables);
        $totalRows = 0;

        foreach ($tables as $table) {
            // Write Drop & Create Table statement
            $write("-- --------------------------------------------------------\n");
            $write("-- Table structure for table `{$table}`\n");
            $write("-- --------------------------------------------------------\n");
            $write("DROP TABLE IF EXISTS `{$table}`;\n");

            $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(PDO::FETCH_ASSOC);
            $createTableSql = $createStmt['Create Table'] ?? null;
            if ($createTableSql) {
                $write($createTableSql . ";\n\n");
            }

            // Inspect columns to check if table supports period filtering
            $columns = $this->getTableColumns($pdo, $table);
            $dateClause = $this->buildDateClause($columns, $periodFilter, $pdo);

            // Dump Table Data in chunks
            $countSql = "SELECT COUNT(*) FROM `{$table}`" . ($dateClause ? " WHERE {$dateClause}" : "");
            $countStmt = $pdo->query($countSql);
            $rowCount = (int) $countStmt->fetchColumn();

            if ($rowCount > 0) {
                $periodNote = $dateClause ? " [Terfilter: {$periodFilter['label']}]" : "";
                $write("-- Dumping data for table `{$table}` ({$rowCount} baris){$periodNote}\n");

                $offset = 0;
                while ($offset < $rowCount) {
                    $selectSql = "SELECT * FROM `{$table}`"
                        . ($dateClause ? " WHERE {$dateClause}" : "")
                        . " LIMIT {$this->chunkSize} OFFSET {$offset}";

                    $selectStmt = $pdo->query($selectSql);
                    $rows = $selectStmt->fetchAll(PDO::FETCH_ASSOC);

                    if (!empty($rows)) {
                        $this->writeInsertStatement($write, $table, $rows, $pdo);
                        $totalRows += count($rows);
                    }

                    $offset += $this->chunkSize;
                }
                $write("\n");
            }
        }

        // Write Footer
        $write("COMMIT;\n");
        $write("SET FOREIGN_KEY_CHECKS=1;\n");
        $write("-- Dump selesai pada " . date('Y-m-d H:i:s') . "\n");

        if ($compress) {
            gzclose($fileHandle);
        } else {
            fclose($fileHandle);
        }

        $duration = round(microtime(true) - $startTime, 2);
        $fileSize = file_exists($outputPath) ? filesize($outputPath) : 0;

        return [
            'tables_count' => $totalTables,
            'rows_count' => $totalRows,
            'duration' => $duration,
            'file_size' => $fileSize,
            'file_path' => $outputPath,
            'period_filter' => $periodFilter ? $periodFilter['label'] : 'Semua Data',
        ];
    }

    /**
     * Get column names for a MySQL table.
     */
    protected function getTableColumns(PDO $pdo, string $table): array
    {
        $cols = [];
        try {
            $stmt = $pdo->query("DESCRIBE `{$table}`");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $cols[] = strtolower($row['Field']);
            }
        } catch (Exception $e) {
            // fallback
        }
        return $cols;
    }

    /**
     * Determine WHERE clause for period filtering on transactional tables.
     */
    protected function buildDateClause(array $columns, ?array $periodFilter, PDO $pdo): ?string
    {
        if (!$periodFilter || empty($periodFilter['start']) || empty($periodFilter['end'])) {
            return null;
        }

        $start = $pdo->quote($periodFilter['start']);
        $end = $pdo->quote($periodFilter['end']);

        // Check created_at first (used by transactions, items, commissions, shifts, payrolls, etc.)
        if (in_array('created_at', $columns)) {
            return "`created_at` BETWEEN {$start} AND {$end}";
        }

        // Check date (used by attendances)
        if (in_array('date', $columns)) {
            $startDateOnly = $pdo->quote(substr($periodFilter['start'], 0, 10));
            $endDateOnly = $pdo->quote(substr($periodFilter['end'], 0, 10));
            return "`date` BETWEEN {$startDateOnly} AND {$endDateOnly}";
        }

        // Master data tables (users, categories, products, services, branches, settings)
        // are exported in full so referential integrity is preserved.
        return null;
    }

    /**
     * Write multi-row INSERT statement safely with PDO quoting.
     */
    protected function writeInsertStatement(callable $write, string $table, array $rows, PDO $pdo): void
    {
        if (empty($rows)) {
            return;
        }

        $firstRow = $rows[0];
        $columnNames = array_keys($firstRow);
        $escapedColumns = array_map(fn($col) => "`" . str_replace("`", "``", $col) . "`", $columnNames);
        $columnsSql = implode(', ', $escapedColumns);

        $write("INSERT INTO `{$table}` ({$columnsSql}) VALUES\n");

        $valueLines = [];
        foreach ($rows as $row) {
            $values = [];
            foreach ($columnNames as $col) {
                $val = $row[$col];
                if (is_null($val)) {
                    $values[] = 'NULL';
                } elseif (is_numeric($val) && !is_string($val)) {
                    $values[] = (string) $val;
                } else {
                    $values[] = $pdo->quote((string) $val);
                }
            }
            $valueLines[] = "  (" . implode(', ', $values) . ")";
        }

        $write(implode(",\n", $valueLines) . ";\n");
    }

    /**
     * Dump SQLite database for test/fallback environments.
     */
    protected function dumpSqlite(string $outputPath, bool $compress, ?array $periodFilter): array
    {
        $connection = DB::connection();
        $pdo = $connection->getPdo();
        $startTime = microtime(true);

        $fileHandle = $compress ? gzopen($outputPath, 'wb9') : fopen($outputPath, 'wb');
        if (!$fileHandle) {
            throw new Exception("Tidak dapat membuka file tujuan dump di: {$outputPath}");
        }

        $write = function (string $text) use ($fileHandle, $compress) {
            if ($compress) {
                gzwrite($fileHandle, $text);
            } else {
                fwrite($fileHandle, $text);
            }
        };

        $write("PRAGMA foreign_keys = OFF;\nBEGIN TRANSACTION;\n\n");

        $stmt = $pdo->query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalTables = count($tables);
        $totalRows = 0;

        foreach ($tables as $t) {
            $table = $t['name'];
            $sql = $t['sql'];

            $write("DROP TABLE IF EXISTS `{$table}`;\n");
            $write("{$sql};\n\n");

            // Inspect columns in SQLite
            $colsStmt = $pdo->query("PRAGMA table_info(`{$table}`)");
            $columns = [];
            while ($cRow = $colsStmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[] = strtolower($cRow['name']);
            }

            $dateClause = $this->buildDateClause($columns, $periodFilter, $pdo);
            $countSql = "SELECT COUNT(*) FROM `{$table}`" . ($dateClause ? " WHERE {$dateClause}" : "");
            $rowCount = (int) $pdo->query($countSql)->fetchColumn();

            if ($rowCount > 0) {
                $selectSql = "SELECT * FROM `{$table}`" . ($dateClause ? " WHERE {$dateClause}" : "");
                $selectStmt = $pdo->query($selectSql);
                $rows = $selectStmt->fetchAll(PDO::FETCH_ASSOC);
                $this->writeInsertStatement($write, $table, $rows, $pdo);
                $totalRows += count($rows);
                $write("\n");
            }
        }

        $write("COMMIT;\nPRAGMA foreign_keys = ON;\n");

        if ($compress) {
            gzclose($fileHandle);
        } else {
            fclose($fileHandle);
        }

        $duration = round(microtime(true) - $startTime, 2);
        $fileSize = file_exists($outputPath) ? filesize($outputPath) : 0;

        return [
            'tables_count' => $totalTables,
            'rows_count' => $totalRows,
            'duration' => $duration,
            'file_size' => $fileSize,
            'file_path' => $outputPath,
            'period_filter' => $periodFilter ? $periodFilter['label'] : 'Semua Data',
        ];
    }
}
