<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Setting;
use App\Models\Branch;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Index', [
            'settings' => Setting::all()->pluck('value', 'key'),
            'branches' => Branch::all(),
            'promotions' => \App\Models\Promotion::with('branch')->get(),
        ]);
    }

    public function updateBranding(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:50',
            'app_logo' => 'nullable|image|max:2048',
        ]);

        Setting::set('app_name', $validated['app_name'], 'ui');

        if ($request->hasFile('app_logo')) {
            // Delete old logo if exists
            $oldLogo = Setting::get('app_logo');
            if ($oldLogo) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $oldLogo));
            }

            $path = $request->file('app_logo')->store('logos', 'public');
            Setting::set('app_logo', Storage::url($path), 'ui');
        }

        return back()->with('success', 'Pengaturan tampilan berhasil diperbarui!');
    }

    public function updateBranch(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'timezone' => 'nullable|string',
            'opening_time' => 'nullable|string',
            'closing_time' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'geofence_radius' => 'nullable|numeric',
            'require_attendance_for_shift' => 'nullable|boolean',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'enable_tax' => 'nullable|boolean',
            'late_penalty_amount' => 'nullable|numeric|min:0',
            'enable_attendance_deduction' => 'nullable|boolean',
        ]);

        $branch->update($validated);

        return back()->with('success', 'Pengaturan cabang berhasil diperbarui!');
    }

    public function updateLoyalty(Request $request)
    {
        $validated = $request->validate([
            'member_discount_rate' => 'required|numeric|min:0|max:100',
        ]);

        Setting::set('member_discount_rate', $validated['member_discount_rate'], 'loyalty');

        return back()->with('success', 'Pengaturan loyalitas berhasil diperbarui!');
    }
}
