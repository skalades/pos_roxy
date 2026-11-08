import React, { useState, useMemo } from 'react';
import Modal from '@/Components/Modal';
import { 
    Calendar, 
    Download, 
    Archive, 
    FileText, 
    Check, 
    X, 
    Building2, 
    Sparkles, 
    CheckSquare, 
    Square, 
    RotateCcw,
    Layers,
    Info,
    ArrowDownToLine,
    Loader2
} from 'lucide-react';

const MONTH_DEFINITIONS = [
    { num: 1, name: 'Januari', short: 'Jan' },
    { num: 2, name: 'Februari', short: 'Feb' },
    { num: 3, name: 'Maret', short: 'Mar' },
    { num: 4, name: 'April', short: 'Apr' },
    { num: 5, name: 'Mei', short: 'Mei' },
    { num: 6, name: 'Juni', short: 'Jun' },
    { num: 7, name: 'Juli', short: 'Jul' },
    { num: 8, name: 'Agustus', short: 'Ags' },
    { num: 9, name: 'September', short: 'Sep' },
    { num: 10, name: 'Oktober', short: 'Okt' },
    { num: 11, name: 'November', short: 'Nov' },
    { num: 12, name: 'Desember', short: 'Des' },
];

export default function MonthExportModal({
    show,
    onClose,
    branches = [],
    isAdmin = false,
    defaultBranchId = '',
}) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonths, setSelectedMonths] = useState([1, 2, 3, 4]); // Default 4 bulan seperti contoh request user
    const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId || '');
    const [downloadMode, setDownloadMode] = useState('zip'); // 'zip' or 'individual'
    const [isExporting, setIsExporting] = useState(false);

    // List of available years (current - 3 to current + 1)
    const availableYears = useMemo(() => {
        const years = [];
        for (let y = currentYear - 3; y <= currentYear + 1; y++) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    // Selected branch object for filename preview
    const selectedBranch = useMemo(() => {
        if (!selectedBranchId) return null;
        return branches.find(b => String(b.id) === String(selectedBranchId)) || null;
    }, [branches, selectedBranchId]);

    // Toggle a single month checkbox
    const toggleMonth = (monthNum) => {
        setSelectedMonths(prev => {
            if (prev.includes(monthNum)) {
                return prev.filter(m => m !== monthNum);
            } else {
                return [...prev, monthNum].sort((a, b) => a - b);
            }
        });
    };

    // Preset selections
    const selectAll = () => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const clearAll = () => setSelectedMonths([]);
    const selectQuarter = (q) => {
        const quarters = {
            1: [1, 2, 3],
            2: [4, 5, 6],
            3: [7, 8, 9],
            4: [10, 11, 12],
        };
        setSelectedMonths(quarters[q] || []);
    };
    const selectSemester = (s) => {
        if (s === 1) setSelectedMonths([1, 2, 3, 4, 5, 6]);
        if (s === 2) setSelectedMonths([7, 8, 9, 10, 11, 12]);
    };

    // File name generator helper for preview & download
    const getMonthFileName = (monthNum) => {
        const def = MONTH_DEFINITIONS.find(m => m.num === monthNum);
        const monthName = def ? def.name : `Bulan_${monthNum}`;
        const branchSuffix = selectedBranch ? `_${selectedBranch.name.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
        return `Laporan_Keuangan_${monthName}_${selectedYear}${branchSuffix}.pdf`;
    };

    // Build URL helper
    const buildExportUrl = (months) => {
        const params = new URLSearchParams();
        params.append('year', selectedYear);
        months.forEach(m => params.append('months[]', m));
        if (selectedBranchId) {
            params.append('branch_id', selectedBranchId);
        }
        return route('reports.finance.export_months') + '?' + params.toString();
    };

    // Direct download for a single month without batch export
    const handleDownloadSingleMonth = (e, monthNum) => {
        e.stopPropagation();
        const url = buildExportUrl([monthNum]);
        window.location.href = url;
    };

    // Trigger batch export
    const handleExport = () => {
        if (selectedMonths.length === 0) return;

        setIsExporting(true);

        if (selectedMonths.length === 1 || downloadMode === 'zip') {
            // Single PDF or bundled ZIP download
            const url = buildExportUrl(selectedMonths);
            window.location.href = url;
            setTimeout(() => {
                setIsExporting(false);
                onClose();
            }, 1200);
        } else {
            // Individual downloads sequentially (staggered to avoid browser popup blockers)
            selectedMonths.forEach((monthNum, index) => {
                setTimeout(() => {
                    const downloadLink = document.createElement('a');
                    downloadLink.href = buildExportUrl([monthNum]);
                    downloadLink.setAttribute('download', getMonthFileName(monthNum));
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    if (index === selectedMonths.length - 1) {
                        setIsExporting(false);
                        onClose();
                    }
                }, index * 700);
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl shadow-md shadow-indigo-100">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                Export Laporan Bulanan
                            </h2>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                Checklist bulan yang diinginkan untuk generate laporan keuangan per bulan
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters (Tahun & Cabang) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                            Pilih Tahun
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isAdmin ? (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                                Cabang
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Semua Cabang</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center text-xs font-bold text-slate-500 pt-6 px-1">
                            <Building2 size={16} className="mr-2 text-indigo-500" />
                            Cabang Terkunci (Sesuai Hak Akses Akun)
                        </div>
                    )}
                </div>

                {/* Preset Quick Select Toolbar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Pilihan Cepat
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                            {selectedMonths.length} bulan terpilih
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Semua Bulan
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedMonths([1, 2, 3, 4])}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Jan - Apr
                        </button>
                        <button
                            type="button"
                            onClick={() => selectQuarter(1)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Q1 (Jan-Mar)
                        </button>
                        <button
                            type="button"
                            onClick={() => selectQuarter(2)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Q2 (Apr-Jun)
                        </button>
                        <button
                            type="button"
                            onClick={() => selectQuarter(3)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Q3 (Jul-Sep)
                        </button>
                        <button
                            type="button"
                            onClick={() => selectQuarter(4)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Q4 (Okt-Des)
                        </button>
                        <button
                            type="button"
                            onClick={() => selectSemester(1)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Semester 1
                        </button>
                        <button
                            type="button"
                            onClick={() => selectSemester(2)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        >
                            Semester 2
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors flex items-center gap-1"
                        >
                            <RotateCcw size={12} />
                            Reset
                        </button>
                    </div>
                </div>

                {/* 12 Months Interactive Grid Checklist */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 px-1">
                        Checklist Bulan yang Diexport
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {MONTH_DEFINITIONS.map((m) => {
                            const isChecked = selectedMonths.includes(m.num);
                            return (
                                <div
                                    key={m.num}
                                    onClick={() => toggleMonth(m.num)}
                                    className={`relative p-3 rounded-2xl cursor-pointer transition-all duration-200 border text-left group select-none ${
                                        isChecked
                                            ? 'bg-indigo-50/80 border-indigo-500 shadow-sm shadow-indigo-100/50'
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1 mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                                isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                                            }`}>
                                                {isChecked && <Check size={14} className="stroke-[3]" />}
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${
                                                isChecked ? 'text-indigo-600' : 'text-slate-400'
                                            }`}>
                                                {String(m.num).padStart(2, '0')}
                                            </span>
                                        </div>

                                        {/* Quick instant download button for this single month */}
                                        <button
                                            type="button"
                                            title={`Download Laporan ${m.name} ${selectedYear} langsung`}
                                            onClick={(e) => handleDownloadSingleMonth(e, m.num)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/60 rounded-md transition-all"
                                        >
                                            <ArrowDownToLine size={13} />
                                        </button>
                                    </div>

                                    <div className="mt-1">
                                        <h4 className={`text-sm font-black transition-colors ${
                                            isChecked ? 'text-indigo-950' : 'text-slate-800'
                                        }`}>
                                            {m.name}
                                        </h4>
                                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                            {selectedYear}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Preview Box: Generated File Names & Mode */}
                {selectedMonths.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <FileText size={15} className="text-indigo-600" />
                                Penamaan File yang Dihasilkan:
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                                {selectedMonths.length} File PDF
                            </span>
                        </div>

                        {/* File preview tags */}
                        <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                            {selectedMonths.map(m => (
                                <div key={m} className="flex items-center gap-2 text-xs font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-slate-600 shadow-2xs">
                                    <FileText size={13} className="text-indigo-500 shrink-0" />
                                    <span className="truncate">{getMonthFileName(m)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Format Mode Selector (only when multiple months) */}
                        {selectedMonths.length > 1 && (
                            <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-500">
                                    Metode Pengunduhan:
                                </span>
                                <div className="flex items-center gap-2">
                                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                        downloadMode === 'zip' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="downloadMode"
                                            value="zip"
                                            checked={downloadMode === 'zip'}
                                            onChange={() => setDownloadMode('zip')}
                                            className="sr-only"
                                        />
                                        <Archive size={13} />
                                        Arsip ZIP (Rekomendasi)
                                    </label>
                                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                        downloadMode === 'individual' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="downloadMode"
                                            value="individual"
                                            checked={downloadMode === 'individual'}
                                            onChange={() => setDownloadMode('individual')}
                                            className="sr-only"
                                        />
                                        <Download size={13} />
                                        Unduh Satu Per Satu
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                        Tutup
                    </button>
                    <button
                        type="button"
                        disabled={selectedMonths.length === 0 || isExporting}
                        onClick={handleExport}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg ${
                            selectedMonths.length === 0 || isExporting
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200 active:scale-95'
                        }`}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Menyiapkan Laporan...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                {selectedMonths.length === 0 
                                    ? 'Pilih Minimal 1 Bulan' 
                                    : selectedMonths.length === 1 
                                        ? `Export Laporan (${MONTH_DEFINITIONS.find(m => m.num === selectedMonths[0])?.name})`
                                        : `Export ${selectedMonths.length} Laporan Bulan Terpilih`
                                }
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
