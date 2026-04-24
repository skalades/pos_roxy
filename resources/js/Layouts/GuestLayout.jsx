import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { app_settings } = usePage().props;
    const appName = app_settings?.app_name || 'ROXY POS';
    const appLogo = app_settings?.app_logo;

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 landscape:pt-2 bg-mesh relative overflow-hidden">
            {/* Decorative Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-400/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-900/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>

            <div className="relative z-10 w-full sm:max-w-md mt-6 landscape:mt-2 px-8 py-10 landscape:py-5 bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 sm:rounded-[3rem] transition-all duration-500">
                <div className="flex flex-col items-center mb-10 landscape:mb-5 landscape:flex-row landscape:gap-4 landscape:justify-center">
                    <Link href="/">
                        <div className="w-20 h-20 landscape:w-14 landscape:h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-[2rem] landscape:rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20 transform hover:scale-110 transition-transform duration-500 overflow-hidden p-2">
                             {appLogo ? (
                                 <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                             ) : (
                                 <span className="text-3xl landscape:text-xl">✂️</span>
                             )}
                        </div>
                    </Link>
                    <div className="landscape:text-left text-center">
                        <h1 className="mt-6 landscape:mt-0 text-3xl landscape:text-2xl font-black font-heading text-roxy-accent tracking-tighter uppercase">{appName}</h1>
                        <p className="text-roxy-text-muted text-sm font-medium mt-1 landscape:mt-0">Management System v1.0</p>
                    </div>
                </div>

                <div className="space-y-6 landscape:space-y-4">
                    {children}
                </div>
                
                <div className="mt-10 landscape:mt-5 text-center">
                    <p className="text-[10px] text-roxy-text-muted font-bold uppercase tracking-[0.2em]">
                        &copy; 2026 ROXY BARBERSHOP • PREMIUM QUALITY
                    </p>
                </div>
            </div>
        </div>
    );
}
