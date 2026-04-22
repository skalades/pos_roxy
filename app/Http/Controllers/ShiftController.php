<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        $cashSales = 0;
        if ($shift) {
            $cashSales = $shift->transactions()
                ->where('payment_method', 'cash')
                ->where('status', 'completed')
                ->sum('total_amount');
        }

        return Inertia::render('Shifts/Index', [
            'current_shift' => $shift,
            'cash_sales' => (float) $cashSales
        ]);
    }

    public function current(Request $request)
    {
        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        return response()->json([
            'shift' => $shift,
            'is_open' => !!$shift
        ]);
    }

    public function open(Request $request)
    {
        $request->validate([
            'opening_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Check if there is already an open shift
        $existingShift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if ($existingShift) {
            return back()->withErrors(['shift' => 'Anda masih memiliki shift yang terbuka.']);
        }

        Shift::create([
            'branch_id' => $request->user()->branch_id,
            'user_id' => $request->user()->id,
            'opening_balance' => $request->opening_balance,
            'opened_at' => now(),
            'status' => 'open',
            'notes' => $request->notes,
        ]);

        return redirect()->route('pos.index')->with('success', 'Shift berhasil dibuka.');
    }

    public function close(Request $request)
    {
        $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->firstOrFail();

        // Calculate expected balance
        // Expected = opening + total_cash_transactions + cash_in - cash_out
        $cashSales = $shift->transactions()
            ->where('payment_method', 'cash')
            ->where('status', 'completed')
            ->sum('amount_paid'); // amount_paid is what they give, but we should use total_amount or amount_paid - change?
            // Actually transactions table has payment_amount and change_amount.
            // total_amount is what they should pay.
            
        // Wait, let's look at transactions table again.
        // total_amount, payment_amount, change_amount.
        // If payment is cash, the cash added to drawer is total_amount.
        
        $totalCashSales = $shift->transactions()
            ->where('payment_method', 'cash')
            ->where('status', 'completed')
            ->sum('total_amount');

        // TODO: Add cash operations (In/Out)
        $expectedBalance = $shift->opening_balance + $totalCashSales;

        $shift->update([
            'closing_balance' => $request->closing_balance,
            'expected_balance' => $expectedBalance,
            'difference' => $request->closing_balance - $expectedBalance,
            'closed_at' => now(),
            'status' => 'closed',
            'notes' => $shift->notes . "\nClose notes: " . $request->notes,
        ]);

        return redirect()->route('dashboard')->with('success', 'Shift berhasil ditutup.');
    }
}
