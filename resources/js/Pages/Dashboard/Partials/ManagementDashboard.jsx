import React from 'react';
import StatCard from '@/Components/Dashboard/StatCard';
import NavAppCard from '@/Components/Dashboard/NavAppCard';
import { ShoppingBag, Package, Users, BarChart2, Settings, PlusCircle } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function ManagementDashboard({ auth }) {
    return (
        <div className="space-y-8">
            {/* Branch Summary */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    title="Sales Hari Ini" 
                    value={formatIDR(0)} 
                    icon={ShoppingBag}
                    trend="up"
                    trendValue="0"
                />
                <StatCard 
                    title="Staf Standby" 
                    value="0" 
                    icon={Users}
                    color="accent"
                />
            </div>

            {/* MANAGEMENT APP GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NavAppCard 
                    title="Kasir POS" 
                    icon={PlusCircle} 
                    href="#" 
                    color="teal"
                />
                <NavAppCard 
                    title="Manajemen Stok" 
                    icon={Package} 
                    href="#" 
                    color="orange"
                />
                <NavAppCard 
                    title="Daftar Staf" 
                    icon={Users} 
                    href="#" 
                    color="indigo"
                />
                <NavAppCard 
                    title="Laporan Cabang" 
                    icon={BarChart2} 
                    href="#" 
                    color="emerald"
                />
                 <NavAppCard 
                    title="Pengaturan" 
                    icon={Settings} 
                    href="#" 
                    color="blue"
                />
            </div>

            {/* Branch Highlight */}
            <div className="bg-roxy-accent text-white p-6 rounded-[2rem] shadow-xl shadow-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg font-heading tracking-tight">Roxy Center</h4>
                        <p className="text-xs text-white/60 mt-1 uppercase tracking-widest font-bold">Status: Open</p>
                    </div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">Tutup Cabang</button>
                    <button className="flex-1 py-2 bg-roxy-primary rounded-xl text-xs font-bold">Menu Kios</button>
                </div>
            </div>
        </div>
    );
}
