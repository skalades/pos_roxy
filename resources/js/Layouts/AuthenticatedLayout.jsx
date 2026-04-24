import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, LogOut } from 'lucide-react';
import FlashMessage from '@/Components/FlashMessage';

export default function AuthenticatedLayout({ header, children, withMobileCartSpace = false }) {
    const user = usePage().props.auth.user;
    
    return (
        <div className="flex bg-mesh flex-col min-h-screen w-full overflow-x-hidden">
            {/* Background Decorative Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-900/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

            <div className="relative z-10 flex-1 flex flex-col w-full">
                {header && (
                    <header className="pt-8 pb-0 landscape:pt-4 sm:landscape:pt-8">
                        <div className="px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full relative">
                            {header}
                            
                        </div>
                    </header>
                )}
                <main className={`flex-1 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full ${withMobileCartSpace ? 'pb-24 landscape:pb-6' : 'pb-8 landscape:pb-6'}`}>
                    {children}
                </main>
            </div>
            <FlashMessage />
        </div>
    );
}
