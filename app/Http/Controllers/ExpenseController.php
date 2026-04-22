<?php

namespace App\Http\Controllers;

use App\Models\CashOperation;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $expenses = CashOperation::where('branch_id', $request->user()->branch_id)
            ->where('type', 'cash_out')
            ->whereDate('created_at', now()->toDateString())
            ->with(['user', 'shift'])
            ->orderBy('created_at', 'desc')
            ->get();

        $activeShift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'active_shift' => $activeShift,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $activeShift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if (!$activeShift) {
            return back()->with('error', 'Anda harus membuka shift terlebih dahulu sebelum mencatat pengeluaran.');
        }

        CashOperation::create([
            'branch_id' => $request->user()->branch_id,
            'shift_id' => $activeShift->id,
            'user_id' => $request->user()->id,
            'type' => 'cash_out',
            'amount' => $request->amount,
            'reason' => $request->reason,
            'notes' => $request->notes,
            'status' => 'completed', // Direct expense usually completed immediately
        ]);

        return back()->with('success', 'Pengeluaran berhasil dicatat.');
    }

    public function destroy(CashOperation $expense)
    {
        // Only allow deleting if it's the user's branch and type is cash_out
        if ($expense->type !== 'cash_out') {
            return back()->with('error', 'Tindakan tidak diizinkan.');
        }

        // Check if shift is still open
        if ($expense->shift && $expense->shift->status === 'closed') {
            return back()->with('error', 'Tidak dapat menghapus pengeluaran pada shift yang sudah ditutup.');
        }

        $expense->delete();

        return back()->with('success', 'Catatan pengeluaran berhasil dihapus.');
    }
}
