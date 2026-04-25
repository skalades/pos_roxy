<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan - {{ $period }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        .header {
            padding: 20px 0;
            border-bottom: 2px solid #f1f5f9;
            margin-bottom: 30px;
        }
        .logo {
            float: left;
            width: 60px;
            height: 60px;
        }
        .company-info {
            float: left;
            margin-left: 15px;
        }
        .report-title {
            float: right;
            text-align: right;
        }
        .report-title h1 {
            margin: 0;
            font-size: 24px;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .report-title p {
            margin: 5px 0 0;
            color: #64748b;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #334155;
            margin-bottom: 15px;
            text-transform: uppercase;
            border-left: 4px solid #4f46e5;
            padding-left: 10px;
        }
        .stats-grid {
            width: 100%;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 10px;
            width: 23%;
            float: left;
            margin-right: 2%;
        }
        .stat-card:last-child {
            margin-right: 0;
            background: #4f46e5;
            color: white;
        }
        .stat-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        .stat-value {
            font-size: 16px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f1f5f9;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border-bottom: 1px solid #e2e8f0;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #f1f5f9;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
        }
        .text-right { text-align: right; }
        .text-rose { color: #e11d48; }
        .text-indigo { color: #4f46e5; }
        .bg-indigo { background-color: #4f46e5; color: white; }
    </style>
</head>
<body>
    <div class="header clearfix">
        <div class="company-info">
            @if($app_logo)
                <img src="{{ public_path($app_logo) }}" class="logo">
            @endif
            <div style="float: left; margin-left: 10px;">
                <h2 style="margin: 0; font-size: 18px;">{{ $app_name }}</h2>
                <p style="margin: 2px 0; color: #64748b;">{{ $branch }}</p>
            </div>
        </div>
        <div class="report-title">
            <h1>LAPORAN KEUANGAN</h1>
            <p>Periode: {{ $period }}</p>
        </div>
    </div>

    <div class="section">
        <div class="stats-grid clearfix">
            <div class="stat-card">
                <div class="stat-label">Pendapatan</div>
                <div class="stat-value">Rp {{ number_format($summary['revenue'], 0, ',', '.') }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Pengeluaran</div>
                <div class="stat-value">Rp {{ number_format($summary['expenses'], 0, ',', '.') }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Komisi</div>
                <div class="stat-value">Rp {{ number_format($summary['commissions'], 0, ',', '.') }}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label" style="color: rgba(255,255,255,0.7)">Laba Bersih</div>
                <div class="stat-value">Rp {{ number_format($summary['profit'], 0, ',', '.') }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Metode Pembayaran</div>
        <table>
            <thead>
                <tr>
                    <th>Metode</th>
                    <th class="text-right">Total Transaksi</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payment_distribution as $item)
                <tr>
                    <td style="text-transform: uppercase;">{{ $item->payment_method }}</td>
                    <td class="text-right">Rp {{ number_format($item->total, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    @if(count($expense_list) > 0)
    <div class="section">
        <div class="section-title">Detail Pengeluaran</div>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Alasan</th>
                    <th>Oleh</th>
                    <th class="text-right">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                @foreach($expense_list as $expense)
                <tr>
                    <td>{{ $expense->created_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $expense->reason }}</td>
                    <td>{{ $expense->user->name }}</td>
                    <td class="text-right text-rose">Rp {{ number_format($expense->amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <th colspan="3" class="text-right">TOTAL PENGELUARAN</th>
                    <th class="text-right">Rp {{ number_format($summary['expenses'], 0, ',', '.') }}</th>
                </tr>
            </tfoot>
        </table>
    </div>
    @endif

    <div class="footer">
        <p>Laporan digenerate secara otomatis pada {{ $report_date }}</p>
        <p>&copy; {{ date('Y') }} {{ $app_name }}. All rights reserved.</p>
    </div>
</body>
</html>
