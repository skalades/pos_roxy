<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Payroll;
use App\Models\Attendance;
use App\Models\TransactionItem;
use App\Models\Branch;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PayrollController extends Controller
{
    protected PayrollService $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    public function index(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $period = $request->get('period');

        if ($period && !$startDate) {
            $startDate = Carbon::parse($period)->startOfMonth()->format('Y-m-d');
            $endDate = Carbon::parse($period)->endOfMonth()->format('Y-m-d');
        } elseif (!$startDate) {
            $startDate = Carbon::now()->startOfMonth()->format('Y-m-d');
            $endDate = Carbon::now()->endOfMonth()->format('Y-m-d');
            $period = Carbon::now()->format('Y-m');
        }

        $branchId = $request->get('branch_id');

        $users = User::with(['profile', 'branch'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->whereIn('role', ['barber', 'cashier', 'manager'])
            ->get();

        $payrollData = $users->map(function ($user) use ($startDate, $endDate) {
            return $this->payrollService->calculateUserPayroll($user, $startDate, $endDate);
        });

        return Inertia::render('Payroll/Index', [
            'payrollData' => $payrollData,
            'branches' => Branch::all(['id', 'name']),
            'filters' => [
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ],
        ]);
    }

    public function show(Request $request, User $user)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $period = $request->get('period');

        if ($period && !$startDate) {
            $startDate = Carbon::parse($period)->startOfMonth()->format('Y-m-d');
            $endDate = Carbon::parse($period)->endOfMonth()->format('Y-m-d');
        }

        $data = $this->payrollService->calculateUserPayroll($user, $startDate, $endDate);
        
        // Fetch detailed items for the payslip
        $commissions = TransactionItem::where('barber_id', $user->id)
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->with('transaction')
            ->get();

        $lates = Attendance::where('user_id', $user->id)
            ->whereDate('date', '>=', $startDate)
            ->whereDate('date', '<=', $endDate)
            ->where('clock_in_on_time', false)
            ->get();

        return Inertia::render('Payroll/Show', [
            'payroll' => $data,
            'commissions' => $commissions,
            'lates' => $lates,
            'filters' => [
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'period' => 'required|string', // Format: YYYY-MM
        ]);

        $user = User::findOrFail($request->user_id);
        
        $this->payrollService->generatePayrollRecord($user, $request->period);

        return back()->with('success', 'Payroll berhasil diproses.');
    }

    public function exportPdf(Request $request)
    {
        ini_set('memory_limit', '256M');
        set_time_limit(120);

        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));
        $branchId = $request->get('branch_id');

        $users = User::with(['branch'])
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->whereIn('role', ['barber', 'cashier', 'manager', 'admin'])
            ->where('role', '!=', 'super_admin')
            ->get();

        $payrollData = $users->map(function ($user) use ($startDate, $endDate) {
            return $this->payrollService->calculateUserPayroll($user, $startDate, $endDate);
        });

        $branch = $branchId ? Branch::find($branchId) : null;

        $data = [
            'app_name' => \App\Models\Setting::get('app_name', 'Roxy POS'),
            'app_logo' => \App\Models\Setting::get('receipt_logo'),
            'report_date' => now()->format('d M Y H:i'),
            'period_label' => Carbon::parse($startDate)->format('d M Y') . ' - ' . Carbon::parse($endDate)->format('d M Y'),
            'branch_name' => $branch ? $branch->name : 'Semua Cabang',
            'payroll_data' => $payrollData,
            'total_net_payroll' => $payrollData->sum('net_salary'),
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.payroll_report', $data);
        return $pdf->download('Laporan_Payroll_' . now()->format('Ymd') . '.pdf');
    }
}
