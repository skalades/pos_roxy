export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-bold font-heading text-roxy-text-muted uppercase tracking-wider mb-2 ml-1 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
