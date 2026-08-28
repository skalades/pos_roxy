<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\IuranSetting;
use App\Models\PaymentProof;
use App\Models\CashLedger;
use App\Models\AuditLog;
use App\Models\House;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BillingController extends Controller
{
    /**
     * List invoices with optional filtering.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Invoice::with(['house', 'verifier', 'paymentProof']);

        // Warga can only see their own house invoices
        if ($user->role === 'warga') {
            if (!$user->house_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda belum terhubung dengan nomor rumah mana pun.',
                ], 400);
            }
            $query->where('house_id', $user->house_id);
        } else {
            // Admin/Bendahara filtering
            if ($request->has('house_id') && $request->house_id) {
                $query->where('house_id', $request->house_id);
            }
            if ($request->has('month') && $request->month) {
                $query->where('month', $request->month);
            }
            if ($request->has('year') && $request->year) {
                $query->where('year', $request->year);
            }
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }
        }

        // Order by year and month descending
        $invoices = $query->orderBy('year', 'desc')->orderBy('month', 'desc')->get();

        return response()->json([
            'success' => true,
            'invoices' => $invoices,
        ]);
    }

    /**
     * Display a specific invoice.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $invoice = Invoice::with(['house', 'verifier', 'paymentProof.uploader'])->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan.',
            ], 404);
        }

        // Restrict Warga to their own house invoice
        if ($user->role === 'warga' && $invoice->house_id !== $user->house_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat invoice ini.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'invoice' => $invoice,
        ]);
    }

    /**
     * Warga uploads payment proof (Transfer/Digital).
     */
    public function uploadProof(Request $request, $id)
    {
        $user = $request->user();
        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan.',
            ], 404);
        }

        if ($user->role === 'warga' && $invoice->house_id !== $user->house_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya bisa mengunggah bukti transfer untuk rumah Anda sendiri.',
            ], 403);
        }

        if (!in_array($invoice->status, ['unpaid', 'pending'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas atau sedang diverifikasi.',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'proof_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:4096', // Max 4MB
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Upload and store proof
        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('payment_proofs', 'public');
            
            // Delete existing proof if any
            if ($invoice->paymentProof) {
                Storage::disk('public')->delete($invoice->paymentProof->file_path);
                $invoice->paymentProof->delete();
            }

            PaymentProof::create([
                'invoice_id' => $invoice->id,
                'uploaded_by' => $user->id,
                'file_path' => $path,
                'notes' => $request->notes,
            ]);

            $invoice->status = 'pending';
            $invoice->payment_method = 'transfer';
            $invoice->save();

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer berhasil diunggah. Menunggu verifikasi Bendahara.',
                'invoice' => $invoice->load('paymentProof'),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Gagal mengunggah berkas bukti transfer.',
        ], 400);
    }

    /**
     * Bendahara verifies digital transfer proof.
     */
    public function verifyProof(Request $request, $id)
    {
        if ($request->user()->role !== 'bendahara' && $request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Bendahara yang dapat memverifikasi bukti transfer.',
            ], 403);
        }

        $invoice = Invoice::with('house')->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan.',
            ], 404);
        }

        if ($invoice->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak sedang dalam status menunggu verifikasi.',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $bendahara = $request->user();

        if ($request->action === 'approve') {
            $invoice->status = 'paid_transfer';
            $invoice->verified_by = $bendahara->id;
            $invoice->verified_at = now();
            $invoice->save();

            // Record into Cash Ledger
            $description = "Pemasukan Iuran Kebersihan & Air Bulan " . 
                           $invoice->month . "/" . $invoice->year . 
                           " — Blok " . $invoice->house->block . "-" . $invoice->house->number;
            
            $ledger = CashLedger::create([
                'type' => 'income',
                'amount' => $invoice->total_amount,
                'description' => $description,
                'payment_method' => 'transfer',
                'reference_id' => $invoice->id,
                'recorded_by' => $bendahara->id,
                'recorded_at' => now(),
            ]);

            // Audit Trail
            AuditLog::create([
                'actor_id' => $bendahara->id,
                'action' => 'approve_transfer_payment',
                'target_type' => Invoice::class,
                'target_id' => $invoice->id,
                'old_value' => ['status' => 'pending'],
                'new_value' => ['status' => 'paid_transfer', 'ledger_id' => $ledger->id],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran transfer disetujui. Tagihan telah dilunasi.',
                'invoice' => $invoice,
            ]);
        } else {
            $invoice->status = 'unpaid';
            $invoice->payment_method = 'none';
            $invoice->save();

            // Notify user / Audit
            AuditLog::create([
                'actor_id' => $bendahara->id,
                'action' => 'reject_transfer_payment',
                'target_type' => Invoice::class,
                'target_id' => $invoice->id,
                'old_value' => ['status' => 'pending'],
                'new_value' => ['status' => 'unpaid', 'reason' => $request->reason],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer ditolak. Status tagihan kembali ke Belum Lunas.',
                'invoice' => $invoice,
            ]);
        }
    }

    /**
     * Bendahara inputs manual cash payment (Tunai).
     */
    public function payManual(Request $request)
    {
        if ($request->user()->role !== 'bendahara' && $request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Bendahara yang dapat menginput pembayaran manual/tunai.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'house_id' => 'required|exists:houses,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $bendahara = $request->user();

        // Check if invoice exists
        $invoice = Invoice::where('house_id', $request->house_id)
            ->where('month', $request->month)
            ->where('year', $request->year)
            ->first();

        // If invoice doesn't exist, we can automatically generate it if house is occupied
        if (!$invoice) {
            $house = House::find($request->house_id);
            if ($house->status === 'vacant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Rumah ini kosong. Tagihan tidak dapat diterbitkan.',
                ], 400);
            }

            // Get current iuran settings
            $kebersihanSetting = IuranSetting::where('type', 'kebersihan')
                ->where('effective_from', '<=', now()->toDateString())
                ->orderBy('effective_from', 'desc')
                ->first();
            $airSetting = IuranSetting::where('type', 'air')
                ->where('effective_from', '<=', now()->toDateString())
                ->orderBy('effective_from', 'desc')
                ->first();

            $kebersihanAmount = $kebersihanSetting ? $kebersihanSetting->amount : 30000.00;
            $airAmount = $airSetting ? $airSetting->amount : 50000.00;

            $invoice = Invoice::create([
                'house_id' => $house->id,
                'month' => $request->month,
                'year' => $request->year,
                'kebersihan_amount' => $kebersihanAmount,
                'air_amount' => $airAmount,
                'total_amount' => $kebersihanAmount + $airAmount,
                'status' => 'unpaid',
                'payment_method' => 'none',
            ]);
        }

        if (in_array($invoice->status, ['paid_transfer', 'paid_manual'])) {
            return response()->json([
                'success' => false,
                'message' => 'Tagihan bulan tersebut sudah lunas.',
            ], 400);
        }

        $oldStatus = $invoice->status;

        // Update invoice
        $invoice->status = 'paid_manual';
        $invoice->payment_method = 'cash';
        $invoice->verified_by = $bendahara->id;
        $invoice->verified_at = now();
        $invoice->save();

        // Record in cash ledger
        $description = "Pemasukan Iuran Kebersihan & Air Bulan " . 
                       $invoice->month . "/" . $invoice->year . 
                       " — Blok " . $invoice->house->block . "-" . $invoice->house->number . 
                       " (Tunai)";

        $ledger = CashLedger::create([
            'type' => 'income',
            'amount' => $invoice->total_amount,
            'description' => $description,
            'payment_method' => 'cash',
            'reference_id' => $invoice->id,
            'recorded_by' => $bendahara->id,
            'recorded_at' => now(),
        ]);

        // Audit Trail (NFR-1)
        AuditLog::create([
            'actor_id' => $bendahara->id,
            'action' => 'confirm_cash_payment',
            'target_type' => Invoice::class,
            'target_id' => $invoice->id,
            'old_value' => ['status' => $oldStatus],
            'new_value' => [
                'status' => 'paid_manual', 
                'ledger_id' => $ledger->id,
                'audit_note' => "Diverifikasi secara manual oleh Bendahara " . $bendahara->name . " pada " . now()->format('d/m/Y H:i') . " WIB"
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pembayaran tunai untuk Blok {$invoice->house->block}-{$invoice->house->number} bulan {$invoice->month}/{$invoice->year} berhasil dikonfirmasi lunas.",
            'invoice' => $invoice,
        ]);
    }

    /**
     * Get active flat rate settings.
     */
    public function getSettings()
    {
        $kebersihanSetting = IuranSetting::where('type', 'kebersihan')
            ->orderBy('effective_from', 'desc')
            ->first();
        $airSetting = IuranSetting::where('type', 'air')
            ->orderBy('effective_from', 'desc')
            ->first();

        return response()->json([
            'success' => true,
            'settings' => [
                'kebersihan' => $kebersihanSetting ? $kebersihanSetting->amount : 30000.00,
                'air' => $airSetting ? $airSetting->amount : 50000.00,
            ],
        ]);
    }

    /**
     * Bendahara updates flat rates.
     */
    public function updateSettings(Request $request)
    {
        if ($request->user()->role !== 'bendahara' && $request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Bendahara yang dapat mengubah nominal iuran.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'kebersihan' => 'required|numeric|min:0',
            'air' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $bendahara = $request->user();

        // Create new iuran settings effective today
        IuranSetting::create([
            'type' => 'kebersihan',
            'amount' => $request->kebersihan,
            'effective_from' => now()->toDateString(),
            'set_by' => $bendahara->id,
        ]);

        IuranSetting::create([
            'type' => 'air',
            'amount' => $request->air,
            'effective_from' => now()->toDateString(),
            'set_by' => $bendahara->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan nominal iuran flat berhasil diperbarui.',
        ]);
    }
}
