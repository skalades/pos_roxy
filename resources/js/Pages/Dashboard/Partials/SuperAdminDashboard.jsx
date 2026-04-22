import React from 'react';
import StatCard from '@/Components/Dashboard/StatCard';
import NavAppCard from '@/Components/Dashboard/NavAppCard';
import { BarChart3, MapPin, Users2, ShieldCheck, Database, Globe, Layers } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function SuperAdminDashboard({ auth }) {
    return (
        <div className="space-y-8">
            {/* Global High-Level Stats */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    title="Revenue HQ" 
                    value={formatIDR(0)} 
                    icon={BarChart3}
                />
                <StatCard 
                    title="Branch" 
                    value="0" 
                    icon={MapPin}
                    color="accent"
                />
            </div>

            {/* SUPER ADMIN APP GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <NavAppCard 
                    title="Analytics" 
                    icon={BarChart3} 
                    href="#" 
                    color="indigo"
                />
                <NavAppCard 
                    title="Semua Cabang" 
                    icon={MapPin} 
                    href="#" 
                    color="teal"
                />
                <NavAppCard 
                    title="HR Korporat" 
                    icon={Users2} 
                    href="#" 
                    color="rose"
                />
                <NavAppCard 
                    title="Database" 
                    icon={Database} 
                    href="#" 
                    color="amber"
                />
                <NavAppCard 
                    title="Security" 
                    icon={ShieldCheck} 
                    href="#" 
                    color="violet"
                />
                <NavAppCard 
                    title="Audit Log" 
                    icon={Layers} 
                    href="#" 
                    color="blue"
                />
            </div>

            {/* Branch Quick Switcher / Status */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="text-roxy-primary" size={20} />
                    <h4 className="font-bold text-roxy-accent font-heading">Kesehatan Jaringan Cabang</h4>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <span className="text-xs font-bold text-roxy-accent">Roxy Center</span>
                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
