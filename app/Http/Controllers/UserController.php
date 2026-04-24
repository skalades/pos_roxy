<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response
    {
        $query = User::query()->with('branch');

        $query->when($request->filled('search'), function($q) use ($request) {
            $search = $request->get('search');
            $q->where(function($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        });

        $query->when($request->filled('role'), function($q) use ($request) {
            $q->where('role', $request->get('role'));
        });

        $query->when($request->filled('branch_id'), function($q) use ($request) {
            $q->where('branch_id', $request->get('branch_id'));
        });

        return Inertia::render('Users/Index', [
            'users' => $query->latest()->paginate(15)->withQueryString(),
            'branches' => Branch::all(['id', 'name']),
            'filters' => $request->only(['search', 'role', 'branch_id']),
            'roles' => [
                ['label' => 'Super Admin', 'value' => 'super_admin'],
                ['label' => 'Admin', 'value' => 'admin'],
                ['label' => 'Manager', 'value' => 'manager'],
                ['label' => 'Cashier', 'value' => 'cashier'],
                ['label' => 'Barber', 'value' => 'barber'],
            ]
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'branch_id' => $request->branch_id,
            'password' => Hash::make($request->password),
            'commission_rate' => $request->commission_rate ?? 0,
            'monthly_salary' => $request->monthly_salary ?? 0,
            'hire_date' => $request->hire_date,
            'work_start_time' => $request->work_start_time,
            'work_end_time' => $request->work_end_time,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $data = $request->only([
            'name', 'email', 'phone', 'role', 'branch_id', 
            'commission_rate', 'monthly_salary', 'hire_date', 
            'work_start_time', 'work_end_time', 'is_active'
        ]);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        if (auth()->id() === $user->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User berhasil dihapus.');
    }
}
