import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import * as Icons from 'lucide-react';

export default function CustomerSelectionModal({ show, onClose, customers, onSelect }) {
    const [search, setSearch] = useState('');
    
    const capitalize = (str) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        (customer.phone && customer.phone.includes(search))
    );

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">Pilih Pelanggan</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Cari atau tambah pelanggan baru</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-90">
                        <Icons.X size={24} />
                    </button>
                </div>

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

                        {filteredCustomers.length === 0 && search && (
                            <div className="py-8 text-center">
                                <p className="text-slate-400 text-sm">Pelanggan tidak ditemukan</p>
                                <button className="mt-4 text-roxy-primary font-bold text-sm flex items-center gap-2 mx-auto hover:underline">
                                    <Icons.PlusCircle size={16} />
                                    Tambah "{search}" Baru
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
