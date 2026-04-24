import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { Store, MapPin, Phone, Mail, User, Clock, Settings, ShieldCheck } from 'lucide-react';

export default function BranchModal({ show, onClose, branch = null, managers = [] }) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        manager_id: '',
        latitude: '',
        longitude: '',
        geofence_radius: 50,
        opening_time: '09:00',
        closing_time: '21:00',
        is_active: true,
        require_attendance_for_shift: true,
        strict_attendance_policy: false,
        enable_attendance_deduction: false,
        late_penalty_amount: 0,
    });

    useEffect(() => {
        if (branch) {
            setData({
                name: branch.name || '',
                code: branch.code || '',
                address: branch.address || '',
                phone: branch.phone || '',
                email: branch.email || '',
                manager_id: branch.manager_id || '',
                latitude: branch.latitude || '',
                longitude: branch.longitude || '',
                geofence_radius: branch.geofence_radius || 50,
                opening_time: branch.opening_time || '09:00',
                closing_time: branch.closing_time || '21:00',
                is_active: branch.is_active ?? true,
                require_attendance_for_shift: branch.require_attendance_for_shift ?? true,
                strict_attendance_policy: branch.strict_attendance_policy ?? false,
                enable_attendance_deduction: branch.enable_attendance_deduction ?? false,
                late_penalty_amount: branch.late_penalty_amount || 0,
            });
        } else {
            reset();
        }
    }, [branch, show]);

    const submit = (e) => {
        e.preventDefault();
        if (branch) {
            put(route('branches.update', branch.id), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('branches.store'), {
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
                        <Store size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                            {branch ? 'Edit Cabang' : 'Cabang Baru'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Atur detail outlet dan operasional</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
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
                        <InputLabel htmlFor="name" value="Nama Cabang" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="Contoh: Roxy Barbershop Bali"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="code" value="Kode Cabang" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="code"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            required
                            placeholder="Contoh: RX01"
                        />
                        <InputError message={errors.code} className="mt-2" />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <InputLabel htmlFor="address" value="Alamat Lengkap" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <textarea
                            id="address"
                            className="mt-1 block w-full border-slate-100 focus:border-roxy-primary focus:ring-roxy-primary/10 rounded-2xl py-4 px-5 font-bold text-slate-700 shadow-sm min-h-[100px] transition-all"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            required
                            placeholder="Alamat lengkap outlet..."
                        />
                        <InputError message={errors.address} className="mt-2" />
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
                        <InputLabel htmlFor="email" value="Email Cabang" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="bali@roxybarber.com"
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    {/* Operational */}
                    <div className="md:col-span-2 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <Clock size={16} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Operasional & Staff</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="manager_id" value="Manager Cabang" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <select
                            id="manager_id"
                            className="mt-1 block w-full border-slate-100 focus:border-roxy-primary focus:ring-roxy-primary/10 rounded-2xl py-4 px-5 font-bold text-slate-700 shadow-sm transition-all"
                            value={data.manager_id}
                            onChange={(e) => setData('manager_id', e.target.value)}
                        >
                            <option value="">Pilih Manager</option>
                            {managers.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.manager_id} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <InputLabel htmlFor="opening_time" value="Jam Buka" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                            <TextInput
                                id="opening_time"
                                type="time"
                                className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                                value={data.opening_time}
                                onChange={(e) => setData('opening_time', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <InputLabel htmlFor="closing_time" value="Jam Tutup" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                            <TextInput
                                id="closing_time"
                                type="time"
                                className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                                value={data.closing_time}
                                onChange={(e) => setData('closing_time', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Geolocation */}
                    <div className="md:col-span-2 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <MapPin size={16} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Geolocation (Geofence)</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="latitude" value="Latitude" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="latitude"
                            type="number"
                            step="any"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.latitude}
                            onChange={(e) => setData('latitude', e.target.value)}
                            placeholder="-6.123456"
                        />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="longitude" value="Longitude" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="longitude"
                            type="number"
                            step="any"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.longitude}
                            onChange={(e) => setData('longitude', e.target.value)}
                            placeholder="106.123456"
                        />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="geofence_radius" value="Radius Absen (Meter)" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                        <TextInput
                            id="geofence_radius"
                            type="number"
                            className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                            value={data.geofence_radius}
                            onChange={(e) => setData('geofence_radius', e.target.value)}
                        />
                    </div>

                    {/* Policies */}
                    <div className="md:col-span-2 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <ShieldCheck size={16} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Kebijakan & Status</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-roxy-primary/5 hover:border-roxy-primary/10 transition-all">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.require_attendance_for_shift}
                                    onChange={(e) => setData('require_attendance_for_shift', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-roxy-primary shadow-inner"></div>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover:text-roxy-primary transition-colors">Wajib Absen</span>
                                <p className="text-[9px] text-slate-500 font-medium leading-tight">Staff harus selfie & GPS sebelum buka shift</p>
                            </div>
                        </label>

                        <label className="flex items-center gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-roxy-primary/5 hover:border-roxy-primary/10 transition-all">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.strict_attendance_policy}
                                    onChange={(e) => setData('strict_attendance_policy', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-roxy-primary shadow-inner"></div>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover:text-roxy-primary transition-colors">Kebijakan Ketat</span>
                                <p className="text-[9px] text-slate-500 font-medium leading-tight">Blokir akses sistem jika di luar lokasi/jam kerja</p>
                            </div>
                        </label>
                    </div>
                    
                    {/* Payroll Settings */}
                    <div className="md:col-span-2 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                                <ShieldCheck size={16} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Pengaturan Payroll</h3>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-roxy-primary/5 hover:border-roxy-primary/10 transition-all">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.enable_attendance_deduction}
                                    onChange={(e) => setData('enable_attendance_deduction', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover:text-rose-500 transition-colors">Potongan Absen</span>
                                <p className="text-[9px] text-slate-500 font-medium leading-tight">Potong gaji otomatis jika terlambat absen</p>
                            </div>
                        </label>

                        {data.enable_attendance_deduction && (
                            <div className="space-y-2">
                                <InputLabel htmlFor="late_penalty_amount" value="Denda Keterlambatan (Rp)" className="!text-[10px] !font-black !uppercase !tracking-widest !text-slate-400" />
                                <TextInput
                                    id="late_penalty_amount"
                                    type="number"
                                    className="mt-1 block w-full !rounded-2xl !border-slate-100 focus:!ring-roxy-primary/10 focus:!border-roxy-primary !py-4 !px-5 !font-bold !text-slate-700"
                                    value={data.late_penalty_amount}
                                    onChange={(e) => setData('late_penalty_amount', e.target.value)}
                                    placeholder="Contoh: 10000"
                                />
                                <InputError message={errors.late_penalty_amount} className="mt-2" />
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
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
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Status Cabang Aktif</span>
                                <p className="text-[10px] text-slate-500 font-medium">Nonaktifkan untuk menutup operasional sementara</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mt-12 flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur-md pt-6 pb-2 border-t border-slate-100">
                    <SecondaryButton onClick={handleClose} type="button" className="!rounded-2xl !py-4 !px-8 !border-slate-200 !text-[11px] !font-black !uppercase !tracking-widest">
                        Batal
                    </SecondaryButton>
                    <PrimaryButton className="!rounded-2xl !py-4 !px-12 !bg-roxy-primary shadow-xl shadow-roxy-primary/30 !font-black !uppercase !tracking-widest !text-[11px] transition-all hover:scale-105 active:scale-95" disabled={processing}>
                        {branch ? 'Simpan Perubahan' : 'Daftarkan Cabang'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
