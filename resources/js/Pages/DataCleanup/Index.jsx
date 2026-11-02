import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Modal from '@/Components/Modal';
import axios from 'axios';
import {
    Trash2,
    HardDrive,
    Database,
    Camera,
    ShoppingBag,
    Store,
    Banknote,
    Clock,
    Wallet,
    Calendar,
    Terminal,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    RefreshCw,
    FileText,
    Layers,
    Filter,
    ArrowRight,
    Server,
    Sparkles,
    Check,
    X
} from 'lucide-react';

const iconMap = {
    Camera,
    Calendar,
    ShoppingBag,
    Banknote,
    Store,
    Clock,
    Wallet,
    Terminal,
    Database,
    Trash2,
};

function getIcon(name) {
    return iconMap[name] || Database;
}

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

export default function Index({
    branches = [],
    modules = [],
    diskUsage = {},
    recentLogs = [],
    defaultYear,
    defaultMonth,
}) {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push(y);
    }

    const [selectedYear, setSelectedYear] = useState(defaultYear || currentYear);
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth || new Date().getMonth() + 1);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedModules, setSelectedModules] = useState(modules.map((m) => m.id));
    
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // Modal Confirmation State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [executing, setExecuting] = useState(false);

    // Fetch preview whenever year, month, or branch changes
    const fetchPreview = async (year = selectedYear, month = selectedMonth, branch = selectedBranch) => {
        setPreviewLoading(true);
        try {
            const response = await axios.post('/data-cleanup/preview', {
                year: parseInt(year),
                month: parseInt(month),
                branch_id: branch ? parseInt(branch) : null,
                modules: selectedModules,
            });
            setPreviewData(response.data);
        } catch (error) {
            console.error('Failed to preview data:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        fetchPreview();
    }, [selectedYear, selectedMonth, selectedBranch]);

    // Module selection handlers
    const toggleModule = (id) => {
        setSelectedModules((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const selectAllModules = () => {
        setSelectedModules(modules.map((m) => m.id));
    };

    const selectStorageOnly = () => {
        setSelectedModules(
            modules.filter((m) => m.category === 'storage' || m.category === 'system').map((m) => m.id)
        );
    };

    const clearAllModules = () => {
        setSelectedModules([]);
    };

    // Quick period presets
    const applyPreset = (monthsAgo) => {
        const d = new Date();
        d.setMonth(d.getMonth() - monthsAgo);
        setSelectedYear(d.getFullYear());
        setSelectedMonth(d.getMonth() + 1);
    };

    // Execution trigger
    const handleExecute = (e) => {
        e.preventDefault();
        if (confirmText.trim().toUpperCase() !== 'HAPUS') return;

        setExecuting(true);
        router.post(
            '/data-cleanup/execute',
            {
                year: parseInt(selectedYear),
                month: parseInt(selectedMonth),
                branch_id: selectedBranch ? parseInt(selectedBranch) : null,
                modules: selectedModules,
                confirmation: confirmText.trim().toUpperCase(),
            },
            {
                onSuccess: () => {
                    setShowConfirmModal(false);
                    setConfirmText('');
                    fetchPreview();
                },
                onFinish: () => {
                    setExecuting(false);
                },
            }
        );
    };

    // Group modules by category
    const storageModules = modules.filter((m) => m.category === 'storage');
    const databaseModules = modules.filter((m) => m.category === 'database');
    const systemModules = modules.filter((m) => m.category === 'system');

    // Calculate selected summary from previewData
    const selectedSummary = React.useMemo(() => {
        if (!previewData || !previewData.breakdown) {
            return { records: 0, files: 0, bytes: 0, formatted: '0 B' };
        }
        let records = 0;
        let files = 0;
        let bytes = 0;

        selectedModules.forEach((id) => {
            const item = previewData.breakdown[id];
            if (item) {
                records += item.records || 0;
                files += item.files || 0;
                bytes += item.bytes || 0;
            }
        });

        // Simple format helper
        const formatBytes = (b) => {
            if (b === 0) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(b) / Math.log(1024));
            return (b / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
        };

        return {
            records,
            files,
            bytes,
            formatted: formatBytes(bytes),
        };
    }, [previewData, selectedModules]);

    const monthLabel = MONTHS.find((m) => m.value === parseInt(selectedMonth))?.label || selectedMonth;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Pembersihan Data Sistem"
                    subtitle="Hapus data database & file penyimpanan lawas untuk meringankan beban server"
                    backHref="/dashboard"
                    badge="SUPER ADMIN"
                    badgeColor="rose"
                    showClock={true}
                />
            }
        >
            <Head title="Pembersihan Data & Storage - Super Admin" />

            <div className="space-y-8 max-w-7xl mx-auto pb-16">
                {/* ── System Storage Health Overview ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Disk Free / Total */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Kapasitas Hard Disk
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-roxy-primary flex items-center justify-center">
                                <HardDrive size={18} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {diskUsage.formatted_free || '0 GB'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                bebas dari {diskUsage.formatted_total || '0 GB'}
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${
                                    (diskUsage.disk_used_percentage || 0) > 85
                                        ? 'bg-rose-500'
                                        : (diskUsage.disk_used_percentage || 0) > 70
                                        ? 'bg-amber-500'
                                        : 'bg-roxy-primary'
                                }`}
                                style={{ width: `${diskUsage.disk_used_percentage || 0}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex justify-between">
                            <span>Terpakai: {diskUsage.disk_used_percentage || 0}%</span>
                            <span>{diskUsage.formatted_used || '0 GB'}</span>
                        </p>
                    </div>

                    {/* Attendance Photos Storage */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Foto Selfie Absensi
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Camera size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {diskUsage.formatted_attendance_photos || '0 MB'}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 mt-2">
                            Penyimpanan foto clock-in & clock-out
                        </p>
                    </div>

                    {/* App Storage Size */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Total Storage Aplikasi
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Database size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {diskUsage.formatted_app_storage || '0 MB'}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 mt-2">
                            Folder <code className="text-slate-600 font-mono text-[10px]">storage/app</code>
                        </p>
                    </div>

                    {/* Server Logs Storage */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                File Log Server
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Terminal size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {diskUsage.formatted_logs || '0 MB'}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 mt-2">
                            Folder <code className="text-slate-600 font-mono text-[10px]">storage/logs</code>
                        </p>
                    </div>
                </div>

                {/* ── Filter & Analysis Controller Card ── */}
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Filter size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Filter Target Pembersihan</h3>
                                <p className="text-xs font-medium text-slate-400">
                                    Pilih periode bulan dan tahun data yang ingin dibersihkan dari server
                                </p>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400 mr-1">Preset Cepat:</span>
                            <button
                                type="button"
                                onClick={() => applyPreset(3)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all border border-slate-100"
                            >
                                3 Bulan Lalu
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset(6)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all border border-slate-100"
                            >
                                6 Bulan Lalu
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset(12)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all border border-slate-100"
                            >
                                1 Tahun Lalu
                            </button>
                        </div>
                    </div>

                    {/* Filter Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                        {/* Month Selector */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Bulan
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-roxy-primary/20 focus:border-roxy-primary transition-all"
                            >
                                {MONTHS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label} ({m.value})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Selector */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Tahun
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-roxy-primary/20 focus:border-roxy-primary transition-all"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Branch Selector */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Cabang Outlet
                            </label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-roxy-primary/20 focus:border-roxy-primary transition-all"
                            >
                                <option value="">Semua Cabang (Global)</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quick Selection Shortcuts */}
                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">Pilih Modul:</span>
                            <button
                                type="button"
                                onClick={selectAllModules}
                                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all"
                            >
                                Pilih Semua
                            </button>
                            <button
                                type="button"
                                onClick={selectStorageOnly}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all"
                            >
                                Foto & Storage Saja
                            </button>
                            <button
                                type="button"
                                onClick={clearAllModules}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold transition-all"
                            >
                                Kosongkan
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchPreview()}
                            disabled={previewLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black tracking-wide hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={previewLoading ? 'animate-spin' : ''} />
                            <span>{previewLoading ? 'Menganalisa Data...' : 'Segarkan Analisa'}</span>
                        </button>
                    </div>
                </div>

                {/* ── Category 1: Penyimpanan File & Media (Storage) ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-wider">
                            1. Penyimpanan File & Media (Storage Disk)
                        </h4>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            Paling Efektif Menghemat Hard Drive
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {storageModules.map((module) => {
                            const isSelected = selectedModules.includes(module.id);
                            const Icon = getIcon(module.icon);
                            const preview = previewData?.breakdown?.[module.id];

                            return (
                                <div
                                    key={module.id}
                                    onClick={() => toggleModule(module.id)}
                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                                        isSelected
                                            ? 'bg-white border-amber-400 shadow-md ring-2 ring-amber-400/20'
                                            : 'bg-slate-50/60 border-slate-100 opacity-60 hover:opacity-100 hover:bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                                isSelected
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-slate-200 text-slate-400'
                                            }`}
                                        >
                                            <Icon size={24} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h5 className="font-black text-slate-900 text-sm">{module.name}</h5>
                                                <div
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? 'bg-amber-500 text-white'
                                                            : 'border border-slate-300'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                                {module.description}
                                            </p>

                                            {/* Preview Stats */}
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-400">
                                                    {previewLoading ? (
                                                        'Menghitung...'
                                                    ) : (
                                                        preview?.details || '0 item'
                                                    )}
                                                </span>
                                                <span className="font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                                    {previewLoading ? '...' : preview?.formatted_size || '0 B'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Category 2: Database Operasional & Transaksi ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-wider">
                            2. Database Operasional & Transaksi (MySQL Data)
                        </h4>
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                            Mengurangi Beban CPU & Query Database
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {databaseModules.map((module) => {
                            const isSelected = selectedModules.includes(module.id);
                            const Icon = getIcon(module.icon);
                            const preview = previewData?.breakdown?.[module.id];

                            return (
                                <div
                                    key={module.id}
                                    onClick={() => toggleModule(module.id)}
                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between ${
                                        isSelected
                                            ? 'bg-white border-rose-400 shadow-md ring-2 ring-rose-400/20'
                                            : 'bg-slate-50/60 border-slate-100 opacity-60 hover:opacity-100 hover:bg-white'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isSelected
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-slate-200 text-slate-400'
                                                }`}
                                            >
                                                <Icon size={20} />
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                    isSelected
                                                        ? 'bg-rose-500 text-white'
                                                        : 'border border-slate-300'
                                                }`}
                                            >
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>

                                        <h5 className="font-black text-slate-900 text-sm">{module.name}</h5>
                                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                            {module.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-400 text-[11px] truncate max-w-[150px]">
                                            {previewLoading ? 'Menghitung...' : `${preview?.records || 0} rekor`}
                                        </span>
                                        <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-[11px]">
                                            {previewLoading ? '...' : preview?.formatted_size || '0 B'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Category 3: System Logs & Server Cache ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-wider">
                            3. Log Server & Antrean Gagal
                        </h4>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                            Pembersihan Aman
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemModules.map((module) => {
                            const isSelected = selectedModules.includes(module.id);
                            const Icon = getIcon(module.icon);
                            const preview = previewData?.breakdown?.[module.id];

                            return (
                                <div
                                    key={module.id}
                                    onClick={() => toggleModule(module.id)}
                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                                        isSelected
                                            ? 'bg-white border-purple-400 shadow-md ring-2 ring-purple-400/20'
                                            : 'bg-slate-50/60 border-slate-100 opacity-60 hover:opacity-100 hover:bg-white'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                isSelected
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-slate-200 text-slate-400'
                                            }`}
                                        >
                                            <Icon size={24} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h5 className="font-black text-slate-900 text-sm">{module.name}</h5>
                                                <div
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? 'bg-purple-500 text-white'
                                                            : 'border border-slate-300'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                                {module.description}
                                            </p>

                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-400">
                                                    {previewLoading ? 'Menghitung...' : preview?.details || '0 item'}
                                                </span>
                                                <span className="font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                                                    {previewLoading ? '...' : preview?.formatted_size || '0 B'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Sticky Execution Action Card ── */}
                <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-slate-800">
                    <div className="space-y-2 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-black text-xs uppercase tracking-widest border border-rose-500/30">
                                Ringkasan Target
                            </span>
                            <span className="text-sm font-bold text-slate-400">
                                Periode: <span className="text-white font-black">{monthLabel} {selectedYear}</span>
                            </span>
                        </div>
                        <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {selectedModules.length} Modul Terpilih • Estimasi Bebas: {selectedSummary.formatted}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                            Total {selectedSummary.records.toLocaleString()} rekor database & {selectedSummary.files.toLocaleString()} file fisik akan dihapus.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            type="button"
                            disabled={selectedModules.length === 0}
                            onClick={() => setShowConfirmModal(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Trash2 size={18} />
                            <span>Mulai Bersihkan Data</span>
                        </button>
                    </div>
                </div>

                {/* ── Recent Cleanup Audit History ── */}
                {recentLogs && recentLogs.length > 0 && (
                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                    <Clock size={18} />
                                </div>
                                <h4 className="text-base font-black text-slate-900 tracking-tight">
                                    Riwayat Pembersihan Sebelumnya (Audit Log)
                                </h4>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <th className="pb-3 px-2">Tanggal Eksekusi</th>
                                        <th className="pb-3 px-2">Eksekutor</th>
                                        <th className="pb-3 px-2">Target Periode</th>
                                        <th className="pb-3 px-2">Cabang</th>
                                        <th className="pb-3 px-2 text-right">Rekor Dihapus</th>
                                        <th className="pb-3 px-2 text-right">File Dihapus</th>
                                        <th className="pb-3 px-2 text-right">Kapasitas Dibebaskan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-2 font-bold text-slate-800">{log.created_at}</td>
                                            <td className="py-3 px-2 font-medium text-slate-600">{log.user_name}</td>
                                            <td className="py-3 px-2 font-black text-slate-900">{log.period}</td>
                                            <td className="py-3 px-2 text-slate-500">{log.branch_name}</td>
                                            <td className="py-3 px-2 text-right font-bold text-slate-700">
                                                {log.records_deleted?.toLocaleString() || 0}
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-slate-700">
                                                {log.files_deleted?.toLocaleString() || 0}
                                            </td>
                                            <td className="py-3 px-2 text-right font-black text-emerald-600">
                                                {log.formatted_freed}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Safety Confirmation Modal ── */}
            <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="lg">
                <form onSubmit={handleExecute} className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-4 text-rose-600">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                            <ShieldAlert size={26} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                Konfirmasi Pembersihan Permanen
                            </h3>
                            <p className="text-xs font-bold text-rose-600">
                                Tindakan ini tidak dapat dibatalkan (Irreversible)
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-800 leading-relaxed font-medium space-y-2">
                        <p>
                            Anda akan menghapus data dan file untuk periode <strong>{monthLabel} {selectedYear}</strong> ({selectedBranch ? branches.find(b => b.id === parseInt(selectedBranch))?.name : 'Semua Cabang'}).
                        </p>
                        <p className="font-bold">
                            Total estimasi: {selectedSummary.records.toLocaleString()} rekor database dan {selectedSummary.files.toLocaleString()} file fisik (~{selectedSummary.formatted}) akan dihapus secara permanen untuk membebaskan ruang server.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                            Ketik kata <span className="text-rose-600 font-mono font-black">HAPUS</span> untuk melanjutkan:
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ketik HAPUS di sini"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono uppercase"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                setShowConfirmModal(false);
                                setConfirmText('');
                            }}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={confirmText.trim().toUpperCase() !== 'HAPUS' || executing}
                            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                        >
                            {executing ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Sedang Membersihkan...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 size={14} />
                                    <span>Saya Yakin, Hapus Sekarang</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
