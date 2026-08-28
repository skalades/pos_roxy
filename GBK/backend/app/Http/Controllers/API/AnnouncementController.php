<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of announcements.
     */
    public function index(Request $request)
    {
        $announcements = Announcement::with('author')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'announcements' => $announcements,
        ]);
    }

    /**
     * Store a newly created announcement.
     */
    public function store(Request $request)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Pengurus RT/RW yang dapat membuat pengumuman.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:agenda,berita_duka,informasi_umum',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'author_id' => $request->user()->id,
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil disiarkan.',
            'announcement' => $announcement,
        ], 201);
    }

    /**
     * Display the specified announcement.
     */
    public function show($id)
    {
        $announcement = Announcement::with('author')->find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update the specified announcement.
     */
    public function update(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Pengurus RT/RW yang dapat memperbarui pengumuman.',
            ], 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:agenda,berita_duka,informasi_umum',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diperbarui.',
            'announcement' => $announcement,
        ]);
    }

    /**
     * Remove the specified announcement.
     */
    public function destroy(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Pengurus RT/RW yang dapat menghapus pengumuman.',
            ], 403);
        }

        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan.',
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus.',
        ]);
    }
}
