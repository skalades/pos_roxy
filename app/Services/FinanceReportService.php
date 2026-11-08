<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\CashOperation;
use App\Models\Setting;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\PayrollService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;
use Exception;

class FinanceReportService extends BaseService
{
    public const INDONESIAN_MONTHS = [
        1  => 'Januari',
        2  => 'Februari',
        3  => 'Maret',
        4  => 'April',
        5  => 'Mei',
        6  => 'Juni',
        7  => 'Juli',
        8  => 'Agustus',
        9  => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Get Indonesian month name from 1-12.
     */
    public function getMonthName(int $month): string
    {
        return self::INDONESIAN_MONTHS[$month] ?? ('Bulan_' . $month);
    }

    /**
     * Build financial report data structure for PDF view.
     */
    public function buildReportData(string $startDate, string $endDate, ?int $branchId = null, ?string $periodLabel = null): array
    {
        $branch = $branchId ? Branch::find($branchId) : null;
        $dateRange = [$startDate . ' 00:00:00', $endDate . ' 23:59:59'];

        // Resolve logo path for dompdf
        $logoUrl = Setting::get('app_logo');
        $logoPath = null;
        if ($logoUrl) {
            $parsedUrl = parse_url($logoUrl, PHP_URL_PATH);
            $relativePath = str_replace('/storage/', '', $parsedUrl);
            $candidatePath = storage_path('app/public/' . $relativePath);
            if (file_exists($candidatePath)) {
                $logoPath = $candidatePath;
            }
        }

        // 1. Financial Summary
        $revenue = (float) Transaction::whereBetween('created_at', $dateRange)
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');
            
        $pendingRevenue = (float) Transaction::whereBetween('created_at', $dateRange)
            ->where('status', 'pending')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('total_amount');
        
        $expenses = (float) CashOperation::where('type', 'cash_out')
            ->whereBetween('created_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->sum('amount');

        $commissions = (float) TransactionItem::whereHas('transaction', function($q) use ($dateRange, $branchId) {
            $q->whereBetween('created_at', $dateRange)
              ->where('status', 'completed');
            if ($branchId) $q->where('branch_id', $branchId);
        })->sum('commission_amount');

        // 2. Barber Commission Breakdown
        $barberCommissions = TransactionItem::select(
                'barber_id',
                DB::raw('SUM(commission_amount) as total_commission'),
                DB::raw('SUM(quantity) as total_services')
            )
            ->whereNotNull('barber_id')
            ->whereHas('transaction', function($q) use ($dateRange, $branchId) {
                $q->whereBetween('created_at', $dateRange)
                  ->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->with('barber')
            ->groupBy('barber_id')
            ->get();

        // 3. Payment Method Distribution
        $paymentDistribution = Transaction::select('payment_method', DB::raw('SUM(total_amount) as total'), DB::raw('COUNT(*) as count'))
            ->whereBetween('created_at', $dateRange)
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', '')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->groupBy('payment_method')
            ->get();

        // 4. Shift & Cash Summary
        $shifts = Shift::whereBetween('opened_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->with('user')
            ->orderBy('opened_at', 'desc')
            ->get();

        // 5. Detailed Transactions (limit 200 to prevent OOM)
        $transactions = Transaction::whereBetween('created_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->with(['items:id,transaction_id,item_name,quantity', 'customer:id,name'])
            ->select(['id', 'transaction_number', 'created_at', 'status', 'total_amount', 'customer_id', 'branch_id'])
            ->orderBy('created_at', 'desc')
            ->limit(200)
            ->get();

        // 6. Detailed Expenses
        $expenseList = CashOperation::where('type', 'cash_out')
            ->whereBetween('created_at', $dateRange)
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        // 7. Staff & Payroll Summary
        $branchStaff = User::where('is_active', true)
            ->where('role', '!=', 'super_admin')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->get();

        $totalFixedSalaries = (float) $branchStaff->sum('monthly_salary');

        $payrollService = app(PayrollService::class);
        $staffPayroll = $branchStaff->map(function ($staff) use ($payrollService, $startDate, $endDate) {
            $calc = $payrollService->calculateUserPayroll($staff, $startDate, $endDate);
            return [
                'user'                 => $staff,
                'total_commission'     => $calc['total_commission'],
                'total_deduction'      => $calc['total_deduction'],
                'late_count'          => $calc['late_count'],
                'late_total_minutes'  => $calc['late_total_minutes'],
                'late_deduction_items' => $calc['late_deduction_items'],
                'net_salary'          => $calc['net_salary'],
            ];
        });

        $totalLateDeductions = (float) $staffPayroll->sum('total_deduction');
        $totalNetSalaryCost  = (float) ($totalFixedSalaries - $totalLateDeductions);

        $formattedPeriod = $periodLabel ?: (Carbon::parse($startDate)->format('d M Y') . ' - ' . Carbon::parse($endDate)->format('d M Y'));

        return [
            'app_name'              => Setting::get('app_name', 'Roxy POS'),
            'app_logo'              => $logoPath,
            'report_date'           => now()->format('d M Y H:i'),
            'period'                => $formattedPeriod,
            'branch'                => $branch ? $branch->name : 'Semua Cabang',
            'summary'               => [
                'revenue'            => $revenue,
                'pending_revenue'    => $pendingRevenue,
                'expenses'           => $expenses,
                'commissions'        => $commissions,
                'fixed_salaries'     => $totalFixedSalaries,
                'late_deductions'    => $totalLateDeductions,
                'net_salary_cost'    => $totalNetSalaryCost,
                'profit'             => ($revenue - $expenses - $commissions - $totalNetSalaryCost),
            ],
            'barber_commissions'    => $barberCommissions,
            'payment_distribution'  => $paymentDistribution,
            'shifts'                => $shifts,
            'transactions'          => $transactions,
            'expense_list'          => $expenseList,
            'all_staff'             => $branchStaff,
            'staff_payroll'         => $staffPayroll,
        ];
    }

    /**
     * Render DomPdf instance from data.
     */
    public function renderPdf(array $data)
    {
        return Pdf::loadView('pdf.finance_report', $data);
    }

    /**
     * Generate PDF content and filename for a single month.
     */
    public function generateMonthReport(int $year, int $month, ?int $branchId = null): array
    {
        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = Carbon::createFromDate($year, $month, 1)->endOfMonth();
        $monthName = $this->getMonthName($month);

        $branch = $branchId ? Branch::find($branchId) : null;
        $branchSuffix = $branch ? '_' . Str::slug($branch->name, '_') : '';

        $periodLabel = "{$monthName} {$year} (" . $start->format('d M Y') . ' - ' . $end->format('d M Y') . ')';
        $reportData = $this->buildReportData($start->toDateString(), $end->toDateString(), $branchId, $periodLabel);

        $pdf = $this->renderPdf($reportData);
        $fileName = "Laporan_Keuangan_{$monthName}_{$year}{$branchSuffix}.pdf";

        return [
            'month'       => $month,
            'year'        => $year,
            'month_name'  => $monthName,
            'filename'    => $fileName,
            'pdf'         => $pdf,
        ];
    }

    /**
     * Download a single month report directly as PDF.
     */
    public function downloadSingleMonth(int $year, int $month, ?int $branchId = null)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $report = $this->generateMonthReport($year, $month, $branchId);
        return $report['pdf']->download($report['filename']);
    }

    /**
     * Export multiple months into a single ZIP archive containing individual monthly PDFs.
     */
    public function exportMultipleMonthsZip(array $months, int $year, ?int $branchId = null)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(600);

        sort($months);
        $branch = $branchId ? Branch::find($branchId) : null;
        $branchSuffix = $branch ? '_' . Str::slug($branch->name, '_') : '';

        // Determine ZIP filename based on selected range
        $firstMonthName = $this->getMonthName($months[0]);
        $lastMonthName = $this->getMonthName(end($months));
        
        if (count($months) === 1) {
            $zipBaseName = "Laporan_Keuangan_{$firstMonthName}_{$year}{$branchSuffix}";
        } elseif ($months === range($months[0], end($months))) {
            $zipBaseName = "Laporan_Keuangan_{$firstMonthName}-{$lastMonthName}_{$year}{$branchSuffix}";
        } else {
            $zipBaseName = "Laporan_Keuangan_MultiBulan_{$year}{$branchSuffix}";
        }
        $zipFileName = $zipBaseName . '.zip';

        // Prepare temporary storage directory
        $tempDir = storage_path('app/temp');
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $tempZipPath = tempnam($tempDir, 'roxy_finance_');

        $zip = new ZipArchive();
        if ($zip->open($tempZipPath, ZipArchive::OVERWRITE) !== true) {
            if ($zip->open($tempZipPath, ZipArchive::CREATE) !== true) {
                throw new Exception("Gagal membuat arsip ZIP untuk laporan bulanan.");
            }
        }

        foreach ($months as $month) {
            $report = $this->generateMonthReport($year, (int)$month, $branchId);
            $pdfContent = $report['pdf']->output();
            $zip->addFromString($report['filename'], $pdfContent);

            // Clean memory between PDF generations to avoid OOM
            unset($report, $pdfContent);
            gc_collect_cycles();
        }

        $zip->close();

        return response()->streamDownload(function () use ($tempZipPath) {
            if ($stream = fopen($tempZipPath, 'rb')) {
                while (!feof($stream)) {
                    echo fread($stream, 1024 * 64);
                    flush();
                }
                fclose($stream);
            }
            @unlink($tempZipPath);
        }, $zipFileName, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="' . $zipFileName . '"',
        ]);
    }

    /**
     * Download custom date range report.
     */
    public function downloadDateRange(string $startDate, string $endDate, ?int $branchId = null)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $branch = $branchId ? Branch::find($branchId) : null;
        $branchSuffix = $branch ? '_' . Str::slug($branch->name, '_') : '';

        $startCarbon = Carbon::parse($startDate);
        $endCarbon = Carbon::parse($endDate);

        // Check if date range is exactly one full month
        if ($startCarbon->copy()->startOfMonth()->toDateString() === $startDate && 
            $startCarbon->copy()->endOfMonth()->toDateString() === $endDate &&
            $startCarbon->month === $endCarbon->month &&
            $startCarbon->year === $endCarbon->year) {
            $monthName = $this->getMonthName($startCarbon->month);
            $fileName = "Laporan_Keuangan_{$monthName}_{$startCarbon->year}{$branchSuffix}.pdf";
        } else {
            $fileName = 'Laporan_Keuangan_Detail_' . $startCarbon->format('Ymd') . '_' . $endCarbon->format('Ymd') . "{$branchSuffix}.pdf";
        }

        $reportData = $this->buildReportData($startDate, $endDate, $branchId);
        $pdf = $this->renderPdf($reportData);

        return $pdf->download($fileName);
    }
}
