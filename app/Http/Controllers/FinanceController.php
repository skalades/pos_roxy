<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashOperation;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Authorization check
        if (!$user->hasRole(['super_admin', 'admin', 'manager'])) {
            abort(403, 'Unauthorized action.');
        }

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $branchId = $request->input('branch_id');
        $barberId = $request->input('barber_id');

        // Enforcement of branch visibility for Managers
        if ($user->hasRole('manager')) {
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
        ]);
    }

    public function exportPdf(Request $request)
    {
        ini_set('memory_limit', '256M');
        set_time_limit(120);

        $user = $request->user();
        if (!$user->hasRole(['super_admin', 'admin', 'manager'])) abort(403);

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $branchId = $request->input('branch_id');
        if ($user->hasRole('manager')) $branchId = $user->branch_id;

        $branch = $branchId ? Branch::find($branchId) : null;
        $dateRange = [$startDate . ' 00:00:00', $endDate . ' 23:59:59'];

        // Resolve logo path for dompdf (Use App Logo for Premium Look)
        $logoUrl = \App\Models\Setting::get('app_logo');
        $logoPath = null;
        if ($logoUrl) {
            $parsedUrl = parse_url($logoUrl, PHP_URL_PATH);
            $relativePath = str_replace('/storage/', '', $parsedUrl);
            $logoPath = storage_path('app/public/' . $relativePath);
        }

        // 1. Financial Summary
        $revenue = Transaction::whereBetween('created_at', $dateRange)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('total_amount');
            
        $pendingRevenue = Transaction::whereBetween('created_at', $dateRange)
            ->where('status', 'pending')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('total_amount');
        
        $expenses = CashOperation::where('type', 'cash_out')
            ->whereBetween('created_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('amount');

        $commissions = TransactionItem::whereHas('transaction', function($q) use ($dateRange, $branchId) {
            $q->whereBetween('created_at', $dateRange)
              ->where('status', 'completed');
            if ($branchId) $q->where('branch_id', $branchId);
        })->sum('commission_amount');

        // 2. Barber Commission Breakdown
        $barberCommissions = TransactionItem::select(
                'barber_id',
                DB::raw('SUM(commission_amount) as total_commission'),
                DB::raw('SUM(quantity) as total_services')
            )
            ->whereNotNull('barber_id')
            ->whereHas('transaction', function($q) use ($dateRange, $branchId) {
                $q->whereBetween('created_at', $dateRange)
                  ->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->with('barber')
            ->groupBy('barber_id')
            ->get();

        // 3. Payment Method Distribution
        $paymentDistribution = Transaction::select('payment_method', DB::raw('SUM(total_amount) as total'), DB::raw('COUNT(*) as count'))
            ->whereBetween('created_at', $dateRange)
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', '')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->groupBy('payment_method')
            ->get();

        // 4. Shift & Cash Summary (Buka/Tutup Kas)
        $shifts = Shift::whereBetween('opened_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->with('user')
            ->orderBy('opened_at', 'desc')
            ->get();

        // 5. Detailed Transactions
        $transactions = Transaction::whereBetween('created_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->with(['items', 'cashier', 'customer'])
            ->orderBy('created_at', 'desc')
            ->get();

        // 6. Detailed Expenses
        $expenseList = CashOperation::where('type', 'cash_out')
            ->whereBetween('created_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        // 7. Staff & Payroll Summary (including Cashiers)
        $branchStaff = User::where('is_active', true)
            ->where('role', '!=', 'super_admin')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();
        
        $totalFixedSalaries = $branchStaff->sum('monthly_salary');

        $data = [
            'app_name' => \App\Models\Setting::get('app_name', 'Roxy POS'),
            'app_logo' => $logoPath,
            'report_date' => now()->format('d M Y H:i'),
            'period' => Carbon::parse($startDate)->format('d M Y') . ' - ' . Carbon::parse($endDate)->format('d M Y'),
            'branch' => $branch ? $branch->name : 'Semua Cabang',
            'summary' => [
                'revenue' => (float)$revenue,
                'pending_revenue' => (float)$pendingRevenue,
                'expenses' => (float)$expenses,
                'commissions' => (float)$commissions,
                'fixed_salaries' => (float)$totalFixedSalaries,
                'profit' => (float)($revenue - $expenses - $commissions - $totalFixedSalaries)
            ],
            'barber_commissions' => $barberCommissions,
            'payment_distribution' => $paymentDistribution,
            'shifts' => $shifts,
            'transactions' => $transactions,
            'expense_list' => $expenseList,
            'all_staff' => $branchStaff,
        ];

        $pdf = Pdf::loadView('pdf.finance_report', $data);
        return $pdf->download('Laporan_Keuangan_Detail_' . now()->format('Ymd') . '.pdf');
    }
}
