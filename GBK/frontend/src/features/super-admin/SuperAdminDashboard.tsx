'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User } from '@/types';

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadUsers = async () => {
    try {
      const response = await api.get('/roles/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setErrorMsg('Gagal memuat daftar warga.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingUserId(userId);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await api.post('/roles/change', {
        user_id: userId,
        role: newRole,
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        loadUsers(); // Refresh
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal merubah jabatan.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameMatch = u.name.toLowerCase().includes(search.toLowerCase());
    const blockMatch = u.house 
      ? `blok ${u.house.block}-${u.house.number}`.toLowerCase().includes(search.toLowerCase())
      : false;
    return nameMatch || blockMatch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-2">Panel Super Admin</h2>
        <p className="text-slate-400 text-sm">Mutasi Jabatan Kepengurusan Komplek Griya Bumi Kamuning secara Instan.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* User list with search */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-200">Daftar Warga & Pengurus Aktif</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs px-4 py-2 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none"
            placeholder="Cari nama atau blok..."
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Memproses data...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Tidak ada warga atau pengurus ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">NIK</th>
                  <th className="py-3 px-4">Blok Rumah</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Jabatan/Peran</th>
                  <th className="py-3 px-4">Ubah Jabatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-200">{user.name}</td>
                    <td className="py-4 px-4 text-slate-400">{user.nik || '-'}</td>
                    <td className="py-4 px-4">
                      {user.house ? (
                        <span className="px-2 py-1 bg-slate-950/60 border border-slate-800 rounded text-slate-300">
                          Blok {user.house.block}-{user.house.number}
                        </span>
                      ) : (
                        <span className="text-slate-500">Belum terhubung</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400">{user.phone || '-'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.role === 'super_admin' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                        user.role === 'rt' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                        user.role === 'rw' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25' :
                        user.role === 'bendahara' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/25'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={user.role}
                        disabled={updatingUserId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300 text-xs focus:outline-none"
                      >
                        <option value="warga">Warga</option>
                        <option value="bendahara">Bendahara</option>
                        <option value="rt">Ketua RT</option>
                        <option value="rw">Ketua RW</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
