import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-mesh relative overflow-hidden">
            {/* Decorative Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-400/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-900/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>

            <div className="relative z-10 w-full sm:max-w-md mt-6 px-8 py-10 bg-white/70 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 sm:rounded-[3rem] transition-all duration-500">
                <div className="flex flex-col items-center mb-10">
                    <Link href="/">
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-teal-500/20 transform hover:scale-110 transition-transform duration-500">
                             <span className="text-3xl">✂️</span>
                        </div>
                    </Link>
                    <h1 className="mt-6 text-3xl font-black font-heading text-roxy-accent tracking-tighter">ROXY POS</h1>
                    <p className="text-roxy-text-muted text-sm font-medium mt-1">Management System v1.0</p>
                </div>

                <div className="space-y-6">
                    {children}
                </div>
                
                <div className="mt-10 text-center">
                    <p className="text-[10px] text-roxy-text-muted font-bold uppercase tracking-[0.2em]">
                        &copy; 2026 ROXY BARBERSHOP • PREMIUM QUALITY
                    </p>
                </div>
            </div>
        </div>
    );
}
