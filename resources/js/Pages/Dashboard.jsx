import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import StatCard from '@/Components/Dashboard/StatCard';
import NavAppCard from '@/Components/Dashboard/NavAppCard';
import * as Icons from 'lucide-react';

export default function Dashboard({ config }) {
    const { auth } = usePage().props;
    
    // Resolve icon component from name
    const getIcon = (name) => {
        return Icons[name] || Icons.HelpCircle;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="text-2xl font-bold font-heading leading-tight text-roxy-accent">
                            {config.title}
                        </h2>
                        <p className="text-sm text-roxy-text-muted mt-1">
                            Selamat datang kembali, <span className="font-bold text-roxy-primary">{auth.user.name}</span>
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-8">
                {/* Dynamic Stats Section */}
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                    {config.stats.map((stat, index) => (
                        <div key={index} className="min-w-[140px] flex-1">
                            <StatCard 
                                title={stat.title} 
                                value={stat.value} 
                                icon={getIcon(stat.icon)}
                                color={stat.color}
                            />
                        </div>
                    ))}
                </div>

                {/* Dynamic App Grid Section */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {config.menu_items.map((item, index) => (
                        <NavAppCard 
                            key={index}
                            title={item.title} 
                            icon={getIcon(item.icon)} 
                            href={item.href} 
                            color={item.color}
                        />
                    ))}
                </div>
                
                {/* Contextual Information based on Role */}
                {auth.user.role === 'cashier' && (
                    <div className="bg-roxy-accent text-white p-6 rounded-[2rem] shadow-lg shadow-slate-200 mt-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold font-heading">Status Shift</h4>
                                <p className="text-xs text-white/70 mt-1">Laci kasir belum dibuka hari ini.</p>
                            </div>
                            <button className="bg-roxy-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md">Buka Shift</button>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
