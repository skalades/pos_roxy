<?php

namespace App\Console\Commands;

use App\Models\House;
use App\Models\Invoice;
use App\Models\IuranSetting;
use Illuminate\Console\Command;

class GenerateMonthlyInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:generate-monthly-invoices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly invoices (Kebersihan + Air) for all occupied houses';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $month = now()->month;
        $year = now()->year;

        $this->info("Starting invoice generation for {$month}/{$year}...");

        // 1. Get current flat rate settings
        $kebersihanSetting = IuranSetting::where('type', 'kebersihan')
            ->where('effective_from', '<=', now()->toDateString())
            ->orderBy('effective_from', 'desc')
            ->first();

        $airSetting = IuranSetting::where('type', 'air')
            ->where('effective_from', '<=', now()->toDateString())
            ->orderBy('effective_from', 'desc')
            ->first();

        $kebersihanAmount = $kebersihanSetting ? $kebersihanSetting->amount : 30000.00;
        $airAmount = $airSetting ? $airSetting->amount : 50000.00;
        $totalAmount = $kebersihanAmount + $airAmount;

        // 2. Fetch occupied houses
        $occupiedHouses = House::whereIn('status', ['occupied_owner', 'rented'])->get();

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($occupiedHouses as $house) {
            // Check if invoice already exists
            $exists = Invoice::where('house_id', $house->id)
                ->where('month', $month)
                ->where('year', $year)
                ->exists();

            if ($exists) {
                $skippedCount++;
                continue;
            }

            Invoice::create([
                'house_id' => $house->id,
                'month' => $month,
                'year' => $year,
                'kebersihan_amount' => $kebersihanAmount,
                'air_amount' => $airAmount,
                'total_amount' => $totalAmount,
                'status' => 'unpaid',
                'payment_method' => 'none',
            ]);

            $createdCount++;
        }

        $this->info("Completed! Invoices created: {$createdCount}, skipped: {$skippedCount}.");
        return Command::SUCCESS;
    }
}

