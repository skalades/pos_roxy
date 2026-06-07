<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan Detail - {{ $period }}</title>
    <style>
        @page { margin: 40px; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #334155;
            line-height: 1.5;
            font-size: 11px;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 3px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo-container {
            float: left;
            width: 30%;
        }
        .logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
        }
        .header-info {
            float: right;
            width: 65%;
            text-align: right;
        }
        .header-info h1 {
            margin: 0;
            color: #6366f1;
            font-size: 24px;
            text-transform: uppercase;
        }
        .header-info p {
            margin: 5px 0;
            color: #64748b;
            font-size: 12px;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background: #f8fafc;
            padding: 8px 12px;
            border-left: 5px solid #6366f1;
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 15px;
            color: #1e293b;
            text-transform: uppercase;
        }
        
        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin-left: -10px;
            margin-bottom: 20px;
        }
        .summary-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 12px;
            vertical-align: top;
        }
        .summary-card.profit {
            background: #6366f1;
            color: #ffffff;
            border-color: #4f46e5;
        }
        .summary-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 8px;
            color: #64748b;
        }
        .profit .summary-label { color: #e0e7ff; }
        .summary-value {
            font-size: 15px;
            font-weight: 900;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        th {
            background: #f1f5f9;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #e2e8f0;
            color: #475569;
            text-transform: uppercase;
            font-size: 9px;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        .row-even { background: #fafafa; }
        
        .badge {
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef9c3; color: #854d0e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
        }
        
        .text-right { text-align: right; }
        .text-bold { font-weight: bold; }
        .text-rose { color: #e11d48; }
        .text-emerald { color: #10b981; }
        .text-indigo { color: #6366f1; }
        
        .sub-table {
            background: #fcfcfc;
            font-size: 9px;
            margin-top: 5px;
            border: 1px solid #f1f5f9;
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header clearfix">
        <div class="logo-container">
            @if($app_logo && file_exists($app_logo))
                <img src="{{ $app_logo }}" class="logo">
            @endif
        </div>
        <div class="header-info">
            <h1>Laporan Keuangan</h1>
            <p><strong>Periode:</strong> {{ $period }}</p>
            <p><strong>Cabang:</strong> {{ $branch }}</p>
            <p><strong>Dicetak pada:</strong> {{ $report_date }}</p>
        </div>
    </div>

    <!-- Summary Stats -->
    <div class="section">
        <div class="section-title">Ringkasan Performa</div>
        <table class="summary-table">
            <tr>
                <td class="summary-card" style="width: 25%;">
                    <div class="summary-label">Pendapatan (Aktual)</div>
                    <div class="summary-value text-emerald">Rp {{ number_format($summary['revenue'], 0, ',', '.') }}</div>
                </td>
                <td class="summary-card" style="width: 25%;">
                    <div class="summary-label">Uang Pending</div>
                    <div class="summary-value text-rose">Rp {{ number_format($summary['pending_revenue'], 0, ',', '.') }}</div>
                </td>
                <td class="summary-card" style="width: 25%;">
                    <div class="summary-label">Pengeluaran</div>
                    <div class="summary-value text-rose">Rp {{ number_format($summary['expenses'], 0, ',', '.') }}</div>
                </td>
                <td class="summary-card" style="width: 25%;">
                    <div class="summary-label">Gaji Pokok Staff</div>
                    <div class="summary-value text-rose">Rp {{ number_format($summary['fixed_salaries'], 0, ',', '.') }}</div>
                </td>
            </tr>
            <tr>
                <td class="summary-card" style="background:#fff7ed; border-color:#fed7aa; width: 25%;">
                    <div class="summary-label" style="color:#9a3412;">Potongan Telat</div>
                    <div class="summary-value" style="color:#c2410c;">+Rp {{ number_format($summary['late_deductions'], 0, ',', '.') }}</div>
                    <div style="font-size:8px; color:#9a3412; margin-top:4px;">kembali ke perusahaan</div>
                </td>
                <td class="summary-card" style="width: 25%;">
                    <div class="summary-label">Total Komisi</div>
                    <div class="summary-value text-indigo">Rp {{ number_format($summary['commissions'], 0, ',', '.') }}</div>
                </td>
                <td class="summary-card profit" colspan="2" style="width: 50%;">
                    <div class="summary-label">Laba Bersih</div>
                    <div class="summary-value" style="font-size: 20px;">Rp {{ number_format($summary['profit'], 0, ',', '.') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table style="width: 100%; border: none; margin-bottom: 0;">
        <tr>
            <td style="width: 35%; padding: 0; border: none; vertical-align: top;">
                <div class="section">
                    <div class="section-title">Distribusi Pembayaran</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Metode</th>
                                <th class="text-right">Trx</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($payment_distribution as $item)
                            <tr>
                                <td class="text-bold" style="text-transform: uppercase; font-size: 9px;">{{ $item->payment_method }}</td>
                                <td class="text-right" style="font-size: 9px;">{{ $item->count }}</td>
                                <td class="text-right text-bold" style="white-space: nowrap; font-size: 9px;">Rp {{ number_format($item->total, 0, ',', '.') }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </td>
            <td style="width: 3%; border: none;"></td>
            <td style="width: 62%; padding: 0; border: none; vertical-align: top;">
                <!-- Staff Payroll -->
                <div class="section">
                    <div class="section-title">Daftar Gaji &amp; Komisi Pegawai</div>
                    <table style="font-size: 9px;">
                        <thead>
                            <tr>
                                <th>Nama Pegawai</th>
                                <th>Role</th>
                                <th class="text-right">Layanan</th>
                                <th class="text-right">Gaji Pokok</th>
                                <th class="text-right">Komisi</th>
                                <th class="text-right" style="color:#c2410c;">Pot. Telat</th>
                                <th class="text-right">Net Diterima</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($staff_payroll as $sp)
                            @php
                                $staff     = $sp['user'];
                                $barberData = $barber_commissions->where('barber_id', $staff->id)->first();
                                $services  = $barberData ? $barberData->total_services : 0;
                                $comm      = (float) $sp['total_commission'];
                                $deduction = (float) $sp['total_deduction'];
                                $salary    = (float) $staff->monthly_salary;
                                $net       = $salary + $comm - $deduction;
                            @endphp
                            <tr>
                                <td class="text-bold" style="white-space: nowrap;">{{ $staff->name }}</td>
                                <td style="text-transform: capitalize;">{{ $staff->role }}</td>
                                <td class="text-right">{{ $services > 0 ? $services.'x' : '—' }}</td>
                                <td class="text-right">Rp{{ number_format($salary, 0, ',', '.') }}</td>
                                <td class="text-right text-indigo">{{ $comm > 0 ? 'Rp'.number_format($comm, 0, ',', '.') : '—' }}</td>
                                <td class="text-right" style="color:#c2410c;">
                                    @if($deduction > 0)
                                        -Rp{{ number_format($deduction, 0, ',', '.') }}
                                        <div style="font-size:7px; color:#9a3412;">{{ $sp['late_count'] }}x &bull; {{ $sp['late_total_minutes'] }} mnt</div>
                                    @else
                                        <span style="color:#10b981;">—</span>
                                    @endif
                                </td>
                                <td class="text-right text-bold">Rp{{ number_format($net, 0, ',', '.') }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Shifts & Cash Log -->
    <div class="section">
        <div class="section-title">Riwayat Kas & Shift (Buka/Tutup Kas)</div>
        <table>
            <thead>
                <tr>
                    <th>Waktu Buka</th>
                    <th>Waktu Tutup</th>
                    <th>Kasir</th>
                    <th class="text-right">Saldo Awal</th>
                    <th class="text-right">Saldo Akhir</th>
                    <th class="text-right">Selisih</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($shifts as $shift)
                <tr>
                    <td>{{ $shift->opened_at->format('d/m/y H:i') }}</td>
                    <td>{{ $shift->closed_at ? $shift->closed_at->format('d/m/y H:i') : '-' }}</td>
                    <td class="text-bold">{{ $shift->user->name }}</td>
                    <td class="text-right">Rp {{ number_format($shift->opening_balance, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($shift->closing_balance, 0, ',', '.') }}</td>
                    <td class="text-right {{ $shift->difference < 0 ? 'text-rose' : '' }}">
                        Rp {{ number_format($shift->difference, 0, ',', '.') }}
                    </td>
                    <td>
                        <span class="badge {{ $shift->status === 'closed' ? 'badge-success' : 'badge-warning' }}">
                            {{ $shift->status }}
                        </span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div style="margin-top: 30px;"></div>

    <!-- Transaction Detail -->
    <div class="section">
        <div class="section-title">Log Transaksi Lengkap</div>
        <table>
            <thead>
                <tr>
                    <th width="12%">No. Trx</th>
                    <th width="12%">Waktu</th>
                    <th width="12%">Pelanggan</th>
                    <th width="32%">Item & Layanan</th>
                    <th width="12%">Status</th>
                    <th width="20%" class="text-right">Total Akhir</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transactions as $trx)
                <tr>
                    <td class="text-bold">{{ $trx->transaction_number }}</td>
                    <td>{{ $trx->created_at->format('d/m H:i') }}</td>
                    <td>{{ $trx->customer ? $trx->customer->name : 'Walk-in' }}</td>
                    <td>
                        <div style="font-size: 8px; color: #64748b;">
                            @foreach($trx->items as $item)
                                • {{ $item->item_name }} ({{ $item->quantity }}x) <br>
                            @endforeach
                        </div>
                    </td>
                    <td>
                        <span class="badge {{ $trx->status === 'completed' ? 'badge-success' : 'badge-warning' }}">
                            {{ $trx->status }}
                        </span>
                    </td>
                    <td class="text-right text-bold">Rp {{ number_format($trx->total_amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Expense Detail -->
    @if(count($expense_list) > 0)
    <div class="section">
        <div class="section-title">Detail Pengeluaran Operasional</div>
        <table>
            <thead>
                <tr>
                    <th width="20%">Tanggal</th>
                    <th width="40%">Alasan / Keperluan</th>
                    <th width="20%">Oleh</th>
                    <th width="20%" class="text-right">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                @foreach($expense_list as $expense)
                <tr>
                    <td>{{ $expense->created_at->format('d/m/y H:i') }}</td>
                    <td class="text-bold">{{ $expense->reason }}</td>
                    <td>{{ $expense->user->name }}</td>
                    <td class="text-right text-rose text-bold">Rp {{ number_format($expense->amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- ═══════════════════════════════════════════════════════════
         LAMPIRAN — Detail Keterlambatan Per Pegawai
         Satu kartu per pegawai, dimulai di halaman baru
    ═══════════════════════════════════════════════════════════ --}}
    @php $hasLateStaff = collect($staff_payroll)->contains(fn($sp) => count($sp['late_deduction_items']) > 0); @endphp
    @if($hasLateStaff)
    <div style="page-break-before: always;"></div>

    {{-- Lampiran Header --}}
    <div style="border-bottom: 3px solid #c2410c; padding-bottom: 14px; margin-bottom: 22px; overflow: hidden;">
        <div style="float:left;">
            <div style="font-size:9px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; color:#c2410c; margin-bottom:4px;">
                Lampiran Laporan Keuangan
            </div>
            <div style="font-size:18px; font-weight:900; color:#1e293b; text-transform:uppercase; letter-spacing:1px;">
                Detail Keterlambatan Staff
            </div>
        </div>
        <div style="float:right; text-align:right; font-size:9px; color:#64748b; padding-top:8px;">
            Periode: {{ $period }}<br>
            Cabang: {{ $branch }}
        </div>
    </div>

    @foreach($staff_payroll as $sp)
    @if(count($sp['late_deduction_items']) > 0)
    @php $st = $sp['user']; @endphp

    {{-- Employee Card --}}
    <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:20px; page-break-inside:avoid;">

        {{-- Card Header — tabel agar tidak terpotong di DomPDF --}}
        <table style="width:100%; border-collapse:collapse; background:#1e293b; color:#fff; margin-bottom:0;">
            <tr>
                <td style="padding:12px 16px; border:none; vertical-align:middle;">
                    <span style="font-size:14px; font-weight:900;">{{ $st->name }}</span>
                    <span style="background:#c2410c; color:#fff; padding:2px 9px; border-radius:10px; font-size:8px; font-weight:bold; text-transform:uppercase; margin-left:8px; vertical-align:middle;">
                        {{ $st->role }}
                    </span>
                </td>
                <td style="padding:12px 16px; border:none; text-align:right; font-size:8px; color:rgba(255,255,255,0.7); white-space:nowrap; vertical-align:middle;">
                    {{ $sp['late_count'] }} kejadian telat &bull; {{ $sp['late_total_minutes'] }} menit total
                </td>
            </tr>
        </table>

        {{-- Salary Strip — tabel agar tidak terpotong di DomPDF --}}
        <table style="width:100%; border-collapse:collapse; background:#f8fafc; border-bottom:1px solid #e2e8f0; margin-bottom:0;">
            <tr>
                <td style="padding:10px 12px; text-align:center; border:none; border-right:1px solid #e2e8f0; vertical-align:middle;">
                    <div style="font-size:7px; text-transform:uppercase; color:#94a3b8; font-weight:bold; margin-bottom:3px;">Gaji Pokok</div>
                    <div style="font-size:11px; font-weight:900; color:#1e293b;">Rp {{ number_format((float)$st->monthly_salary, 0, ',', '.') }}</div>
                </td>
                <td style="padding:10px 12px; text-align:center; border:none; border-right:1px solid #e2e8f0; vertical-align:middle;">
                    <div style="font-size:7px; text-transform:uppercase; color:#94a3b8; font-weight:bold; margin-bottom:3px;">Komisi</div>
                    <div style="font-size:11px; font-weight:900; color:#6366f1;">
                        {{ $sp['total_commission'] > 0 ? '+Rp '.number_format($sp['total_commission'], 0, ',', '.') : '—' }}
                    </div>
                </td>
                <td style="padding:10px 12px; text-align:center; border:none; border-right:1px solid #e2e8f0; vertical-align:middle;">
                    <div style="font-size:7px; text-transform:uppercase; color:#94a3b8; font-weight:bold; margin-bottom:3px;">Potongan Telat</div>
                    <div style="font-size:11px; font-weight:900; color:#c2410c;">-Rp {{ number_format((float)$sp['total_deduction'], 0, ',', '.') }}</div>
                </td>
                <td style="padding:10px 12px; text-align:center; border:none; vertical-align:middle;">
                    <div style="font-size:7px; text-transform:uppercase; color:#94a3b8; font-weight:bold; margin-bottom:3px;">Net Diterima</div>
                    <div style="font-size:11px; font-weight:900; color:#16a34a;">Rp {{ number_format((float)$sp['net_salary'], 0, ',', '.') }}</div>
                </td>
            </tr>
        </table>

        {{-- Late Detail Table --}}
        <table style="width:100%; border-collapse:collapse; font-size:9px;">
            <thead>
                <tr>
                    <th style="background:#fff1f2; color:#9f1239; padding:7px 12px; text-align:left; font-size:8px; text-transform:uppercase; border-bottom:1px solid #fecdd3; font-weight:bold;" width="22%">Tanggal</th>
                    <th style="background:#fff1f2; color:#9f1239; padding:7px 12px; text-align:left; font-size:8px; text-transform:uppercase; border-bottom:1px solid #fecdd3; font-weight:bold;" width="15%">Jam Masuk</th>
                    <th style="background:#fff1f2; color:#9f1239; padding:7px 12px; text-align:right; font-size:8px; text-transform:uppercase; border-bottom:1px solid #fecdd3; font-weight:bold;" width="18%">Menit Telat</th>
                    <th style="background:#fff1f2; color:#9f1239; padding:7px 12px; text-align:right; font-size:8px; text-transform:uppercase; border-bottom:1px solid #fecdd3; font-weight:bold;" width="18%">Interval</th>
                    <th style="background:#fff1f2; color:#9f1239; padding:7px 12px; text-align:right; font-size:8px; text-transform:uppercase; border-bottom:1px solid #fecdd3; font-weight:bold;" width="27%">Potongan</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sp['late_deduction_items'] as $idx => $item)
                <tr style="{{ $idx % 2 === 1 ? 'background:#fffafa;' : '' }}">
                    <td style="padding:7px 12px; border-bottom:1px solid #fff1f2;">{{ \Carbon\Carbon::parse($item['date'])->isoFormat('DD MMM YYYY') }}</td>
                    <td style="padding:7px 12px; border-bottom:1px solid #fff1f2; font-weight:bold;">{{ $item['clock_in'] ?? '—' }}</td>
                    <td style="padding:7px 12px; border-bottom:1px solid #fff1f2; text-align:right;">
                        <span style="background:#fff1f2; color:#9f1239; padding:2px 8px; border-radius:8px; font-size:8px; font-weight:bold;">
                            {{ $item['minutes'] }} mnt
                        </span>
                    </td>
                    <td style="padding:7px 12px; border-bottom:1px solid #fff1f2; text-align:right; color:#6366f1; font-weight:bold;">{{ $item['intervals'] }}×</td>
                    <td style="padding:7px 12px; border-bottom:1px solid #fff1f2; text-align:right; color:#c2410c; font-weight:bold;">
                        {{ $item['deduction'] > 0 ? '-Rp '.number_format($item['deduction'], 0, ',', '.') : '—' }}
                    </td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="padding:8px 12px; background:#fff1f2; font-weight:bold; color:#9f1239; border-top:2px solid #fecdd3; font-size:9px;">
                        Total: {{ $sp['late_count'] }} kejadian &bull; {{ $sp['late_total_minutes'] }} menit
                    </td>
                    <td style="padding:8px 12px; background:#fff1f2; text-align:right; color:#6366f1; font-weight:bold; border-top:2px solid #fecdd3;">
                        {{ collect($sp['late_deduction_items'])->sum('intervals') }}×
                    </td>
                    <td style="padding:8px 12px; background:#fff1f2; text-align:right; color:#c2410c; font-weight:bold; border-top:2px solid #fecdd3; font-size:10px;">
                        -Rp {{ number_format((float)$sp['total_deduction'], 0, ',', '.') }}
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
    @endif
    @endforeach
    @endif

    <div class="footer">
        <p>Laporan ini merupakan dokumen resmi yang digenerate oleh sistem Roxy POS.</p>
        <p>&copy; {{ date('Y') }} {{ $app_name }}. Dokumen Rahasia.</p>
    </div>
</body>
</html>
