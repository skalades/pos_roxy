import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';

/**
 * Custom hook untuk logika POS.
 * @param {Array} initialCart - Cart awal
 * @param {number} taxRate - Tax rate dari branch config (default 10%)
 * @param {boolean} enableTax - Status aktif pajak
 * @param {number} memberDiscountRate - Diskon tetap untuk member (%)
 * @param {Array} activePromotions - Daftar promosi aktif
 */
export default function usePos(initialCart = [], taxRate = 10, enableTax = true, memberDiscountRate = 0, activePromotions = []) {
    const [cart, setCart] = useState(initialCart);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [manualDiscount, setManualDiscount] = useState({ type: 'fixed', value: 0 });
    const [processing, setProcessing] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);

    // Hitung total pakai useMemo untuk performa
    const totals = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        let discountAmount = 0;
        let discountLabel = '';

        // 1. Tentukan diskon otomatis (Member atau Event)
        let autoDiscountRate = 0;
        let autoDiscountLabel = '';

        if (selectedCustomer && memberDiscountRate > 0) {
            autoDiscountRate = memberDiscountRate;
            autoDiscountLabel = `Member (${memberDiscountRate}%)`;
        }

        // Cek promo (ambil yang terbesar)
        activePromotions.forEach(promo => {
            if (promo.discount_type === 'percentage' && promo.discount_value > autoDiscountRate) {
                autoDiscountRate = promo.discount_value;
                autoDiscountLabel = promo.name;
            }
        });

        // 2. Terapkan diskon (Manual override Otomatis)
        if (manualDiscount.value > 0) {
            if (manualDiscount.type === 'percentage') {
                discountAmount = Math.round(subtotal * (manualDiscount.value / 100));
                discountLabel = `Manual (${manualDiscount.value}%)`;
            } else {
                discountAmount = Number(manualDiscount.value);
                discountLabel = 'Manual (Rp)';
            }
        } else if (autoDiscountRate > 0) {
            discountAmount = Math.round(subtotal * (autoDiscountRate / 100));
            discountLabel = autoDiscountLabel;
        }

        const discountedSubtotal = Math.max(0, subtotal - discountAmount);
        const tax = enableTax ? Math.round(discountedSubtotal * (taxRate / 100)) : 0;
        const total = discountedSubtotal + tax;

        return { subtotal, tax, total, discountAmount, discountLabel };
    }, [cart, taxRate, enableTax, manualDiscount, selectedCustomer, memberDiscountRate, activePromotions]);

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
                    barber_name: barber?.name,
                    commission_rate: barber?.commission_rate || 0
                }];
            }
        });
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

    const clearCheckoutError = () => setCheckoutError(null);

    const handleCheckout = (paymentData, onSuccessCallback) => {
        setProcessing(true);
        setCheckoutError(null);

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
            subtotal: totals.subtotal,
            tax_amount: totals.tax,
            discount_amount: totals.discountAmount,
            manual_discount_type: manualDiscount.value > 0 ? manualDiscount.type : null,
            manual_discount_value: manualDiscount.value > 0 ? manualDiscount.value : null,
            total_amount: totals.total,
            amount_paid: paymentData.amountPaid,
            change_amount: paymentData.change,
            notes: ''
        }, {
            onSuccess: (page) => {
                if (!page?.props?.flash?.error) {
                    setCart([]);
                    setSelectedCustomer(null);
                    setManualDiscount({ type: 'fixed', value: 0 });
                    if (onSuccessCallback) onSuccessCallback();
                }
                setProcessing(false);
            },
            onError: (errors) => {
                // Tampilkan error validasi ke UI
                const firstError = Object.values(errors)[0];
                setCheckoutError(firstError || 'Terjadi kesalahan validasi. Periksa kembali data transaksi.');
                setProcessing(false);
            },
            onFinish: () => setProcessing(false)
        });
    };

    return {
        cart,
        setCart,
        selectedCustomer,
        setSelectedCustomer,
        processing,
        checkoutError,
        clearCheckoutError,
        manualDiscount,
        setManualDiscount,
        ...totals,
        addToCart,
        removeFromCart,
        updateQuantity,
        handleCheckout
    };
}
