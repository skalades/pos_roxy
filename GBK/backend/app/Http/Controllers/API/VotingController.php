<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Vote;
use App\Models\VoteResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VotingController extends Controller
{
    /**
     * Display a listing of polls.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $polls = Vote::with('creator')
            ->orderBy('created_at', 'desc')
            ->get();

        // Check if user has voted on each poll and calculate results
        $formattedPolls = $polls->map(function ($poll) use ($user) {
            $userResponse = VoteResponse::where('vote_id', $poll->id)
                ->where('user_id', $user->id)
                ->first();

            // Calculate options percentages
            $responses = VoteResponse::where('vote_id', $poll->id)->get();
            $totalVotes = $responses->count();
            
            $results = [];
            foreach ($poll->options as $option) {
                $optionCount = $responses->where('chosen_option', $option)->count();
                $percentage = $totalVotes > 0 ? round(($optionCount / $totalVotes) * 100, 1) : 0;
                $results[] = [
                    'option' => $option,
                    'votes' => $optionCount,
                    'percentage' => $percentage,
                ];
            }

            return [
                'id' => $poll->id,
                'title' => $poll->title,
                'description' => $poll->description,
                'options' => $poll->options,
                'deadline' => $poll->deadline->toDateTimeString(),
                'is_active' => $poll->is_active && $poll->deadline->isFuture(),
                'created_by' => $poll->creator->name ?? 'Pengurus',
                'has_voted' => $userResponse !== null,
                'voted_option' => $userResponse ? $userResponse->chosen_option : null,
                'total_votes' => $totalVotes,
                'results' => $results,
            ];
        });

        return response()->json([
            'success' => true,
            'polls' => $formattedPolls,
        ]);
    }

    /**
     * Store a newly created poll (RT/RW/Super Admin only).
     */
    public function store(Request $request)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Pengurus RT/RW yang dapat membuat polling.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'options' => 'required|array|min:2',
            'options.*' => 'required|string|distinct|max:255',
            'deadline' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $poll = Vote::create([
            'title' => $request->title,
            'description' => $request->description,
            'options' => $request->options,
            'deadline' => $request->deadline,
            'created_by' => $request->user()->id,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Polling baru berhasil dibuat.',
            'poll' => $poll,
        ], 201);
    }

    /**
     * Cast a vote in a poll.
     */
    public function castVote(Request $request, $id)
    {
        $poll = Vote::find($id);

        if (!$poll) {
            return response()->json([
                'success' => false,
                'message' => 'Polling tidak ditemukan.',
            ], 404);
        }

        if (!$poll->is_active || $poll->deadline->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Masa aktif polling ini sudah berakhir.',
            ], 400);
        }

        $user = $request->user();

        // Check if user already voted
        $alreadyVoted = VoteResponse::where('vote_id', $poll->id)
            ->where('user_id', $user->id)
            ->first();

        if ($alreadyVoted) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah menyalurkan suara di polling ini.',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'option' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verify option exists in poll options
        if (!in_array($request->option, $poll->options)) {
            return response()->json([
                'success' => false,
                'message' => 'Pilihan tidak valid untuk polling ini.',
            ], 400);
        }

        $response = VoteResponse::create([
            'vote_id' => $poll->id,
            'user_id' => $user->id,
            'chosen_option' => $request->option,
            'voted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Suara Anda berhasil dikirim. Terima kasih.',
            'response' => $response,
        ], 201);
    }

    /**
     * Close a poll manually (RT/RW/Super Admin only).
     */
    public function close(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki wewenang untuk menutup polling.',
            ], 403);
        }

        $poll = Vote::find($id);

        if (!$poll) {
            return response()->json([
                'success' => false,
                'message' => 'Polling tidak ditemukan.',
            ], 404);
        }

        $poll->is_active = false;
        $poll->save();

        return response()->json([
            'success' => true,
            'message' => 'Polling telah ditutup.',
            'poll' => $poll,
        ]);
    }
}
