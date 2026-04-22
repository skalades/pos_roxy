import React from 'react';
import Modal from '@/Components/Modal';
import * as Icons from 'lucide-react';

export default function BarberSelectionModal({ show, onClose, barbers, onSelect, selectedItem }) {
    const capitalize = (str) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">Pilih Barber</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Siapa yang melayani <span className="text-roxy-primary font-bold">{selectedItem?.name}</span>?</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-90">
                        <Icons.X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {barbers.map((barber) => (
                        <button
                            key={barber.id}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onSelect(barber);
                            }}
                            className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-roxy-primary/10 border-2 border-slate-100 hover:border-roxy-primary rounded-[1.8rem] transition-all group text-left relative overflow-hidden active:scale-95"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-roxy-primary text-white flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform relative z-10 shadow-lg shadow-roxy-primary/20">
                                {barber.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="relative z-10">
                                <p className="font-bold text-slate-900 text-base leading-tight">{capitalize(barber.name)}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Barber Active</p>
                            </div>
                            <div className="ml-auto relative z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <Icons.ChevronRight size={20} className="text-roxy-primary" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-roxy-primary/0 to-roxy-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
