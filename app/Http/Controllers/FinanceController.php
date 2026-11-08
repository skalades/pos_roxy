<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashOperation;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\PayrollService;
use App\Services\FinanceReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    protected FinanceReportService $reportService;

    public function __construct(FinanceReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        
        // Authorization check
        if (!$user->hasRole(['super_admin', 'admin', 'manager', 'cashier'])) {
            abort(403, 'Unauthorized action.');
        }

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $branchId = $request->input('branch_id');
        $barberId = $request->input('barber_id');

        // Enforcement of branch visibility for Managers & Cashiers
        if ($user->hasRole(['manager', 'cashier'])) {
            $branchId = $user->branch_id;
        }

        // 1. Core Summary Stats
        $baseQuery = Transaction::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        if ($branchId) $baseQuery->where('branch_id', $branchId);

        $totalRevenue = (float) (clone $baseQuery)->sum('total_amount');
        $actualRevenue = (float) (clone $baseQuery)->where('status', 'completed')->sum('total_amount');
        $pendingRevenue = (float) (clone $baseQuery)->where('status', 'pending')->sum('total_amount');

        $expenseQuery = CashOperation::where('type', 'cash_out')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        if ($branchId) $expenseQuery->where('branch_id', $branchId);
        $totalExpenses = (float) $expenseQuery->sum('amount');

        $commissionQuery = TransactionItem::whereHas('transaction', function($q) use ($startDate, $endDate, $branchId) {
            $q->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            if ($branchId) $q->where('branch_id', $branchId);
        });
        $totalCommissions = (float) $commissionQuery->sum('commission_amount');

        $netProfit = $totalRevenue - $totalExpenses - $totalCommissions;

        // 2. Revenue Trend (Daily)
        $revenueTrend = Transaction::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total')
            )
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 3. Payment Methods Distribution
        $paymentMethods = Transaction::select(
                'payment_method',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_amount) as total')
            )
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->groupBy('payment_method')
            ->get();

        // 4. Top Services/Products
        $topItems = TransactionItem::select(
                'item_name',
                DB::raw('SUM(quantity) as qty'),
                DB::raw('SUM(total_price) as total')
            )
            ->whereHas('transaction', function($q) use ($startDate, $endDate, $branchId) {
                $q->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->groupBy('item_name')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        // 5. Pending Items Breakdown
        $pendingItems = TransactionItem::select(
                'item_name',
                DB::raw('SUM(quantity) as qty'),
                DB::raw('SUM(total_price) as total')
            )
            ->whereHas('transaction', function($q) use ($startDate, $endDate, $branchId) {
                $q->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                  ->where('status', 'pending');
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->groupBy('item_name')
            ->get();
        // 6. Barber Performance
        $barbers = User::where('role', 'barber')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->select('id', 'name')
            ->get();

        $selectedBarberPerformance = null;
        if ($barberId) {
            $barber = User::find($barberId);
            if ($barber) {
                $serviceBreakdown = TransactionItem::join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                    ->select(
                        'transaction_items.item_name',
                        DB::raw('SUM(transaction_items.quantity) as qty'),
                        DB::raw('SUM(transaction_items.total_price) as total'),
                        DB::raw('SUM(transaction_items.commission_amount) as total_commission')
                    )
                    ->where('transaction_items.barber_id', $barberId)
                    ->where('transactions.status', 'completed')
                    ->whereBetween('transactions.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->when($branchId, fn($q) => $q->where('transactions.branch_id', $branchId))
                    ->groupBy('transaction_items.item_name')
                    ->get();
                    
                $selectedBarberPerformance = [
                    'barber' => [
                        'id' => $barber->id,
                        'name' => $barber->name,
                    ],
                    'total_commission' => (float)$serviceBreakdown->sum('total_commission'),
                    'total_services' => (int)$serviceBreakdown->sum('qty'),
                    'total_revenue' => (float)$serviceBreakdown->sum('total'),
                    'services' => $serviceBreakdown
                ];
            }
        }
        // Attendance Monitoring
        $payrollService = new PayrollService();
        $usersQuery = User::whereIn('role', ['barber', 'staff', 'manager']);
        if ($branchId) {
            $usersQuery->where('branch_id', $branchId);
        }
        $usersToCalculate = $usersQuery->with('branch')->get();

        $attendanceStats = [
            'total_late_staff' => 0,
            'total_late_count' => 0,
            'total_late_minutes' => 0,
            'total_deduction' => 0,
            'staff_details' => []
        ];

        $bulkPayroll = $payrollService->calculateBulkAttendanceDeductions($usersToCalculate, $startDate, $endDate);

        foreach ($usersToCalculate as $staff) {
            $payroll = $bulkPayroll[$staff->id] ?? null;
            if ($payroll && ($payroll['late_count'] > 0 || $payroll['late_total_minutes'] > 0)) {
                $attendanceStats['total_late_staff']++;
                $attendanceStats['total_late_count'] += $payroll['late_count'];
                $attendanceStats['total_late_minutes'] += $payroll['late_total_minutes'];
                $attendanceStats['total_deduction'] += $payroll['total_deduction'];
                
                $attendanceStats['staff_details'][] = [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'role' => $staff->role,
                    'branch' => $staff->branch ? $staff->branch->name : '-',
                    'late_count' => $payroll['late_count'],
                    'late_minutes' => $payroll['late_total_minutes'],
                    'deduction' => $payroll['total_deduction']
                ];
            }
        }

        // Urutkan berdasarkan menit telat terbanyak
        usort($attendanceStats['staff_details'], function($a, $b) {
            return $b['late_minutes'] <=> $a['late_minutes'];
        });

        return Inertia::render('Reports/Finance/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
                'barber_id' => $barberId,
            ],
            'summary' => [
                'total_revenue' => $totalRevenue,
                'actual_revenue' => $actualRevenue,
                'pending_revenue' => $pendingRevenue,
                'total_expenses' => $totalExpenses,
                'total_commissions' => $totalCommissions,
                'net_profit' => $actualRevenue - $totalExpenses - $totalCommissions,
            ],
            'revenue_trend' => $revenueTrend,
            'payment_methods' => $paymentMethods,
            'top_items' => $topItems,
            'pending_items' => $pendingItems,
            'branches' => $user->hasRole(['super_admin', 'admin']) ? Branch::all() : [],
            'barbers' => $barbers,
            'selected_barber_performance' => $selectedBarberPerformance,
            'attendance_stats' => $attendanceStats,
        ]);
    }

    public function exportPdf(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole(['super_admin', 'admin', 'manager', 'cashier'])) {
            abort(403, 'Unauthorized action.');
        }

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $branchId = $request->input('branch_id');
        if ($user->hasRole(['manager', 'cashier'])) {
            $branchId = $user->branch_id;
        }

        return $this->reportService->downloadDateRange($startDate, $endDate, $branchId ? (int)$branchId : null);
    }

    public function exportMonths(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole(['super_admin', 'admin', 'manager', 'cashier'])) {
            abort(403, 'Unauthorized action.');
        }

        $year = (int) $request->input('year', date('Y'));
        $branchId = $request->input('branch_id');
        if ($user->hasRole(['manager', 'cashier'])) {
            $branchId = $user->branch_id;
        }

        // Support single month or array / comma-separated months
        $rawMonths = $request->input('months', []);
        if ($request->has('month') && empty($rawMonths)) {
            $rawMonths = [$request->input('month')];
        } elseif (is_string($rawMonths)) {
            $rawMonths = explode(',', $rawMonths);
        }

        $months = array_values(array_unique(array_filter(
            array_map('intval', (array) $rawMonths),
            fn($m) => $m >= 1 && $m <= 12
        )));

        sort($months);

        if (empty($months)) {
            return back()->with('error', 'Silakan pilih minimal satu bulan untuk diexport.');
        }

        if (count($months) === 1) {
            return $this->reportService->downloadSingleMonth($year, $months[0], $branchId ? (int)$branchId : null);
        }

        return $this->reportService->exportMultipleMonthsZip($months, $year, $branchId ? (int)$branchId : null);
    }
}
