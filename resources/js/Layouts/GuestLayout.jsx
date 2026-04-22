import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-roxy-canvas pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-roxy-primary" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-roxy-surface px-6 py-8 shadow-lg shadow-slate-200/50 sm:max-w-md rounded-2xl border border-roxy-border">
                {children}
            </div>
        </div>
    );
}
