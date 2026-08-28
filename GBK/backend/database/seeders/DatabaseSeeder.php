<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\IuranSetting;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Houses
        $blocks = ['A', 'B', 'C'];
        $houses = [];
        foreach ($blocks as $block) {
            for ($num = 1; $num <= 5; $num++) {
                $number = str_pad($num, 2, '0', STR_PAD_LEFT);
                $status = ($block === 'C' && $num === 5) ? 'vacant' : (($block === 'B' && $num === 4) ? 'rented' : 'occupied_owner');
                $houses[] = House::create([
                    'block' => $block,
                    'number' => $number,
                    'full_address' => "Perumahan Griya Bumi Kamuning Blok {$block}-{$number}",
                    'status' => $status,
                    'notes' => $status === 'vacant' ? 'Rumah kosong' : null,
                ]);
            }
        }

        // Get created house IDs
        $houseA1 = House::where('block', 'A')->where('number', '01')->first()->id;
        $houseA2 = House::where('block', 'A')->where('number', '02')->first()->id;
        $houseB5 = House::where('block', 'B')->where('number', '05')->first()->id;

        // 2. Seed Users
        $superAdmin = User::create([
            'name' => 'Super Admin GBK',
            'email' => 'admin@gbk.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'status' => 'active',
            'nik' => '3200000000000001',
            'phone' => '081122334455',
        ]);

        $rt = User::create([
            'name' => 'Budi Ketua RT',
            'email' => 'rt@gbk.com',
            'password' => Hash::make('password'),
            'role' => 'rt',
            'status' => 'active',
            'nik' => '3200000000000002',
            'phone' => '081122334456',
            'house_id' => $houseA1,
        ]);

        $bendahara = User::create([
            'name' => 'Ani Bendahara',
            'email' => 'bendahara@gbk.com',
            'password' => Hash::make('password'),
            'role' => 'bendahara',
            'status' => 'active',
            'nik' => '3200000000000003',
            'phone' => '081122334457',
            'house_id' => $houseA2,
        ]);

        $warga = User::create([
            'name' => 'Wawan Warga',
            'email' => 'warga@gbk.com',
            'password' => Hash::make('password'),
            'role' => 'warga',
            'status' => 'active',
            'nik' => '3200000000000004',
            'phone' => '081122334458',
            'house_id' => $houseB5,
        ]);

        // 3. Seed Default Iuran Settings
        IuranSetting::create([
            'type' => 'kebersihan',
            'amount' => 30000.00,
            'effective_from' => '2026-01-01',
            'set_by' => $bendahara->id,
        ]);

        IuranSetting::create([
            'type' => 'air',
            'amount' => 50000.00,
            'effective_from' => '2026-01-01',
            'set_by' => $bendahara->id,
        ]);

        // 4. Seed Sample Invoices
        // Unpaid Invoice for Wawan Warga (B-05) - June 2026
        Invoice::create([
            'house_id' => $houseB5,
            'month' => 6,
            'year' => 2026,
            'kebersihan_amount' => 30000.00,
            'air_amount' => 50000.00,
            'total_amount' => 80000.00,
            'status' => 'unpaid',
            'payment_method' => 'none',
        ]);

        // Paid Invoice for Wawan Warga (B-05) - May 2026 (Paid Cash)
        Invoice::create([
            'house_id' => $houseB5,
            'month' => 5,
            'year' => 2026,
            'kebersihan_amount' => 30000.00,
            'air_amount' => 50000.00,
            'total_amount' => 80000.00,
            'status' => 'paid_manual',
            'payment_method' => 'cash',
            'verified_by' => $bendahara->id,
            'verified_at' => now(),
        ]);
    }
}

