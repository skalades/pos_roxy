import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-roxy-primary text-roxy-accent font-bold focus:border-roxy-primaryHover'
                    : 'border-transparent text-roxy-textMuted hover:border-roxy-border hover:text-roxy-textMain focus:border-roxy-border focus:text-roxy-textMain') +
                className
            }
        >
            {children}
        </Link>
    );
}
