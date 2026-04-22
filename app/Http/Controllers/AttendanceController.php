<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $today = Carbon::today();
        
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today->toDateString())
            ->first();

        return Inertia::render('Attendance/Index', [
            'attendance' => $attendance,
            'branch' => $user->branch,
        ]);
    }

    public function clockIn(Request $request)
    {
        $request->validate([
            'photo' => 'required|string', // base64 image
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user = auth()->user();
        $branch = $user->branch;
        
        if (!$branch) {
            return back()->withErrors(['error' => 'Cabang tidak ditemukan untuk user ini.']);
        }

        $distance = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $branch->latitude,
            $branch->longitude
        );

        $geofenceRadius = $branch->geofence_radius ?? 100; // default 100m

        if ($distance > $geofenceRadius) {
            return response()->json([
                'success' => false,
                'message' => 'Anda berada di luar jangkauan lokasi cabang ('.round($distance).'m). Jarak maksimal: '.$geofenceRadius.'m.',
            ], 422);
        }

        // Process Image
        $imageData = $request->photo;
        $imageName = 'attendance/in/' . $user->id . '_' . time() . '.jpg';
        
        // Remove base64 header if exists
        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
            $imageData = base64_decode($imageData);
        } else {
            return response()->json(['success' => false, 'message' => 'Format foto tidak valid.'], 422);
        }

        Storage::disk('public')->put($imageName, $imageData);

        $now = Carbon::now();
        $onTime = $now->format('H:i:s') <= ($user->work_start_time ?? '09:30:00');

        $attendance = Attendance::updateOrCreate(
            [
                'user_id' => $user->id,
                'date' => $now->toDateString(),
            ],
            [
                'branch_id' => $branch->id,
                'clock_in_at' => $now,
                'clock_in_latitude' => $request->latitude,
                'clock_in_longitude' => $request->longitude,
                'clock_in_photo' => $imageName,
                'clock_in_distance' => round($distance),
                'clock_in_on_time' => $onTime,
                'status' => $onTime ? 'present' : 'late',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Absen masuk berhasil!',
            'attendance' => $attendance,
        ]);
    }

    public function clockOut(Request $request)
    {
        $request->validate([
            'photo' => 'required|string', // base64 image
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user = auth()->user();
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', Carbon::today()->toDateString())
            ->first();

        if (!$attendance || !$attendance->clock_in_at) {
            return response()->json(['success' => false, 'message' => 'Anda belum melakukan absen masuk hari ini.'], 422);
        }

        $branch = $user->branch;
        $distance = $this->calculateDistance(
            $request->latitude,
            $request->longitude,
            $branch->latitude,
            $branch->longitude
        );

        $geofenceRadius = $branch->geofence_radius ?? 100;

        if ($distance > $geofenceRadius) {
            return response()->json([
                'success' => false,
                'message' => 'Anda berada di luar jangkauan lokasi cabang ('.round($distance).'m).',
            ], 422);
        }

        // Process Image
        $imageData = $request->photo;
        $imageName = 'attendance/out/' . $user->id . '_' . time() . '.jpg';
        
        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
            $imageData = base64_decode($imageData);
        }

        Storage::disk('public')->put($imageName, $imageData);

        $now = Carbon::now();
        $totalHours = $attendance->clock_in_at->diffInHours($now);

        $attendance->update([
            'clock_out_at' => $now,
            'clock_out_latitude' => $request->latitude,
            'clock_out_longitude' => $request->longitude,
            'clock_out_photo' => $imageName,
            'clock_out_distance' => round($distance),
            'total_hours' => $totalHours,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absen pulang berhasil! Terima kasih kerja kerasnya hari ini.',
            'attendance' => $attendance,
        ]);
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
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
