'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User, Announcement, Complaint, Vote } from '@/types';

export default function AdminDashboard() {
  const [pendingResidents, setPendingResidents] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [polls, setPolls] = useState<Vote[]>([]);
  
  // Forms states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState('informasi_umum');

  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollOptions, setPollOptions] = useState('');
  const [pollDeadline, setPollDeadline] = useState('');

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resident' | 'announcement' | 'complaint' | 'voting'>('resident');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const pendingRes = await api.get('/residents/pending');
      const annRes = await api.get('/announcements');
      const compRes = await api.get('/complaints');
      const pollRes = await api.get('/voting');

      if (pendingRes.data.success) setPendingResidents(pendingRes.data.pending);
      if (annRes.data.success) setAnnouncements(annRes.data.announcements);
      if (compRes.data.success) setComplaints(compRes.data.complaints);
      if (pollRes.data.success) setPolls(pollRes.data.polls);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const response = await api.post(`/residents/${id}/approve`);
      if (response.data.success) {
        setMsg(response.data.message);
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal memproses verifikasi.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await api.post(`/residents/${id}/reject`);
      if (response.data.success) {
        setMsg(response.data.message);
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal memproses verifikasi.');
    }
  };

  const handleAnnounceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/announcements', {
        title: annTitle,
        content: annContent,
        category: annCategory,
      });
      if (response.data.success) {
        setMsg('Pengumuman baru disiarkan!');
        setAnnTitle('');
        setAnnContent('');
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal membuat pengumuman.');
    }
  };

  const handlePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const optionsArray = pollOptions
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt !== '');

    if (optionsArray.length < 2) {
      setMsg('Harap berikan minimal 2 pilihan jawaban, pisahkan dengan koma.');
      return;
    }

    try {
      const response = await api.post('/voting', {
        title: pollTitle,
        description: pollDesc,
        options: optionsArray,
        deadline: pollDeadline,
      });
      if (response.data.success) {
        setMsg('Jajak pendapat e-voting berhasil dibuat.');
        setPollTitle('');
        setPollDesc('');
        setPollOptions('');
        setPollDeadline('');
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal membuat voting.');
    }
  };

  const handleComplaintStatus = async (id: number, status: string) => {
    try {
      const response = await api.post(`/complaints/${id}/status`, { status });
      if (response.data.success) {
        setMsg('Status pengaduan warga diperbarui.');
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal mengubah status pengaduan.');
    }
  };

  const handleClosePoll = async (id: number) => {
    try {
      const response = await api.post(`/voting/${id}/close`);
      if (response.data.success) {
        setMsg('Polling ditutup.');
        loadData();
      }
    } catch (err: any) {
      setMsg('Gagal menutup polling.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2">Panel Pengurus RT / RW</h2>
        <p className="text-slate-400 text-sm">Kelola sensus, siaran pengumuman, pengaduan fasilitas, dan e-voting.</p>
      </div>

      {msg && (
        <div className="p-4 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-indigo-400 font-bold hover:text-indigo-300">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resident')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'resident'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Sensus Mandiri ({pendingResidents.length})
        </button>
        <button
          onClick={() => setActiveTab('announcement')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'announcement'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Pengumuman ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('complaint')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'complaint'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Keluhan Fasilitas ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('voting')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'voting'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Polling E-Voting ({polls.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Memproses data...</div>
      ) : (
        <div className="min-h-[400px]">
          {/* TAB 1: RESIDENT APPROVALS */}
          {activeTab === 'resident' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Sensus Mandiri Menunggu Verifikasi</h3>
              {pendingResidents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                  Tidak ada pendaftaran warga baru yang tertunda.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingResidents.map((res) => (
                    <div key={res.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div>
                        <h4 className="text-slate-200 font-bold text-base">{res.name}</h4>
                        <p className="text-slate-400 text-xs mt-1">NIK: {res.nik} | No. HP: {res.phone}</p>
                        <p className="text-indigo-400 text-xs font-semibold mt-1">
                          Pilihan Rumah: {res.house ? `Blok ${res.house.block}-${res.house.number}` : '-'}
                        </p>
                      </div>

                      {res.family_members && res.family_members.length > 0 && (
                        <div className="border-t border-slate-800/80 pt-3">
                          <span className="text-slate-400 text-xs font-bold uppercase block mb-2">Anggota Keluarga:</span>
                          <ul className="text-slate-300 text-xs space-y-1">
                            {res.family_members.map((fam) => (
                              <li key={fam.id}>
                                • {fam.name} ({fam.relation}) - {fam.gender}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleApprove(res.id)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors"
                        >
                          Setujui Warga
                        </button>
                        <button
                          onClick={() => handleReject(res.id)}
                          className="flex-1 py-2 bg-rose-600/15 border border-rose-500/30 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs rounded-lg transition-colors"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENTS */}
          {activeTab === 'announcement' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Create */}
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-fit">
                <h3 className="text-slate-200 font-bold mb-4">Siarkan Pengumuman</h3>
                <form onSubmit={handleAnnounceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Judul Pengumuman</label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                      placeholder="Kerja Bakti Bulanan"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Kategori</label>
                    <select
                      value={annCategory}
                      onChange={(e) => setAnnCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none"
                    >
                      <option value="agenda">Agenda Kegiatan</option>
                      <option value="berita_duka">Berita Duka</option>
                      <option value="informasi_umum">Informasi Umum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Isi Pengumuman</label>
                    <textarea
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none h-32"
                      placeholder="Tulis informasi selengkapnya di sini..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition-colors"
                  >
                    Kirim Pengumuman
                  </button>
                </form>
              </div>

              {/* Announcements list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-slate-200 font-bold">Riwayat Pengumuman Aktif</h3>
                {announcements.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                    Belum ada pengumuman disiarkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="bg-slate-900/20 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ann.category === 'agenda' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            ann.category === 'berita_duka' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {ann.category.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(ann.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <h4 className="text-slate-200 font-bold mb-1">{ann.title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line">{ann.content}</p>
                        <p className="text-[10px] text-slate-500 mt-3">Disiarkan oleh: {ann.author?.name || 'Pengurus'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLAINTS */}
          {activeTab === 'complaint' && (
            <div className="space-y-4">
              <h3 className="text-slate-200 font-bold">Pengaduan Keluhan Fasilitas Warga</h3>
              {complaints.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                  Tidak ada laporan keluhan dari warga.
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((comp) => (
                    <div key={comp.id} className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start">
                      {comp.photo_path && (
                        <div className="w-full md:w-32 h-32 relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                          <img
                            src={`http://127.0.0.1:8000/storage/${comp.photo_path}`}
                            alt="Bukti kerusakan"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-slate-200 font-bold">{comp.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            comp.status === 'new' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                            comp.status === 'reviewing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                            comp.status === 'in_progress' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {comp.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">Lokasi: <span className="text-slate-300 font-semibold">{comp.location}</span></p>
                        <p className="text-slate-300 text-xs leading-relaxed">{comp.description}</p>
                        <div className="text-[10px] text-slate-500">
                          Pelapor: {comp.user?.name} (Blok {comp.user?.house?.block}-{comp.user?.house?.number}) | 
                          Tanggal: {new Date(comp.created_at).toLocaleDateString('id-ID')}
                        </div>

                        {/* Action select */}
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-slate-400 text-xs font-semibold">Tanggapi:</span>
                          <select
                            value={comp.status}
                            onChange={(e) => handleComplaintStatus(comp.id, e.target.value)}
                            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-300 text-xs focus:outline-none"
                          >
                            <option value="new">Baru</option>
                            <option value="reviewing">Ditinjau</option>
                            <option value="in_progress">Dalam Perbaikan</option>
                            <option value="resolved">Selesai</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VOTING */}
          {activeTab === 'voting' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Create */}
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-fit">
                <h3 className="text-slate-200 font-bold mb-4">Buat Polling E-Voting</h3>
                <form onSubmit={handlePollSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Pertanyaan / Topik</label>
                    <input
                      type="text"
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                      placeholder="Contoh: Rencana Perbaikan Gapura"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Deskripsi Polling</label>
                    <textarea
                      value={pollDesc}
                      onChange={(e) => setPollDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none h-20"
                      placeholder="Jelaskan latar belakang polling ini..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Pilihan Jawaban (Pisahkan dengan Koma)</label>
                    <input
                      type="text"
                      value={pollOptions}
                      onChange={(e) => setPollOptions(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                      placeholder="Setuju, Tidak Setuju, Abstrak"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Batas Waktu (Deadline)</label>
                    <input
                      type="datetime-local"
                      value={pollDeadline}
                      onChange={(e) => setPollDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition-colors"
                  >
                    Rilis E-Voting
                  </button>
                </form>
              </div>

              {/* Poll list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-slate-200 font-bold">Hasil Voting Real-time</h3>
                {polls.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                    Belum ada e-voting yang aktif.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {polls.map((poll) => (
                      <div key={poll.id} className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-slate-200 font-bold text-base">{poll.title}</h4>
                            <p className="text-slate-400 text-xs">{poll.description}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            poll.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {poll.is_active ? 'AKTIF' : 'DITUTUP'}
                          </span>
                        </div>

                        {/* Results list */}
                        <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80">
                          {poll.results.map((res, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-300">
                                <span>{res.option}</span>
                                <span>{res.votes} Suara ({res.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${res.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
                          <span>Total Partisipasi: {poll.total_votes} Warga</span>
                          <span>Deadline: {new Date(poll.deadline).toLocaleString('id-ID')}</span>
                        </div>

                        {poll.is_active && (
                          <button
                            onClick={() => handleClosePoll(poll.id)}
                            className="w-full py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded transition-colors"
                          >
                            Tutup Polling Sekarang
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
