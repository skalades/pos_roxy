import React, { useState, useEffect } from 'react';
import { parseIDR } from '@/utils/currency';

export default function CurrencyInput({ 
    value, 
    onChange, 
    id, 
    placeholder = "0", 
    required = false,
    className = "",
    ...props 
}) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Format for display: 1.000.000 (no Rp prefix here as it's usually handled by the layout)
        if (value === '' || value === null || value === undefined) {
            setDisplayValue('');
        } else {
            setDisplayValue(new Intl.NumberFormat('id-ID').format(value));
        }
    }, [value]);

    const handleChange = (e) => {
        const input = e.target.value;
        const numericValue = input.replace(/\D/g, '');
        
        // Update parent state with raw number
        if (onChange) {
            onChange(numericValue);
        }
    };

    return (
        <div className="relative group">
            <input
                {...props}
                id={id}
                type="text"
                className={`w-full pl-16 pr-6 py-5 bg-slate-50 border-slate-200 rounded-3xl text-xl font-black text-slate-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${className}`}
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}
