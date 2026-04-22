export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={
                `inline-flex items-center justify-center bg-roxy-primary hover:bg-roxy-primary-dark text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs ` +
                className
            }
        >
            {children}
        </button>
    );
}
