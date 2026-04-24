import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import RankingCard from '@/Components/Ranking/RankingCard';
import Modal from '@/Components/Modal';
import CustomerDatabaseTable from '@/Components/Ranking/CustomerDatabaseTable';
import { 
    Users, 
    Scissors, 
    Package, 
    Trophy, 
    X, 
    Search, 
    ChevronRight,
    TrendingUp,
    Clock,
    Filter
} from 'lucide-react';

export default function RankingIndex({ rankings, customers, filters }) {
    const [activeTab, setActiveTab] = useState(filters?.search ? 'database' : 'summary');
    const [selectedRanking, setSelectedRanking] = useState(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const handleSearchChange = (val) => {
        setSearchTerm(val);
        router.get(
            route('ranking.index'),
            { search: val },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true
            }
        );
    };

    const openDetails = (type) => {
        let data = [];
        let title = '';
        let icon = null;

        switch(type) {
            case 'customers':
                data = rankings.customers;
                title = 'Pelanggan Paling Loyal';
                icon = <Users className="text-blue-500" />;
                break;
            case 'services':
                data = rankings.services;
                title = 'Layanan Paling Diminati';
                icon = <Scissors className="text-indigo-500" />;
                break;
            case 'products':
                data = rankings.products;
                title = 'Produk Terlaris';
                icon = <Package className="text-emerald-500" />;
                break;
            case 'barbers':
                data = rankings.barbers;
                title = 'Barber Kinerja Terbaik';
                icon = <Trophy className="text-amber-500" />;
                break;
        }

        setSelectedRanking({ type, data, title, icon });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Analisa Peringkat"
                    subtitle="Pantau performa operasional & loyalitas"
                    backHref={route('dashboard')}
                />
            }
        >
            <Head title="Peringkat Performa" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Custom Tab Switcher - Premium Style */}
                <div className="flex p-1 bg-slate-900/5 rounded-3xl w-full sm:w-fit">
                    <button 
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${activeTab === 'summary' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Ringkasan
                    </button>
                    <button 
                        onClick={() => setActiveTab('database')}
                        className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl text-xs font-black transition-all duration-300 uppercase tracking-widest ${activeTab === 'database' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Database Pelanggan
                    </button>
                </div>

                {activeTab === 'summary' ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <RankingCard 
                                title="Pelanggan Loyal"
                                topName={rankings.customers[0]?.name}
                                topValue={`${rankings.customers[0]?.transactions_count || 0} Kunjungan`}
                                subtitle={rankings.customers[0]?.transactions_sum_total_amount ? `Total: ${formatCurrency(rankings.customers[0].transactions_sum_total_amount)}` : null}
                                icon={Users}
                                color="blue"
                                onClick={() => openDetails('customers')}
                            />
                            <RankingCard 
                                title="Layanan Terfavorit"
                                topName={rankings.services[0]?.item_name}
                                topValue={`${parseInt(rankings.services[0]?.total_sold || 0)}x Terjual`}
                                subtitle={rankings.services[0]?.total_revenue ? `Revenue: ${formatCurrency(rankings.services[0].total_revenue)}` : null}
                                icon={Scissors}
                                color="indigo"
                                onClick={() => openDetails('services')}
                            />
                            <RankingCard 
                                title="Produk Terlaris"
                                topName={rankings.products[0]?.item_name}
                                topValue={`${parseInt(rankings.products[0]?.total_sold || 0)} Pcs`}
                                subtitle={rankings.products[0]?.total_revenue ? `Revenue: ${formatCurrency(rankings.products[0].total_revenue)}` : null}
                                icon={Package}
                                color="emerald"
                                onClick={() => openDetails('products')}
                            />
                            <RankingCard 
                                title="Barber Terbaik"
                                topName={rankings.barbers[0]?.name}
                                topValue={formatCurrency(rankings.barbers[0]?.transaction_items_sum_commission_amount || 0)}
                                subtitle={`${rankings.barbers[0]?.transaction_items_count || 0} Layanan Selesai`}
                                icon={Trophy}
                                color="amber"
                                onClick={() => openDetails('barbers')}
                            />
                        </div>

                        {/* Visual Insight Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border-2 border-slate-900/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-roxy-primary/5 blur-[100px] -mr-48 -mt-48"></div>
                                <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-center">
                                    <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shrink-0">
                                        <TrendingUp size={40} />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tren Performa Cabang</h3>
                                        <p className="text-slate-500 font-bold mt-2 leading-relaxed">
                                            Data peringkat ini dihitung berdasarkan transaksi yang sudah selesai. Gunakan informasi ini untuk memberikan reward kepada staff terbaik atau promo khusus bagi pelanggan setia.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-roxy-primary/20 to-transparent opacity-50"></div>
                                <div className="relative z-10">
                                    <Clock size={32} className="text-roxy-primary mb-4" />
                                    <h4 className="text-lg font-black tracking-tight">Waktu Update</h4>
                                    <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">Real-time Data</p>
                                </div>
                                <div className="relative z-10 mt-8">
                                    <p className="text-3xl font-black tracking-tighter">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Status: Sinkron</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <CustomerDatabaseTable 
                        customers={customers}
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        formatCurrency={formatCurrency}
                    />
                )}
            </div>

            {/* Ranking Detail Modal */}
            <Modal show={!!selectedRanking} onClose={() => setSelectedRanking(null)} maxWidth="2xl">
                <div className="relative overflow-hidden">
                    {/* Glassmorphic Background */}
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl z-0"></div>
                    <div className={`absolute top-0 right-0 w-80 h-80 bg-roxy-primary/10 blur-[100px] -mr-40 -mt-40`}></div>
                    
                    <div className="relative z-10 p-10">
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                                    {selectedRanking?.icon}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedRanking?.title}</h2>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Daftar Top 10 Performa</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedRanking(null)}
                                className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
                            >
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedRanking?.data.map((item, index) => (
                                <div 
                                    key={index}
                                    className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 ${index === 0 ? 'bg-amber-50/50 border-amber-200/50' : 'bg-white border-slate-50'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${index === 0 ? 'bg-amber-500 text-white' : index === 1 ? 'bg-slate-300 text-white' : index === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-lg">
                                                {item.name || item.item_name}
                                            </p>
                                            {selectedRanking.type === 'customers' && (
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.phone || 'No Phone'}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-slate-900">
                                            {selectedRanking.type === 'customers' ? `${item.transactions_count} Visit` :
                                             selectedRanking.type === 'barbers' ? formatCurrency(item.transaction_items_sum_commission_amount || 0) :
                                             `${parseInt(item.total_sold || 0)} Unit`}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            {selectedRanking.type === 'customers' ? formatCurrency(item.transactions_sum_total_amount || 0) :
                                             selectedRanking.type === 'barbers' ? `${item.transaction_items_count} Job` :
                                             formatCurrency(item.total_revenue || 0)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setSelectedRanking(null)}
                            className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                            Tutup Detail
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
