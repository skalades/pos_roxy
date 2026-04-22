import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 transition duration-150 ease-in-out focus:outline-none ${
                active
                    ? 'border-roxy-primary bg-roxy-primary/5 text-roxy-primary font-bold focus:border-roxy-primary'
                    : 'border-transparent text-roxy-textMuted hover:border-roxy-border hover:bg-slate-50 hover:text-roxy-textMain focus:border-roxy-border focus:bg-slate-50 focus:text-roxy-textMain'
            } text-base ${className}`}
        >
            {children}
        </Link>
    );
}
