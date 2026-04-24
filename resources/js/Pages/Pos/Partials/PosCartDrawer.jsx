import React from 'react';
import { ShoppingCart, X, User, ChevronRight, Scissors, Package, Minus, Plus, Trash2 } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function PosCartDrawer({
    cart,
    selectedCustomer,
    setShowCustomerModal,
    updateQuantity,
    removeFromCart,
    subtotal,
    tax,
    tax_rate,
    total,
    discountAmount,
    discountLabel,
    manualDiscount,
    setShowPaymentModal,
    setShowDiscountModal,
    showMobileCart,
    setShowMobileCart
}) {
    return (
        <div className={`w-full landscape:w-[320px] lg:w-[360px] xl:w-[400px] flex flex-col bg-slate-900 lg:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 z-20 ${showMobileCart ? 'fixed inset-0 rounded-none landscape:relative landscape:rounded-[2rem] lg:relative lg:rounded-[2.5rem]' : 'hidden landscape:flex lg:flex'}`}>
            
            {/* Cart Header (Mobile Only - Portrait) */}
            <div className="landscape:hidden lg:hidden p-6 bg-slate-800 flex items-center justify-between">
                <h4 className="text-white font-black flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Keranjang Belanja
                </h4>
                <button onClick={() => setShowMobileCart(false)} className="text-slate-400 hover:text-white p-2">
                    <X size={24} />
                </button>
            </div>

            {/* Customer Section */}
            <div className="p-4 lg:p-6 border-b border-white/5">
                <button 
                    onClick={() => setShowCustomerModal(true)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-3 lg:p-4 rounded-xl lg:rounded-2xl flex items-center justify-between transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                            <User size={18} className="lg:w-5 lg:h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-bold tracking-widest">Pelanggan</p>
                            <p className="text-xs lg:text-sm text-white font-bold truncate max-w-[120px]">
                                {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-600 group-hover:text-white" size={16} />
                </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                        <ShoppingCart size={40} className="lg:w-12 lg:h-12" />
                        <p className="text-xs lg:text-sm font-medium">Keranjang masih kosong</p>
                    </div>
                ) : (
                    cart.map((item, index) => (
                        <div key={`${item.type}-${item.id}-${index}`} className="flex items-center gap-3 lg:gap-4 group">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                                {item.type === 'service' ? <Scissors size={18} /> : <Package size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h6 className="text-xs lg:text-sm font-bold text-white truncate">{item.name}</h6>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] lg:text-xs text-teal-400 font-black">{formatIDR(item.price)}</p>
                                    {item.barber_name && (
                                        <span className="text-[8px] lg:text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                            <User size={8} /> {item.barber_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 lg:gap-2 bg-white/5 rounded-lg lg:rounded-xl p-1 border border-white/5">
                                <button 
                                    onClick={() => updateQuantity(index, -1)}
                                    className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md lg:rounded-lg hover:bg-white/10 text-slate-400"
                                >
                                    <Minus size={12} />
                                </button>
                                <span className="w-5 lg:w-6 text-center text-[10px] lg:text-xs font-bold text-white">{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(index, 1)}
                                    className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md lg:rounded-lg hover:bg-white/10 text-slate-400"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                            <button 
                                onClick={() => removeFromCart(index)}
                                className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Summary */}
            <div className="p-6 lg:p-8 bg-black/60 border-t border-white/5 space-y-4 lg:space-y-6">
                <div className="space-y-2 lg:space-y-3">
                    <div className="flex justify-between text-xs lg:text-sm">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="text-white font-bold">{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs lg:text-sm">
                        <span className="text-slate-400">Pajak ({tax_rate}%)</span>
                        <span className="text-white font-bold">{formatIDR(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs lg:text-sm pt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Potongan Harga</span>
                            {discountAmount > 0 && (
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${manualDiscount.value > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'}`}>
                                    {discountLabel}
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={() => setShowDiscountModal(true)}
                            className="text-teal-400 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                            {discountAmount > 0 ? formatIDR(discountAmount) : 'Tambah Diskon'}
                        </button>
                    </div>
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-base lg:text-lg font-bold text-white">Total</span>
                        <span className="text-xl lg:text-2xl font-black text-teal-400">{formatIDR(total)}</span>
                    </div>
                </div>

                <button 
                    disabled={cart.length === 0}
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-teal-400 text-slate-900 py-3.5 lg:py-4 rounded-xl lg:rounded-2xl text-sm lg:text-base font-black transition-all shadow-xl shadow-teal-500/20 uppercase tracking-widest"
                >
                    Bayar Sekarang
                </button>
            </div>
        </div>
    );
}
