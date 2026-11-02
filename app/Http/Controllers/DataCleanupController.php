<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Services\DataCleanup\DataCleanupService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DataCleanupController extends Controller
{
    public function __construct(
        protected DataCleanupService $cleanupService
    ) {}

    /**
     * Ensure only super_admin can access.
     */
    protected function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->hasRole(['super_admin', 'superadmin'])) {
            abort(403, 'Akses terbatas untuk Super Admin.');
        }
    }

    /**
     * Display the Data Cleanup Management interface.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $branches = Branch::where('is_active', true)->get(['id', 'name']);
        $modules = $this->cleanupService->getModulesMetadata();
        $diskUsage = $this->cleanupService->getSystemDiskUsage();
        $recentLogs = $this->cleanupService->getRecentCleanupLogs();

        // Default to previous month
        $defaultDate = Carbon::now()->subMonth();
        $defaultYear = (int) $defaultDate->year;
        $defaultMonth = (int) $defaultDate->month;

        return Inertia::render('DataCleanup/Index', [
            'branches' => $branches,
            'modules' => $modules,
            'diskUsage' => $diskUsage,
            'recentLogs' => $recentLogs,
            'defaultYear' => $defaultYear,
            'defaultMonth' => $defaultMonth,
        ]);
    }

    /**
     * Preview cleanup stats via JSON endpoint.
     */
    public function preview(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'month' => 'required|integer|min:1|max:12',
            'branch_id' => 'nullable|integer',
            'modules' => 'nullable|array',
            'modules.*' => 'string',
        ]);

        $preview = $this->cleanupService->preview(
            (int) $validated['year'],
            (int) $validated['month'],
            $validated['branch_id'] ? (int) $validated['branch_id'] : null,
            $validated['modules'] ?? []
        );

        return response()->json($preview);
    }

    /**
     * Execute data and storage cleanup.
     */
    public function execute(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'month' => 'required|integer|min:1|max:12',
            'branch_id' => 'nullable|integer',
            'modules' => 'required|array|min:1',
            'modules.*' => 'string',
            'confirmation' => 'required|string',
        ]);

        if (strtoupper(trim($validated['confirmation'])) !== 'HAPUS') {
            return back()->with('error', 'Konfirmasi kata "HAPUS" tidak cocok. Pembersihan dibatalkan demi keamanan.');
        }

        // Warn if trying to delete current month
        $isCurrentMonth = ($validated['year'] == Carbon::now()->year && $validated['month'] == Carbon::now()->month);
        $options = [
            'is_current_month' => $isCurrentMonth,
        ];

        $result = $this->cleanupService->cleanup(
            (int) $validated['year'],
            (int) $validated['month'],
            $validated['branch_id'] ? (int) $validated['branch_id'] : null,
            $validated['modules'],
            $options,
            $request->user()->id
        );

        return back()->with('success', "Pembersihan berhasil! {$result['total_records_deleted']} rekor dihapus, {$result['total_files_deleted']} file dihapus, membebaskan {$result['formatted_freed_size']} ruang server.");
    }
}
