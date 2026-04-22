import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import * as Icons from 'lucide-react';
import BarberSelectionModal from './Partials/BarberSelectionModal';
import CustomerSelectionModal from './Partials/CustomerSelectionModal';
import PaymentModal from './Partials/PaymentModal';

export default function PosIndex({ services, products, categories, barbers, customers, current_shift }) {
    const { auth, flash } = usePage().props;
    const [cart, setCart] = useState([]);
    const [activeTab, setActiveTab] = useState('services');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showMobileCart, setShowMobileCart] = useState(false);
    
    // Modal States
    const [showBarberModal, setShowBarberModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [tempItem, setTempItem] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Calculate totals
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.1); 
    const total = subtotal + tax;

    const handleItemClick = (item, type) => {
        if (type === 'service') {
            setTempItem(item);
            setShowBarberModal(true);
        } else {
            addToCart(item, type);
        }
    };

    const addToCart = (item, type, barber = null) => {
        if (!item) return;

        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(i => 
                i.id === item.id && 
                i.type === type && 
                (type === 'service' ? i.barber_id === barber?.id : true)
            );

            if (existingIndex > -1) {
                return prevCart.map((i, idx) => 
                    idx === existingIndex 
                    ? { ...i, quantity: i.quantity + 1 } 
                    : i
                );
            } else {
                return [...prevCart, { 
                    ...item, 
                    type, 
                    quantity: 1, 
                    barber_id: barber?.id,
                    barber_name: barber?.name
                }];
            }
        });

        setShowBarberModal(false);
        // Don't clear tempItem immediately to avoid race conditions if any
        setTimeout(() => setTempItem(null), 100);
    };

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, delta) => {
        setCart(cart.map((item, i) => {
            if (i === index) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleCheckout = (paymentData) => {
        setProcessing(true);
        router.post(route('pos.store'), {
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                quantity: item.quantity,
                price: item.price,
                barber_id: item.barber_id
            })),
            customer_id: selectedCustomer?.id,
            payment_method: paymentData.paymentMethod,
            subtotal,
            tax_amount: tax,
            total_amount: total,
            amount_paid: paymentData.amountPaid,
            change_amount: paymentData.change,
            notes: ''
        }, {
            onSuccess: () => {
                setCart([]);
                setSelectedCustomer(null);
                setShowPaymentModal(false);
                setProcessing(false);
            },
            onError: () => setProcessing(false)
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const filteredItems = (activeTab === 'services' ? services : products).filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                        <h2 className="text-xl sm:text-2xl font-black text-roxy-accent tracking-tight">Kasir POS</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest sm:hidden">
                             {activeTab === 'services' ? 'Layanan' : 'Produk'} • {current_shift.status}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="bg-amber-100 text-amber-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-2">
                            <Icons.Clock size={14} className="hidden sm:block" />
                            {new Date(current_shift.opened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="POS - Kasir" />

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-140px)] lg:h-[calc(100vh-180px)] relative overflow-hidden">
                
                {/* Left Side: Product/Service Selection */}
                <div className={`flex-1 flex flex-col gap-4 lg:gap-6 bg-white rounded-[2rem] border border-slate-200 p-4 lg:p-6 shadow-sm overflow-hidden ${showMobileCart ? 'hidden lg:flex' : 'flex'}`}>
                    
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
                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 pb-20 lg:pb-4">
                        {filteredItems.map(item => (
                            <button 
                                key={item.id}
                                onClick={() => handleItemClick(item, activeTab === 'services' ? 'service' : 'product')}
                                className="group relative bg-white border border-slate-100 p-3 lg:p-4 rounded-[1.5rem] lg:rounded-[2rem] text-left hover:border-roxy-primary hover:shadow-xl hover:shadow-roxy-primary/5 transition-all duration-300 flex flex-col gap-2 lg:gap-3"
                            >
                                <div className="w-full aspect-square bg-slate-50 rounded-[1rem] lg:rounded-[1.5rem] overflow-hidden mb-1">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            {activeTab === 'services' ? <Icons.Scissors size={24} className="lg:w-8 lg:h-8" /> : <Icons.Package size={24} className="lg:w-8 lg:h-8" />}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-slate-800 text-[11px] lg:text-sm line-clamp-2 leading-tight h-8 lg:h-10">{item.name}</h5>
                                    <p className="text-roxy-primary font-black text-[12px] lg:text-sm mt-1">{formatCurrency(item.price)}</p>
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
                <div className={`w-full lg:w-[360px] xl:w-[400px] lg:flex flex-col bg-slate-900 lg:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 z-20 ${showMobileCart ? 'fixed inset-0 rounded-none lg:relative lg:rounded-[2.5rem]' : 'hidden lg:flex'}`}>
                    
                    {/* Cart Header (Mobile Only) */}
                    <div className="lg:hidden p-6 bg-slate-800 flex items-center justify-between">
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
                                            <p className="text-[10px] lg:text-xs text-teal-400 font-black">{formatCurrency(item.price)}</p>
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
                                <span className="text-white font-bold">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs lg:text-sm">
                                <span className="text-slate-400">Pajak (10%)</span>
                                <span className="text-white font-bold">{formatCurrency(tax)}</span>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                <span className="text-base lg:text-lg font-bold text-white">Total</span>
                                <span className="text-xl lg:text-2xl font-black text-teal-400">{formatCurrency(total)}</span>
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
                    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-10 duration-500">
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
                                    <p className="text-sm font-black text-teal-400">{formatCurrency(total)}</p>
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
                onSelect={(barber) => addToCart(tempItem, 'service', barber)}
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
                onConfirm={handleCheckout}
            />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-10 duration-300">
                    <div className="bg-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                        <Icons.CheckCircle2 size={24} />
                        <p className="font-bold">{flash.success}</p>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-10 duration-300">
                    <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                        <Icons.AlertCircle size={24} />
                        <p className="font-bold">{flash.error}</p>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

