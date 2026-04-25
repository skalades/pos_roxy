import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { ShoppingCart, ChevronUp, Printer, CheckCircle, X, AlertCircle } from 'lucide-react';
import PrinterService from '@/Services/PrinterService';
import { formatIDR } from '@/utils/currency';
import { formatDate, formatTime } from '@/utils/datetime';
import BarberSelectionModal from './Partials/BarberSelectionModal';
import CustomerSelectionModal from './Partials/CustomerSelectionModal';
import PaymentModal from './Partials/PaymentModal';
import ManualDiscountModal from './Partials/ManualDiscountModal';
import usePos from '@/hooks/usePos';
import PosProductGrid from './Partials/PosProductGrid';
import PosCartDrawer from './Partials/PosCartDrawer';
import PageHeader from '@/Components/PageHeader';

export default function PosIndex({ services, categories, barbers, current_shift, tax_rate = 10, enable_tax = true, member_discount_rate = 0, active_promotions = [] }) {
    const { auth, flash, app_settings } = usePage().props;
    const [activeTab, setActiveTab] = useState('services');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showMobileCart, setShowMobileCart] = useState(false);
    
    // Modal States
    const [showBarberModal, setShowBarberModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
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
        discountAmount,
        manualDiscount,
        setManualDiscount,
        addToCart,
        removeFromCart,
        updateQuantity,
        handleCheckout,
        discountLabel,
    } = usePos([], tax_rate, enable_tax, member_discount_rate, active_promotions);

    const handleItemClick = (item, type) => {
        if (type === 'service') {
            setTempItem(item);
            setShowBarberModal(true);
        } else {
            addToCart(item, type);
        }
    };

    const onCheckout = (paymentData, onSuccess) => {
        handleCheckout(paymentData, onSuccess);
    };

    return (
        <AuthenticatedLayout
            withMobileCartSpace={true}
            header={
                <PageHeader 
                    title="Kasir POS"
                    backHref={route('dashboard')}
                    subtitle={`${formatDate(currentTime)} • ${formatTime(currentTime)}`}
                    badge="Shift Aktif"
                    showClock={false}
                />
            }
        >
            <Head title="POS - Kasir" />

            <div className="flex flex-col landscape:flex-row lg:flex-row gap-4 lg:gap-6 h-[calc(100dvh-140px)] landscape:h-[calc(100dvh-100px)] lg:h-[calc(100dvh-180px)] relative overflow-hidden">
                
                <PosProductGrid 
                    services={services}
                    categories={categories}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    onItemClick={handleItemClick}
                    showMobileCart={showMobileCart}
                    cart={cart}
                />

                <PosCartDrawer 
                    cart={cart}
                    selectedCustomer={selectedCustomer}
                    setShowCustomerModal={setShowCustomerModal}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                    subtotal={subtotal}
                    tax={tax}
                    tax_rate={tax_rate}
                    total={total}
                    discountAmount={discountAmount}
                    discountLabel={discountLabel}
                    manualDiscount={manualDiscount}
                    setShowPaymentModal={setShowPaymentModal}
                    setShowDiscountModal={setShowDiscountModal}
                    showMobileCart={showMobileCart}
                    setShowMobileCart={setShowMobileCart}
                />

                {/* Mobile Floating Action Bar (Portrait Only) */}
                {!showMobileCart && cart.length > 0 && (
                    <div className="landscape:hidden lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-10 duration-500">
                        <button 
                            onClick={() => setShowMobileCart(true)}
                            className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <ShoppingCart size={24} className="text-roxy-primary" />
                                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Belanja</p>
                                    <p className="text-sm font-black text-roxy-primary">{formatIDR(total)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-roxy-primary font-bold text-xs uppercase tracking-widest">
                                Lihat Detail
                                <ChevronUp size={16} />
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
                onSelect={(customer) => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                }}
            />

            <PaymentModal 
                show={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                total={total}
                cart={cart}
                selectedCustomer={selectedCustomer}
                processing={processing}
                onConfirm={onCheckout}
            />

            <ManualDiscountModal 
                show={showDiscountModal}
                onClose={() => setShowDiscountModal(false)}
                currentDiscount={manualDiscount}
                subtotal={subtotal}
                onConfirm={(data) => setManualDiscount(data)}
            />

            {/* Local Error Messages (Validation) */}
            {checkoutError && (
                <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-10 duration-300">
                    <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400/20">
                        <AlertCircle size={24} />
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Gagal Checkout</p>
                            <p className="font-bold text-sm">{checkoutError}</p>
                        </div>
                        <button onClick={clearCheckoutError} className="ml-2 hover:opacity-70 p-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

