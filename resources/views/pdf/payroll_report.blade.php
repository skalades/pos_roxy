<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Payroll - {{ $period_label }}</title>
    <style>
        @page { margin: 35px 40px; }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1e293b;
            font-size: 10px;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }

        /* ── HEADER ── */
        .header {
            border-bottom: 3px solid #6366f1;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }
        .clearfix::after { content: ""; clear: both; display: table; }
        .logo-container { float: left; width: 20%; }
        .logo { width: 60px; height: 60px; object-fit: contain; }
        .header-info { float: right; width: 78%; text-align: right; }
        .header-info h1 {
            margin: 0 0 4px 0;
            color: #6366f1;
            font-size: 22px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .header-info p { margin: 2px 0; color: #64748b; font-size: 10px; }
        .header-info .branch-badge {
            display: inline-block;
            background: #6366f1;
            color: #fff;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        /* ── SECTION ── */
        .section { margin-bottom: 28px; }
        .section-title {
            background: #1e293b;
            color: #fff;
            padding: 7px 14px;
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 4px;
        }
        .section-title span {
            float: right;
            background: #6366f1;
            padding: 1px 8px;
            border-radius: 10px;
            font-size: 8px;
        }

        /* ── SUMMARY TABLE (Halaman 1) ── */
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }
        .summary-table thead tr {
            background: #f1f5f9;
        }
        .summary-table th {
            padding: 9px 10px;
            text-align: left;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
            letter-spacing: 0.5px;
        }
        .summary-table td {
            padding: 9px 10px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
            font-size: 9px;
        }
        .summary-table tr:nth-child(even) td { background: #fafafa; }
        .summary-table tr:last-child td { border-bottom: none; }
        .summary-table .name-cell { font-weight: bold; font-size: 10px; color: #0f172a; }
        .summary-table .role-cell {
            text-transform: capitalize;
            color: #64748b;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .summary-table .money { text-align: right; font-weight: bold; white-space: nowrap; }
        .summary-table .money-commission { color: #6366f1; text-align: right; white-space: nowrap; }
        .summary-table .money-deduction { color: #c2410c; text-align: right; white-space: nowrap; }
        .summary-table .money-net { color: #0f172a; text-align: right; font-weight: bold; font-size: 11px; white-space: nowrap; }
        .late-badge {
            display: inline-block;
            background: #fff1f2;
            color: #9f1239;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 7px;
            font-weight: bold;
            white-space: nowrap;
        }
        .ok-badge {
            display: inline-block;
            background: #f0fdf4;
            color: #166534;
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 7px;
            font-weight: bold;
        }

        /* ── GRAND TOTAL BAR ── */
        .grand-total {
            background: #6366f1;
            color: #fff;
            padding: 14px 20px;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 28px;
        }
        .grand-total-label {
            float: left;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.85;
            padding-top: 4px;
        }
        .grand-total-value {
            float: right;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -1px;
        }

        /* ── PAGE BREAK ── */
        .page-break { page-break-before: always; }

        /* ── EMPLOYEE DETAIL CARD ── */
        .emp-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 24px;
            page-break-inside: avoid;
        }
        .emp-card-header {
            background: #1e293b;
            color: #fff;
            padding: 0;
        }
        .emp-card-header table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }
        .emp-card-header td {
            padding: 12px 16px;
            border: none;
            vertical-align: middle;
        }
        .emp-name {
            font-size: 14px;
            font-weight: 900;
        }
        .emp-meta {
            text-align: right;
            font-size: 8px;
            opacity: 0.75;
            white-space: nowrap;
        }
        .emp-role-badge {
            display: inline-block;
            background: #6366f1;
            color: #fff;
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            margin-left: 10px;
            vertical-align: middle;
        }

        /* salary breakdown row */
        .salary-strip {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }
        .salary-strip table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }
        .salary-strip td {
            padding: 10px 8px;
            text-align: center;
            border: none;
            border-right: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        .salary-strip td:last-child {
            border-right: none;
        }
        .salary-item-label {
            font-size: 7px;
            text-transform: uppercase;
            color: #94a3b8;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }
        .salary-item-value {
            font-size: 12px;
            font-weight: 900;
            color: #0f172a;
        }
        .salary-item-value.green  { color: #16a34a; }
        .salary-item-value.red    { color: #c2410c; }
        .salary-item-value.indigo { color: #6366f1; }

        /* late detail table inside card */
        .late-table {
            width: 100%;
            border-collapse: collapse;
        }
        .late-table th {
            background: #fff1f2;
            color: #9f1239;
            padding: 7px 12px;
            font-size: 8px;
            text-transform: uppercase;
            font-weight: bold;
            border-bottom: 1px solid #fecdd3;
            letter-spacing: 0.5px;
        }
        .late-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #fff1f2;
            font-size: 9px;
            vertical-align: middle;
        }
        .late-table tr:last-child td { border-bottom: none; }
        .late-table tr:nth-child(even) td { background: #fffafa; }
        .late-table .tr { text-align: right; }
        .late-table .deduction-val { color: #c2410c; font-weight: bold; text-align: right; }
        .late-table .interval-val  { color: #6366f1; font-weight: bold; text-align: right; }
        .late-table tfoot td {
            background: #fff1f2;
            font-weight: bold;
            color: #9f1239;
            border-top: 2px solid #fecdd3;
            padding: 8px 12px;
        }

        /* no-late box */
        .no-late-box {
            background: #f0fdf4;
            border: 1px dashed #bbf7d0;
            color: #166534;
            text-align: center;
            padding: 14px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* footer */
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #94a3b8;
            font-size: 9px;
            border-top: 1px solid #f1f5f9;
            padding-top: 16px;
        }
    </style>
</head>
<body>

    {{-- ═══════════════════════════════════════════════════════════
         HEADER
    ═══════════════════════════════════════════════════════════ --}}
    <div class="header clearfix">
        <div class="logo-container">
            @if($app_logo && file_exists($app_logo))
                <img src="{{ $app_logo }}" class="logo">
            @endif
        </div>
        <div class="header-info">
            <div class="branch-badge">{{ $branch_name }}</div>
            <h1>Laporan Payroll</h1>
            <p><strong>Periode:</strong> {{ $period_label }}</p>
            <p><strong>Dicetak pada:</strong> {{ $report_date }}</p>
        </div>
    </div>

    {{-- ═══════════════════════════════════════════════════════════
         HALAMAN 1 — RINGKASAN GAJI SELURUH PEGAWAI
    ═══════════════════════════════════════════════════════════ --}}
    <div class="section">
        <div class="section-title">
            Ringkasan Gaji Seluruh Pegawai
            <span>{{ count($payroll_data) }} pegawai</span>
        </div>
        <table class="summary-table">
            <thead>
                <tr>
                    <th width="22%">Nama Pegawai</th>
                    <th width="10%">Role</th>
                    <th width="15%" style="text-align:right;">Gaji Pokok</th>
                    <th width="13%" style="text-align:right;">Komisi</th>
                    <th width="13%" style="text-align:right; color:#c2410c;">Pot. Telat</th>
                    <th width="12%" style="text-align:center;">Keterlambatan</th>
                    <th width="15%" style="text-align:right;">Net Diterima</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payroll_data as $data)
                <tr>
                    <td class="name-cell">{{ $data['user']->name }}</td>
                    <td class="role-cell">{{ $data['user']->role }}</td>
                    <td class="money">Rp {{ number_format($data['base_salary'], 0, ',', '.') }}</td>
                    <td class="money-commission">
                        {{ $data['total_commission'] > 0 ? 'Rp '.number_format($data['total_commission'], 0, ',', '.') : '—' }}
                    </td>
                    <td class="money-deduction">
                        @if($data['total_deduction'] > 0)
                            -Rp {{ number_format($data['total_deduction'], 0, ',', '.') }}
                        @else
                            <span style="color:#16a34a;">—</span>
                        @endif
                    </td>
                    <td style="text-align:center;">
                        @if($data['late_count'] > 0)
                            <span class="late-badge">{{ $data['late_count'] }}x &bull; {{ $data['late_total_minutes'] ?? 0 }} mnt</span>
                        @else
                            <span class="ok-badge">Tepat Waktu</span>
                        @endif
                    </td>
                    <td class="money-net">Rp {{ number_format($data['net_salary'], 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{-- Grand Total --}}
    <div class="grand-total clearfix">
        <div class="grand-total-label">Total Pengeluaran Payroll Periode Ini</div>
        <div class="grand-total-value">Rp {{ number_format($total_net_payroll, 0, ',', '.') }}</div>
    </div>

    {{-- ═══════════════════════════════════════════════════════════
         HALAMAN 2+ — DETAIL PER PEGAWAI
         Setiap pegawai mendapat kartu rincian sendiri, dimulai
         dengan page-break setelah halaman ringkasan.
    ═══════════════════════════════════════════════════════════ --}}
    @php $firstDetail = true; @endphp
    @foreach($payroll_data as $data)
    @if($firstDetail)
        <div class="page-break"></div>
        @php $firstDetail = false; @endphp

        {{-- Sub-header halaman detail --}}
        <div style="margin-bottom:20px; border-bottom:2px solid #e2e8f0; padding-bottom:12px;">
            <span style="font-size:13px; font-weight:900; color:#1e293b; text-transform:uppercase; letter-spacing:1px;">
                Lampiran — Detail Keterlambatan &amp; Gaji
            </span>
            <span style="float:right; font-size:9px; color:#94a3b8;">{{ $period_label }} &bull; {{ $branch_name }}</span>
        </div>
    @endif

    <div class="emp-card">
        {{-- Card Header — tabel agar tidak terpotong di DomPDF --}}
        <div class="emp-card-header">
            <table>
                <tr>
                    <td>
                        <span class="emp-name">{{ $data['user']->name }}</span>
                        <span class="emp-role-badge">{{ $data['user']->role }}</span>
                    </td>
                    <td class="emp-meta">
                        {{ $data['user']->branch->name ?? $branch_name }}<br>
                        Periode: {{ $period_label }}
                    </td>
                </tr>
            </table>
        </div>

        {{-- Salary Strip — tabel agar tidak terpotong di DomPDF --}}
        <div class="salary-strip">
            <table>
                <tr>
                    <td>
                        <div class="salary-item-label">Gaji Pokok</div>
                        <div class="salary-item-value">Rp {{ number_format($data['base_salary'], 0, ',', '.') }}</div>
                    </td>
                    <td>
                        <div class="salary-item-label">Komisi</div>
                        <div class="salary-item-value indigo">
                            {{ $data['total_commission'] > 0 ? '+Rp '.number_format($data['total_commission'], 0, ',', '.') : '—' }}
                        </div>
                    </td>
                    <td>
                        <div class="salary-item-label">Potongan Telat</div>
                        <div class="salary-item-value red">
                            @if($data['total_deduction'] > 0)
                                -Rp {{ number_format($data['total_deduction'], 0, ',', '.') }}
                            @else
                                —
                            @endif
                        </div>
                    </td>
                    <td>
                        <div class="salary-item-label">Total Diterima</div>
                        <div class="salary-item-value green">Rp {{ number_format($data['net_salary'], 0, ',', '.') }}</div>
                    </td>
                </tr>
            </table>
        </div>

        {{-- Late Detail Table --}}
        @if(!empty($data['late_deduction_items']) && count($data['late_deduction_items']) > 0)
        <table class="late-table">
            <thead>
                <tr>
                    <th width="22%">Tanggal</th>
                    <th width="16%">Jam Masuk</th>
                    <th width="18%" style="text-align:right;">Menit Telat</th>
                    <th width="18%" style="text-align:right;">Interval</th>
                    <th width="26%" style="text-align:right;">Potongan</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['late_deduction_items'] as $item)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($item['date'])->isoFormat('DD MMMM YYYY') }}</td>
                    <td><strong>{{ $item['clock_in'] ?? '—' }}</strong></td>
                    <td style="text-align:right;">
                        <span style="background:#fff1f2; color:#9f1239; padding:2px 7px; border-radius:8px; font-size:8px; font-weight:bold;">
                            {{ $item['minutes'] }} mnt
                        </span>
                    </td>
                    <td class="interval-val">{{ $item['intervals'] }}×</td>
                    <td class="deduction-val">
                        {{ $item['deduction'] > 0 ? '-Rp '.number_format($item['deduction'], 0, ',', '.') : '—' }}
                    </td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3">Total: {{ $data['late_count'] }} kejadian &bull; {{ $data['late_total_minutes'] ?? 0 }} menit</td>
                    <td style="text-align:right;">{{ collect($data['late_deduction_items'])->sum('intervals') }}×</td>
                    <td style="text-align:right; color:#c2410c;">-Rp {{ number_format($data['total_deduction'], 0, ',', '.') }}</td>
                </tr>
            </tfoot>
        </table>
        @else
        <div class="no-late-box">&#10003; Tidak ada keterlambatan pada periode ini — Tepat Waktu!</div>
        @endif
    </div>
    @endforeach

    {{-- ═══════════════ FOOTER ═══════════════ --}}
    <div class="footer">
        <p>Laporan ini merupakan dokumen resmi yang digenerate oleh sistem {{ $app_name }}.</p>
        <p>&copy; {{ date('Y') }} {{ $app_name }}. Dokumen Rahasia &bull; Dicetak: {{ $report_date }}</p>
    </div>
</body>
</html>
