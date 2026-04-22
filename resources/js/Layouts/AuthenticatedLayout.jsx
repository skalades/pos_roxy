import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    
    return (
        <div className="flex bg-mesh flex-col min-h-screen w-full overflow-x-hidden pb-24">
            {/* Background Decorative Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-900/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

            <div className="relative z-10 flex-1 flex flex-col w-full">
                {header && (
                    <header className="pt-8 pb-4">
                        <div className="px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                {!route().current('dashboard') && (
                                    <Link 
                                        href={route('dashboard')} 
                                        className="bg-white/40 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-slate-700 shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 group"
                                    >
                                        <span className="group-hover:-translate-x-1 transition-transform inline-block text-xl">⬅️</span>
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
                                <span className="group-hover:rotate-12 transition-transform inline-block text-xl">🚪</span>
                            </Link>
                        </div>
                    </header>
                )}
                <main className="flex-1 px-6 pb-8 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Global Bottom Navigation - Premium App Style */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
                <nav className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] h-20 flex justify-around items-center px-6">
                    <NavItem 
                        href={route('dashboard')} 
                        active={route().current('dashboard')}
                        icon="🏠"
                        label="Home"
                    />
                    <NavItem 
                        href="#" 
                        icon="🛒"
                        label="POS"
                    />
                    <NavItem 
                        href="#" 
                        icon="📷"
                        label="Absen"
                    />
                    <NavItem 
                        href={route('profile.edit')} 
                        active={route().current('profile.edit')}
                        icon="👤"
                        label="User"
                    />
                </nav>
            </div>
        </div>
    );
}

function NavItem({ href, active, icon, label }) {
    return (
        <Link 
            href={href} 
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${active ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
        >
            <div className={`text-2xl transition-all duration-300 ${active ? 'drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]' : ''}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-teal-400' : 'text-white'}`}>
                {label}
            </span>
            {active && (
                <div className="absolute -bottom-1 w-1 h-1 bg-teal-400 rounded-full"></div>
            )}
        </Link>
    );
}
