'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

import SuperAdminDashboard from '@/features/super-admin/SuperAdminDashboard';
import AdminDashboard from '@/features/admin/AdminDashboard';
import BendaharaDashboard from '@/features/bendahara/BendaharaDashboard';
import WargaDashboard from '@/features/warga/WargaDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('rukun_net_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('rukun_net_token');
          localStorage.removeItem('rukun_net_user');
          router.push('/login');
        }
      } catch (err: any) {
        // Fallback to localStorage user if server error
        const localUser = localStorage.getItem('rukun_net_user');
        if (localUser) {
          setUser(JSON.parse(localUser));
        } else {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      localStorage.removeItem('rukun_net_token');
      localStorage.removeItem('rukun_net_user');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">Memuat Rukun-Net...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Account verification block state (FR-1.3)
  if (user.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            ⏳
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Akun Menunggu Aktivasi</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Halo <b>{user.name}</b>, akun Anda untuk rumah <b>Blok {user.house?.block}-{user.house?.number}</b> belum diaktivasi oleh pengurus komplek.
            <br /><br />
            Silakan hubungi Ketua RT/RW setempat untuk mempercepat verifikasi data sensus Anda.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/login')}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'rt':
      case 'rw':
        return <AdminDashboard />;
      case 'bendahara':
        return <BendaharaDashboard />;
      case 'warga':
      default:
        return <WargaDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Dynamic Top Bar */}
      <header className="bg-slate-900/40 border-b border-slate-900 px-6 py-4 flex items-center justify-between backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            R
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white leading-none tracking-tight">Rukun-Net</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Griya Bumi Kamuning</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-slate-200 text-sm font-bold leading-none">{user.name}</p>
            <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider mt-1 inline-block">
              {user.role === 'rt' ? 'Ketua RT' : user.role === 'rw' ? 'Ketua RW' : user.role.toUpperCase()}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-semibold text-xs rounded-xl transition-all active:scale-95"
            title="Keluar"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20">
        {renderDashboardByRole()}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-600 text-xs border-t border-slate-900/60 bg-slate-950">
        &copy; 2026 Rukun-Net &mdash; Griya Bumi Kamuning. Manajemen Swadaya Warga.
      </footer>
    </div>
  );
}
