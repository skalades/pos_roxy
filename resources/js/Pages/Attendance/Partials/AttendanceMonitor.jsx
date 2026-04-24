import React from 'react';
import { User, MapPin, Clock, Image as ImageIcon } from 'lucide-react';

export default function AttendanceMonitor({ attendances }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
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
    if (!attendances || attendances.length === 0) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Clock size={32} />
                </div>
                <p className="text-slate-500 font-medium">Belum ada data absensi hari ini.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2 gap-4">
                {attendances.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-5 space-y-4">
                            {/* Header: User & Status */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
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
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.clock_in_on_time ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {item.clock_in_on_time ? 'On Time' : 'Terlambat'}
                                </div>
                            </div>

                            {/* Photos Section */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Masuk</p>
                                    <div className="relative aspect-[4/3] rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 group">
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
                                        <span className="text-[10px] font-bold text-slate-600 italic">{formatTime(item.clock_in_at)}</span>
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
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
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
                ))}
            </div>
        </div>
    );
}
