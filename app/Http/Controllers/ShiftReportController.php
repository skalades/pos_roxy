<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class ShiftReportController extends Controller
{
    public function index(Request )
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
}
