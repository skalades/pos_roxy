<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleManagementController extends Controller
{
    /**
     * Get all users for role mutation panel.
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Super Admin yang dapat mengakses panel manajemen jabatan.',
            ], 403);
        }

        $users = User::with('house')
            ->where('status', 'active')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    /**
     * Change role of a resident instantly (Super Admin only).
     */
    public function changeRole(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Super Admin yang dapat mengubah jabatan warga.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:super_admin,rt,rw,bendahara,warga',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $targetUser = User::find($request->user_id);
        $superAdmin = $request->user();

        if ($targetUser->id === $superAdmin->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menurunkan jabatan Anda sendiri.',
            ], 400);
        }

        $oldRole = $targetUser->role;
        $targetUser->role = $request->role;
        $targetUser->save();

        // Create Audit Log (FR-0.1 & NFR-1)
        AuditLog::create([
            'actor_id' => $superAdmin->id,
            'action' => 'change_role',
            'target_type' => User::class,
            'target_id' => $targetUser->id,
            'old_value' => ['role' => $oldRole],
            'new_value' => ['role' => $targetUser->role],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Jabatan warga {$targetUser->name} berhasil diubah menjadi " . strtoupper($request->role) . ".",
            'user' => $targetUser,
        ]);
    }
}
