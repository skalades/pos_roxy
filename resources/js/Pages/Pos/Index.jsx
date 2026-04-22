import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import * as Icons from 'lucide-react';
import { formatIDR } from '@/utils/currency';
import { formatDate, formatTime } from '@/utils/datetime';
import BarberSelectionModal from './Partials/BarberSelectionModal';
import CustomerSelectionModal from './Partials/CustomerSelectionModal';
import PaymentModal from './Partials/PaymentModal';
import usePos from '@/hooks/usePos';
export default function PosIndex({ services, products, categories, barbers, customers, current_shift }) {
    const { auth, flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('services');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showMobileCart, setShowMobileCart] = useState(false);
    
    // Modal States
    const [showBarberModal, setShowBarberModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [tempItem, setTempItem] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);


    const {
        cart,
        selectedCustomer,
        setSelectedCustomer,
        processing,
        checkoutError,
        clearCheckoutError,
        subtotal,
        tax,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        handleCheckout
    } = usePos();

    const handleItemClick = (item, type) => {
        if (type === 'service') {
            setTempItem(item);
            setShowBarberModal(true);
        } else {
            addToCart(item, type);
        }
    };

    const onCheckout = (paymentData) => {
        handleCheckout(paymentData, () => {
            setShowPaymentModal(false);
        });
    };

    const filteredItems = (activeTab === 'services' ? services : products).filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-roxy-primary rounded-full shadow-[0_0_15px_rgba(13,148,136,0.5)]"></div>
                        <h2 className="text-2xl sm:text-3xl font-black font-heading leading-tight text-roxy-accent tracking-tight">
                            Kasir POS
                        </h2>
                        <p className="text-sm text-roxy-text-muted mt-1 font-medium">
                            {formatDate(currentTime)} • <span className="text-roxy-primary font-bold">{formatTime(currentTime)}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="bg-white/50 backdrop-blur-sm border border-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Shift Aktif</span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="POS - Kasir" />

            <div className="flex flex-col landscape:flex-row lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-140px)] landscape:h-[calc(100vh-100px)] lg:h-[calc(100vh-180px)] relative overflow-hidden">
                
                {/* Left Side: Product/Service Selection */}
                <div className={`flex-1 flex flex-col gap-4 lg:gap-6 bg-white rounded-[2rem] border border-slate-200 p-4 lg:p-6 shadow-sm overflow-hidden ${showMobileCart ? 'hidden landscape:flex lg:flex' : 'flex'}`}>
                    
                    {/* Tabs & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button 
                                onClick={() => {setActiveTab('services'); setSelectedCategory(null);}}
                                className={`flex-1 sm:flex-none px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-white text-roxy-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                Layanan
                            </button>
                            <button 
                                onClick={() => {setActiveTab('products'); setSelectedCategory(null);}}
                                className={`flex-1 sm:flex-none px-4 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white text-roxy-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                Produk
                            </button>
                        </div>

                        <div className="relative flex-1 sm:max-w-[240px]">
                            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Cari..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl text-xs lg:text-sm focus:ring-2 focus:ring-roxy-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
                        <button 
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-1.5 rounded-full text-[10px] lg:text-xs font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-roxy-accent text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                            Semua
                        </button>
                        {categories.filter(c => c.type === (activeTab === 'services' ? 'service' : 'product')).map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-[10px] lg:text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-roxy-accent text-white' : 'bg-slate-100 text-slate-500'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Grid Items */}
                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-4 pb-24 lg:pb-4">
                        {filteredItems.map(item => (
                            <button 
                                key={item.id}
                                onClick={() => handleItemClick(item, activeTab === 'services' ? 'service' : 'product')}
                                className="group relative bg-white border border-slate-100 p-4 lg:p-4 rounded-[2rem] text-left hover:border-roxy-primary hover:shadow-xl hover:shadow-roxy-primary/5 transition-all duration-300 flex flex-col gap-3 active:scale-95 active:bg-slate-50"
                            >
                                <div className="w-full aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden mb-1">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            {activeTab === 'services' ? <Icons.Scissors size={24} className="lg:w-8 lg:h-8" /> : <Icons.Package size={24} className="lg:w-8 lg:h-8" />}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-slate-800 text-[12px] lg:text-sm line-clamp-2 leading-tight h-10">{item.name}</h5>
                                    <p className="text-roxy-primary font-black text-[13px] lg:text-sm mt-1">{formatIDR(item.price)}</p>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-roxy-primary text-white p-1.5 rounded-lg lg:rounded-xl shadow-lg">
                                        <Icons.Plus size={14} className="lg:w-4 lg:h-4" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Side: Cart & Checkout (Desktop: Sidebar, Mobile: Adaptive Drawer) */}
                <div className={`w-full landscape:w-[320px] lg:w-[360px] xl:w-[400px] flex flex-col bg-slate-900 lg:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 z-20 ${showMobileCart ? 'fixed inset-0 rounded-none landscape:relative landscape:rounded-[2rem] lg:relative lg:rounded-[2.5rem]' : 'hidden landscape:flex lg:flex'}`}>
                    
                    {/* Cart Header (Mobile Only - Portrait) */}
                    <div className="landscape:hidden lg:hidden p-6 bg-slate-800 flex items-center justify-between">
                        <h4 className="text-white font-black flex items-center gap-2">
                            <Icons.ShoppingCart size={20} />
                            Keranjang Belanja
                        </h4>
                        <button onClick={() => setShowMobileCart(false)} className="text-slate-400 hover:text-white p-2">
                            <Icons.X size={24} />
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
                                    <Icons.User size={18} className="lg:w-5 lg:h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[8px] lg:text-[10px] text-slate-500 uppercase font-bold tracking-widest">Pelanggan</p>
                                    <p className="text-xs lg:text-sm text-white font-bold truncate max-w-[120px]">
                                        {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                                    </p>
                                </div>
                            </div>
                            <Icons.ChevronRight className="text-slate-600 group-hover:text-white" size={16} />
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                                <Icons.ShoppingCart size={40} className="lg:w-12 lg:h-12" />
                                <p className="text-xs lg:text-sm font-medium">Keranjang masih kosong</p>
                            </div>
                        ) : (
                            cart.map((item, index) => (
                                <div key={`${item.type}-${item.id}-${index}`} className="flex items-center gap-3 lg:gap-4 group">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                                        {item.type === 'service' ? <Icons.Scissors size={18} /> : <Icons.Package size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h6 className="text-xs lg:text-sm font-bold text-white truncate">{item.name}</h6>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] lg:text-xs text-teal-400 font-black">{formatIDR(item.price)}</p>
                                            {item.barber_name && (
                                                <span className="text-[8px] lg:text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                    <Icons.User size={8} /> {item.barber_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 lg:gap-2 bg-white/5 rounded-lg lg:rounded-xl p-1 border border-white/5">
                                        <button 
                                            onClick={() => updateQuantity(index, -1)}
                                            className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md lg:rounded-lg hover:bg-white/10 text-slate-400"
                                        >
                                            <Icons.Minus size={12} />
                                        </button>
                                        <span className="w-5 lg:w-6 text-center text-[10px] lg:text-xs font-bold text-white">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(index, 1)}
                                            className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md lg:rounded-lg hover:bg-white/10 text-slate-400"
                                        >
                                            <Icons.Plus size={12} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(index)}
                                        className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                                    >
                                        <Icons.Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer / Summary */}
                    <div className="p-6 lg:p-8 bg-black/40 backdrop-blur-xl border-t border-white/5 space-y-4 lg:space-y-6">
                        <div className="space-y-2 lg:space-y-3">
                            <div className="flex justify-between text-xs lg:text-sm">
                                <span className="text-slate-400">Subtotal</span>
                                <span className="text-white font-bold">{formatIDR(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs lg:text-sm">
                                <span className="text-slate-400">Pajak (10%)</span>
                                <span className="text-white font-bold">{formatIDR(tax)}</span>
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

                {/* Mobile Floating Action Bar (Portrait Only) */}
                {!showMobileCart && cart.length > 0 && (
                    <div className="landscape:hidden lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-10 duration-500">
                        <button 
                            onClick={() => setShowMobileCart(true)}
                            className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Icons.ShoppingCart size={24} className="text-teal-400" />
                                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Belanja</p>
                                    <p className="text-sm font-black text-teal-400">{formatIDR(total)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-widest">
                                Lihat Detail
                                <Icons.ChevronUp size={16} />
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <BarberSelectionModal 
                show={showBarberModal} 
                onClose={() => setShowBarberModal(false)}
                barbers={barbers}
                selectedItem={tempItem}
                onSelect={(barber) => {
                    addToCart(tempItem, 'service', barber);
                    setShowBarberModal(false);
                    setTimeout(() => setTempItem(null), 100);
                }}
            />

            <CustomerSelectionModal 
                show={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                customers={customers}
                onSelect={(customer) => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                }}
            />

            <PaymentModal 
                show={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                total={total}
                processing={processing}
                onConfirm={onCheckout}
            />

            {/* Flash Messages */}
            {flash?.success && (
            {/* Local Error Messages (Validation) */}
            {checkoutError && (
                <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-10 duration-300">
                    <div className="bg-rose-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400/20">
                        <Icons.AlertCircle size={24} />
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Gagal Checkout</p>
                            <p className="font-bold text-sm">{checkoutError}</p>
                        </div>
                        <button onClick={clearCheckoutError} className="ml-2 hover:opacity-70 p-1">
                            <Icons.X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

