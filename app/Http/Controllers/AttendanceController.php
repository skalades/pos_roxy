<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Traits\ApiResponse;

class AttendanceController extends Controller
{
    use ApiResponse;

    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    public function index()
    {
        $user = auth()->user();
        $today = Carbon::today();
        
        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today->toDateString())
            ->first();

        $isAdmin = $user->role === 'super_admin'; // Consistent with other roles
        $allAttendances = [];

        if ($isAdmin) {
            $allAttendances = Attendance::with(['user', 'branch'])
                ->orderBy('date', 'desc')
                ->orderBy('clock_in_at', 'desc')
                ->limit(100)
                ->get();
        }

        return Inertia::render('Attendance/Index', [
            'attendance' => $attendance,
            'branch' => $user->branch,
            'allAttendances' => $allAttendances,
            'isAdmin' => $isAdmin
        ]);
    }

    public function clockIn(Request $request)
    {
        $validated = $request->validate([
            'photo' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        try {
            $attendance = $this->attendanceService->processClockIn(auth()->user(), $validated);

            return $this->successResponse(['attendance' => $attendance], 'Absen masuk berhasil!');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function clockOut(Request $request)
    {
        $validated = $request->validate([
            'photo' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        try {
            $attendance = $this->attendanceService->processClockOut(auth()->user(), $validated);

            return $this->successResponse(['attendance' => $attendance], 'Absen pulang berhasil! Terima kasih kerja kerasnya hari ini.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
