<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Exception;

class AttendanceService extends BaseService
{
    /**
     * Process Clock-In.
     */
    public function processClockIn(User $user, array $data): Attendance
    {
        $branch = $user->branch;
        if (!$branch) {
            throw new Exception('Cabang tidak ditemukan untuk user ini.');
        }

        $distance = $this->calculateDistance(
            $data['latitude'],
            $data['longitude'],
            $branch->latitude,
            $branch->longitude
        );

        $geofenceRadius = $branch->geofence_radius ?? 100;
        $isStrict = $branch->strict_attendance_policy ?? true;

        if ($isStrict && $distance > $geofenceRadius) {
            throw new Exception('Anda berada di luar jangkauan lokasi cabang ('.round($distance).'m). Jarak maksimal: '.$geofenceRadius.'m.');
        }

        // Process Image
        $imageName = $this->savePhoto($data['photo'], 'attendance/in/' . $user->id . '_' . time() . '.jpg');

        $now = Carbon::now();
        $onTime = $now->format('H:i:s') <= ($user->work_start_time ?? '09:30:00');

        return Attendance::updateOrCreate(
            [
                'user_id' => $user->id,
                'date' => $now->toDateString(),
            ],
            [
                'branch_id' => $branch->id,
                'clock_in_at' => $now,
                'clock_in_latitude' => $data['latitude'],
                'clock_in_longitude' => $data['longitude'],
                'clock_in_photo' => $imageName,
                'clock_in_distance' => round($distance),
                'clock_in_on_time' => $onTime,
                'status' => $onTime ? 'present' : 'late',
            ]
        );
    }

    /**
     * Process Clock-Out.
     */
    public function processClockOut(User $user, array $data): Attendance
    {
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', Carbon::today()->toDateString())
            ->first();

        if (!$attendance || !$attendance->clock_in_at) {
            throw new Exception('Anda belum melakukan absen masuk hari ini.');
        }

        $branch = $user->branch;
        $distance = $this->calculateDistance(
            $data['latitude'],
            $data['longitude'],
            $branch->latitude,
            $branch->longitude
        );

        $geofenceRadius = $branch->geofence_radius ?? 100;
        $isStrict = $branch->strict_attendance_policy ?? true;

        if ($isStrict && $distance > $geofenceRadius) {
            throw new Exception('Anda berada di luar jangkauan lokasi cabang ('.round($distance).'m).');
        }

        // Process Image
        $imageName = $this->savePhoto($data['photo'], 'attendance/out/' . $user->id . '_' . time() . '.jpg');

        $now = Carbon::now();
        $totalHours = $attendance->clock_in_at->diffInHours($now);

        $attendance->update([
            'clock_out_at' => $now,
            'clock_out_latitude' => $data['latitude'],
            'clock_out_longitude' => $data['longitude'],
            'clock_out_photo' => $imageName,
            'clock_out_distance' => round($distance),
            'total_hours' => $totalHours,
        ]);

        return $attendance;
    }

    /**
     * Save base64 photo to storage.
     */
    private function savePhoto(string $base64Data, string $path): string
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
            $base64Data = base64_decode($base64Data);
        } else {
            // Assume it might already be raw or error
            $decoded = base64_decode($base64Data, true);
            if ($decoded === false) {
                throw new Exception('Format foto tidak valid.');
            }
            $base64Data = $decoded;
        }

        Storage::disk('public')->put($path, $base64Data);
        return $path;
    }

    /**
     * Haversine formula for distance calculation.
     */
    public function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // meters

        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $latDelta = $lat2 - $lat1;
        $lonDelta = $lon2 - $lon1;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($lat1) * cos($lat2) * pow(sin($lonDelta / 2), 2)));
            
        return $angle * $earthRadius;
    }
}
