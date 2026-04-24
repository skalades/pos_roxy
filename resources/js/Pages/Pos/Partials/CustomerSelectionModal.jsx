import React, { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import * as Icons from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function CustomerSelectionModal({ show, onClose, onSelect }) {
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [newData, setNewData] = useState({
        name: '',
        phone: ''
    });
    
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setLoading(true);
            const delayDebounceFn = setTimeout(() => {
                axios.get(route('api.pos.customers'), {
                    params: { search }
                }).then(res => {
                    setCustomers(res.data);
                    setLoading(false);
                }).catch(err => {
                    console.error("Error fetching customers", err);
                    setLoading(false);
                });
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [search, show]);

    const capitalize = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const filteredCustomers = customers;

    const handleQuickAdd = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('customers.store'), newData, {
            onSuccess: () => {
                setProcessing(false);
                setIsAdding(false);
                setNewData({ name: '', phone: '' });
                setSearch('');
            },
            onError: () => setProcessing(false)
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">
                            {isAdding ? 'Tambah Pelanggan' : 'Pilih Pelanggan'}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {isAdding ? 'Daftarkan pelanggan baru ke sistem' : 'Cari atau tambah pelanggan baru'}
                        </p>
                    </div>
                    <button 
                        onClick={() => isAdding ? setIsAdding(false) : onClose()} 
                        className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-90"
                    >
                        {isAdding ? <Icons.ArrowLeft size={24} /> : <Icons.X size={24} />}
                    </button>
                </div>

                {isAdding ? (
                    <form onSubmit={handleQuickAdd} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                <div className="relative">
                                    <Icons.User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input 
                                        type="text"
                                        required
                                        autoFocus
                                        value={newData.name}
                                        onChange={e => setNewData({...newData, name: e.target.value})}
                                        placeholder="Masukkan nama..."
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Handphone</label>
                                <div className="relative">
                                    <Icons.Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input 
                                        type="tel"
                                        value={newData.phone}
                                        onChange={e => setNewData({...newData, phone: e.target.value})}
                                        placeholder="0812xxxx..."
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={processing}
                            className="w-full bg-roxy-primary hover:bg-roxy-primary-dark text-white py-4 rounded-3xl font-black text-sm shadow-lg shadow-roxy-primary/20 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 uppercase tracking-widest"
                        >
                            {processing ? <Icons.Loader2 className="animate-spin" size={20} /> : <Icons.UserPlus size={20} />}
                            Simpan Pelanggan
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-roxy-primary transition-colors" size={20} />
                            <input 
                                type="text"
                                placeholder="Cari nama atau nomor HP..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary transition-all"
                            />
                        </div>

                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                            {/* Walk-in option */}
                            <button
                                type="button"
                                onClick={() => onSelect(null)}
                                className="w-full flex items-center gap-4 p-5 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl transition-all group text-left active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                                    <Icons.User size={24} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-700 text-base">Walk-in Customer</p>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Pelanggan Umum</p>
                                </div>
                            </button>

                            {filteredCustomers.map((customer) => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onSelect(customer);
                                    }}
                                    className="w-full flex items-center gap-4 p-5 bg-white hover:bg-teal-50 border-2 border-slate-50 hover:border-teal-100 rounded-[1.8rem] transition-all group text-left relative overflow-hidden active:scale-[0.98] shadow-sm"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform relative z-10">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 relative z-10">
                                        <p className="font-black text-slate-800 text-base truncate">{capitalize(customer.name)}</p>
                                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">{customer.phone || 'Tanpa Nomor HP'}</p>
                                    </div>
                                    <div className="relative z-10 text-teal-500 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <Icons.CheckCircle2 size={24} />
                                    </div>
                                </button>
                            ))}

                            <div className="py-4 text-center">
                                <button 
                                    onClick={() => {
                                        setIsAdding(true);
                                        setNewData({...newData, name: search});
                                    }}
                                    className="text-roxy-primary font-bold text-sm flex items-center gap-2 mx-auto hover:underline p-4"
                                >
                                    <Icons.PlusCircle size={18} />
                                    {search ? `Tambah "${search}" Baru` : 'Tambah Pelanggan Baru'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
