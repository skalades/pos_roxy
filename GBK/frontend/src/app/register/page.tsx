'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { House } from '@/types';

interface FamilyMemberInput {
  name: string;
  relation: string;
  birth_date: string;
  gender: 'L' | 'P';
}

export default function RegisterPage() {
  const router = useRouter();
  const [houses, setHouses] = useState<House[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [houseId, setHouseId] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHouses, setFetchingHouses] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch houses list
  useEffect(() => {
    async function loadHouses() {
      try {
        const response = await api.get('/houses/public');
        if (response.data.success) {
          setHouses(response.data.houses);
        }
      } catch (err: any) {
        setError('Gagal memuat daftar rumah. Silakan muat ulang halaman.');
      } finally {
        setFetchingHouses(false);
      }
    }
    loadHouses();
  }, []);

  const handleAddFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      { name: '', relation: 'Anak', birth_date: '', gender: 'L' },
    ]);
  };

  const handleRemoveFamilyMember = (index: number) => {
    const updated = [...familyMembers];
    updated.splice(index, 1);
    setFamilyMembers(updated);
  };

  const handleFamilyMemberChange = (index: number, field: keyof FamilyMemberInput, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      email,
      password,
      nik,
      phone,
      house_id: Number(houseId),
      family_members: familyMembers.length > 0 ? familyMembers : null,
    };

    try {
      const response = await api.post('/auth/register', payload);
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0] as string[];
        setError(firstError[0]);
      } else {
        setError(
          err.response?.data?.message || 
          'Terjadi kesalahan saat pendaftaran. Pastikan data unik seperti NIK belum terdaftar.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Sensus Mandiri Berhasil!</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Data registrasi Anda telah tersimpan. Saat ini akun Anda berstatus <span className="text-amber-400 font-semibold">Menunggu Verifikasi</span>. Akun Anda akan diaktifkan setelah ditinjau dan disetujui oleh Ketua RT/RW.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-4 py-12">
      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Sensus Mandiri Warga
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Rukun-Net Griya Bumi Kamuning
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Nama Lengkap (Sesuai KTP)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Contoh: Wawan Kurniawan"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Nomor Induk Kependudukan (NIK)
              </label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="16-digit nomor NIK"
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="nama@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Nomor HP / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Pilih Blok / No. Rumah
              </label>
              <select
                value={houseId}
                onChange={(e) => setHouseId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="" disabled className="bg-slate-950">-- Pilih Rumah Anda --</option>
                {fetchingHouses ? (
                  <option disabled className="bg-slate-950">Memuat daftar rumah...</option>
                ) : (
                  houses.map((house) => (
                    <option key={house.id} value={house.id} className="bg-slate-950 text-slate-200">
                      Blok {house.block}-{house.number} ({house.status === 'vacant' ? 'Kosong' : 'Terisi'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Min. 8 karakter"
                required
              />
            </div>
          </div>

          {/* FAMILY SENSUS MODULE */}
          <div className="border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-200 font-bold">Anggota Keluarga</h3>
                <p className="text-slate-400 text-xs mt-0.5">Daftarkan anggota keluarga yang tinggal serumah (opsional)</p>
              </div>
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg transition-colors"
              >
                + Tambah Anggota
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                Belum ada anggota keluarga ditambahkan.
              </div>
            ) : (
              <div className="space-y-4">
                {familyMembers.map((member, index) => (
                  <div key={index} className="p-4 bg-slate-950/20 border border-slate-800/80 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nama</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleFamilyMemberChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none"
                        placeholder="Nama"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Hubungan</label>
                      <select
                        value={member.relation}
                        onChange={(e) => handleFamilyMemberChange(index, 'relation', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded text-slate-300 text-xs focus:outline-none"
                      >
                        <option value="Suami">Suami</option>
                        <option value="Istri">Istri</option>
                        <option value="Anak">Anak</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={member.birth_date}
                        onChange={(e) => handleFamilyMemberChange(index, 'birth_date', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded text-slate-300 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gender</label>
                        <select
                          value={member.gender}
                          onChange={(e) => handleFamilyMemberChange(index, 'gender', e.target.value as 'L' | 'P')}
                          className="w-full px-2 py-1.5 bg-slate-950/50 border border-slate-800 rounded text-slate-300 text-xs focus:outline-none"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFamilyMember(index)}
                        className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 rounded text-rose-400 text-xs font-bold"
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-950/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mt-4"
          >
            {loading ? 'Mengirim Data Sensus...' : 'Kirim Sensus Mandiri'}
          </button>
        </form>

        <div className="text-center mt-6 text-slate-400 text-sm border-t border-slate-800/80 pt-6">
          Sudah terdaftar?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
