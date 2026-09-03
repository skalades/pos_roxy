import React from 'react';
import { User, MapPin, Clock, Image as ImageIcon, Calendar, AlertTriangle } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function AttendanceMonitor({ attendances, isSuperAdmin, branches, filters }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '--:--';
        return new Date(timeString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const handleFilterChange = (e) => {
        router.get(route('attendance.index'), { ...filters, branch_id: e.target.value }, { preserveState: true });
    };

    const handleDateClick = (dateStr) => {
        router.get(route('attendance.index'), { ...filters, date: dateStr }, { preserveState: true });
    };

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const selectedDateStr = filters?.date || todayStr;
    const selectedDate = new Date(selectedDateStr);

    const currentMonthYear = selectedDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
    });

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    });

    return (
        <div className="space-y-6">
            {/* Header: Date Strip and Filter */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-roxy-primary/10 text-roxy-primary rounded-full flex items-center justify-center">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Monitor Absensi</p>
                            <h2 className="text-xl md:text-2xl font-black text-roxy-accent">{currentMonthYear}</h2>
                        </div>
                    </div>

                    {isSuperAdmin && branches && (
                        <div className="w-full md:w-auto">
                            <select 
                                value={filters?.branch_id || ''}
                                onChange={handleFilterChange}
                                className="w-full md:w-48 bg-slate-50 border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-roxy-primary focus:border-roxy-primary font-medium"
                            >
                                <option value="">Semua Cabang</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Horizontal Date Strip */}
                <div className="flex gap-2 overflow-x-auto pb-2 pt-2 snap-x hide-scrollbar scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {dates.map(dateStr => {
                        const isSelected = dateStr === selectedDateStr;
                        const d = new Date(dateStr);
                        const dayNum = d.getDate();
                        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
                        return (
                            <button
                                key={dateStr}
                                onClick={() => handleDateClick(dateStr)}
                                className={`flex-shrink-0 snap-center w-14 flex flex-col items-center py-3 rounded-2xl transition-all ${isSelected ? 'bg-roxy-primary text-white shadow-md shadow-roxy-primary/30 scale-110' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'opacity-90' : 'opacity-80'}`}>{dayName}</span>
                                <span className="text-xl font-black mt-1">{dayNum}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {(!attendances || attendances.length === 0) ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                        <Clock size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Belum ada data absensi hari ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 gap-4">
                    {attendances.map((item) => {
                        const isLate = !item.clock_in_on_time;
                        return (
                        <div key={item.id} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all ${isLate ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-100'}`}>
                            {isLate && (
                                <div className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2">
                                    <AlertTriangle size={12} />
                                    PERHATIAN: KARYAWAN TERLAMBAT
                                </div>
                            )}
                            <div className="p-5 space-y-4">
                                {/* Header: User & Status */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${isLate ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.user?.avatar ? (
                                                <img src={item.user.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-sm leading-tight">{item.user?.name || 'Unknown User'}</h5>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <MapPin size={10} />
                                                {item.branch?.name || 'No Branch'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${!isLate ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-700 animate-pulse'}`}>
                                        {!isLate ? 'On Time' : 'Terlambat'}
                                    </div>
                                </div>

                                {/* Photos Section */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Masuk</p>
                                        <div className={`relative aspect-[4/3] rounded-2xl bg-slate-50 overflow-hidden border group ${isLate ? 'border-rose-200' : 'border-slate-100'}`}>
                                            {item.clock_in_photo ? (
                                                <img 
                                                    src={`/storage/${item.clock_in_photo}`} 
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer" 
                                                    alt="Clock In"
                                                    onClick={() => window.open(`/storage/${item.clock_in_photo}`, '_blank')}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-md font-bold backdrop-blur-sm">
                                                {formatTime(item.clock_in_at)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className={`text-[10px] font-bold italic ${isLate ? 'text-rose-600' : 'text-slate-600'}`}>
                                                {formatTime(item.clock_in_at)}
                                                {isLate && item.late_minutes > 0 && ` (+${item.late_minutes}m)`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pulang</p>
                                        <div className="relative aspect-[4/3] rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 group">
                                            {item.clock_out_photo ? (
                                                <img 
                                                    src={`/storage/${item.clock_out_photo}`} 
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 cursor-pointer" 
                                                    alt="Clock Out"
                                                    onClick={() => window.open(`/storage/${item.clock_out_photo}`, '_blank')}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-md font-bold backdrop-blur-sm">
                                                {formatTime(item.clock_out_at)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-bold text-slate-600 italic">{formatTime(item.clock_out_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className={`flex items-center justify-between pt-2 border-t ${isLate ? 'border-rose-50' : 'border-slate-50'}`}>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        {formatDate(item.date)}
                                    </div>
                                    {item.total_hours && (
                                        <div className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                                            Durasi: {item.total_hours} Jam
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );
}
