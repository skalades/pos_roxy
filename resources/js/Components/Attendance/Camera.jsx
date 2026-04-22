import React, { useRef, useState, useEffect } from 'react';
import { Camera as CameraIcon, RotateCcw, Zap } from 'lucide-react';

export default function Camera({ onCapture, isLoading }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            // Try with preferred constraints first (front camera)
            const constraints = {
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };
            
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn("Front camera failed, trying generic camera:", err);
                // Fallback to any available camera if 'user' facing mode fails
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError("Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera yang aktif.");
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
            } else {
                setError("Gagal mengakses kamera: " + err.message);
            }
        }
    };

    const capture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        setFlash(true);
        setTimeout(() => setFlash(false), 150);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror the image if using front camera
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
    };

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CameraIcon size={32} />
                </div>
                <p className="text-rose-700 font-bold">{error}</p>
                <button 
                    onClick={startCamera}
                    className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-md mx-auto aspect-[3/4] sm:aspect-square overflow-hidden rounded-[2.5rem] bg-slate-900 border-4 border-white shadow-2xl">
            {/* Video Preview */}
            <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Flash Effect */}
            {flash && (
                <div className="absolute inset-0 bg-white z-20 animate-pulse"></div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>

            {/* Camera Frame/Guides */}
            <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none flex items-center justify-center">
                 <div className="w-64 h-64 border-2 border-white/30 rounded-full border-dashed"></div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 px-6 z-10">
                <button 
                    onClick={capture}
                    disabled={isLoading || !stream}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform disabled:opacity-50"
                >
                    <div className="w-16 h-16 border-4 border-slate-900 rounded-full flex items-center justify-center">
                        <div className="w-12 h-12 bg-roxy-primary rounded-full"></div>
                    </div>
                </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30">
                    <div className="w-12 h-12 border-4 border-roxy-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-sm uppercase tracking-widest">Memproses Foto...</p>
                </div>
            )}
        </div>
    );
}
