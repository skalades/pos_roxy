<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function getLogoUrl($logo) {
    if (!$logo) return null;
    if (str_starts_with($logo, 'http')) return $logo;
    
    // Remove /storage/ or storage/ if present
    $cleanPath = ltrim($logo, '/');
    $cleanPath = preg_replace('/^storage\//', '', $cleanPath);
    
    return asset('storage/' . $cleanPath);
}

$logo = "/storage/logos/test.png";
echo "Input: $logo\n";
echo "Output: " . getLogoUrl($logo) . "\n";

$logo2 = "logos/test.png";
echo "Input: $logo2\n";
echo "Output: " . getLogoUrl($logo2) . "\n";
