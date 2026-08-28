'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Invoice, CashLedger, Announcement, Complaint, Vote } from '@/types';

export default function WargaDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<CashLedger[]>([]);
  const [balance, setBalance] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [polls, setPolls] = useState<Vote[]>([]);

  // Active billing transfer upload form
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');

  // Complaint form
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compLoc, setCompLoc] = useState('');
  const [compPhoto, setCompPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'billing' | 'transparency' | 'announcements' | 'complaints' | 'voting'>('billing');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const invoicesRes = await api.get('/invoices');
      const ledgerRes = await api.get('/treasury/ledger');
      const summaryRes = await api.get('/treasury/summary');
      const annRes = await api.get('/announcements');
      const compRes = await api.get('/complaints');
      const pollRes = await api.get('/voting');

      if (invoicesRes.data.success) setInvoices(invoicesRes.data.invoices);
      if (ledgerRes.data.success) setLedger(ledgerRes.data.ledger);
      if (summaryRes.data.success) setBalance(summaryRes.data.summary.total_balance);
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

  const handleUploadProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !proofFile) return;

    setSubmitting(true);
    setMsg('');

    const formData = new FormData();
    formData.append('proof_image', proofFile);
    formData.append('notes', proofNotes);

    try {
      const response = await api.post(`/invoices/${payingInvoice.id}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMsg('Bukti transfer berhasil diunggah. Menunggu konfirmasi Bendahara.');
        setPayingInvoice(null);
        setProofFile(null);
        setProofNotes('');
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal mengunggah bukti transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    const formData = new FormData();
    formData.append('title', compTitle);
    formData.append('description', compDesc);
    formData.append('location', compLoc);
    if (compPhoto) formData.append('photo', compPhoto);

    try {
      const response = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMsg('Pengaduan Anda berhasil dilaporkan.');
        setCompTitle('');
        setCompDesc('');
        setCompLoc('');
        setCompPhoto(null);
        const fileInput = document.getElementById('comp_photo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal mengirim pengaduan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCastVote = async (pollId: number, option: string) => {
    try {
      const response = await api.post(`/voting/${pollId}/vote`, { option });
      if (response.data.success) {
        setMsg('Suara Anda berhasil dikirim!');
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal mengirim suara.');
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val));
  };

  const activeInvoice = invoices.find((inv) => inv.status === 'unpaid' || inv.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Beranda Warga</h2>
          <p className="text-slate-400 text-sm">Lihat tagihan bulanan, transparansi keuangan kas komplek, lapor keluhan dan e-voting.</p>
        </div>
        
        {activeInvoice && activeInvoice.status === 'unpaid' && (
          <button
            onClick={() => setPayingInvoice(activeInvoice)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-950/30 transition-all flex items-center gap-2"
          >
            💳 Bayar Tagihan Aktif
          </button>
        )}
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
          onClick={() => setActiveTab('billing')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'billing'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tagihan Iuran
        </button>
        <button
          onClick={() => setActiveTab('transparency')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'transparency'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Transparansi Kas RT
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'announcements'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Papan Pengumuman ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'complaints'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Lapor Keluhan
        </button>
        <button
          onClick={() => setActiveTab('voting')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'voting'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          E-Voting Polling ({polls.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Memproses data...</div>
      ) : (
        <div className="min-h-[350px]">
          {/* TAB 1: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {payingInvoice && (
                <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4 max-w-xl mx-auto">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Pembayaran Iuran Bulan {payingInvoice.month}/{payingInvoice.year}</h3>
                    <button
                      onClick={() => setPayingInvoice(null)}
                      className="text-slate-400 hover:text-slate-200 font-bold"
                    >
                      ✕ Batal
                    </button>
                  </div>
                  
                  <div className="bg-slate-950/60 p-4 rounded-xl space-y-2.5 text-sm border border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Iuran Kebersihan:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(payingInvoice.kebersihan_amount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Iuran Air Bersih:</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(payingInvoice.air_amount)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold border-t border-slate-850 pt-2 text-base">
                      <span>Total Tagihan:</span>
                      <span className="text-indigo-400">{formatCurrency(payingInvoice.total_amount)}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl text-xs space-y-2 text-slate-300">
                    <span className="font-bold text-indigo-300 uppercase block">Instruksi Pembayaran Digital (Transfer / QRIS):</span>
                    <p>1. Transfer ke Rekening RT Bank Syariah Indonesia (BSI): <b>7700-8800-99 (a/n Swadaya GBK)</b></p>
                    <p>2. Atau scan QRIS Swadaya di papan pos satpam komplek.</p>
                    <p>3. Capture bukti transfer Anda, lalu unggah form di bawah.</p>
                  </div>

                  <form onSubmit={handleUploadProofSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-300 text-xs font-semibold mb-2">Unggah Foto Bukti Transfer</label>
                      <input
                        type="file"
                        onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-slate-300 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-950 file:text-slate-300 file:hover:bg-slate-900 cursor-pointer"
                        accept="image/*"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-xs font-semibold mb-2">Catatan Tambahan (Opsional)</label>
                      <input
                        type="text"
                        value={proofNotes}
                        onChange={(e) => setProofNotes(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 text-xs focus:outline-none"
                        placeholder="Contoh: Pembayaran Lunas via transfer BNI"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all"
                    >
                      {submitting ? 'Mengunggah...' : 'Kirim Konfirmasi Transfer'}
                    </button>
                  </form>
                </div>
              )}

              {/* Invoices List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Riwayat Tagihan Rumah Anda</h3>
                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Belum ada tagihan diterbitkan untuk rumah ini.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Tagihan Bulan</h4>
                            <p className="text-slate-100 font-extrabold text-lg mt-0.5">{inv.month}/{inv.year}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'unpaid' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                            inv.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {inv.status === 'unpaid' ? 'BELUM BAYAR' : inv.status === 'pending' ? 'VERIFIKASI' : 'LUNAS'}
                          </span>
                        </div>

                        <div className="bg-slate-950/50 p-3 rounded-lg text-xs space-y-1.5 text-slate-400 border border-slate-850">
                          <div className="flex justify-between">
                            <span>Iuran Kebersihan:</span>
                            <span className="text-slate-300 font-semibold">{formatCurrency(inv.kebersihan_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Iuran Air:</span>
                            <span className="text-slate-300 font-semibold">{formatCurrency(inv.air_amount)}</span>
                          </div>
                          <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800/80 pt-1.5">
                            <span>Total:</span>
                            <span>{formatCurrency(inv.total_amount)}</span>
                          </div>
                        </div>

                        {inv.status === 'unpaid' && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="w-full py-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/35 text-indigo-300 text-xs font-bold rounded-lg transition-colors"
                          >
                            Konfirmasi Pembayaran
                          </button>
                        )}

                        {inv.status === 'paid_manual' && (
                          <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded text-[10px] text-emerald-400 italic text-center">
                            Diterima Tunai oleh Bendahara pada {new Date(inv.verified_at || '').toLocaleDateString('id-ID')}
                          </div>
                        )}
                        
                        {inv.status === 'paid_transfer' && (
                          <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded text-[10px] text-emerald-400 italic text-center">
                            Diverifikasi oleh Bendahara pada {new Date(inv.verified_at || '').toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TRANSPARENCY */}
          {activeTab === 'transparency' && (
            <div className="space-y-6">
              {/* Financial Box */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Transparansi Buku Kas Perumahan</h3>
                  <p className="text-slate-400 text-xs mt-1">Laporan mutasi pemasukan & pengeluaran yang diupdate real-time.</p>
                </div>
                <div className="bg-indigo-500/15 border border-indigo-500/25 px-5 py-3 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 block">Total Saldo Kas RT Saat Ini</span>
                  <span className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(balance)}</span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5">
                <h4 className="text-slate-300 font-bold mb-4">Laporan Mutasi Transaksi Kas</h4>
                {ledger.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Belum ada transaksi tercatat.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Keperluan / Keterangan</th>
                          <th className="py-3 px-4">Metode</th>
                          <th className="py-3 px-4">Jenis</th>
                          <th className="py-3 px-4">Jumlah</th>
                          <th className="py-3 px-4">Foto Nota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {ledger.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(item.recorded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-200">{item.description}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-850 rounded text-[10px] font-bold">
                                {item.payment_method.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {item.type === 'income' ? 'MASUK' : 'KELUAR'}
                              </span>
                            </td>
                            <td className={`py-3 px-4 font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                            </td>
                            <td className="py-3 px-4">
                              {item.proof_path ? (
                                <a
                                  href={`http://127.0.0.1:8000/storage/${item.proof_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 text-xs font-bold underline"
                                >
                                  Lihat Nota
                                </a>
                              ) : (
                                <span className="text-slate-500 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Papan Pengumuman Komplek</h3>
              {announcements.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                  Tidak ada pengumuman untuk saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ann.category === 'agenda' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          ann.category === 'berita_duka' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {ann.category.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-slate-500 text-xs">{new Date(ann.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      <h4 className="text-slate-200 font-bold text-base">{ann.title}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line">{ann.content}</p>
                      <div className="text-[10px] text-slate-500 border-t border-slate-850 pt-2">
                        Disampaikan oleh: {ann.author?.name || 'Pengurus'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Filer */}
              <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-5 h-fit">
                <h3 className="text-slate-200 font-bold mb-4">Laporkan Masalah Fasilitas</h3>
                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Masalah / Fasilitas Rusak</label>
                    <input
                      type="text"
                      value={compTitle}
                      onChange={(e) => setCompTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                      placeholder="Contoh: Lampu Jalan Padam"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Lokasi Kerusakan</label>
                    <input
                      type="text"
                      value={compLoc}
                      onChange={(e) => setCompLoc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                      placeholder="Contoh: Depan Blok B-05"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Deskripsi Detail</label>
                    <textarea
                      value={compDesc}
                      onChange={(e) => setCompDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none h-24"
                      placeholder="Jelaskan kondisi kerusakan secara rinci..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Unggah Foto Bukti (Opsional)</label>
                    <input
                      id="comp_photo"
                      type="file"
                      onChange={(e) => setCompPhoto(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-slate-300 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-950 file:text-slate-300 file:hover:bg-slate-900 cursor-pointer"
                      accept="image/*"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition-colors"
                  >
                    Kirim Laporan Keluhan
                  </button>
                </form>
              </div>

              {/* Complaints History */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-slate-200 font-bold">Laporan Keluhan Anda & Warga Lain</h3>
                {complaints.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                    Belum ada pengaduan keluhan dimasukkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {complaints.map((comp) => (
                      <div key={comp.id} className="bg-slate-900/20 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start">
                        {comp.photo_path && (
                          <div className="w-full sm:w-24 h-24 bg-slate-950 border border-slate-800 rounded overflow-hidden relative">
                            <img
                              src={`http://127.0.0.1:8000/storage/${comp.photo_path}`}
                              alt="Kerusakan"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <h4 className="text-slate-200 font-bold">{comp.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                          <p className="text-[10px] text-slate-500">
                            Oleh: {comp.user?.name} | {new Date(comp.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: VOTING */}
          {activeTab === 'voting' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Partisipasi E-Voting Warga</h3>
              {polls.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                  Tidak ada polling suara aktif untuk saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {polls.map((poll) => (
                    <div key={poll.id} className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-slate-200 font-bold text-base">{poll.title}</h4>
                          <p className="text-slate-400 text-xs mt-1">{poll.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          poll.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {poll.is_active ? 'AKTIF' : 'SELESAI'}
                        </span>
                      </div>

                      {/* Vote form or results */}
                      {!poll.has_voted && poll.is_active ? (
                        <div className="space-y-2 border-t border-slate-850 pt-3">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Pilih Suara Anda:</span>
                          <div className="flex flex-wrap gap-2">
                            {poll.options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => handleCastVote(poll.id, opt)}
                                className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-200 hover:text-indigo-400 font-semibold text-xs rounded-xl transition-all"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3.5 border-t border-slate-850 pt-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Hasil Polling Real-time:</span>
                            {poll.has_voted && (
                              <span className="text-emerald-400 font-bold">✓ Pilihan Anda: {poll.voted_option}</span>
                            )}
                          </div>
                          
                          <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                            {poll.results.map((res, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-slate-300">
                                  <span>{res.option}</span>
                                  <span>{res.votes} Suara ({res.percentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-indigo-500 h-full rounded-full"
                                    style={{ width: `${res.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                        <span>Total Suara Masuk: {poll.total_votes}</span>
                        <span>Deadline: {new Date(poll.deadline).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
