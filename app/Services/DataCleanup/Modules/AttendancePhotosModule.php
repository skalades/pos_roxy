<?php

namespace App\Services\DataCleanup\Modules;

use App\Models\Attendance;
use App\Services\DataCleanup\CleanupModuleInterface;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AttendancePhotosModule implements CleanupModuleInterface
{
    public function getId(): string
    {
        return 'attendance_photos';
    }

    public function getName(): string
    {
        return 'Foto Absensi (Storage)';
    }

    public function getDescription(): string
    {
        return 'Menghapus file foto selfie clock-in & clock-out dari penyimpanan disk (public/attendance). Data kehadiran pegawai tetap tersimpan, hanya file foto dan referensi fotonya yang dibersihkan.';
    }

    public function getCategory(): string
    {
        return 'storage';
    }

    public function getImpactLevel(): string
    {
        return 'low';
    }

    public function getIcon(): string
    {
        return 'Camera';
    }

    protected function getQuery(int $year, int $month, ?int $branchId = null)
    {
        $query = Attendance::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->where(function ($q) {
                $q->whereNotNull('clock_in_photo')
                  ->orWhereNotNull('clock_out_photo');
            });

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query;
    }

    public function preview(int $year, int $month, ?int $branchId = null): array
    {
        $attendances = $this->getQuery($year, $month, $branchId)->get(['id', 'clock_in_photo', 'clock_out_photo']);

        $fileCount = 0;
        $totalBytes = 0;
        $disk = Storage::disk('public');

        foreach ($attendances as $att) {
            foreach ([$att->clock_in_photo, $att->clock_out_photo] as $photo) {
                if ($photo && !str_starts_with($photo, 'data:')) {
                    $fileCount++;
                    try {
                        if ($disk->exists($photo)) {
                            $totalBytes += $disk->size($photo);
                        } else {
                            // Estimated average size per selfie photo if already missing or in different relative path
                            $totalBytes += 150 * 1024;
                        }
                    } catch (\Throwable $e) {
                        $totalBytes += 150 * 1024;
                    }
                } elseif ($photo && str_starts_with($photo, 'data:')) {
                    // Base64 stored in database
                    $fileCount++;
                    $totalBytes += strlen($photo);
                }
            }
        }

        return [
            'records' => $attendances->count(),
            'files' => $fileCount,
            'bytes' => $totalBytes,
            'details' => "{$fileCount} foto selfie pada {$attendances->count()} kehadiran.",
        ];
    }

    public function cleanup(int $year, int $month, ?int $branchId = null, array $options = []): array
    {
        $disk = Storage::disk('public');
        $filesDeleted = 0;
        $recordsUpdated = 0;
        $bytesFreed = 0;

        $this->getQuery($year, $month, $branchId)
            ->chunkById(100, function ($attendances) use ($disk, &$filesDeleted, &$recordsUpdated, &$bytesFreed) {
                foreach ($attendances as $att) {
                    $hasPhoto = false;

                    foreach ([$att->clock_in_photo, $att->clock_out_photo] as $photo) {
                        if ($photo && !str_starts_with($photo, 'data:')) {
                            $hasPhoto = true;
                            try {
                                if ($disk->exists($photo)) {
                                    $size = $disk->size($photo);
                                    if ($disk->delete($photo)) {
                                        $filesDeleted++;
                                        $bytesFreed += $size;
                                    }
                                }
                            } catch (\Throwable $e) {
                                // Continue deleting remaining files
                            }
                        } elseif ($photo && str_starts_with($photo, 'data:')) {
                            $hasPhoto = true;
                            $bytesFreed += strlen($photo);
                            $filesDeleted++;
                        }
                    }

                    if ($hasPhoto) {
                        $att->update([
                            'clock_in_photo' => null,
                            'clock_out_photo' => null,
                            'clock_in_photo_verified' => 0,
                            'clock_out_photo_verified' => 0,
                        ]);
                        $recordsUpdated++;
                    }
                }
            });

        return [
            'records_deleted' => $recordsUpdated,
            'files_deleted' => $filesDeleted,
            'bytes_freed' => $bytesFreed,
            'message' => "Berhasil membersihkan {$filesDeleted} foto absensi ({$recordsUpdated} catatan diperbarui).",
        ];
    }
}
