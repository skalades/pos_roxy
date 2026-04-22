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
                'rounded-xl border-roxy-border shadow-sm focus:border-roxy-primary focus:ring-roxy-primary text-roxy-textMain placeholder:text-roxy-textMuted/50 transition-all duration-200 ' +
                className
            }
            ref={localRef}
        />
    );
});
