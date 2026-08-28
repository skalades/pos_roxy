<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ComplaintController extends Controller
{
    /**
     * Display a listing of complaints.
     */
    public function index(Request $request)
    {
        $complaints = Complaint::with(['user.house', 'updater'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'complaints' => $complaints,
        ]);
    }

    /**
     * Store a newly created complaint.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096', // Max 4MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('complaints', 'public');
        }

        $complaint = Complaint::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'location' => $request->location,
            'photo_path' => $photoPath,
            'status' => 'new',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan keluhan berhasil dikirim dan akan segera ditinjau.',
            'complaint' => $complaint,
        ], 201);
    }

    /**
     * Display the specified complaint.
     */
    public function show($id)
    {
        $complaint = Complaint::with(['user.house', 'updater'])->find($id);

        if (!$complaint) {
            return response()->json([
                'success' => false,
                'message' => 'Keluhan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'complaint' => $complaint,
        ]);
    }

    /**
     * Update the status of a complaint (RT/RW/Super Admin only).
     */
    public function updateStatus(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki wewenang untuk menanggapi keluhan.',
            ], 403);
        }

        $complaint = Complaint::find($id);

        if (!$complaint) {
            return response()->json([
                'success' => false,
                'message' => 'Keluhan tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:new,reviewing,in_progress,resolved',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $complaint->update([
            'status' => $request->status,
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status keluhan berhasil diperbarui.',
            'complaint' => $complaint->load(['user.house', 'updater']),
        ]);
    }
}
