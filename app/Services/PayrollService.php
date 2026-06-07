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

        // Sum deductions (interval-based late penalty)
        $totalDeduction     = 0;
        $lateCount          = 0;
        $lateTotalMinutes   = 0;
        $lateDeductionItems = [];

        if ($user->branch && $user->branch->enable_attendance_deduction) {
            $lateAttendances = Attendance::where('user_id', $user->id)
                ->whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate)
                ->where('clock_in_on_time', false)
                ->get(['date', 'late_minutes', 'clock_in_at']);

            // Ambil pengaturan interval dari cabang
            $interval        = max(1, (int) ($user->branch->late_penalty_interval ?? 5));
            $penaltyPerInterval = (float) ($user->branch->late_penalty_per_interval ?? 0);
            $applyFrom       = $user->branch->late_penalty_apply_from ? Carbon::parse($user->branch->late_penalty_apply_from)->startOfDay() : null;

            foreach ($lateAttendances as $attendance) {
                // Jika ada apply_from dan absensi sebelum tanggal tsb, abaikan denda
                if ($applyFrom && Carbon::parse($attendance->date)->startOfDay()->lt($applyFrom)) {
                    continue;
                }

                $minutes = (int) ($attendance->late_minutes ?? 0);

                // Fallback untuk data historis: hitung dari clock_in_at vs work_start_time
                if ($minutes === 0 && $attendance->clock_in_at && $user->work_start_time) {
                    $scheduledStart = Carbon::parse($attendance->date)
                        ->setTimeFromTimeString($user->work_start_time);
                    $rawLate = (int) $scheduledStart->diffInMinutes($attendance->clock_in_at, false);
                    $gracePeriod = (int) ($user->branch->late_grace_period_minutes ?? 0);
                    $minutes = max(0, $rawLate - $gracePeriod);
                }

                // Lewati jika setelah grace period ternyata tidak ada keterlambatan efektif
                if ($minutes <= 0) {
                    continue;
                }

                $intervals = (int) floor($minutes / $interval);
                $deduction = $intervals * $penaltyPerInterval;

                $lateCount++;
                $lateTotalMinutes += $minutes;
                $totalDeduction   += $deduction;

                $lateDeductionItems[] = [
                    'date'       => $attendance->date?->format('Y-m-d'),
                    'clock_in'   => $attendance->clock_in_at?->format('H:i'),
                    'minutes'    => $minutes,
                    'intervals'  => $intervals,
                    'deduction'  => $deduction,
                ];
            }
        }

        $netSalary = $baseSalary + $totalCommission - $totalDeduction;

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
            'user'                 => $user,
            'period'               => $period,
            'start_date'           => $startDate,
            'end_date'             => $endDate,
            'base_salary'          => (float) $baseSalary,
            'total_commission'     => (float) $totalCommission,
            'total_deduction'      => (float) $totalDeduction,
            'late_count'           => $lateCount,
            'late_total_minutes'   => $lateTotalMinutes,
            'late_deduction_items' => $lateDeductionItems,
            'net_salary'           => (float) $netSalary,
            'status'               => $existing ? $existing->status : 'pending',
            'processed_at'         => $existing ? $existing->processed_at : null,
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
}
