import React from 'react';
import StatCard from '@/Components/Dashboard/StatCard';
import NavAppCard from '@/Components/Dashboard/NavAppCard';
import { Camera, Calendar, DollarSign, Clock, User, ClipboardList } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function BarberDashboard({ auth }) {
    return (
        <div className="space-y-8">
            {/* Quick Stats Summary */}
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                <div className="min-w-[140px] flex-1">
                    <StatCard 
                        title="Jam Kerja" 
                        value="0h 0m" 
                        icon={Clock}
                    />
                </div>
                <div className="min-w-[140px] flex-1">
                    <StatCard 
                        title="Komisi Saya" 
                        value={formatIDR(0)} 
                        icon={DollarSign}
                        color="accent"
                    />
                </div>
            </div>

            {/* BARBER APP GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <NavAppCard 
                    title="Absen Selfie" 
                    icon={Camera} 
                    href="#" 
                    color="teal"
                />
                <NavAppCard 
                    title="Agenda Saya" 
                    icon={Calendar} 
                    href="#" 
                    color="blue"
                />
                <NavAppCard 
                    title="Riwayat Kerjaan" 
                    icon={ClipboardList} 
                    href="#" 
                    color="indigo"
                />
                <NavAppCard 
                    title="Profil Staf" 
                    icon={User} 
                    href={route('profile.edit')} 
                    color="violet"
                />
            </div>

            {/* Status Section */}
            <div className="bg-white/50 rounded-[2rem] p-6 border border-slate-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-roxy-accent">Status Kerja</h4>
                    <p className="text-xs text-roxy-textMuted mt-1">Anda belum melakukan absen masuk hari ini.</p>
                </div>
                <div className="h-3 w-3 bg-rose-500 rounded-full animate-pulse"></div>
            </div>
        </div>
    );
}
