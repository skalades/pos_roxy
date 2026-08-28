<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\FamilyMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register a new resident account.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'nik' => 'required|string|unique:users|max:20',
            'phone' => 'required|string|max:20',
            'house_id' => 'required|exists:houses,id',
            'family_members' => 'nullable|array',
            'family_members.*.name' => 'required|string|max:255',
            'family_members.*.relation' => 'required|string|max:100',
            'family_members.*.birth_date' => 'nullable|date',
            'family_members.*.gender' => 'required|in:L,P',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if house already has an active primary user
        $existingUser = User::where('house_id', $request->house_id)
            ->whereIn('status', ['active', 'pending'])
            ->first();

        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'Rumah ini sudah terdaftar oleh warga lain. Silakan hubungi Ketua RT/RW jika ada kekeliruan.',
            ], 400);
        }

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'nik' => $request->nik,
            'phone' => $request->phone,
            'house_id' => $request->house_id,
            'role' => 'warga',
            'status' => 'pending', // Awaiting RT/RW verification
        ]);

        // Add family members if provided
        if ($request->has('family_members') && is_array($request->family_members)) {
            foreach ($request->family_members as $member) {
                FamilyMember::create([
                    'user_id' => $user->id,
                    'name' => $member['name'],
                    'relation' => $member['relation'],
                    'birth_date' => $member['birth_date'] ?? null,
                    'gender' => $member['gender'],
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Registrasi sensus mandiri berhasil. Akun Anda sedang menunggu verifikasi dari Ketua RT/RW.',
            'user' => $user->load('familyMembers'),
        ], 201);
    }

    /**
     * Authenticate user and create token.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        
        if ($user->status === 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran akun Anda ditolak oleh Pengurus RT/RW.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'house_id' => $user->house_id,
            ]
        ]);
    }

    /**
     * Terminate the session and revoke token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Get authenticated user details.
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->load(['house', 'familyMembers']),
        ]);
    }
}
