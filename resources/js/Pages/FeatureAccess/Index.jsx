import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import { 
    ShieldCheck, RotateCcw, ShoppingBag, Store, Banknote, History, 
    Camera, Scissors, Package, Tag, Users, MapPin, BarChart3, 
    Wallet, Trophy, Settings, AlertTriangle
} from 'lucide-react';

// ── Icon registry ───────────────────────────────────────────────
const iconMap = {
    ShieldCheck, ShoppingBag, Store, Banknote, History, Camera,
    Scissors, Package, Tag, Users, MapPin, BarChart3, Wallet,
    Trophy, Settings,
};

function getIcon(name) {
    return iconMap[name] || ShieldCheck;
}

// ── Color utilities ─────────────────────────────────────────────
const colorClasses = {
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-100',    dot: 'bg-teal-500'    },
    emerald: { bg: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-emerald-100',  dot: 'bg-emerald-500'  },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    dot: 'bg-blue-500'    },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-100',  dot: 'bg-indigo-500'  },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   dot: 'bg-amber-500'   },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    dot: 'bg-rose-500'    },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-100',    dot: 'bg-cyan-500'    },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-100',   dot: 'bg-slate-500'   },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100',  dot: 'bg-purple-500'  },
};

function getColor(color) {
    return colorClasses[color] || colorClasses.slate;
}

// ── Toggle Switch Component ─────────────────────────────────────
function ToggleSwitch({ enabled, onChange, processing }) {
    return (
        <button
            type="button"
            onClick={onChange}
            disabled={processing}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                enabled
                    ? 'bg-teal-500 focus:ring-teal-500/20'
                    : 'bg-slate-200 focus:ring-slate-300/20'
            } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

// ── Feature Card Component ──────────────────────────────────────
function FeatureCard({ feature, role, onToggle, processing }) {
    const Icon = getIcon(feature.icon);
    const color = getColor(feature.color);
    const roleAccess = feature.roles[role];
    const isEnabled = roleAccess?.is_enabled ?? true;

    return (
        <div
            className={`group relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${
                isEnabled
                    ? `bg-white ${color.border} shadow-sm hover:shadow-md`
                    : 'bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-80'
            }`}
        >
            {/* Icon */}
            <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isEnabled
                        ? `${color.bg} ${color.text}`
                        : 'bg-slate-100 text-slate-300'
                }`}
            >
                <Icon size={20} strokeWidth={2.5} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate transition-colors duration-300 ${
                    isEnabled ? 'text-slate-800' : 'text-slate-400'
                }`}>
                    {feature.name}
                </p>
                <p className={`text-[10px] font-medium mt-0.5 truncate transition-colors duration-300 ${
                    isEnabled ? 'text-slate-400' : 'text-slate-300'
                }`}>
                    {feature.description}
                </p>
            </div>

            {/* Toggle */}
            <ToggleSwitch
                enabled={isEnabled}
                processing={processing}
                onChange={() => onToggle(feature.key, role, !isEnabled)}
            />
        </div>
    );
}

// ── Role Column Component ───────────────────────────────────────
function RoleColumn({ role, roleLabel, features, groups, summary, onToggle, processingKey }) {
    const groupedFeatures = {};
    features.forEach((f) => {
        const group = f.group;
        if (!groupedFeatures[group]) groupedFeatures[group] = [];
        groupedFeatures[group].push(f);
    });

    const enabledCount = summary?.enabled ?? 0;
    const totalCount = summary?.total ?? 0;
    const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Role Header */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{roleLabel}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">
                            {enabledCount} dari {totalCount} fitur aktif
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <span className="text-2xl font-black text-slate-900">{percentage}%</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Feature Groups */}
            {Object.entries(groups).map(([groupKey, groupLabel]) => {
                const groupFeatures = groupedFeatures[groupKey];
                if (!groupFeatures || groupFeatures.length === 0) return null;

                return (
                    <div key={groupKey} className="space-y-3">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1 h-4 bg-slate-300 rounded-full" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {groupLabel}
                            </h4>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        <div className="space-y-2">
                            {groupFeatures.map((feature) => (
                                <FeatureCard
                                    key={feature.key}
                                    feature={feature}
                                    role={role}
                                    onToggle={onToggle}
                                    processing={processingKey === `${feature.key}:${role}`}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Page Component ─────────────────────────────────────────
export default function FeatureAccessIndex({ features, roles, roleLabels, groups, summary }) {
    const [processingKey, setProcessingKey] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleToggle = (featureKey, role, isEnabled) => {
        setProcessingKey(`${featureKey}:${role}`);

        router.put(route('feature-access.update'), {
            feature_key: featureKey,
            role: role,
            is_enabled: isEnabled,
        }, {
            preserveScroll: true,
            onFinish: () => setProcessingKey(null),
        });
    };

    const handleReset = () => {
        setShowResetConfirm(false);
        router.post(route('feature-access.reset'), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Kontrol Akses Fitur"
                    subtitle="Kelola fitur yang bisa diakses oleh setiap role"
                    badge={`${features.length} Fitur`}
                    badgeColor="teal"
                />
            }
        >
            <Head title="Kontrol Akses Fitur" />

            <div className="max-w-7xl mx-auto pb-24 px-4 sm:px-0">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center">
                            <ShieldCheck size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">Fitur yang dinonaktifkan akan tersembunyi dari menu dan tidak bisa diakses.</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Super Admin & Admin selalu memiliki akses penuh.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm shrink-0"
                    >
                        <RotateCcw size={14} />
                        Reset ke Default
                    </button>
                </div>

                {/* Role Columns Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {roles.map((role) => (
                        <RoleColumn
                            key={role}
                            role={role}
                            roleLabel={roleLabels[role] || role}
                            features={features}
                            groups={groups}
                            summary={summary[role]}
                            onToggle={handleToggle}
                            processingKey={processingKey}
                        />
                    ))}
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-100 rounded-[1.5rem] flex items-center justify-center mx-auto">
                                <AlertTriangle size={32} className="text-amber-500" />
                            </div>

                            <div>
                                <h4 className="text-xl font-black text-slate-900">Reset ke Default?</h4>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    Semua pengaturan akses fitur akan dikembalikan ke nilai default.
                                    Perubahan yang sudah Anda buat akan hilang.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-4 rounded-2xl font-black text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 uppercase tracking-widest transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-[2] py-4 rounded-2xl font-black text-xs text-white bg-amber-500 hover:bg-amber-600 uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all"
                                >
                                    Ya, Reset Semua
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
