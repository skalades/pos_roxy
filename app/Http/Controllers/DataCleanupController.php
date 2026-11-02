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

        // Default to previous 3 months or previous month
        $defaultEndDate = Carbon::now()->subMonth();
        $defaultStartDate = Carbon::now()->subMonths(3);

        return Inertia::render('DataCleanup/Index', [
            'branches' => $branches,
            'modules' => $modules,
            'diskUsage' => $diskUsage,
            'recentLogs' => $recentLogs,
            'defaultStartYear' => (int) $defaultStartDate->year,
            'defaultStartMonth' => (int) $defaultStartDate->month,
            'defaultEndYear' => (int) $defaultEndDate->year,
            'defaultEndMonth' => (int) $defaultEndDate->month,
        ]);
    }

    /**
     * Parse and validate range into Carbon instances.
     */
    protected function parseDateRange(array $data): array
    {
        $startYear = (int) ($data['start_year'] ?? $data['year'] ?? Carbon::now()->year);
        $startMonth = (int) ($data['start_month'] ?? $data['month'] ?? 1);
        $endYear = (int) ($data['end_year'] ?? $data['year'] ?? $startYear);
        $endMonth = (int) ($data['end_month'] ?? $data['month'] ?? $startMonth);

        $startDate = Carbon::create($startYear, $startMonth, 1)->startOfMonth();
        $endDate = Carbon::create($endYear, $endMonth, 1)->endOfMonth();

        if ($startDate->gt($endDate)) {
            // Swap if user inverted start and end
            $temp = $startDate;
            $startDate = $endDate->copy()->startOfMonth();
            $endDate = $temp->copy()->endOfMonth();
        }

        return [$startDate, $endDate];
    }

    /**
     * Preview cleanup stats via JSON endpoint.
     */
    public function preview(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'start_year' => 'nullable|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'start_month' => 'nullable|integer|min:1|max:12',
            'end_year' => 'nullable|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'end_month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'month' => 'nullable|integer|min:1|max:12',
            'branch_id' => 'nullable|integer',
            'modules' => 'nullable|array',
            'modules.*' => 'string',
        ]);

        [$startDate, $endDate] = $this->parseDateRange($validated);

        $preview = $this->cleanupService->preview(
            $startDate,
            $endDate,
            !empty($validated['branch_id']) ? (int) $validated['branch_id'] : null,
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
            'start_year' => 'nullable|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'start_month' => 'nullable|integer|min:1|max:12',
            'end_year' => 'nullable|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'end_month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:' . (Carbon::now()->year + 1),
            'month' => 'nullable|integer|min:1|max:12',
            'branch_id' => 'nullable|integer',
            'modules' => 'required|array|min:1',
            'modules.*' => 'string',
            'confirmation' => 'required|string',
        ]);

        if (strtoupper(trim($validated['confirmation'])) !== 'HAPUS') {
            return back()->with('error', 'Konfirmasi kata "HAPUS" tidak cocok. Pembersihan dibatalkan demi keamanan.');
        }

        [$startDate, $endDate] = $this->parseDateRange($validated);

        // Warn if range includes current month
        $currentStart = Carbon::now()->startOfMonth();
        $includesCurrentMonth = $endDate->gte($currentStart);

        $options = [
            'includes_current_month' => $includesCurrentMonth,
        ];

        $result = $this->cleanupService->cleanup(
            $startDate,
            $endDate,
            !empty($validated['branch_id']) ? (int) $validated['branch_id'] : null,
            $validated['modules'],
            $options,
            $request->user()->id
        );

        return back()->with('success', "Pembersihan berhasil! Periode: {$result['formatted_period']}. {$result['total_records_deleted']} rekor dihapus, {$result['total_files_deleted']} file dihapus, membebaskan {$result['formatted_freed_size']} kapasitas server.");
    }
}
