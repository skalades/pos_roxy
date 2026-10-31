<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Branch;
use App\Models\User;
use App\Models\Service;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;

class OnyxOctober2026ShiftsSeeder extends Seeder
{
    /**
     * Jalankan database seeder untuk data shift & transaksi Onyx Barber Bali
     * yang hilang pada periode 1 - 3 Oktober 2026 (beserta pengecekan aman untuk 4 Oktober 2026).
     */
    public function run(): void
    {
        $this->command->info('Memulai seeding data shift & transaksi Onyx Barber Bali (Oktober 2026)...');

        // 1. Dapatkan Cabang Onyx Barber Bali
        $branch = Branch::where('name', 'like', '%Onyx%')->first() ?? Branch::find(2);
        if (!$branch) {
            $this->command->error('Cabang Onyx Barber Bali (branch_id: 2) tidak ditemukan!');
            return;
        }

        // 2. Dapatkan atau buat user kasir sesuai struk ("Kasir Onyx 1")
        $cashier = User::where('name', 'Kasir Onyx 1')->first();
        if (!$cashier) {
            $cashier = User::where('branch_id', $branch->id)->where('role', 'cashier')->first();
            if (!$cashier) {
                $cashier = User::create([
                    'branch_id' => $branch->id,
                    'name' => 'Kasir Onyx 1',
                    'email' => 'kasir.onyx1@roxybarber.com',
                    'role' => 'cashier',
                    'work_start_time' => '09:00:00',
                    'work_end_time' => '21:00:00',
                    'monthly_salary' => 4000000,
                    'is_active' => 1,
                    'password' => bcrypt('password'),
                ]);
            }
        }

        // 3. Konfigurasi data per hari sesuai struk fisik
        $shiftsData = $this->getShiftsData();

        foreach ($shiftsData as $dayData) {
            $this->seedDay($branch, $cashier, $dayData);
        }

        $this->command->info('Seeding data shift & transaksi Onyx Barber Bali selesai dengan sukses.');
    }

    /**
     * Seed data satu hari shift beserta seluruh transaksi & items terkait.
     */
    private function seedDay(Branch $branch, User $cashier, array $dayData): void
    {
        $date = $dayData['date'];

        // Cek apakah shift pada tanggal ini sudah ada (idempotent agar aman dijalankan berkali-kali)
        $existingShift = Shift::where('branch_id', $branch->id)
            ->whereDate('closed_at', $date)
            ->first();

        if ($existingShift) {
            $this->command->warn("Shift untuk tanggal {$date} sudah ada di database (Shift ID: {$existingShift->id}), dilewati.");
            return;
        }

        DB::beginTransaction();
        try {
            // Buat Shift
            $shift = new Shift();
            if (isset($dayData['preferred_shift_id']) && !Shift::find($dayData['preferred_shift_id'])) {
                $shift->id = $dayData['preferred_shift_id'];
            }
            $shift->branch_id = $branch->id;
            $shift->user_id = $cashier->id;
            $shift->opening_balance = $dayData['opening_balance'];
            $shift->closing_balance = $dayData['closing_balance'];
            $shift->expected_balance = $dayData['closing_balance'];
            $shift->difference = 0.00;
            $shift->opened_at = $dayData['opened_at'];
            $shift->closed_at = $dayData['closed_at'];
            $shift->status = 'closed';
            $shift->notes = "\nClose notes: ";
            $shift->created_at = $dayData['opened_at'];
            $shift->updated_at = $dayData['closed_at'];
            $shift->save();

            $this->command->info("Membuat Shift ID: {$shift->id} untuk tanggal {$date}...");

            $barberCache = [];
            $serviceCache = [];

            foreach ($dayData['transactions'] as $trxData) {
                // Resolusi Barber
                $barberName = $trxData['barber'];
                if (!isset($barberCache[$barberName])) {
                    $barberCache[$barberName] = User::where('name', $barberName)
                        ->where('branch_id', $branch->id)
                        ->first() ?? User::where('name', $barberName)->first();
                }
                $barber = $barberCache[$barberName];
                $barberId = $barber ? $barber->id : null;

                // Resolusi Layanan
                $serviceName = $trxData['item'];
                if (!isset($serviceCache[$serviceName])) {
                    $serviceCache[$serviceName] = Service::where('name', $serviceName)
                        ->where(function ($q) use ($branch) {
                            $q->where('branch_id', $branch->id)->orWhereNull('branch_id');
                        })
                        ->first() ?? Service::where('name', 'like', "%{$serviceName}%")->first();
                }
                $service = $serviceCache[$serviceName];

                $subtotal = (float)$trxData['price'];
                $discount = (float)($trxData['discount'] ?? 0);
                $totalAmount = $subtotal - $discount;
                $commissionRate = 35.00; // Standar komisi barber di cabang Onyx
                $commissionAmount = round($subtotal * ($commissionRate / 100), 2);

                // Cek nomor transaksi apakah sudah ada
                $existingTrx = Transaction::withTrashed()->where('transaction_number', $trxData['number'])->first();
                if ($existingTrx) {
                    $this->command->warn("Transaksi {$trxData['number']} sudah ada, dilewati.");
                    continue;
                }

                // Buat Transaksi
                $trx = Transaction::create([
                    'branch_id' => $branch->id,
                    'shift_id' => $shift->id,
                    'cashier_id' => $cashier->id,
                    'customer_id' => null,
                    'barber_id' => $barberId,
                    'transaction_number' => $trxData['number'],
                    'subtotal' => $subtotal,
                    'tax_amount' => 0.00,
                    'discount_amount' => $discount,
                    'total_amount' => $totalAmount,
                    'barber_commission' => $commissionAmount,
                    'total_commission' => $commissionAmount,
                    'payment_method' => $trxData['payment_method'],
                    'amount_paid' => $totalAmount,
                    'payment_amount' => $totalAmount,
                    'change_amount' => 0.00,
                    'payment_details' => null,
                    'status' => 'completed',
                    'notes' => null,
                    'completed_at' => $trxData['time'] ?? $dayData['closed_at'],
                    'created_at' => $trxData['time'] ?? $dayData['closed_at'],
                    'updated_at' => $trxData['time'] ?? $dayData['closed_at'],
                ]);

                // Buat Item Transaksi
                TransactionItem::create([
                    'transaction_id' => $trx->id,
                    'item_type' => 'service',
                    'item_id' => $service ? $service->id : 0,
                    'item_name' => $service ? $service->name : $serviceName,
                    'item_description' => $service ? $service->description : null,
                    'barber_id' => $barberId,
                    'quantity' => 1,
                    'unit_price' => $subtotal,
                    'subtotal' => $subtotal,
                    'discount_amount' => $discount,
                    'total_price' => $subtotal, // Sesuai ShiftService::getServicesBreakdown yang menghitung total item
                    'commission_rate' => $commissionRate,
                    'commission_amount' => $commissionAmount,
                    'item_metadata' => null,
                    'created_at' => $trxData['time'] ?? $dayData['closed_at'],
                    'updated_at' => $trxData['time'] ?? $dayData['closed_at'],
                ]);
            }

            DB::commit();
            $this->command->info("Berhasil membuat Shift ID: {$shift->id} dan seluruh transaksinya untuk tanggal {$date}.");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Gagal membuat data tanggal {$date}: " . $e->getMessage());
        }
    }

    /**
     * Data master shift dan transaksi yang ditranskripsikan secara presisi dari struk fisik.
     */
    private function getShiftsData(): array
    {
        return [
            // =========================================================================
            // TANGGAL 1 OKTOBER 2026 (Struk 1)
            // =========================================================================
            [
                'date' => '2026-10-01',
                'preferred_shift_id' => 434,
                'opening_balance' => 10000.00,
                'closing_balance' => 160000.00,
                'opened_at' => '2026-10-01 08:30:00',
                'closed_at' => '2026-10-01 19:26:44',
                'transactions' => [
                    // Cash sales = 150.000
                    ['number' => 'TRX-202610010003', 'payment_method' => 'cash', 'item' => 'BALI BUZZ CUT', 'price' => 150000, 'discount' => 0, 'barber' => 'Koido', 'time' => '2026-10-01 10:15:00'],
                    // QRIS sales = 200.000
                    ['number' => 'TRX-202610010005', 'payment_method' => 'qris', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Koido', 'time' => '2026-10-01 11:20:00'],
                    // EDC sales = 3.725.000 (3.800.000 - 75.000 diskon)
                    ['number' => 'TRX-202610010008', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-01 12:45:00'],
                    ['number' => 'TRX-202610010010', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-01 13:30:00'],
                    ['number' => 'TRX-202610010023', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-01 15:10:00'],
                    ['number' => 'TRX-202610010024', 'payment_method' => 'edc', 'item' => 'BALI TRIM', 'price' => 150000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-01 15:55:00'],
                    // Transaksi berdiskon tercetak di struk: TRX-202610010025 Diskon 75.000 > HIGHLIGHT
                    ['number' => 'TRX-202610010025', 'payment_method' => 'edc', 'item' => 'HIGHLIGHT', 'price' => 700000, 'discount' => 75000, 'barber' => 'Refan', 'time' => '2026-10-01 16:30:00'],
                    ['number' => 'TRX-202610010027', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Refan', 'time' => '2026-10-01 17:15:00'],
                    ['number' => 'TRX-202610010036', 'payment_method' => 'edc', 'item' => 'BASIC COLOR', 'price' => 200000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-01 17:50:00'],
                    ['number' => 'TRX-202610010037', 'payment_method' => 'edc', 'item' => 'BALI PRINCE', 'price' => 550000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-01 18:25:00'],
                    ['number' => 'TRX-202610010038', 'payment_method' => 'edc', 'item' => 'FASHION COLOR', 'price' => 700000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-01 18:55:00'],
                    ['number' => 'TRX-202610010039', 'payment_method' => 'edc', 'item' => 'HIGHLIGHT', 'price' => 700000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-01 19:15:00'],
                ]
            ],

            // =========================================================================
            // TANGGAL 2 OKTOBER 2026 (Struk 2)
            // =========================================================================
            [
                'date' => '2026-10-02',
                'preferred_shift_id' => 436,
                'opening_balance' => 10000.00,
                'closing_balance' => 1110000.00,
                'opened_at' => '2026-10-02 08:30:00',
                'closed_at' => '2026-10-02 20:31:01',
                'transactions' => [
                    // Cash sales = 1.100.000 (250k + 250k + 250k + 350k)
                    ['number' => 'TRX-202610020001', 'payment_method' => 'cash', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Cuban', 'time' => '2026-10-02 09:40:00'],
                    ['number' => 'TRX-202610020003', 'payment_method' => 'cash', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Koido', 'time' => '2026-10-02 10:30:00'],
                    ['number' => 'TRX-202610020012', 'payment_method' => 'cash', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-02 12:15:00'],
                    ['number' => 'TRX-202610020015', 'payment_method' => 'cash', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Refan', 'time' => '2026-10-02 13:40:00'],
                    // QRIS sales = 580.000 (180k + 200k + 200k)
                    ['number' => 'TRX-202610020016', 'payment_method' => 'qris', 'item' => 'BALI SHAVING', 'price' => 180000, 'discount' => 0, 'barber' => 'Koido', 'time' => '2026-10-02 14:20:00'],
                    ['number' => 'TRX-202610020018', 'payment_method' => 'qris', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Koido', 'time' => '2026-10-02 15:10:00'],
                    ['number' => 'TRX-202610020023', 'payment_method' => 'qris', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-02 16:30:00'],
                    // EDC sales = 1.080.000 (180k + 200k + 350k + 350k)
                    ['number' => 'TRX-202610020028', 'payment_method' => 'edc', 'item' => 'BALI SHAVING', 'price' => 180000, 'discount' => 0, 'barber' => 'Refan', 'time' => '2026-10-02 17:45:00'],
                    ['number' => 'TRX-202610020030', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-02 18:20:00'],
                    ['number' => 'TRX-202610020035', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-02 19:10:00'],
                    ['number' => 'TRX-202610020040', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-02 20:05:00'],
                ]
            ],

            // =========================================================================
            // TANGGAL 3 OKTOBER 2026 (Struk 3)
            // =========================================================================
            [
                'date' => '2026-10-03',
                'preferred_shift_id' => 438,
                'opening_balance' => 10000.00,
                'closing_balance' => 210000.00,
                'opened_at' => '2026-10-03 08:30:00',
                'closed_at' => '2026-10-03 19:42:16',
                'transactions' => [
                    // Cash sales = 200.000
                    ['number' => 'TRX-202610030001', 'payment_method' => 'cash', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Refan', 'time' => '2026-10-03 09:20:00'],
                    // QRIS sales = 730.000 (130k + 250k + 350k)
                    ['number' => 'TRX-202610030003', 'payment_method' => 'qris', 'item' => 'BALI HAIRCUT KIDS', 'price' => 130000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-03 10:15:00'],
                    ['number' => 'TRX-202610030010', 'payment_method' => 'qris', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-03 11:45:00'],
                    ['number' => 'TRX-202610030012', 'payment_method' => 'qris', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-03 12:50:00'],
                    // EDC sales = 3.960.000 (16 items)
                    ['number' => 'TRX-202610030015', 'payment_method' => 'edc', 'item' => 'BALI BUZZ CUT', 'price' => 150000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-03 13:20:00'],
                    ['number' => 'TRX-202610030016', 'payment_method' => 'edc', 'item' => 'BALI HAIRCUT KIDS', 'price' => 130000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-03 13:55:00'],
                    ['number' => 'TRX-202610030017', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-03 14:30:00'],
                    ['number' => 'TRX-202610030019', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Ocha', 'time' => '2026-10-03 15:10:00'],
                    ['number' => 'TRX-202610030020', 'payment_method' => 'edc', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-03 15:45:00'],
                    ['number' => 'TRX-202610030021', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-03 16:15:00'],
                    ['number' => 'TRX-202610030022', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-03 16:50:00'],
                    ['number' => 'TRX-202610030023', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Aldy', 'time' => '2026-10-03 17:20:00'],
                    ['number' => 'TRX-202610030026', 'payment_method' => 'edc', 'item' => 'BLACK MASK', 'price' => 150000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-03 17:40:00'],
                    ['number' => 'TRX-202610030030', 'payment_method' => 'edc', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-03 18:05:00'],
                    ['number' => 'TRX-202610030031', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-03 18:25:00'],
                    ['number' => 'TRX-202610030038', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-03 18:45:00'],
                    ['number' => 'TRX-202610030039', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Galih', 'time' => '2026-10-03 19:00:00'],
                    ['number' => 'TRX-202610030040', 'payment_method' => 'edc', 'item' => 'BALI HAIRCUT KIDS', 'price' => 130000, 'discount' => 0, 'barber' => 'Refan', 'time' => '2026-10-03 19:15:00'],
                    ['number' => 'TRX-202610030041', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Refan', 'time' => '2026-10-03 19:30:00'],
                    ['number' => 'TRX-202610030042', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Refan', 'time' => '2026-10-03 19:40:00'],
                ]
            ],

            // =========================================================================
            // TANGGAL 4 OKTOBER 2026 (Struk 4) - Pengecekan Aman (Sudah ada Shift 442)
            // =========================================================================
            [
                'date' => '2026-10-04',
                'preferred_shift_id' => 442,
                'opening_balance' => 10000.00,
                'closing_balance' => 410000.00,
                'opened_at' => '2026-10-04 17:09:22',
                'closed_at' => '2026-10-04 19:08:09',
                'transactions' => [
                    ['number' => 'TRX-202610040030', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Koido'],
                    ['number' => 'TRX-202610040031', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Galih'],
                    ['number' => 'TRX-202610040032', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Galih'],
                    ['number' => 'TRX-202610040033', 'payment_method' => 'qris', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Galih'],
                    ['number' => 'TRX-202610040034', 'payment_method' => 'qris', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Galih'],
                    ['number' => 'TRX-202610040035', 'payment_method' => 'edc', 'item' => 'BALI STANDAR', 'price' => 200000, 'discount' => 0, 'barber' => 'Koido'],
                    ['number' => 'TRX-202610040036', 'payment_method' => 'cash', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Refan'],
                    ['number' => 'TRX-202610040037', 'payment_method' => 'edc', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Refan'],
                    ['number' => 'TRX-202610040041', 'payment_method' => 'edc', 'item' => 'BALI SHAVING', 'price' => 180000, 'discount' => 0, 'barber' => 'Ocha'],
                    ['number' => 'TRX-202610040042', 'payment_method' => 'edc', 'item' => 'BALI SUPREME', 'price' => 350000, 'discount' => 0, 'barber' => 'Ocha'],
                    ['number' => 'TRX-202610040043', 'payment_method' => 'edc', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Ocha'],
                    ['number' => 'TRX-202610040045', 'payment_method' => 'cash', 'item' => 'BALI TRIM', 'price' => 150000, 'discount' => 0, 'barber' => 'Refan'],
                    ['number' => 'TRX-202610040046', 'payment_method' => 'edc', 'item' => 'BALI SKIN FADE', 'price' => 250000, 'discount' => 0, 'barber' => 'Koido'],
                ]
            ]
        ];
    }
}
