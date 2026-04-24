import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Layout, Store, Percent, Tag, MapPin, ShieldCheck, Save, Upload, X, CheckCircle2, Pencil } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';

export default function SettingsIndex({ settings, branches, promotions }) {
    const [activeTab, setActiveTab] = useState('branding');

    const tabs = [
        { id: 'branding', label: 'Sistem & UI', icon: Layout },
        { id: 'loyalty', label: 'Member & Loyalitas', icon: ShieldCheck },
        { id: 'promo', label: 'Event & Promosi', icon: Tag },
        { id: 'branch', label: 'Profil Toko', icon: Store },
        { id: 'ops', label: 'Absensi & Lokasi', icon: MapPin },
        { id: 'finance', label: 'Keuangan & Pajak', icon: Percent },
    ];

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Pengaturan Sistem"
                    subtitle="Kelola branding, promosi, dan operasional toko"
                />
            }
        >
            <Head title="Pengaturan" />

            <div className="max-w-7xl mx-auto pb-24 px-4 sm:px-0">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full lg:w-80 shrink-0 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                                        activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                                        : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                                    }`}
                                >
                                    <Icon size={20} className={activeTab === tab.id ? 'text-roxy-primary' : ''} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10">
                        {activeTab === 'branding' && <BrandingTab settings={settings} />}
                        {activeTab === 'loyalty' && <LoyaltyTab settings={settings} />}
                        {activeTab === 'promo' && <PromotionTab promotions={promotions} branches={branches} />}
                        {activeTab === 'branch' && <BranchTab branches={branches} />}
                        {activeTab === 'ops' && <OpsTab branches={branches} />}
                        {activeTab === 'finance' && <FinanceTab branches={branches} />}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function BrandingTab({ settings }) {
    const [preview, setPreview] = useState(settings.app_logo || null);
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        app_name: settings.app_name || 'Roxy POS',
        app_logo: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('app_logo', file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.ui'), {
            forceFormData: true,
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tampilan Sistem</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Sesuaikan identitas aplikasi Anda</p>
            </div>

            <form onSubmit={submit} className="space-y-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Aplikasi</label>
                    <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <div className="w-32 h-32 bg-white rounded-3xl shadow-inner flex items-center justify-center overflow-hidden border border-slate-100 relative group">
                            {preview ? (
                                <img src={preview} alt="Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <Layout size={40} className="text-slate-200" />
                            )}
                        </div>
                        <div className="flex-1 space-y-4 text-center sm:text-left">
                            <div>
                                <h5 className="text-sm font-bold text-slate-800">Upload Logo Baru</h5>
                                <p className="text-xs text-slate-500 mt-1">Format PNG atau JPG, Maksimal 2MB. Disarankan background transparan.</p>
                            </div>
                            <input
                                type="file"
                                id="logo-upload"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <label
                                htmlFor="logo-upload"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer transition-all"
                            >
                                <Upload size={16} />
                                Pilih File
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Aplikasi</label>
                    <input
                        type="text"
                        value={data.app_name}
                        onChange={e => setData('app_name', e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary transition-all"
                    />
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                    <button
                        disabled={processing}
                        type="submit"
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} className="text-roxy-primary" />
                        Simpan Perubahan
                    </button>
                    
                    {recentlySuccessful && (
                        <div className="flex items-center gap-2 text-teal-600 animate-in fade-in slide-in-from-left-4">
                            <CheckCircle2 size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tersimpan</span>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

function BranchTab({ branches }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Profil Toko / Cabang</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Kelola data operasional setiap cabang</p>
            </div>

            <div className="space-y-6">
                {branches.map((branch) => (
                    <BranchForm key={branch.id} branch={branch} />
                ))}
            </div>
        </div>
    );
}

function BranchForm({ branch }) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        name: branch.name,
        phone: branch.phone || '',
        email: branch.email || '',
        address: branch.address || '',
        opening_time: branch.opening_time || '09:00',
        closing_time: branch.closing_time || '21:00',
        timezone: branch.timezone || 'Asia/Jakarta',
        tax_rate: branch.tax_rate,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.branch', branch.id));
    };

    return (
        <form onSubmit={submit} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                        <Store size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800">{branch.name}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cabang ID: {branch.code}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Cabang</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Cabang</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telepon</label>
                    <input
                        type="text"
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zona Waktu</label>
                    <select
                        value={data.timezone}
                        onChange={e => setData('timezone', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    >
                        <option value="Asia/Jakarta">WIB (UTC+7)</option>
                        <option value="Asia/Makassar">WITA (UTC+8)</option>
                        <option value="Asia/Jayapura">WIT (UTC+9)</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Buka</label>
                    <input
                        type="time"
                        value={data.opening_time}
                        onChange={e => setData('opening_time', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Tutup</label>
                    <input
                        type="time"
                        value={data.closing_time}
                        onChange={e => setData('closing_time', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat Lengkap</label>
                    <textarea
                        value={data.address}
                        onChange={e => setData('address', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold h-24"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4">
                <button
                    disabled={processing}
                    type="submit"
                    className="px-8 py-3.5 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Save size={16} className="text-teal-500" />
                    Simpan Cabang
                </button>
                {recentlySuccessful && (
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Berhasil!</span>
                )}
            </div>
        </form>
    );
}

function LoyaltyTab({ settings }) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        member_discount_rate: settings.member_discount_rate || 0,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.loyalty'));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Member & Loyalitas</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Kelola keuntungan pelanggan terdaftar</p>
            </div>

            <form onSubmit={submit} className="max-w-2xl p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-roxy-primary shadow-sm border border-slate-100 shrink-0">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800">Diskon Member Otomatis</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Persentase diskon yang akan langsung diterapkan di POS saat kasir memilih pelanggan terdaftar.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Persentase Diskon (%)</label>
                    <div className="relative max-w-xs">
                        <input
                            type="number"
                            value={data.member_discount_rate}
                            onChange={e => setData('member_discount_rate', e.target.value)}
                            className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xl font-black focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex items-center gap-4">
                    <button
                        disabled={processing}
                        type="submit"
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all"
                    >
                        <Save size={18} className="text-roxy-primary" />
                        Simpan Pengaturan
                    </button>
                    {recentlySuccessful && (
                        <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Berhasil!</span>
                    )}
                </div>
            </form>
        </div>
    );
}

function PromotionTab({ promotions, branches }) {
    const [showModal, setShowModal] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset } = useForm({
        name: '',
        discount_type: 'percentage',
        discount_value: 0,
        start_date: '',
        end_date: '',
        branch_id: '',
        is_active: true,
    });

    const openCreateModal = () => {
        reset();
        setEditingPromo(null);
        setShowModal(true);
    };

    const openEditModal = (promo) => {
        setEditingPromo(promo);
        setData({
            name: promo.name,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            start_date: new Date(promo.start_date).toISOString().split('T')[0],
            end_date: new Date(promo.end_date).toISOString().split('T')[0],
            branch_id: promo.branch_id || '',
            is_active: promo.is_active,
        });
        setShowModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingPromo) {
            put(route('promotions.update', editingPromo.id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('promotions.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const deletePromo = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus promosi ini?')) {
            destroy(route('promotions.destroy', id));
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Event & Promosi</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Atur diskon otomatis berdasarkan periode waktu</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-teal-500 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
                >
                    Tambah Promo
                </button>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-2xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Nama Promo</th>
                            <th className="px-6 py-4">Diskon</th>
                            <th className="px-6 py-4">Periode</th>
                            <th className="px-6 py-4">Cabang</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {promotions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold text-sm italic">Belum ada promosi yang dibuat</td>
                            </tr>
                        ) : (
                            promotions.map((promo) => (
                                <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{promo.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-teal-600 font-black text-xs">
                                            {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `Rp ${promo.discount_value}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                        {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                            {promo.branch ? promo.branch.name : 'Semua Cabang'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {promo.is_active ? (
                                            <span className="flex items-center gap-1.5 text-teal-600 font-bold text-[10px] uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div> Aktif
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEditModal(promo)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => deletePromo(promo.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Promotion Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="text-xl font-black text-slate-900">{editingPromo ? 'Edit Promosi' : 'Tambah Promosi'}</h4>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Promo</label>
                                <input
                                    required
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                                    placeholder="Contoh: Diskon Lebaran"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Diskon</label>
                                    <select
                                        value={data.discount_type}
                                        onChange={e => setData('discount_type', e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                                    >
                                        <option value="percentage">Persentase (%)</option>
                                        <option value="fixed">Nominal (Rp)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nilai Diskon</label>
                                    <input
                                        required
                                        type="number"
                                        value={data.discount_value}
                                        onChange={e => setData('discount_value', e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Mulai</label>
                                    <input
                                        required
                                        type="date"
                                        value={data.start_date}
                                        onChange={e => setData('start_date', e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Selesai</label>
                                    <input
                                        required
                                        type="date"
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Cabang (Opsional)</label>
                                <select
                                    value={data.branch_id}
                                    onChange={e => setData('branch_id', e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold"
                                >
                                    <option value="">Semua Cabang</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700">Aktifkan Promosi</label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl font-black text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 uppercase tracking-widest transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    disabled={processing}
                                    type="submit"
                                    className="flex-[2] py-4 rounded-2xl font-black text-xs text-slate-900 bg-roxy-primary hover:bg-roxy-primary/80 uppercase tracking-widest shadow-xl shadow-roxy-primary/10 transition-all"
                                >
                                    {editingPromo ? 'Perbarui Promo' : 'Simpan Promo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function OpsTab({ branches }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Absensi & Geofence</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Atur radius absensi dan lokasi setiap cabang</p>
            </div>

            <div className="space-y-6">
                {branches.map((branch) => (
                    <OpsForm key={branch.id} branch={branch} />
                ))}
            </div>
        </div>
    );
}

function OpsForm({ branch }) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        latitude: branch.latitude || '',
        longitude: branch.longitude || '',
        geofence_radius: branch.geofence_radius || 100,
        require_attendance_for_shift: branch.require_attendance_for_shift || false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.branch', branch.id));
    };

    return (
        <form onSubmit={submit} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <MapPin size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-black text-slate-800">{branch.name}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Radius Absensi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                    <input
                        type="text"
                        value={data.latitude}
                        onChange={e => setData('latitude', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        placeholder="-6.123456"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                    <input
                        type="text"
                        value={data.longitude}
                        onChange={e => setData('longitude', e.target.value)}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        placeholder="106.123456"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radius Aman (Meter)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={data.geofence_radius}
                            onChange={e => setData('geofence_radius', e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">MTR</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-6">
                    <input
                        type="checkbox"
                        id={`req-att-${branch.id}`}
                        checked={data.require_attendance_for_shift}
                        onChange={e => setData('require_attendance_for_shift', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor={`req-att-${branch.id}`} className="text-sm font-bold text-slate-700">Wajib Absen untuk Buka Shift</label>
                </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
                <button
                    disabled={processing}
                    type="submit"
                    className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Save size={16} className="text-teal-500" />
                    Update Lokasi
                </button>
                {recentlySuccessful && (
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Tersimpan!</span>
                )}
            </div>
        </form>
    );
}

function FinanceTab({ branches }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Keuangan & Pajak</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Kelola pajak dan denda keterlambatan</p>
            </div>

            <div className="space-y-6">
                {branches.map((branch) => (
                    <FinanceForm key={branch.id} branch={branch} />
                ))}
            </div>
        </div>
    );
}

function FinanceForm({ branch }) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        tax_rate: branch.tax_rate,
        enable_tax: branch.enable_tax,
        late_penalty_amount: branch.late_penalty_amount || 0,
        enable_attendance_deduction: branch.enable_attendance_deduction || false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.branch', branch.id));
    };

    return (
        <form onSubmit={submit} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Percent size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-black text-slate-800">{branch.name}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Konfigurasi Keuangan</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pajak Layanan (%)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`enable-tax-${branch.id}`}
                                checked={data.enable_tax}
                                onChange={e => setData('enable_tax', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor={`enable-tax-${branch.id}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">Aktifkan</label>
                        </div>
                    </div>
                    <div className={`relative transition-opacity ${!data.enable_tax ? 'opacity-40 pointer-events-none' : ''}`}>
                        <input
                            type="number"
                            value={data.tax_rate}
                            onChange={e => setData('tax_rate', e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                            disabled={!data.enable_tax}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Denda Terlambat (Rp)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={data.late_penalty_amount}
                            onChange={e => setData('late_penalty_amount', e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs hidden lg:block">Rp</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                    <input
                        type="checkbox"
                        id={`deduct-${branch.id}`}
                        checked={data.enable_attendance_deduction}
                        onChange={e => setData('enable_attendance_deduction', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor={`deduct-${branch.id}`} className="text-sm font-bold text-slate-700">Potong Gaji Otomatis jika Terlambat</label>
                </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
                <button
                    disabled={processing}
                    type="submit"
                    className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Save size={16} className="text-teal-500" />
                    Update Keuangan
                </button>
                {recentlySuccessful && (
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Tersimpan!</span>
                )}
            </div>
        </form>
    );
}
