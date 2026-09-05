<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftCorrectionController extends Controller
{
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return redirect()->back()->with('error', 'Unauthorized access');
        }

        $shift = Shift::findOrFail($id);
        
        if ($shift->status !== 'closed') {
             return redirect()->back()->with('error', 'Hanya shift yang sudah ditutup yang dapat dikoreksi.');
        }

        $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);
        
        $newClosingBalance = $request->input('closing_balance');
        $expectedBalance = $shift->expected_balance;
        $difference = $newClosingBalance - $expectedBalance;

        $notes = $request->input('notes');
        $correctionNote = "\n[Koreksi oleh Super Admin pada " . now()->format('Y-m-d H:i:s') . "]\nSaldo laci dikoreksi dari " . number_format($shift->closing_balance, 0, ',', '.') . " menjadi " . number_format($newClosingBalance, 0, ',', '.');
        
        $finalNotes = $shift->notes ? $shift->notes . $correctionNote : $correctionNote;
        if ($notes) {
            $finalNotes .= "\nCatatan Tambahan: " . $notes;
        }

        $shift->update([
            'closing_balance' => $newClosingBalance,
            'difference' => $difference,
            'notes' => $finalNotes
        ]);

        return redirect()->back()->with('success', 'Data shift berhasil dikoreksi.');
    }
}
