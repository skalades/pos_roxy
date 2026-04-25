<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\CashOperation;
use App\Models\Transaction;
use App\Models\TransactionItem;
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

        // Enforcement of branch visibility for Managers
        if ($user->hasRole('manager')) {
            $branchId = $user->branch_id;
        }

        // 1. Core Summary Stats
        $query = Transaction::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        if ($branchId) $query->where('branch_id', $branchId);
        $totalRevenue = (float) $query->sum('total');

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
                DB::raw('SUM(total) as total')
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
                DB::raw('SUM(total) as total')
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

        return Inertia::render('Reports/Finance/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'total_commissions' => $totalCommissions,
                'net_profit' => $netProfit,
            ],
            'revenue_trend' => $revenueTrend,
            'payment_methods' => $paymentMethods,
            'top_items' => $topItems,
            'branches' => $user->hasRole(['super_admin', 'admin']) ? Branch::all() : [],
        ]);
    }

    public function exportPdf(Request $request)
    {
        // Similar logic to index but for PDF
        $user = $request->user();
        if (!$user->hasRole(['super_admin', 'admin', 'manager'])) abort(403);

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $branchId = $request->input('branch_id');
        if ($user->hasRole('manager')) $branchId = $user->branch_id;

        $branch = $branchId ? Branch::find($branchId) : null;

        // Fetch data (simplified for PDF)
        $revenue = Transaction::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('total');
        
        $expenses = CashOperation::where('type', 'cash_out')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))->sum('amount');

        $commissions = TransactionItem::whereHas('transaction', function($q) use ($startDate, $endDate, $branchId) {
            $q->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            if ($branchId) $q->where('branch_id', $branchId);
        })->sum('commission_amount');

        $data = [
            'app_name' => \App\Models\Setting::get('app_name', 'Roxy POS'),
            'app_logo' => \App\Models\Setting::get('receipt_logo'), // Using receipt logo for PDF
            'report_date' => now()->format('d M Y H:i'),
            'period' => Carbon::parse($startDate)->format('d M Y') . ' - ' . Carbon::parse($endDate)->format('d M Y'),
            'branch' => $branch ? $branch->name : 'Semua Cabang',
            'summary' => [
                'revenue' => $revenue,
                'expenses' => $expenses,
                'commissions' => $commissions,
                'profit' => $revenue - $expenses - $commissions
            ],
            // Add list of expenses and payment methods for the PDF detail
            'expense_list' => CashOperation::where('type', 'cash_out')
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->with('user')
                ->get(),
            'payment_distribution' => Transaction::select('payment_method', DB::raw('SUM(total) as total'))
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
                ->groupBy('payment_method')
                ->get()
        ];

        $pdf = Pdf::loadView('pdf.finance_report', $data);
        return $pdf->download('Laporan_Keuangan_' . now()->format('Ymd') . '.pdf');
    }
}
