import React from 'react';
import StatCard from '@/Components/Dashboard/StatCard';
import NavAppCard from '@/Components/Dashboard/NavAppCard';
import { ShoppingBag, Camera, Users, ClipboardList, User, Calculator, Store } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function CashierDashboard({ auth }) {
    return (
        <div className="space-y-8">
            {/* Quick Stats Summary for Cashier */}
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                <div className="min-w-[140px] flex-1">
                    <StatCard 
                        title="Sales Toko" 
                        value={formatIDR(0)} 
                        icon={Calculator}
                    />
                </div>
                <div className="min-w-[140px] flex-1">
                    <StatCard 
                        title="Antrean" 
                        value="0" 
                        icon={Users}
                        color="accent"
                    />
                </div>
            </div>

            {/* CASHIER APP GRID - Focus on POS and Operations */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NavAppCard 
                    title="Kasir POS" 
                    icon={ShoppingBag} 
                    href="#" 
                    color="teal"
                />
                <NavAppCard 
                    title="Absen Selfie" 
                    icon={Camera} 
                    href="#" 
                    color="emerald"
                />
                <NavAppCard 
                    title="Shift Kasir" 
                    icon={Store} 
                    href="#" 
                    color="amber"
                />
                <NavAppCard 
                    title="Lihat Antrean" 
                    icon={Users} 
                    href="#" 
                    color="blue"
                />
                <NavAppCard 
                    title="Riwayat Transaksi" 
                    icon={ClipboardList} 
                    href="#" 
                    color="indigo"
                />
                <NavAppCard 
                    title="Profil Saya" 
                    icon={User} 
                    href={route('profile.edit')} 
                    color="violet"
                />
            </div>

            {/* Shift Information */}
            <div className="bg-roxy-accent text-white p-6 rounded-[2rem] shadow-lg shadow-slate-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold font-heading">Status Shift</h4>
                        <p className="text-xs text-white/70 mt-1">Laci kasir belum dibuka hari ini.</p>
                    </div>
                    <button className="bg-roxy-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md">Buka Shift</button>
                </div>
            </div>
        </div>
    );
}
