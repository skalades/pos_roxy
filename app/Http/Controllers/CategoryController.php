<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeAccess();

        $query = Category::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return Inertia::render('Categories/Index', [
            'categories' => $query->latest()->get(),
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAccess();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:service,product',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Category::create($validated);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $this->authorizeAccess();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:service,product',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $this->authorizeAccess();

        // Check if category is used
        if ($category->services()->exists() || $category->products()->exists()) {
            return redirect()->back()->with('error', 'Kategori tidak dapat dihapus karena masih digunakan oleh layanan atau produk.');
        }

        $category->delete();

        return redirect()->back()->with('success', 'Kategori berhasil dihapus.');
    }

    private function authorizeAccess()
    {
        $role = auth()->user()->role;
        if (!in_array($role, ['super_admin', 'manager', 'admin'])) {
            abort(403, 'Unauthorized action.');
        }
    }
}
