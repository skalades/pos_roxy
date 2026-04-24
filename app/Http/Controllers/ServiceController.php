<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Category;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeAccess();

        $user = $request->user();
        $query = Service::query()->with(['category', 'branch']);

        // Restrictions for branch managers
        if ($user->role === 'manager' || $user->role === 'admin') {
            $query->where(function($q) use ($user) {
                $q->where('branch_id', $user->branch_id)
                  ->orWhereNull('branch_id');
            });
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return Inertia::render('Services/Index', [
            'services' => $query->latest()->get(),
            'categories' => Category::where('type', 'service')->get(),
            'branches' => Branch::all(),
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAccess();

        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
            'image' => 'nullable|string',
        ]);

        Service::create($validated);

        return redirect()->back()->with('success', 'Layanan berhasil ditambahkan.');
    }

    public function update(Request $request, Service $service): RedirectResponse
    {
        $this->authorizeAccess();

        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'is_active' => 'boolean',
            'image' => 'nullable|string',
        ]);

        $service->update($validated);

        return redirect()->back()->with('success', 'Layanan berhasil diperbarui.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $this->authorizeAccess();

        $service->delete();

        return redirect()->back()->with('success', 'Layanan berhasil dihapus.');
    }

    private function authorizeAccess()
    {
        $role = auth()->user()->role;
        if (!in_array($role, ['super_admin', 'manager', 'admin'])) {
            abort(403, 'Unauthorized action.');
        }
    }
}
