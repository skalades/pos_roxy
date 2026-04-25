<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Storage;

$path = "logos/test.png";
echo "Default Disk URL: " . Storage::url($path) . "\n";
echo "Public Disk URL: " . Storage::disk('public')->url($path) . "\n";
echo "Asset URL: " . asset('storage/logos/test.png') . "\n";
