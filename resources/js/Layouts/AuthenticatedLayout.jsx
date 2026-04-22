import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, LogOut } from 'lucide-react';
import FlashMessage from '@/Components/FlashMessage';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    
    return (
        <div className="flex bg-mesh flex-col min-h-screen w-full overflow-x-hidden">
            {/* Background Decorative Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-900/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

            <div className="relative z-10 flex-1 flex flex-col w-full">
                {header && (
                    <header className="pt-8 pb-4 landscape:pt-4 landscape:pb-2 sm:landscape:pt-8 sm:landscape:pb-4">
                        <div className="px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                {!route().current('dashboard') && (
                                    <Link 
                                        href={route('dashboard')} 
                                        className="bg-white/40 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-slate-700 shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 group"
                                    >
                                        <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                                    </Link>
                                )}
                                {header}
                            </div>
                            
                            {/* Floating Logout Button */}
                            <Link 
                                href={route('logout')} 
                                method="post" 
                                as="button"
                                className="bg-white/40 hover:bg-rose-500/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-rose-600 shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 group"
                            >
                                <LogOut className="group-hover:rotate-12 transition-transform" size={20} />
                            </Link>
                        </div>
                    </header>
                )}
                <main className="flex-1 px-6 pb-8 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
            <FlashMessage />
        </div>
    );
}
