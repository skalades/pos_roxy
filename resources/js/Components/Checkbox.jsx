export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-roxy-border text-roxy-primary shadow-sm focus:ring-roxy-primary transition duration-150 ' +
                className
            }
        />
    );
}
