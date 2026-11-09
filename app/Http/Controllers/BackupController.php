<?php

namespace App\Http\Controllers;

use App\Services\Backup\BackupService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Exception;

class BackupController extends Controller
{
    public function __construct(
        protected BackupService $backupService
    ) {}

    /**
     * Ensure only super_admin can access backup & restore tools.
     */
    protected function authorizeSuperAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !$user->hasRole(['super_admin', 'superadmin'])) {
            abort(403, 'Akses terbatas untuk Super Admin.');
        }
    }

    /**
     * Display the Backup and Restore dashboard.
     */
    public function index(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $stats = $this->backupService->getSystemStats();
        $backups = $this->backupService->getBackupsList();

        return Inertia::render('Backup/Index', [
            'stats' => $stats,
            'backups' => $backups,
        ]);
    }

    /**
     * Generate a new backup.
     */
    public function create(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'include_files' => 'nullable|boolean',
            'download_direct' => 'nullable|boolean',
            'period_mode' => 'nullable|string|in:all,custom',
            'start_year' => 'nullable|integer|min:2020|max:2035',
            'start_month' => 'nullable|integer|min:1|max:12',
            'end_year' => 'nullable|integer|min:2020|max:2035',
            'end_month' => 'nullable|integer|min:1|max:12',
            'notes' => 'nullable|string|max:255',
        ]);

        try {
            $backup = $this->backupService->createBackup([
                'include_files' => !empty($validated['include_files']),
                'period_mode' => $validated['period_mode'] ?? 'all',
                'start_year' => $validated['start_year'] ?? null,
                'start_month' => $validated['start_month'] ?? null,
                'end_year' => $validated['end_year'] ?? null,
                'end_month' => $validated['end_month'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $periodLabel = $backup['period_filter'] ?? 'Semua Data';

            $redirect = redirect()->route('system.backup.index')->with(
                'success',
                "Cadangan {$backup['filename']} ({$backup['formatted_size']}) berhasil dibuat [Periode: {$periodLabel}] dan disimpan di server."
            );

            if (!empty($validated['download_direct'])) {
                $redirect->with('download_filename', $backup['filename']);
            }

            return $redirect;
        } catch (Exception $e) {
            return redirect()->route('system.backup.index')->with(
                'error',
                "Gagal membuat cadangan: " . $e->getMessage()
            );
        }
    }

    /**
     * Download an existing backup file.
     */
    public function download(Request $request, string $filename): BinaryFileResponse
    {
        $this->authorizeSuperAdmin($request);

        $path = $this->backupService->getBackupPath($filename);
        if (!$path) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return response()->download($path, basename($filename));
    }

    /**
     * Restore database and media assets from an uploaded file or server file.
     */
    public function restore(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'file' => 'nullable|file|max:524288', // Max 512MB
            'server_file' => 'nullable|string',
            'restore_mode' => 'required|string|in:merge,overwrite',
            'confirmation' => 'required|string',
        ]);

        if (strtoupper(trim($validated['confirmation'])) !== 'RESTORE') {
            return redirect()->route('system.backup.index')->with(
                'error',
                'Konfirmasi kata "RESTORE" tidak cocok. Pemulihan dibatalkan demi keamanan data.'
            );
        }

        if (empty($validated['file']) && empty($validated['server_file'])) {
            return redirect()->route('system.backup.index')->with(
                'error',
                'Pilih file backup dari komputer atau salah satu file cadangan yang ada di server.'
            );
        }

        try {
            $source = $request->file('file') ?: $validated['server_file'];
            $mode = $validated['restore_mode']; // 'merge' or 'overwrite'

            $result = $this->backupService->restoreBackup($source, $mode);

            $modeLabel = $mode === 'merge' ? 'Gabungkan Data (Merge Safe)' : 'Timpa Total (Full Overwrite)';

            $msg = "Pemulihan berhasil [Mode: {$modeLabel}] dari file: {$result['source_file']}. "
                . "{$result['statements_executed']} statement dieksekusi";

            if ($mode === 'merge' && $result['statements_skipped'] > 0) {
                $msg .= " ({$result['statements_skipped']} query DROP/TRUNCATE dilewati agar data baru aman)";
            }

            $msg .= ", {$result['files_restored']} file aset dipulihkan dalam {$result['duration']} detik.";

            if (!empty($result['safety_snapshot'])) {
                $msg .= " Snapshot darurat pra-pemulihan telah disimpan ({$result['safety_snapshot']}).";
            }

            return redirect()->route('system.backup.index')->with('success', $msg);
        } catch (Exception $e) {
            return redirect()->route('system.backup.index')->with(
                'error',
                "Gagal memulihkan database: " . $e->getMessage()
            );
        }
    }

    /**
     * Delete an existing backup file.
     */
    public function destroy(Request $request, string $filename)
    {
        $this->authorizeSuperAdmin($request);

        $success = $this->backupService->deleteBackup($filename);

        if ($success) {
            return redirect()->route('system.backup.index')->with('success', 'File cadangan berhasil dihapus.');
        }

        return redirect()->route('system.backup.index')->with('error', 'File cadangan tidak ditemukan atau gagal dihapus.');
    }
}
