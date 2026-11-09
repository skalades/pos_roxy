<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use ZipArchive;
use Exception;

class StorageArchiver
{
    /**
     * Archive public storage directory into a zip archive.
     *
     * @param string $destinationZipPath Path to save the zip file
     * @param string|null $sourceDir Directory to archive (defaults to storage_path('app/public'))
     * @return array Statistics of the archive
     * @throws Exception
     */
    public function archive(string $destinationZipPath, ?string $sourceDir = null): array
    {
        $sourceDir = $sourceDir ?: storage_path('app/public');
        if (!is_dir($sourceDir)) {
            File::makeDirectory($sourceDir, 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($destinationZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new Exception("Gagal membuat file arsip zip di: {$destinationZipPath}");
        }

        $filesCount = 0;
        $totalBytes = 0;

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($sourceDir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $filePath = $item->getRealPath();
            $relativePath = substr($filePath, strlen($sourceDir) + 1);
            $relativePath = str_replace('\\', '/', $relativePath);

            // Skip hidden gitignore or temp files
            if ($item->getFilename() === '.gitignore' || str_starts_with($item->getFilename(), '.DS_Store')) {
                continue;
            }

            if ($item->isDir()) {
                $zip->addEmptyDir('storage/' . $relativePath);
            } elseif ($item->isFile()) {
                $zip->addFile($filePath, 'storage/' . $relativePath);
                $filesCount++;
                $totalBytes += $item->getSize();
            }
        }

        $zip->close();

        return [
            'files_count' => $filesCount,
            'total_bytes' => $totalBytes,
            'archive_path' => $destinationZipPath,
        ];
    }

    /**
     * Extract storage files from an archive into public storage directory.
     *
     * @param string $zipFilePath Path to the zip archive
     * @param string|null $targetDir Destination directory (defaults to storage_path('app/public'))
     * @return array Statistics of extracted files
     * @throws Exception
     */
    public function extract(string $zipFilePath, ?string $targetDir = null): array
    {
        $targetDir = $targetDir ?: storage_path('app/public');
        if (!is_dir($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($zipFilePath) !== true) {
            throw new Exception("Gagal membuka file arsip zip: {$zipFilePath}");
        }

        $filesRestored = 0;
        $realTargetDir = realpath($targetDir);

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $filename = $zip->getNameIndex($i);

            // Normalize path
            $normalized = str_replace('\\', '/', $filename);

            // Only extract files originating from 'storage/' inside the zip
            if (!str_starts_with($normalized, 'storage/')) {
                continue;
            }

            // Strip prefix 'storage/'
            $destSubPath = substr($normalized, 8);
            if (empty($destSubPath)) {
                continue;
            }

            // Prevent Zip Slip / Path traversal attack
            if (str_contains($destSubPath, '../') || str_contains($destSubPath, '..\\')) {
                Log::warning("Potential path traversal detected in backup zip: {$filename}");
                continue;
            }

            $destination = $targetDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $destSubPath);

            // Handle directory creation
            if (str_ends_with($normalized, '/')) {
                if (!is_dir($destination)) {
                    @mkdir($destination, 0755, true);
                }
                continue;
            }

            $parentDir = dirname($destination);
            if (!is_dir($parentDir)) {
                @mkdir($parentDir, 0755, true);
            }

            // Extract file safely
            $fileStream = $zip->getStream($filename);
            if ($fileStream) {
                $destHandle = @fopen($destination, 'wb');
                if ($destHandle) {
                    stream_copy_to_stream($fileStream, $destHandle);
                    fclose($destHandle);
                    $filesRestored++;
                }
                fclose($fileStream);
            }
        }

        $zip->close();

        return [
            'files_restored' => $filesRestored,
            'target_dir' => $targetDir,
        ];
    }
}
