import React, { useState, useEffect } from 'react';
import { formatIDR, parseIDR } from '../utils/currency';

export default function CurrencyInput({ value, onChange, className = '', ...props }) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        setDisplayValue(value ? formatIDR(value) : '');
    }, [value]);

    const handleChange = (e) => {
        const rawValue = parseIDR(e.target.value);
        setDisplayValue(formatIDR(rawValue));
        if (onChange) {
            onChange(rawValue);
        }
    };

    return (
        <input
            {...props}
            type="text"
            className={
                'border-roxy-border focus:border-roxy-primary focus:ring-roxy-primary rounded-md shadow-sm ' +
                className
            }
            value={displayValue}
            onChange={handleChange}
        />
    );
}
