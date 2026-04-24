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

        // Sum deductions (late penalty)
        $totalDeduction = 0;
        $lateCount = 0;
        
        if ($user->branch && $user->branch->enable_attendance_deduction) {
            $lateCount = Attendance::where('user_id', $user->id)
                ->whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate)
                ->where('clock_in_on_time', false)
                ->count();
            
            $totalDeduction = $lateCount * ($user->branch->late_penalty_amount ?? 0);
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
            'user' => $user,
            'period' => $period,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'base_salary' => (float)$baseSalary,
            'total_commission' => (float)$totalCommission,
            'total_deduction' => (float)$totalDeduction,
            'late_count' => $lateCount,
            'net_salary' => (float)$netSalary,
            'status' => $existing ? $existing->status : 'pending',
            'processed_at' => $existing ? $existing->processed_at : null,
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
