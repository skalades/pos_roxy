<?php

namespace App\Services\DataCleanup\Modules;

use App\Models\Attendance;
use App\Services\DataCleanup\CleanupModuleInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AttendanceRecordsModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'attendance_records';
    }

    public function getName(): string
    {
        return 'Data Rekor Absensi & Log Audit';
    }

    public function getDescription(): string
    {
        return 'Menghapus riwayat rekor kehadiran pegawai (tabel attendances), log audit geofence/ip (attendance_audit_logs), serta file foto terkait pada periode terpilih.';
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
        return 'Calendar';
    }

    protected function getQuery(Carbon $startDate, Carbon $endDate, ?int $branchId = null)
    {
        $query = Attendance::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query;
    }

    public function preview(Carbon $startDate, Carbon $endDate, ?int $branchId = null): array
    {
        $query = $this->getQuery($startDate, $endDate, $branchId);
        $count = $query->count();

        $attendanceIds = (clone $query)->pluck('id');
        $auditLogsCount = DB::table('attendance_audit_logs')
            ->whereIn('attendance_id', $attendanceIds)
            ->count();

        $estimatedBytes = ($count * 1536) + ($auditLogsCount * 800);

        return [
            'records' => $count + $auditLogsCount,
            'files' => 0,
            'bytes' => $estimatedBytes,
            'details' => "{$count} data absensi dan {$auditLogsCount} log audit kehadiran.",
        ];
    }

    public function cleanup(Carbon $startDate, Carbon $endDate, ?int $branchId = null, array $options = []): array
    {
        $disk = Storage::disk('public');
        $deletedRecords = 0;
        $deletedFiles = 0;
        $bytesFreed = 0;

        $this->getQuery($startDate, $endDate, $branchId)
            ->chunkById(100, function ($attendances) use ($disk, &$deletedRecords, &$deletedFiles, &$bytesFreed) {
                $ids = $attendances->pluck('id')->toArray();

                // 1. Delete associated audit logs
                $auditLogsDeleted = DB::table('attendance_audit_logs')
                    ->whereIn('attendance_id', $ids)
                    ->delete();
                $deletedRecords += $auditLogsDeleted;

                // 2. Delete photos if any exist on disk
                foreach ($attendances as $att) {
                    foreach ([$att->clock_in_photo, $att->clock_out_photo] as $photo) {
                        if ($photo && !str_starts_with($photo, 'data:')) {
                            try {
                                if ($disk->exists($photo)) {
                                    $size = $disk->size($photo);
                                    if ($disk->delete($photo)) {
                                        $deletedFiles++;
                                        $bytesFreed += $size;
                                    }
                                }
                            } catch (\Throwable $e) {}
                        }
                    }
                }

                // 3. Delete attendance rows
                $attDeleted = Attendance::whereIn('id', $ids)->delete();
                $deletedRecords += $attDeleted;
                $bytesFreed += ($attDeleted * 1536) + ($auditLogsDeleted * 800);
            });

        return [
            'records_deleted' => $deletedRecords,
            'files_deleted' => $deletedFiles,
            'bytes_freed' => $bytesFreed,
            'message' => "Berhasil menghapus {$deletedRecords} rekor data absensi & audit.",
        ];
    }
}
