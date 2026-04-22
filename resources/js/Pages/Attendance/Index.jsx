import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Camera from '@/Components/Attendance/Camera';
import { MapPin, Camera as CameraIcon, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { formatDate, formatTime } from '@/utils/datetime';

export default function AttendanceIndex({ attendance, branch }) {
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);


    useEffect(() => {
        getLocation();
    }, []);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation tidak didukung oleh browser ini.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationError(null);
            },
            (error) => {
                let msg = "Gagal mendapatkan lokasi.";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "Izin lokasi ditolak. Silakan aktifkan GPS.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Informasi lokasi tidak tersedia.";
                        break;
                    case error.TIMEOUT:
                        msg = "Waktu permintaan lokasi habis.";
                        break;
                }
                setLocationError(msg);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleCapture = async (imageData) => {
        if (!location) {
            setStatus({ type: 'error', message: 'Tunggu hingga lokasi terdeteksi.' });
            getLocation();
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            // 1. Convert base64 to File for compression
            const response = await fetch(imageData);
            const blob = await response.blob();
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

            // 2. Compress image
            const options = {
                maxSizeMB: 0.2, // 200KB
                maxWidthOrHeight: 1024,
                useWebWorker: true
            };
            
            const compressedFile = await imageCompression(file, options);
            
            // 3. Convert back to base64 for transmission (or use FormData)
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = async () => {
                const base64data = reader.result;
                
                // 4. Send to server
                const endpoint = attendance && attendance.clock_in_at ? '/attendance/clock-out' : '/attendance/clock-in';
                
                try {
                    const res = await axios.post(endpoint, {
                        photo: base64data,
                        latitude: location.latitude,
                        longitude: location.longitude
                    });

                    if (res.data.success) {
                        setStatus({ type: 'success', message: res.data.message });
                        setTimeout(() => {
                            router.visit(route('dashboard'));
                        }, 2000);
                    }
                } catch (err) {
                    setStatus({ 
                        type: 'error', 
                        message: err.response?.data?.message || 'Terjadi kesalahan pada server.' 
                    });
                } finally {
                    setIsLoading(false);
                }
            };
        } catch (error) {
            console.error("Compression/Upload error:", error);
            setStatus({ type: 'error', message: 'Gagal memproses foto.' });
            setIsLoading(false);
        }
    };

    const isClockedIn = attendance && attendance.clock_in_at && !attendance.clock_out_at;
    const isFinished = attendance && attendance.clock_out_at;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-roxy-primary rounded-full shadow-[0_0_15px_rgba(13,148,136,0.5)]"></div>
                        <h2 className="text-2xl sm:text-3xl font-black font-heading leading-tight text-roxy-accent tracking-tight">
                            Presensi Karyawan
                        </h2>
                        <p className="text-sm text-roxy-text-muted mt-1 font-medium">
                            {formatDate(currentTime)} • <span className="text-roxy-primary font-bold">{formatTime(currentTime)}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <div className="bg-white/50 backdrop-blur-sm border border-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                             <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Online</span>
                         </div>
                    </div>
                </div>
            }
        >
            <Head title="Absen Selfie" />

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Status Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 space-y-2 text-center md:text-left w-full">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cabang Aktif</p>
                        <h3 className="text-xl font-bold text-roxy-accent flex items-center justify-center md:justify-start gap-2">
                            <MapPin size={20} className="text-roxy-primary" />
                            {branch?.name || 'Cabang Roxy'}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">{branch?.address}</p>
                    </div>

                    <div className="h-px md:h-12 w-full md:w-px bg-slate-100"></div>

                    <div className="flex-1 space-y-2 text-center md:text-left w-full">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Hari Ini</p>
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <Clock size={20} className="text-teal-500" />
                            <span className={`text-lg font-bold ${isFinished ? 'text-emerald-600' : (isClockedIn ? 'text-amber-600' : 'text-slate-400')}`}>
                                {isFinished ? 'Selesai Tugas' : (isClockedIn ? 'Sedang Bertugas' : 'Belum Absen')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Action Area */}
                {!isFinished ? (
                    <div className="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-2 gap-8 items-start">
                        {/* Camera Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="font-bold text-roxy-accent flex items-center gap-2">
                                    <CameraIcon size={18} />
                                    {isClockedIn ? 'Ambil Selfie Pulang' : 'Ambil Selfie Masuk'}
                                </h4>
                                {location ? (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase tracking-tighter flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Lokasi Terdeteksi
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-tighter animate-pulse">
                                        Mencari GPS...
                                    </span>
                                )}
                            </div>
                            
                            <Camera onCapture={handleCapture} isLoading={isLoading} />
                        </div>

                        {/* Instructions & Feedback */}
                        <div className="space-y-6">
                            {status.message && (
                                <div className={`p-6 rounded-3xl border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'} animate-in fade-in slide-in-from-top-4 duration-300`}>
                                    <div className="flex items-start gap-4">
                                        {status.type === 'success' ? <CheckCircle2 className="shrink-0" /> : <AlertCircle className="shrink-0" />}
                                        <div>
                                            <p className="font-bold">{status.type === 'success' ? 'Berhasil!' : 'Gagal'}</p>
                                            <p className="text-sm opacity-90">{status.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {locationError && (
                                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 text-amber-800">
                                    <div className="flex items-start gap-4">
                                        <AlertCircle className="shrink-0" />
                                        <div>
                                            <p className="font-bold">Akses Lokasi Diperlukan</p>
                                            <p className="text-sm opacity-90">{locationError}</p>
                                            <button 
                                                onClick={getLocation}
                                                className="mt-3 text-xs font-black uppercase tracking-widest bg-amber-200 px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors"
                                            >
                                                Aktifkan GPS
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-roxy-primary/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-roxy-primary/20 transition-colors"></div>
                                
                                <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    Panduan Absensi
                                </h5>
                                <ul className="space-y-4 text-slate-300 text-sm">
                                    <li className="flex gap-3">
                                        <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">1</div>
                                        <span>Pastikan wajah terlihat jelas tanpa masker/kacamata hitam.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">2</div>
                                        <span>Anda harus berada dalam radius 100m dari lokasi cabang.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">3</div>
                                        <span>Sistem secara otomatis akan mengompres foto untuk menghemat kuota.</span>
                                    </li>
                                </ul>
                            </div>

                            {isClockedIn && (
                                <div className="p-8 bg-emerald-500 rounded-[2.5rem] text-slate-900">
                                    <h5 className="font-black text-xl mb-1 italic">TELAH CLOCK-IN</h5>
                                    <p className="text-sm font-bold opacity-80">
                                        Jangan lupa absen pulang (Clock-Out) sebelum meninggalkan outlet agar jam kerja terhitung.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-[3rem] text-center shadow-sm border border-slate-100 space-y-6">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-roxy-accent tracking-tight">Presensi Selesai!</h3>
                            <p className="text-slate-500 font-medium">Anda telah melakukan absen masuk dan pulang hari ini.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4">
                             <div className="p-4 bg-slate-50 rounded-2xl">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">Masuk</p>
                                 <p className="text-lg font-bold text-slate-700">{new Date(attendance.clock_in_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-2xl">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase">Pulang</p>
                                 <p className="text-lg font-bold text-slate-700">{new Date(attendance.clock_out_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                        </div>
                        <button 
                            onClick={() => router.visit(route('dashboard'))}
                            className="mt-4 px-10 py-4 bg-roxy-accent text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
