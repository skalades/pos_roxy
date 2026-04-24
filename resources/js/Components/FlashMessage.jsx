import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState(null);
    const [type, setType] = useState('success'); // success or error

    useEffect(() => {
        if (flash?.success) {
            setMessage(flash.success);
            setType('success');
            setVisible(true);
        } else if (flash?.error) {
            setMessage(flash.error);
            setType('error');
            setVisible(true);
        }
    }, [flash]);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-right-10 duration-500">
            <div 
                className={`
                    flex items-center gap-4 px-6 py-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border
                    ${type === 'success' 
                        ? 'bg-emerald-500 text-white border-emerald-400/20' 
                        : 'bg-rose-500 text-white border-rose-400/20'
                    }
                `}
            >
                <div className="shrink-0">
                    {type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                
                <div className="flex-1 pr-4">
                    <p className="text-sm font-black tracking-tight leading-tight uppercase">{type === 'success' ? 'Sukses' : 'Error'}</p>
                    <p className="text-sm font-bold opacity-90 mt-0.5">{message}</p>
                </div>

                <button 
                    onClick={() => setVisible(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
                
                {/* Timer Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-white animate-progress-shrink" 
                    ></div>
                </div>
            </div>
        </div>
    );
}
