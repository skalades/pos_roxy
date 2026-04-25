<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Payroll - {{ $period_label }}</title>
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
            margin-bottom: 30px;
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
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
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
            padding: 12px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        
        .text-right { text-align: right; }
        .text-bold { font-weight: bold; }
        .text-rose { color: #e11d48; }
        .text-emerald { color: #10b981; }
        .text-indigo { color: #6366f1; }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
        }
        
        .summary-total {
            background: #f8fafc;
            padding: 15px;
            border-radius: 12px;
            text-align: right;
            border: 1px solid #e2e8f0;
        }
        .summary-total h2 {
            margin: 0;
            color: #1e293b;
            font-size: 18px;
        }
        .summary-total p {
            margin: 0;
            color: #64748b;
            font-weight: bold;
        }

        .badge {
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="header clearfix">
        <div class="logo-container">
            @if($app_logo && file_exists(public_path($app_logo)))
                <img src="{{ public_path($app_logo) }}" class="logo">
            @endif
        </div>
        <div class="header-info">
            <h1>Laporan Payroll</h1>
            <p><strong>Periode:</strong> {{ $period_label }}</p>
            <p><strong>Cabang:</strong> {{ $branch_name }}</p>
            <p><strong>Dicetak pada:</strong> {{ $report_date }}</p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Rincian Pembayaran Gaji Pegawai</div>
        <table>
            <thead>
                <tr>
                    <th width="20%">Nama Pegawai</th>
                    <th width="10%">Role</th>
                    <th width="15%" class="text-right">Gaji Pokok</th>
                    <th width="15%" class="text-right">Komisi</th>
                    <th width="15%" class="text-right">Potongan (Telat)</th>
                    <th width="25%" class="text-right">Total Diterima</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payroll_data as $data)
                <tr>
                    <td class="text-bold">{{ $data['user']->name }}</td>
                    <td style="text-transform: capitalize;">{{ $data['user']->role }}</td>
                    <td class="text-right">Rp {{ number_format($data['base_salary'], 0, ',', '.') }}</td>
                    <td class="text-right text-indigo">Rp {{ number_format($data['total_commission'], 0, ',', '.') }}</td>
                    <td class="text-right text-rose">
                        @if($data['total_deduction'] > 0)
                            - Rp {{ number_format($data['total_deduction'], 0, ',', '.') }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="text-right text-bold">
                        <div style="font-size: 12px;">Rp {{ number_format($data['net_salary'], 0, ',', '.') }}</div>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="summary-total">
        <p>TOTAL PENGELUARAN PAYROLL</p>
        <h2>Rp {{ number_format($total_net_payroll, 0, ',', '.') }}</h2>
    </div>

    <div class="footer">
        <p>Laporan ini merupakan dokumen resmi yang digenerate oleh sistem Roxy POS.</p>
        <p>&copy; {{ date('Y') }} {{ $app_name }}. Dokumen Rahasia.</p>
    </div>
</body>
</html>
