<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\Branch;
use App\Services\ShiftService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class ShiftReportController extends Controller
{
    public function index(Request $request)
    {
        // Pastikan hanya super_admin atau admin yang bisa mengakses
        if (!in_array($request->user()->role, ['super_admin', 'admin'])) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        $query = Shift::with(['user', 'branch'])->orderBy('created_at', 'desc');

        // Jika role admin biasa (bukan super_admin), batasi hanya cabang miliknya
        if ($request->user()->role !== 'super_admin') {
            $query->where('branch_id', $request->user()->branch_id);
        } else {
            // Super admin bisa filter cabang
            if ($request->filled('branch_id')) {
                $query->where('branch_id', $request->branch_id);
            }
        }

        if ($request->filled('date')) {
            $query->whereDate('opened_at', $request->date);
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $shifts = $query->paginate(15)->withQueryString();

        $branches = Branch::where('is_active', true)->get();

        return Inertia::render('Reports/Shifts', [
            'shifts' => $shifts,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'date', 'status']),
        ]);
    }

    public function show($id, Request $request, ShiftService $shiftService)
    {
        if (!in_array($request->user()->role, ['super_admin', 'admin'])) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        $query = Shift::with(['user', 'branch']);
        
        // Jika role admin biasa, batasi hanya melihat shift cabangnya
        if ($request->user()->role !== 'super_admin') {
            $query->where('branch_id', $request->user()->branch_id);
        }

        $shift = $query->findOrFail($id);

        $cashSales = $shiftService->calculateCashSales($shift);
        $cashExpenses = $shiftService->calculateCashExpenses($shift);
        $expectedBalance = $shiftService->calculateExpectedBalance($shift);
        $paymentSummary = $shiftService->getPaymentMethodsSummary($shift);
        $barberCommissions = $shiftService->getBarberCommissions($shift);
        $servicesTotal = $shiftService->getServicesTotal($shift);
        $productsTotal = $shiftService->getProductsTotal($shift);
        $servicesBreakdown = $shiftService->getServicesBreakdown($shift);
        $productsBreakdown = $shiftService->getProductsBreakdown($shift);
        $totalDiscount = $shiftService->calculateTotalDiscount($shift);
        $discountBreakdown = $shiftService->getDiscountBreakdown($shift);

        return Inertia::render('Reports/ShiftDetail', [
            'shift' => $shift,
            'cash_sales' => $cashSales,
            'cash_expenses' => $cashExpenses,
            'expected_balance' => $expectedBalance,
            'payment_summary' => $paymentSummary,
            'barber_commissions' => $barberCommissions,
            'services_total' => $servicesTotal,
            'products_total' => $productsTotal,
            'services_breakdown' => $servicesBreakdown,
            'products_breakdown' => $productsBreakdown,
            'total_discount' => $totalDiscount,
            'discount_breakdown' => $discountBreakdown,
        ]);
    }
}
