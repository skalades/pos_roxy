<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;

class BranchController extends Controller
{
    /**
     * Display a listing of the branches.
     */
    public function index(Request $request): Response
    {
        $query = Branch::query()->with('manager');

        $query->when($request->filled('search'), function($q) use ($request) {
            $search = $request->get('search');
            $q->where(function($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        });

        return Inertia::render('Branches/Index', [
            'branches' => $query->latest()->paginate(15)->withQueryString(),
            'managers' => User::whereIn('role', ['admin', 'manager'])->get(['id', 'name']),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created branch in storage.
     */
    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Branch::create($validated);

        return redirect()->route('branches.index')
            ->with('success', 'Cabang berhasil ditambahkan.');
    }

    /**
     * Update the specified branch in storage.
     */
    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $validated = $request->validated();

        $branch->update($validated);

        return redirect()->route('branches.index')
            ->with('success', 'Cabang berhasil diperbarui.');
    }

    /**
     * Remove the specified branch from storage.
     */
    public function destroy(Branch $branch): RedirectResponse
    {
        // Check if branch has users or transactions before deleting
        if ($branch->users()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus cabang yang masih memiliki staff.');
        }

        if ($branch->shifts()->count() > 0) {
             return back()->with('error', 'Tidak dapat menghapus cabang yang sudah memiliki data transaksi/shift.');
        }

        $branch->delete();

        return redirect()->route('branches.index')
            ->with('success', 'Cabang berhasil dihapus.');
    }
}
