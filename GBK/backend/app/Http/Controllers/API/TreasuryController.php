<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CashLedger;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TreasuryController extends Controller
{
    /**
     * Get financial summary and chart data.
     */
    public function summary(Request $request)
    {
        // 1. Calculate Total Balance
        $income = CashLedger::where('type', 'income')->sum('amount');
        $expense = CashLedger::where('type', 'expense')->sum('amount');
        $balance = $income - $expense;

        // 2. Calculate Current Month Summary
        $startOfMonth = now()->startOfMonth()->toDateTimeString();
        $endOfMonth = now()->endOfMonth()->toDateTimeString();

        $monthIncome = CashLedger::where('type', 'income')
            ->whereBetween('recorded_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $monthExpense = CashLedger::where('type', 'expense')
            ->whereBetween('recorded_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // 3. Chart Data: Monthly breakdown of the current year
        $year = now()->year;
        
        $monthlyFlows = CashLedger::select(
            DB::raw('month(recorded_at) as month'),
            DB::raw('sum(case when type = "income" then amount else 0 end) as income'),
            DB::raw('sum(case when type = "expense" then amount else 0 end) as expense')
        )
        ->whereYear('recorded_at', $year)
        ->groupBy(DB::raw('month(recorded_at)'))
        ->orderBy(DB::raw('month(recorded_at)'))
        ->get();

        // Map months to names for chart readability
        $monthsNames = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
            7 => 'Jul', 8 => 'Agt', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des'
        ];

        $chartData = [];
        for ($m = 1; $m <= 12; $m++) {
            $found = $monthlyFlows->firstWhere('month', $m);
            $chartData[] = [
                'month' => $monthsNames[$m],
                'income' => $found ? (float)$found->income : 0.00,
                'expense' => $found ? (float)$found->expense : 0.00,
            ];
        }

        return response()->json([
            'success' => true,
            'summary' => [
                'total_balance' => (float)$balance,
                'total_income' => (float)$income,
                'total_expense' => (float)$expense,
                'current_month' => [
                    'income' => (float)$monthIncome,
                    'expense' => (float)$monthExpense,
                ]
            ],
            'chart_data' => $chartData,
        ]);
    }

    /**
     * List all ledger transactions.
     */
    public function ledger(Request $request)
    {
        $ledger = CashLedger::with('recorder')
            ->orderBy('recorded_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'ledger' => $ledger,
        ]);
    }

    /**
     * Record an expense (Bendahara only, requires receipt upload).
     */
    public function recordExpense(Request $request)
    {
        if ($request->user()->role !== 'bendahara' && $request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Bendahara yang dapat mencatat pengeluaran kas.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:255',
            'payment_method' => 'required|in:transfer,cash',
            'receipt_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:4096', // Max 4MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $bendahara = $request->user();

        // Upload and store receipt image
        if ($request->hasFile('receipt_image')) {
            $path = $request->file('receipt_image')->store('receipts', 'public');

            $ledger = CashLedger::create([
                'type' => 'expense',
                'amount' => $request->amount,
                'description' => $request->description,
                'payment_method' => $request->payment_method,
                'proof_path' => $path,
                'recorded_by' => $bendahara->id,
                'recorded_at' => now(),
            ]);

            // Audit Trail
            AuditLog::create([
                'actor_id' => $bendahara->id,
                'action' => 'record_expense',
                'target_type' => CashLedger::class,
                'target_id' => $ledger->id,
                'new_value' => [
                    'amount' => $ledger->amount,
                    'description' => $ledger->description,
                    'proof_path' => $ledger->proof_path,
                ],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pengeluaran kas berhasil dicatat.',
                'ledger' => $ledger,
            ], 201);
        }

        return response()->json([
            'success' => false,
            'message' => 'Foto nota belanja wajib diunggah.',
        ], 400);
    }
}
