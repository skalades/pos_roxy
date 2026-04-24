import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import CurrencyInput from '@/Components/CurrencyInput';
import { useForm } from '@inertiajs/react';
import { 
    User as UserIcon, 
    Mail, 
    Phone, 
    Shield, 
    Store, 
    Lock, 
    Wallet, 
    Clock, 
    Calendar,
    Settings,
    Activity
} from 'lucide-react';

export default function UserModal({ show, onClose, user = null, branches = [], roles = [] }) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'barber',
        branch_id: '',
        password: '',
        password_confirmation: '',
        commission_rate: 0,
        monthly_salary: 0,
        hire_date: '',
        work_start_time: '09:00',
        work_end_time: '21:00',
        is_active: true,
    });

    useEffect(() => {
        if (user) {
            setData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                role: user.role || 'barber',
                branch_id: user.branch_id || '',
                password: '',
                password_confirmation: '',
                commission_rate: user.commission_rate || 0,
                monthly_salary: user.monthly_salary || 0,
                hire_date: user.hire_date || '',
                work_start_time: user.work_start_time || '09:00',
                work_end_time: user.work_end_time || '21:00',
                is_active: user.is_active ?? true,
            });
        } else {
            reset();
        }
    }, [user, show]);

    const submit = (e) => {
        e.preventDefault();
        if (user) {
            put(route('users.update', user.id), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('users.store'), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    const handleClose = () => {
        clearErrors();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <form onSubmit={submit} className="p-6 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-16 h-16 bg-roxy-primary/10 rounded-[1.5rem] flex items-center justify-center text-roxy-primary border-4 border-white shadow-lg">
                        <UserIcon size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                            {user ? 'Edit Profil' : 'Staff Baru'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Kelola informasi staff & hak akses</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info Section */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <Settings size={16} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Informasi Dasar</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="name" value="Nama Lengkap" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="Contoh: John Doe"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="email" value="Email" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="staff@roxybarber.com"
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="phone" value="No. Telepon" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="phone"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="0812xxxx"
                        />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="role" value="Role Akses" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <select
                            id="role"
                            className="mt-1 block w-full border-slate-100 focus:border-roxy-primary focus:ring-roxy-primary/10 rounded-2xl py-4 px-5 font-bold text-slate-700 shadow-sm transition-all"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            required
                        >
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <InputError message={errors.role} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="branch_id" value="Cabang Penugasan" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <select
                            id="branch_id"
                            className="mt-1 block w-full border-slate-100 focus:border-roxy-primary focus:ring-roxy-primary/10 rounded-2xl py-4 px-5 font-bold text-slate-700 shadow-sm transition-all"
                            value={data.branch_id}
                            onChange={(e) => setData('branch_id', e.target.value)}
                        >
                            <option value="">Semua Cabang (Global)</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.branch_id} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="hire_date" value="Tanggal Masuk" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="hire_date"
                            type="date"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.hire_date}
                            onChange={(e) => setData('hire_date', e.target.value)}
                        />
                    </div>

                    {/* Authentication Section */}
                    <div className="md:col-span-2 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <Lock size={16} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Keamanan</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                        {user && <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mb-4 bg-amber-50 py-2 px-3 rounded-lg border border-amber-100 inline-block">Kosongkan jika tidak ingin mengubah password</p>}
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="password" value={user ? 'Password Baru' : 'Password'} className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="password"
                            type="password"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    {/* Financial & Operational Section */}
                    <div className="md:col-span-2 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <Wallet size={16} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Finansial & Operasional</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="commission_rate" value="Rate Komisi (%)" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="commission_rate"
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.commission_rate}
                            onChange={(e) => setData('commission_rate', e.target.value)}
                        />
                        <InputError message={errors.commission_rate} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="monthly_salary" value="Gaji Pokok" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <CurrencyInput
                            id="monthly_salary"
                            value={data.monthly_salary}
                            onChange={(val) => setData('monthly_salary', val)}
                            className="!py-4 !px-5 !rounded-2xl !border-slate-100"
                        />
                        <InputError message={errors.monthly_salary} className="mt-2" />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <InputLabel htmlFor="work_start_time" value="Mulai Kerja" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                            <TextInput
                                id="work_start_time"
                                type="time"
                                className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                                value={data.work_start_time}
                                onChange={(e) => setData('work_start_time', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <InputLabel htmlFor="work_end_time" value="Selesai Kerja" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                            <TextInput
                                id="work_end_time"
                                type="time"
                                className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                                value={data.work_end_time}
                                onChange={(e) => setData('work_end_time', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-4">
                        <label className="flex items-center gap-4 cursor-pointer group bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                            </div>
                            <div>
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Status Staff Aktif</span>
                                <p className="text-[10px] text-slate-500 font-medium">Nonaktifkan untuk mencabut akses sistem sementara</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mt-12 flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur-md pt-6 pb-2 border-t border-slate-100">
                    <SecondaryButton onClick={handleClose} type="button" className="!rounded-2xl !py-4 !px-8 !border-slate-200 !text-[11px] !font-black !uppercase !tracking-widest">
                        Batal
                    </SecondaryButton>
                    <PrimaryButton className="!rounded-2xl !py-4 !px-12 !bg-roxy-primary shadow-xl shadow-roxy-primary/30 !font-black !uppercase !tracking-widest !text-[11px] transition-all hover:scale-105 active:scale-95" disabled={processing}>
                        {user ? 'Simpan Perubahan' : 'Daftarkan Staff'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
