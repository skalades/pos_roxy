import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import {
    Database,
    HardDrive,
    Server,
    Archive,
    Download,
    Upload,
    RotateCcw,
    Trash2,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    Clock,
    FileText,
    FileArchive,
    Layers,
    Info,
    RefreshCw,
    Check,
    X,
    FileUp,
    Calendar,
    GitMerge,
    AlertCircle
} from 'lucide-react';

const MONTHS = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

export default function BackupIndex({ stats = {}, backups = [] }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push(y);
    }

    // ── Backup Form State ──
    const [backupType, setBackupType] = useState('database'); // 'database' | 'full'
    const [periodMode, setPeriodMode] = useState('all'); // 'all' | 'custom'
    const [startYear, setStartYear] = useState(currentYear);
    const [startMonth, setStartMonth] = useState(1);
    const [endYear, setEndYear] = useState(currentYear);
    const [endMonth, setEndMonth] = useState(Math.max(1, currentMonth - 2)); // default misal September jika bulan berjalan November
    const [downloadDirect, setDownloadDirect] = useState(false);
    const [backupNotes, setBackupNotes] = useState('');
    const [creatingBackup, setCreatingBackup] = useState(false);

    // ── Upload Restore Form State ──
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadRestoreMode, setUploadRestoreMode] = useState('merge'); // 'merge' | 'overwrite'
    const [uploadConfirmText, setUploadConfirmText] = useState('');
    const [restoringUpload, setRestoringUpload] = useState(false);
    const fileInputRef = useRef(null);

    // ── Server Backup Restore Modal State ──
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [selectedServerBackup, setSelectedServerBackup] = useState(null);
    const [serverRestoreMode, setServerRestoreMode] = useState('merge'); // 'merge' | 'overwrite'
    const [serverConfirmText, setServerConfirmText] = useState('');
    const [restoringServer, setRestoringServer] = useState(false);

    // ── Delete Backup Modal State ──
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [backupToDelete, setBackupToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ── Create Backup Handler ──
    const handleCreateBackup = (e) => {
        e.preventDefault();
        setCreatingBackup(true);

        const payload = {
            include_files: backupType === 'full',
            download_direct: downloadDirect,
            period_mode: periodMode,
            start_year: parseInt(startYear),
            start_month: parseInt(startMonth),
            end_year: parseInt(endYear),
            end_month: parseInt(endMonth),
            notes: backupNotes,
        };

        if (downloadDirect) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/backup/create';

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = '_token';
                csrfInput.value = csrfToken;
                form.appendChild(csrfInput);
            }

            Object.keys(payload).forEach((key) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = payload[key] === true ? '1' : payload[key] === false ? '0' : payload[key] || '';
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            setTimeout(() => {
                setCreatingBackup(false);
            }, 3000);
        } else {
            router.post('/backup/create', payload, {
                onFinish: () => {
                    setCreatingBackup(false);
                    setBackupNotes('');
                },
            });
        }
    };

    // ── File Selection Handler ──
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setUploadedFile(e.dataTransfer.files[0]);
        }
    };

    // ── Execute Restore from Upload ──
    const handleRestoreUpload = (e) => {
        e.preventDefault();
        if (!uploadedFile || uploadConfirmText.trim().toUpperCase() !== 'RESTORE') {
            return;
        }

        setRestoringUpload(true);
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('restore_mode', uploadRestoreMode);
        formData.append('confirmation', uploadConfirmText);

        router.post('/backup/restore', formData, {
            onFinish: () => {
                setRestoringUpload(false);
                setUploadedFile(null);
                setUploadConfirmText('');
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    // ── Execute Restore from Server File ──
    const handleRestoreServerFile = (e) => {
        e.preventDefault();
        if (!selectedServerBackup || serverConfirmText.trim().toUpperCase() !== 'RESTORE') {
            return;
        }

        setRestoringServer(true);
        router.post(
            '/backup/restore',
            {
                server_file: selectedServerBackup.filename,
                restore_mode: serverRestoreMode,
                confirmation: serverConfirmText,
            },
            {
                onFinish: () => {
                    setRestoringServer(false);
                    setRestoreModalOpen(false);
                    setSelectedServerBackup(null);
                    setServerConfirmText('');
                },
            }
        );
    };

    // ── Execute Delete Backup ──
    const handleDeleteBackup = () => {
        if (!backupToDelete) return;
        setDeleting(true);

        router.delete(`/backup/${encodeURIComponent(backupToDelete.filename)}`, {
            onFinish: () => {
                setDeleting(false);
                setDeleteModalOpen(false);
                setBackupToDelete(null);
            },
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
    };

    const startMonthLabel = MONTHS.find((m) => m.value === parseInt(startMonth))?.label || startMonth;
    const endMonthLabel = MONTHS.find((m) => m.value === parseInt(endMonth))?.label || endMonth;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Backup & Restore Sistem"
                    subtitle="Cadangkan database dan file aset, atau pulihkan data kapan saja via upload"
                    backHref="/dashboard"
                    badge="SUPER ADMIN"
                    badgeColor="indigo"
                    showClock={true}
                />
            }
        >
            <Head title="Backup & Restore Database" />

            <div className="space-y-8 max-w-7xl mx-auto pb-16">
                {/* ── System Storage & Health Overview Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Database Stat */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Database Aktif
                            </span>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                <Database size={20} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.database?.formatted_size || '0 MB'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                ({stats.database?.tables_count || 0} tabel)
                            </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-2 truncate">
                            Driver: <span className="uppercase text-indigo-600 font-black">{stats.database?.driver}</span> • {stats.database?.name}
                        </p>
                    </div>

                    {/* Media Assets Stat */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Media & Foto Absen
                            </span>
                            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-roxy-primary flex items-center justify-center font-bold">
                                <HardDrive size={20} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.storage?.formatted_size || '0 MB'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                ({stats.storage?.files_count || 0} berkas)
                            </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-2">
                            Foto absen, logo toko & bukti upload
                        </p>
                    </div>

                    {/* Server Disk Space */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Kapasitas Disk Server
                            </span>
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Server size={20} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.disk?.formatted_free || '0 GB'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                bebas dari {stats.disk?.formatted_total || '0 GB'}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    (stats.disk?.used_percent || 0) > 85 ? 'bg-rose-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(100, stats.disk?.used_percent || 0)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Total Backups Available */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Cadangan Tersimpan
                            </span>
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                <Archive size={20} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.backups_count || 0}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                arsip ({stats.total_backups_size || '0 MB'})
                            </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-2">
                            Tersimpan di direktori server
                        </p>
                    </div>
                </div>

                {/* ── Action Grid: Backup (Export) & Restore (Import) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ══ ACTION 1: BUAT CADANGAN BARU ══ */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                                    <Download size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                                        Buat Cadangan Baru
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                                        Ekspor database dan file aset dengan kompresi hemat ruang
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateBackup} className="space-y-6">
                                {/* Mode Selection Cards */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        1. Pilih Lingkup File
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Option: Database Only */}
                                        <button
                                            type="button"
                                            onClick={() => setBackupType('database')}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                backupType === 'database'
                                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Database size={18} className={backupType === 'database' ? 'text-indigo-600' : 'text-slate-400'} />
                                                    <span className="font-black text-sm text-slate-900">Database Sahaja</span>
                                                </div>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                                    .sql.gz
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                Cadangkan skema tabel & transaksi. Sangat cepat & hemat ruang.
                                            </p>
                                        </button>

                                        {/* Option: Full System (DB + Files) */}
                                        <button
                                            type="button"
                                            onClick={() => setBackupType('full')}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                backupType === 'full'
                                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Archive size={18} className={backupType === 'full' ? 'text-indigo-600' : 'text-slate-400'} />
                                                    <span className="font-black text-sm text-slate-900">Cadangan Penuh</span>
                                                </div>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                                    .zip
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                Database lengkap + seluruh foto absensi, logo cabang & media.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* ── Pilihan Rentang Periode ── */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                                        <span>2. Pilih Rentang Periode Data</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPeriodMode('all')}
                                            className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                                                periodMode === 'all'
                                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${periodMode === 'all' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                    {periodMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                                </div>
                                                <span>Semua Waktu (Seluruh Riwayat)</span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPeriodMode('custom')}
                                            className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                                                periodMode === 'custom'
                                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${periodMode === 'custom' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                    {periodMode === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                                </div>
                                                <span>Pilih Periode Tertentu</span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Period Dropdowns */}
                                    {periodMode === 'custom' && (
                                        <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 space-y-3 animate-in fade-in duration-300">
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Dari Bulan */}
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-indigo-900 block mb-1">
                                                        Dari Bulan & Tahun:
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <select
                                                            value={startMonth}
                                                            onChange={(e) => setStartMonth(e.target.value)}
                                                            className="w-full text-xs font-bold py-2 px-2.5 rounded-xl border border-indigo-200 bg-white"
                                                        >
                                                            {MONTHS.map((m) => (
                                                                <option key={m.value} value={m.value}>{m.label}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={startYear}
                                                            onChange={(e) => setStartYear(e.target.value)}
                                                            className="w-full text-xs font-bold py-2 px-2 rounded-xl border border-indigo-200 bg-white"
                                                        >
                                                            {years.map((y) => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Sampai Bulan */}
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-indigo-900 block mb-1">
                                                        Sampai Bulan & Tahun:
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <select
                                                            value={endMonth}
                                                            onChange={(e) => setEndMonth(e.target.value)}
                                                            className="w-full text-xs font-bold py-2 px-2.5 rounded-xl border border-indigo-200 bg-white"
                                                        >
                                                            {MONTHS.map((m) => (
                                                                <option key={m.value} value={m.value}>{m.label}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={endYear}
                                                            onChange={(e) => setEndYear(e.target.value)}
                                                            className="w-full text-xs font-bold py-2 px-2 rounded-xl border border-indigo-200 bg-white"
                                                        >
                                                            {years.map((y) => (
                                                                <option key={y} value={y}>{y}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5 pt-1">
                                                <Info size={14} className="shrink-0" />
                                                <span>Data operasional yang dicadangkan: <strong>{startMonthLabel} {startYear} s/d {endMonthLabel} {endYear}</strong>. Master data (kategori/produk/layanan) tetap disertakan lengkap.</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Notes Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        Catatan Cadangan (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={backupNotes}
                                        onChange={(e) => setBackupNotes(e.target.value)}
                                        placeholder="Misal: Arsip Jan-Sep sebelum tutup buku..."
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                                    />
                                </div>

                                {/* Direct Download Checkbox */}
                                <label className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl cursor-pointer border border-slate-100 transition-all select-none">
                                    <input
                                        type="checkbox"
                                        checked={downloadDirect}
                                        onChange={(e) => setDownloadDirect(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-800">
                                            Unduh Langsung ke Komputer
                                        </p>
                                        <p className="text-[11px] font-semibold text-slate-400">
                                            Jika dicentang, file backup langsung di-download otomatis oleh browser.
                                        </p>
                                    </div>
                                </label>

                                <button
                                    type="submit"
                                    disabled={creatingBackup}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-indigo-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {creatingBackup ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            <span>Sedang Membuat Cadangan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} strokeWidth={2.5} />
                                            <span>Mulai Proses Cadangan</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ══ ACTION 2: RESTORE VIA UPLOAD DATA ══ */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-roxy-primary flex items-center justify-center shadow-inner">
                                    <Upload size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                                        Pulihkan Sistem (Restore Upload)
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                                        Upload file cadangan (.sql, .sql.gz, atau .zip) untuk dipulihkan
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleRestoreUpload} className="space-y-6">
                                {/* Drag & Drop File Upload Area */}
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                                        uploadedFile
                                            ? 'border-emerald-500 bg-emerald-50/30'
                                            : 'border-slate-200 hover:border-roxy-primary bg-slate-50/50 hover:bg-teal-50/20'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".sql,.gz,.zip"
                                        className="hidden"
                                    />

                                    {uploadedFile ? (
                                        <div className="space-y-2 py-2">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                                                {uploadedFile.name.endsWith('.zip') ? (
                                                    <FileArchive size={24} />
                                                ) : (
                                                    <FileText size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 truncate max-w-xs mx-auto">
                                                    {uploadedFile.name}
                                                </p>
                                                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                                                    Ukuran: {formatFileSize(uploadedFile.size)} • Siap Dipulihkan
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUploadedFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="text-xs font-bold text-rose-500 hover:text-rose-700 underline pt-1"
                                            >
                                                Ganti file lain
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 py-3">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                                                <FileUp size={24} />
                                            </div>
                                            <p className="text-sm font-black text-slate-800">
                                                Klik untuk memilih atau seret file ke sini
                                            </p>
                                            <p className="text-xs font-semibold text-slate-400">
                                                Mendukung file <span className="font-black text-slate-600">.sql</span>,{' '}
                                                <span className="font-black text-slate-600">.sql.gz</span>, atau{' '}
                                                <span className="font-black text-slate-600">.zip</span> (maks 512 MB)
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Pilihan Mode Restore (Merge vs Overwrite) ── */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        Pilih Mode Pemulihan Data
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Mode A: Gabungkan Data (Merge) */}
                                        <button
                                            type="button"
                                            onClick={() => setUploadRestoreMode('merge')}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                uploadRestoreMode === 'merge'
                                                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <GitMerge size={18} className={uploadRestoreMode === 'merge' ? 'text-emerald-600' : 'text-slate-400'} />
                                                    <span className="font-black text-sm text-slate-900">Gabungkan (Merge)</span>
                                                </div>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                    Rekomendasi
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                <strong className="text-emerald-700">Data baru (Okt-Nov) tetap aman!</strong> Hanya menambahkan rekor lama tanpa menghapus data berjalan.
                                            </p>
                                        </button>

                                        {/* Mode B: Timpa Total (Overwrite) */}
                                        <button
                                            type="button"
                                            onClick={() => setUploadRestoreMode('overwrite')}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                uploadRestoreMode === 'overwrite'
                                                    ? 'border-rose-600 bg-rose-50/50 shadow-md ring-2 ring-rose-600/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <RotateCcw size={18} className={uploadRestoreMode === 'overwrite' ? 'text-rose-600' : 'text-slate-400'} />
                                                    <span className="font-black text-sm text-slate-900">Timpa Total</span>
                                                </div>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                                    Hapus Semua
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                                Mereset tabel. Data berjalan setelah tanggal backup <strong className="text-rose-700">akan tertimpa/hilang</strong>.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic Warning Banner */}
                                {uploadRestoreMode === 'merge' ? (
                                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                                        <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                                        <div className="text-xs font-semibold text-emerald-900 leading-relaxed">
                                            <p className="font-black text-emerald-950 mb-0.5">Mode Penggabungan Aman Aktif:</p>
                                            Sistem akan menyisipkan data dari backup ke database tanpa menghapus tabel yang ada. Transaksi baru Anda di bulan berjalan tidak akan hilang.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                                        <div className="text-xs font-semibold text-amber-900 leading-relaxed">
                                            <p className="font-black text-amber-950 mb-0.5">Peringatan Mode Timpa Total:</p>
                                            Database akan di-reset penuh. Data berjalan setelah tanggal backup akan hilang. Safety snapshot otomatis tetap dibuat sebelum proses dimulai.
                                        </div>
                                    </div>
                                )}

                                {/* Confirmation Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        Ketik <span className="text-rose-600 font-black">RESTORE</span> untuk konfirmasi
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadConfirmText}
                                        onChange={(e) => setUploadConfirmText(e.target.value)}
                                        placeholder="Ketik RESTORE"
                                        disabled={!uploadedFile}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-black tracking-widest uppercase text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        !uploadedFile ||
                                        uploadConfirmText.trim().toUpperCase() !== 'RESTORE' ||
                                        restoringUpload
                                    }
                                    className={`w-full text-white font-black py-4 px-6 rounded-2xl text-sm transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                        uploadRestoreMode === 'merge'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                                            : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                                    }`}
                                >
                                    {restoringUpload ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            <span>Sedang Memulihkan Sistem...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw size={18} strokeWidth={2.5} />
                                            <span>
                                                {uploadRestoreMode === 'merge' ? 'Upload & Gabungkan Data' : 'Upload & Timpa Seluruh Database'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ── Table: Riwayat Cadangan di Server ── */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-6 bg-roxy-primary rounded-full"></div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                                    Berkas Cadangan di Server
                                </h3>
                                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {backups.length} file
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-1 ml-5">
                                File backup yang tersimpan di direktori server (storage/app/backups)
                            </p>
                        </div>
                    </div>

                    {backups.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-200">
                            <Archive size={40} className="text-slate-300 mx-auto mb-3" />
                            <h4 className="text-base font-black text-slate-800">Belum Ada File Cadangan di Server</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1 max-w-sm mx-auto">
                                Buat cadangan pertama Anda menggunakan formulir di atas untuk mengamankan data Roxy POS.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        <th className="pb-4 font-black">Nama File Cadangan</th>
                                        <th className="pb-4 font-black">Jenis</th>
                                        <th className="pb-4 font-black">Ukuran</th>
                                        <th className="pb-4 font-black">Waktu Dibuat</th>
                                        <th className="pb-4 font-black text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {backups.map((b, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            {/* File Name */}
                                            <td className="py-4 font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                    {b.type === 'full' ? (
                                                        <FileArchive size={18} className="text-teal-600" />
                                                    ) : b.type === 'safety' ? (
                                                        <ShieldAlert size={18} className="text-amber-600" />
                                                    ) : (
                                                        <FileText size={18} className="text-indigo-600" />
                                                    )}
                                                </div>
                                                <div className="truncate max-w-xs sm:max-w-md">
                                                    <p className="truncate font-black">{b.filename}</p>
                                                    <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                                                        <span>{b.relative_time}</span>
                                                        {b.has_period && (
                                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                                                Periode
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Type Badge */}
                                            <td className="py-4">
                                                <span
                                                    className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border ${
                                                        b.type === 'full'
                                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                                            : b.type === 'safety'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    }`}
                                                >
                                                    {b.type_label}
                                                </span>
                                            </td>

                                            {/* File Size */}
                                            <td className="py-4 font-black text-slate-700 tabular-nums">
                                                {b.formatted_size}
                                            </td>

                                            {/* Date */}
                                            <td className="py-4 font-semibold text-slate-500 text-xs tabular-nums">
                                                {b.formatted_date}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Download Button */}
                                                    <a
                                                        href={`/backup/download/${encodeURIComponent(b.filename)}`}
                                                        title="Unduh File Cadangan"
                                                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all active:scale-95"
                                                    >
                                                        <Download size={16} />
                                                    </a>

                                                    {/* Restore Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedServerBackup(b);
                                                            setServerRestoreMode('merge');
                                                            setServerConfirmText('');
                                                            setRestoreModalOpen(true);
                                                        }}
                                                        title="Pulihkan dari Cadangan Ini"
                                                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all active:scale-95"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setBackupToDelete(b);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        title="Hapus Cadangan"
                                                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all active:scale-95"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ MODAL: KONFIRMASI RESTORE DARI SERVER FILE ══ */}
            <Modal show={restoreModalOpen} onClose={() => setRestoreModalOpen(false)} maxWidth="md">
                <div className="p-8">
                    <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 border border-indigo-100 shadow-inner">
                        <RotateCcw size={28} strokeWidth={2.5} />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 text-center tracking-tight font-heading">
                        Pulihkan dari Cadangan Server
                    </h3>

                    {selectedServerBackup && (
                        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-1">
                            <p className="text-xs font-black text-slate-900 truncate">
                                {selectedServerBackup.filename}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400">
                                Jenis: {selectedServerBackup.type_label} • Ukuran: {selectedServerBackup.formatted_size}
                            </p>
                        </div>
                    )}

                    {/* Mode Selection Inside Modal */}
                    <div className="mt-5 space-y-2 text-left">
                        <label className="text-[11px] font-black uppercase text-slate-500 block">
                            Pilih Mode Pemulihan:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setServerRestoreMode('merge')}
                                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                    serverRestoreMode === 'merge'
                                        ? 'border-emerald-600 bg-emerald-50/60 font-black text-emerald-900 ring-2 ring-emerald-600/20'
                                        : 'border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                                }`}
                            >
                                <p className="flex items-center gap-1.5">
                                    <GitMerge size={14} className="text-emerald-600" />
                                    <span>Gabungkan (Merge)</span>
                                </p>
                                <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                    Data baru tetap aman
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setServerRestoreMode('overwrite')}
                                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                    serverRestoreMode === 'overwrite'
                                        ? 'border-rose-600 bg-rose-50/60 font-black text-rose-900 ring-2 ring-rose-600/20'
                                        : 'border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                                }`}
                            >
                                <p className="flex items-center gap-1.5">
                                    <RotateCcw size={14} className="text-rose-600" />
                                    <span>Timpa Total</span>
                                </p>
                                <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                    Reset seluruh tabel
                                </p>
                            </button>
                        </div>
                    </div>

                    <div className={`mt-4 p-3.5 rounded-2xl border text-xs font-semibold text-left ${
                        serverRestoreMode === 'merge'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                        {serverRestoreMode === 'merge' ? (
                            <span><strong className="text-emerald-950">Aman:</strong> Query penghapusan tabel (DROP TABLE) akan dilewati. Data berjalan di bulan sekarang tidak akan terhapus.</span>
                        ) : (
                            <span><strong className="text-amber-950">Peringatan:</strong> Mode Timpa Total akan menghapus data berjalan dan mengembalikannya ke titik saat file backup dibuat.</span>
                        )}
                    </div>

                    <form onSubmit={handleRestoreServerFile} className="mt-5 space-y-4">
                        <div>
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                Ketik <span className="text-rose-600 font-black">RESTORE</span> untuk konfirmasi
                            </label>
                            <input
                                type="text"
                                value={serverConfirmText}
                                onChange={(e) => setServerConfirmText(e.target.value)}
                                placeholder="Ketik RESTORE"
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-black tracking-widest uppercase text-slate-900 text-center placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setRestoreModalOpen(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    serverConfirmText.trim().toUpperCase() !== 'RESTORE' ||
                                    restoringServer
                                }
                                className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-xs transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    serverRestoreMode === 'merge'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                                }`}
                            >
                                {restoringServer ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={14} />
                                        <span>Memulihkan...</span>
                                    </>
                                ) : (
                                    <span>{serverRestoreMode === 'merge' ? 'Ya, Gabungkan Data' : 'Ya, Timpa Total'}</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ══ MODAL: KONFIRMASI HAPUS FILE CADANGAN ══ */}
            <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="sm">
                <div className="p-8 text-center">
                    <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                        <Trash2 size={26} strokeWidth={2.5} />
                    </div>

                    <h3 className="text-lg font-black text-slate-900 tracking-tight font-heading">
                        Hapus File Cadangan?
                    </h3>

                    <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                        File backup <span className="font-black text-slate-800">"{backupToDelete?.filename}"</span> akan dihapus permanen dari server. Tindakan ini tidak dapat dibatalkan.
                    </p>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(false)}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteBackup}
                            disabled={deleting}
                            className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/20 disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
