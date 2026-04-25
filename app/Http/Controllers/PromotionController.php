<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Promotion;
use App\Models\Branch;
use Inertia\Inertia;

class PromotionController extends Controller
{
    public function index()
    {
        return redirect()->route('settings.index', ['tab' => 'promo']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'required|boolean',
        ]);

        Promotion::create($validated);

        return back()->with('success', 'Promosi berhasil dibuat!');
    }

    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'required|boolean',
        ]);

        $promotion->update($validated);

        return back()->with('success', 'Promosi berhasil diperbarui!');
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->delete();
        return back()->with('success', 'Promosi berhasil dihapus!');
    }
}
