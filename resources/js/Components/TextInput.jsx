import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'bg-white/50 border-slate-200 focus:border-roxy-primary focus:ring-4 focus:ring-roxy-primary/10 rounded-2xl shadow-sm transition-all duration-300 h-14 px-6 text-roxy-text-main placeholder:text-slate-400 ' +
                className
            }
            ref={localRef}
        />
    );
});
