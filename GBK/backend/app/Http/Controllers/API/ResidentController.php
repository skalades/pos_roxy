<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class ResidentController extends Controller
{
    /**
     * Display a listing of residents.
     */
    public function index(Request $request)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin', 'bendahara'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat data warga.',
            ], 403);
        }

        $residents = User::with(['house', 'familyMembers'])
            ->where('role', 'warga')
            ->get();

        return response()->json([
            'success' => true,
            'residents' => $residents,
        ]);
    }

    /**
     * Get pending registrations.
     */
    public function getPending(Request $request)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat antrean verifikasi.',
            ], 403);
        }

        $pending = User::with(['house', 'familyMembers'])
            ->where('status', 'pending')
            ->get();

        return response()->json([
            'success' => true,
            'pending' => $pending,
        ]);
    }

    /**
     * Approve pending resident.
     */
    public function approve(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki wewenang untuk verifikasi warga.',
            ], 403);
        }

        $resident = User::find($id);

        if (!$resident) {
            return response()->json([
                'success' => false,
                'message' => 'Data warga tidak ditemukan.',
            ], 404);
        }

        if ($resident->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Akun warga ini sudah diproses sebelumnya.',
            ], 400);
        }

        $oldStatus = $resident->status;
        $resident->status = 'active';
        $resident->save();

        // Create Audit Log
        AuditLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'approve_resident',
            'target_type' => User::class,
            'target_id' => $resident->id,
            'old_value' => ['status' => $oldStatus],
            'new_value' => ['status' => 'active'],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Akun warga {$resident->name} berhasil diaktifkan.",
            'resident' => $resident,
        ]);
    }

    /**
     * Reject pending resident.
     */
    public function reject(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki wewenang untuk verifikasi warga.',
            ], 403);
        }

        $resident = User::find($id);

        if (!$resident) {
            return response()->json([
                'success' => false,
                'message' => 'Data warga tidak ditemukan.',
            ], 404);
        }

        if ($resident->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Akun warga ini sudah diproses sebelumnya.',
            ], 400);
        }

        $oldStatus = $resident->status;
        $resident->status = 'rejected';
        $resident->save();

        // Create Audit Log
        AuditLog::create([
            'actor_id' => $request->user()->id,
            'action' => 'reject_resident',
            'target_type' => User::class,
            'target_id' => $resident->id,
            'old_value' => ['status' => $oldStatus],
            'new_value' => ['status' => 'rejected'],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Registrasi akun warga {$resident->name} ditolak.",
            'resident' => $resident,
        ]);
    }

    /**
     * Show resident detail.
     */
    public function show(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin', 'bendahara'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat data warga ini.',
            ], 403);
        }

        $resident = User::with(['house', 'familyMembers'])->find($id);

        if (!$resident) {
            return response()->json([
                'success' => false,
                'message' => 'Warga tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'resident' => $resident,
        ]);
    }
}
