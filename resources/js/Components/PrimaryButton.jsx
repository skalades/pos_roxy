export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-xl border border-transparent bg-roxy-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm shadow-roxy-primary/20 transition duration-150 ease-in-out hover:bg-roxy-primaryHover focus:outline-none focus:ring-2 focus:ring-roxy-primary focus:ring-offset-2 active:bg-roxy-accent ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
