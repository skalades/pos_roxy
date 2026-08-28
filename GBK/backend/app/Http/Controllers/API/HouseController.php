<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\House;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HouseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $houses = House::withCount('residents')->get();

        return response()->json([
            'success' => true,
            'houses' => $houses,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Check if user is admin (rt/rw/super_admin)
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki wewenang untuk menambah data rumah.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'block' => 'required|string|max:10',
            'number' => 'required|string|max:10',
            'full_address' => 'nullable|string|max:255',
            'status' => 'required|in:occupied_owner,rented,vacant',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if already exists
        $exists = House::where('block', $request->block)
            ->where('number', $request->number)
            ->first();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "Rumah Blok {$request->block}-{$request->number} sudah terdaftar.",
            ], 400);
        }

        $house = House::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Data rumah berhasil ditambahkan.',
            'house' => $house,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $house = House::with('residents.familyMembers')->find($id);

        if (!$house) {
            return response()->json([
                'success' => false,
                'message' => 'Data rumah tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'house' => $house,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki wewenang untuk mengubah data rumah.',
            ], 403);
        }

        $house = House::find($id);

        if (!$house) {
            return response()->json([
                'success' => false,
                'message' => 'Data rumah tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'block' => 'required|string|max:10',
            'number' => 'required|string|max:10',
            'full_address' => 'nullable|string|max:255',
            'status' => 'required|in:occupied_owner,rented,vacant',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check duplicate block/number if changed
        if ($house->block !== $request->block || $house->number !== $request->number) {
            $exists = House::where('block', $request->block)
                ->where('number', $request->number)
                ->where('id', '!=', $id)
                ->first();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => "Rumah Blok {$request->block}-{$request->number} sudah terdaftar.",
                ], 400);
            }
        }

        $house->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Data rumah berhasil diperbarui.',
            'house' => $house,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['rt', 'rw', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki wewenang untuk menghapus data rumah.',
            ], 403);
        }

        $house = House::find($id);

        if (!$house) {
            return response()->json([
                'success' => false,
                'message' => 'Data rumah tidak ditemukan.',
            ], 404);
        }

        $house->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data rumah berhasil dihapus.',
        ]);
    }
}
