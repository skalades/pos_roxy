<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Http\Requests\OpenShiftRequest;
use App\Http\Requests\CloseShiftRequest;
use App\Services\ShiftService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    protected ShiftService $shiftService;

    public function __construct(ShiftService $shiftService)
    {
        $this->shiftService = $shiftService;
    }

    public function index(Request $request)
    {
        $shift = $this->shiftService->getActiveShift($request->user()->id);

        $paymentSummary = [];
        $barberCommissions = [];
        $servicesTotal = 0;
        $productsTotal = 0;

        if ($shift) {
            $cashSales = $this->shiftService->calculateCashSales($shift);
            $cashExpenses = $this->shiftService->calculateCashExpenses($shift);
            $paymentSummary = $this->shiftService->getPaymentMethodsSummary($shift);
            $barberCommissions = $this->shiftService->getBarberCommissions($shift);
            $servicesTotal = $this->shiftService->getServicesTotal($shift);
            $productsTotal = $this->shiftService->getProductsTotal($shift);
        }

        return Inertia::render('Shifts/Index', [
            'current_shift' => $shift,
            'cash_sales' => $cashSales,
            'cash_expenses' => $cashExpenses,
            'payment_summary' => $paymentSummary,
            'barber_commissions' => $barberCommissions,
            'services_total' => $servicesTotal,
            'products_total' => $productsTotal,
        ]);
    }

    public function current(Request $request)
    {
        $shift = $this->shiftService->getActiveShift($request->user()->id);

        return response()->json([
            'shift' => $shift,
            'is_open' => !!$shift
        ]);
    }

    public function open(OpenShiftRequest $request)
    {
        $validated = $request->validated();

        // Cek apakah sudah ada shift terbuka
        $existingShift = $this->shiftService->getActiveShift($request->user()->id);

        if ($existingShift) {
            return back()->withErrors(['shift' => 'Anda masih memiliki shift yang terbuka.']);
        }

        // Audit & Enforcement: Check if branch requires attendance for shift
        $branch = $request->user()->branch;
        if ($branch && $branch->require_attendance_for_shift) {
            $hasAttended = \App\Models\Attendance::where('user_id', $request->user()->id)
                ->where('date', now()->toDateString())
                ->whereNotNull('clock_in_at')
                ->exists();
            
            if (!$hasAttended) {
                return back()->withErrors(['shift' => 'Wajib melakukan Absen Selfie sebelum membuka shift di cabang ini.']);
            }
        }

        Shift::create([
            'branch_id' => $request->user()->branch_id,
            'user_id' => $request->user()->id,
            'opening_balance' => $validated['opening_balance'],
            'opened_at' => now(),
            'status' => 'open',
            'notes' => $validated['notes'],
        ]);

        return redirect()->route('pos.index')->with('success', 'Shift berhasil dibuka.')->with('just_opened', true);
    }

    public function close(CloseShiftRequest $request)
    {
        $validated = $request->validated();

        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->firstOrFail();

        // Pakai ShiftService — satu sumber kebenaran
        $expectedBalance = $this->shiftService->calculateExpectedBalance($shift);

        $shift->update([
            'closing_balance' => $validated['closing_balance'],
            'expected_balance' => $expectedBalance,
            'difference' => $validated['closing_balance'] - $expectedBalance,
            'closed_at' => now(),
            'status' => 'closed',
            'notes' => $shift->notes . "\nClose notes: " . $validated['notes'],
        ]);

        return redirect()->route('dashboard')->with('success', 'Shift berhasil ditutup.');
    }
}
