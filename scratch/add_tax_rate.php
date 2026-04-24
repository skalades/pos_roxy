<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \Illuminate\Support\Facades\Schema::table('branches', function ($table) {
        $table->decimal('tax_rate', 5, 2)->default(10.00)->after('closing_time');
    });
    echo "OK: tax_rate column added to branches table.\n";
} catch (\Exception $e) {
    if (str_contains($e->getMessage(), 'Duplicate column')) {
        echo "SKIP: Column already exists.\n";
    } else {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}
