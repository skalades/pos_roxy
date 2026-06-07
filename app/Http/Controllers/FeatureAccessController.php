<?php

namespace App\Http\Controllers;

use App\Services\FeatureAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeatureAccessController extends Controller
{
    public function __construct(
        private FeatureAccessService $featureAccessService
    ) {}

    /**
     * Display the feature access management page.
     * Only accessible by super_admin (enforced via route middleware).
     */
    public function index()
    {
        return Inertia::render('FeatureAccess/Index', [
            'features'    => $this->featureAccessService->getAccessMatrix(),
            'roles'       => $this->featureAccessService->getControllableRoles(),
            'roleLabels'  => $this->featureAccessService->getRoleLabels(),
            'groups'      => $this->featureAccessService->getGroups(),
            'summary'     => $this->featureAccessService->getRoleSummary(),
        ]);
    }

    /**
     * Toggle a feature on/off for a specific role.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'feature_key' => 'required|string|max:50',
            'role'        => 'required|string|max:20',
            'is_enabled'  => 'required|boolean',
        ]);

        $success = $this->featureAccessService->updateAccess(
            $validated['feature_key'],
            $validated['role'],
            $validated['is_enabled']
        );

        if (!$success) {
            return back()->with('error', 'Fitur atau role tidak valid.');
        }

        $status = $validated['is_enabled'] ? 'diaktifkan' : 'dinonaktifkan';
        $registry = $this->featureAccessService->getRegistry();
        $featureName = $registry[$validated['feature_key']]['name'] ?? $validated['feature_key'];
        $roleLabel = $this->featureAccessService->getRoleLabels()[$validated['role']] ?? $validated['role'];

        return back()->with('success', "{$featureName} berhasil {$status} untuk {$roleLabel}.");
    }

    /**
     * Reset all feature access to defaults.
     */
    public function resetDefaults()
    {
        $this->featureAccessService->resetToDefaults();

        return back()->with('success', 'Semua akses fitur berhasil direset ke default.');
    }
}
