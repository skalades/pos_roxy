import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    
    return (
        <div className="flex bg-roxy-canvas text-roxy-text-main flex-col h-screen w-full overflow-hidden pb-16">
            {/* Main Content Area - Full Width No Sidebar */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
                {header && (
                    <header className="bg-roxy-canvas sticky top-0 z-10">
                        <div className="px-6 py-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full">
                            {header}
                        </div>
                    </header>
                )}
                <main className="flex-1 px-6 pb-8 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Global Bottom Navigation - App Style for All Screen Sizes */}
            <nav className="fixed bottom-0 w-full h-16 bg-white/90 backdrop-blur-md shadow-[0_-10px_20px_-5px_rgb(0,0,0,0.05)] border-t border-slate-100 z-50 flex justify-around items-center px-4 pb-safe max-w-full">
                 <div className="max-w-3xl w-full flex justify-around items-center h-full">
                     <Link href={route('dashboard')} className={`flex flex-col items-center justify-center h-full transition-all ${route().current('dashboard') ? 'text-roxy-primary' : 'text-roxy-textMuted'}`}>
                          <div className={`${route().current('dashboard') ? 'bg-roxy-primary/10' : ''} p-1.5 rounded-lg mb-0.5`}><span className="text-[12px] font-bold">🏠</span></div>
                          <span className="text-[10px] font-bold">Home</span>
                     </Link>
                     <Link href="#" className="flex flex-col items-center justify-center h-full text-roxy-textMuted">
                          <div className="p-1.5 mb-0.5 text-lg">🛒</div>
                          <span className="text-[10px] font-medium text-slate-500 font-heading">POS</span>
                     </Link>
                     <Link href="#" className="flex flex-col items-center justify-center h-full text-roxy-textMuted">
                          <div className="p-1.5 mb-0.5 text-lg">📷</div>
                          <span className="text-[10px] font-medium text-slate-500 font-heading">Absen</span>
                     </Link>
                     <Link href={route('profile.edit')} className={`flex flex-col items-center justify-center h-full transition-all ${route().current('profile.edit') ? 'text-roxy-primary' : 'text-roxy-textMuted'}`}>
                          <div className={`${route().current('profile.edit') ? 'bg-roxy-primary/10' : ''} p-1.5 rounded-lg mb-0.5`}><span className="text-[12px] font-bold">👤</span></div>
                          <span className="text-[10px] font-bold font-heading">User</span>
                     </Link>
                 </div>
            </nav>
        </div>
    );
}
