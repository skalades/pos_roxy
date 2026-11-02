<?php

namespace App\Services\DataCleanup;

use Carbon\Carbon;

interface CleanupModuleInterface
{
    /**
     * Unique identifier for the module (e.g. 'attendance_photos', 'transactions')
     */
    public function getId(): string;

    /**
     * Human-readable module name in Indonesian.
     */
    public function getName(): string;

    /**
     * Description explaining what this module cleans up and what the impact is.
     */
    public function getDescription(): string;

    /**
     * Category: 'storage' (disk files), 'database' (DB rows), or 'system' (logs/cache).
     */
    public function getCategory(): string;

    /**
     * Impact level: 'low', 'medium', or 'high'
     */
    public function getImpactLevel(): string;

    /**
     * Lucide React icon name to use in the UI.
     */
    public function getIcon(): string;

    /**
     * Preview count and estimated bytes that would be deleted for the specified date range.
     *
     * @param Carbon $startDate Start of the range (inclusive, e.g. 2024-01-01 00:00:00)
     * @param Carbon $endDate   End of the range (inclusive, e.g. 2024-06-30 23:59:59)
     * @param int|null $branchId
     * @return array{records: int, files: int, bytes: int, details: string}
     */
    public function preview(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array;

    /**
     * Execute chunked deletion for the specified date range.
     *
     * @param Carbon $startDate Start of the range (inclusive)
     * @param Carbon $endDate   End of the range (inclusive)
     * @param int|null $branchId
     * @param array $options
     * @return array{records_deleted: int, files_deleted: int, bytes_freed: int, message: string}
     */
    public function cleanup(Carbon $startDate, Carbon $endDate, ?int $branchId = null, array $options = []): array;
}
