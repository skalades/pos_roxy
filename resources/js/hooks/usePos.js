import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';

export default function usePos(initialCart = []) {
    const [cart, setCart] = useState(initialCart);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Calculate totals using useMemo for performance
    const totals = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.1); 
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [cart]);

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

    const handleCheckout = (paymentData, onSuccessCallback) => {
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
            subtotal: totals.subtotal,
            tax_amount: totals.tax,
            total_amount: totals.total,
            amount_paid: paymentData.amountPaid,
            change_amount: paymentData.change,
            notes: ''
        }, {
            onSuccess: (page) => {
                if (!page?.props?.flash?.error) {
                    setCart([]);
                    setSelectedCustomer(null);
                    if (onSuccessCallback) onSuccessCallback();
                }
                setProcessing(false);
            },
            onError: (errors) => {
                console.error('Validation Errors:', errors);
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
        ...totals,
        addToCart,
        removeFromCart,
        updateQuantity,
        handleCheckout
    };
}
