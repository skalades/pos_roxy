<?php

namespace App\Services;

use App\Models\User;
use App\Models\Payroll;
use App\Models\Attendance;
use App\Models\TransactionItem;
use Carbon\Carbon;

class PayrollService extends BaseService
{
    /**
     * Calculate payroll data for a user within a date range.
     */
    public function calculateUserPayroll(User $user, string $startDate, string $endDate): array
    {
        $baseSalary = $user->monthly_salary ?? 0;

        // Sum commissions
        $totalCommission = TransactionItem::where('barber_id', $user->id)
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->sum('commission_amount');

        // ── DENDA KETERLAMBATAN ──────────────────────────────────────────────
        $lateDeduction      = 0;
        $lateCount          = 0;
        $lateTotalMinutes   = 0;
        $lateDeductionItems = [];

        // ── DENDA TIDAK MASUK (ALPHA) ────────────────────────────────────────
        $absentDeduction      = 0;
        $absentCount          = 0;
        $absentDeductionItems = [];

        if ($user->branch) {
            $branch      = $user->branch;
            $applyFrom   = $branch->late_penalty_apply_from
                ? Carbon::parse($branch->late_penalty_apply_from)->startOfDay()
                : null;

            // ── Mode denda telat ──
            // Prioritas: per-menit (late_penalty_per_minute > 0)
            //            fallback: per-interval
            $penaltyEnabled     = (bool) ($branch->enable_attendance_deduction ?? false);
            $perMinute          = $penaltyEnabled ? (float) ($branch->late_penalty_per_minute  ?? 0) : 0.0;
            $interval           = max(1, (int) ($branch->late_penalty_interval ?? 5));
            $penaltyPerInterval = ($penaltyEnabled && $perMinute <= 0)
                ? (float) ($branch->late_penalty_per_interval ?? 0)
                : 0.0;
            $gracePeriod        = (int) ($branch->late_grace_period_minutes ?? 0);

            // ── Absensi terlambat ──
            $lateAttendances = Attendance::where('user_id', $user->id)
                ->whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate)
                ->where('clock_in_on_time', false)
                ->whereNotNull('clock_in_at')
                ->get(['date', 'late_minutes', 'clock_in_at']);

            foreach ($lateAttendances as $attendance) {
                // Lewati jika sebelum tanggal berlaku
                if ($applyFrom && Carbon::parse($attendance->date)->startOfDay()->lt($applyFrom)) {
                    continue;
                }

                $minutes = (int) ($attendance->late_minutes ?? 0);

                // Fallback historis: hitung dari clock_in_at vs work_start_time
                if ($minutes === 0 && $attendance->clock_in_at && $user->work_start_time) {
                    $scheduledStart = Carbon::parse($attendance->date)
                        ->setTimeFromTimeString($user->work_start_time);
                    $rawLate = (int) $scheduledStart->diffInMinutes($attendance->clock_in_at, false);
                    $minutes = max(0, $rawLate - $gracePeriod);
                } elseif ($minutes === 0) {
                    // Tidak bisa hitung, skip
                    continue;
                }

                if ($minutes <= 0) {
                    continue;
                }

                // Hitung denda
                if ($perMinute > 0) {
                    // Mode per-menit
                    $deduction = $minutes * $perMinute;
                    $intervals = $minutes; // 1 interval = 1 menit dalam mode ini
                } else {
                    // Mode per-interval
                    $intervals = (int) floor($minutes / $interval);
                    $deduction = $intervals * $penaltyPerInterval;
                }

                $lateCount++;
                $lateTotalMinutes += $minutes;
                $lateDeduction    += $deduction;

                $lateDeductionItems[] = [
                    'date'      => $attendance->date?->format('Y-m-d'),
                    'clock_in'  => $attendance->clock_in_at?->format('H:i'),
                    'minutes'   => $minutes,
                    'intervals' => $perMinute > 0 ? $minutes : $intervals,
                    'deduction' => $deduction,
                    'mode'      => $perMinute > 0 ? 'per_minute' : 'per_interval',
                ];
            }

            // ── Denda tidak masuk (alpha) ──
            $absentPenaltyEnabled = (bool) ($branch->enable_absent_penalty ?? false);
            $absentPenaltyAmount  = $absentPenaltyEnabled
                ? (float) ($branch->absent_penalty_amount ?? 0)
                : 0.0;

            if ($absentPenaltyEnabled && $absentPenaltyAmount > 0) {
                // Hitung hari kerja dalam rentang (Senin–Sabtu, kecuali hari libur)
                $absentAttendances = Attendance::where('user_id', $user->id)
                    ->whereDate('date', '>=', $startDate)
                    ->whereDate('date', '<=', $endDate)
                    ->where('status', 'absent')
                    ->whereNull('clock_in_at')
                    ->get(['date', 'status']);

                foreach ($absentAttendances as $absentRecord) {
                    // Terapkan apply_from juga untuk denda alpha
                    if ($applyFrom && Carbon::parse($absentRecord->date)->startOfDay()->lt($applyFrom)) {
                        continue;
                    }

                    $absentCount++;
                    $absentDeduction      += $absentPenaltyAmount;
                    $absentDeductionItems[] = [
                        'date'      => Carbon::parse($absentRecord->date)->format('Y-m-d'),
                        'deduction' => $absentPenaltyAmount,
                    ];
                }
            }
        }

        $totalDeduction = $lateDeduction + $absentDeduction;
        $netSalary      = $baseSalary + $totalCommission - $totalDeduction;

        // Period string for storage (monthly)
        $period = Carbon::parse($startDate)->format('Y-m');

        // Check if already processed (only for full month)
        $isFullMonth = Carbon::parse($startDate)->startOfMonth()->equalTo(Carbon::parse($startDate)) &&
                       Carbon::parse($endDate)->endOfMonth()->startOfDay()->equalTo(Carbon::parse($endDate)->startOfDay());

        $existing = null;
        if ($isFullMonth) {
            $existing = Payroll::where('user_id', $user->id)
                ->where('period', $period)
                ->first();
        }

        return [
            'user'                   => $user,
            'period'                 => $period,
            'start_date'             => $startDate,
            'end_date'               => $endDate,
            'base_salary'            => (float) $baseSalary,
            'total_commission'       => (float) $totalCommission,
            // Denda telat
            'late_count'             => $lateCount,
            'late_total_minutes'     => $lateTotalMinutes,
            'late_deduction'         => (float) $lateDeduction,
            'late_deduction_items'   => $lateDeductionItems,
            // Denda alpha
            'absent_count'           => $absentCount,
            'absent_deduction'       => (float) $absentDeduction,
            'absent_deduction_items' => $absentDeductionItems,
            // Total
            'total_deduction'        => (float) $totalDeduction,
            'net_salary'             => (float) $netSalary,
            'status'                 => $existing ? $existing->status : 'pending',
            'processed_at'           => $existing ? $existing->processed_at : null,
        ];

    }

    /**
     * Generate and save payroll record.
     */
    public function generatePayrollRecord(User $user, string $period): Payroll
    {
        $startDate = Carbon::parse($period)->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::parse($period)->endOfMonth()->format('Y-m-d');

        $data = $this->calculateUserPayroll($user, $startDate, $endDate);

        return Payroll::updateOrCreate(
            ['user_id' => $user->id, 'period' => $period],
            [
                'branch_id' => $user->branch_id,
                'base_salary' => $data['base_salary'],
                'total_commission' => $data['total_commission'],
                'total_deduction' => $data['total_deduction'],
                'net_salary' => $data['net_salary'],
                'status' => 'paid',
                'processed_at' => now(),
                'processed_by' => auth()->id(),
            ]
        );
    }

    /**
     * Calculate deductions for multiple users efficiently (fixes N+1 in reports).
     */
    public function calculateBulkAttendanceDeductions(\Illuminate\Support\Collection $users, string $startDate, string $endDate): array
    {
        $userIds = $users->pluck('id')->toArray();
        $results = [];

        // Preload all attendances for these users in the date range
        $attendances = Attendance::whereIn('user_id', $userIds)
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->get()
            ->groupBy('user_id');

        foreach ($users as $user) {
            $userAttendances = $attendances->get($user->id, collect());
            
            $lateDeduction = 0;
            $lateCount = 0;
            $lateTotalMinutes = 0;
            $absentDeduction = 0;
            $absentCount = 0;

            if ($user->branch) {
                $branch = $user->branch;
                $applyFrom = $branch->late_penalty_apply_from ? Carbon::parse($branch->late_penalty_apply_from)->startOfDay() : null;

                $penaltyEnabled = (bool) ($branch->enable_attendance_deduction ?? false);
                $perMinute = $penaltyEnabled ? (float) ($branch->late_penalty_per_minute ?? 0) : 0.0;
                $interval = max(1, (int) ($branch->late_penalty_interval ?? 5));
                $penaltyPerInterval = ($penaltyEnabled && $perMinute <= 0) ? (float) ($branch->late_penalty_per_interval ?? 0) : 0.0;
                $gracePeriod = (int) ($branch->late_grace_period_minutes ?? 0);

                // Lates
                $lateRecords = $userAttendances->filter(function($a) {
                    return $a->clock_in_on_time === false && $a->clock_in_at !== null;
                });

                foreach ($lateRecords as $attendance) {
                    if ($applyFrom && Carbon::parse($attendance->date)->startOfDay()->lt($applyFrom)) continue;

                    $minutes = (int) ($attendance->late_minutes ?? 0);
                    if ($minutes === 0 && $attendance->clock_in_at && $user->work_start_time) {
                        $scheduledStart = Carbon::parse($attendance->date)->setTimeFromTimeString($user->work_start_time);
                        $rawLate = (int) $scheduledStart->diffInMinutes($attendance->clock_in_at, false);
                        $minutes = max(0, $rawLate - $gracePeriod);
                    }
                    
                    if ($minutes <= 0) continue;

                    if ($perMinute > 0) {
                        $deduction = $minutes * $perMinute;
                    } else {
                        $intervals = (int) floor($minutes / $interval);
                        $deduction = $intervals * $penaltyPerInterval;
                    }

                    $lateCount++;
                    $lateTotalMinutes += $minutes;
                    $lateDeduction += $deduction;
                }

                // Absents
                $absentPenaltyEnabled = (bool) ($branch->enable_absent_penalty ?? false);
                $absentPenaltyAmount = $absentPenaltyEnabled ? (float) ($branch->absent_penalty_amount ?? 0) : 0.0;

                if ($absentPenaltyEnabled && $absentPenaltyAmount > 0) {
                    $absentRecords = $userAttendances->filter(function($a) {
                        return $a->status === 'absent' && $a->clock_in_at === null;
                    });

                    foreach ($absentRecords as $absentRecord) {
                        if ($applyFrom && Carbon::parse($absentRecord->date)->startOfDay()->lt($applyFrom)) continue;
                        $absentCount++;
                        $absentDeduction += $absentPenaltyAmount;
                    }
                }
            }

            $results[$user->id] = [
                'late_count' => $lateCount,
                'late_total_minutes' => $lateTotalMinutes,
                'total_deduction' => $lateDeduction + $absentDeduction,
            ];
        }

        return $results;
    }
}
