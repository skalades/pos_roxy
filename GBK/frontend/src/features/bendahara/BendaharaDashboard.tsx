'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { House, Invoice, CashLedger } from '@/types';

export default function BendaharaDashboard() {
  const [houses, setHouses] = useState<House[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [ledger, setLedger] = useState<CashLedger[]>([]);
  const [balance, setBalance] = useState(0);

  // Settings
  const [kebersihanRate, setKebersihanRate] = useState('');
  const [airRate, setAirRate] = useState('');

  // Manual payment form
  const [manualHouseId, setManualHouseId] = useState('');
  const [manualMonth, setManualMonth] = useState('');
  const [manualYear, setManualYear] = useState('');

  // Expense form
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expMethod, setExpMethod] = useState('cash');
  const [expReceipt, setExpReceipt] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'verification' | 'manual_pay' | 'expense' | 'ledger' | 'settings'>('verification');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    try {
      const housesRes = await api.get('/houses');
      const invoicesRes = await api.get('/invoices?status=pending');
      const ledgerRes = await api.get('/treasury/ledger');
      const summaryRes = await api.get('/treasury/summary');
      const settingsRes = await api.get('/iuran-settings');

      if (housesRes.data.success) setHouses(housesRes.data.houses);
      if (invoicesRes.data.success) setPendingInvoices(invoicesRes.data.invoices);
      if (ledgerRes.data.success) setLedger(ledgerRes.data.ledger);
      if (summaryRes.data.success) setBalance(summaryRes.data.summary.total_balance);
      if (settingsRes.data.success) {
        setKebersihanRate(settingsRes.data.settings.kebersihan);
        setAirRate(settingsRes.data.settings.air);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (invoiceId: number, action: 'approve' | 'reject') => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/verify`, { action });
      if (response.data.success) {
        setMsg(action === 'approve' ? 'Pembayaran berhasil disetujui!' : 'Bukti transfer ditolak.');
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal memverifikasi.');
    }
  };

  const handleManualPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    try {
      const response = await api.post('/invoices/pay-manual', {
        house_id: Number(manualHouseId),
        month: Number(manualMonth),
        year: Number(manualYear),
      });

      if (response.data.success) {
        setMsg(response.data.message);
        setManualHouseId('');
        setManualMonth('');
        setManualYear('');
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal menginput pembayaran manual.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expReceipt) {
      setMsg('Foto nota belanja wajib diunggah.');
      return;
    }

    setSubmitting(true);
    setMsg('');

    const formData = new FormData();
    formData.append('amount', expAmount);
    formData.append('description', expDesc);
    formData.append('payment_method', expMethod);
    formData.append('receipt_image', expReceipt);

    try {
      const response = await api.post('/treasury/expense', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMsg('Pengeluaran berhasil dicatat.');
        setExpAmount('');
        setExpDesc('');
        setExpReceipt(null);
        // Reset file input
        const fileInput = document.getElementById('receipt') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        loadData();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal menyimpan pengeluaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    try {
      const response = await api.post('/iuran-settings', {
        kebersihan: Number(kebersihanRate),
        air: Number(airRate),
      });

      if (response.data.success) {
        setMsg('Nominal iuran flat berhasil diperbarui.');
        loadData();
      }
    } catch (err: any) {
      setMsg('Gagal memperbarui iuran.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val));
  };

  return (
    <div className="space-y-6">
      {/* Treasury Header Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Saldo Kas RT</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{formatCurrency(balance)}</h2>
            <p className="text-emerald-100/80 text-xs mt-2">Dikelola swadaya oleh Bendahara Griya Bumi Kamuning</p>
          </div>
          <div className="text-4xl opacity-20 hidden sm:block">💰</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pengaturan Tarif Flat</h3>
          <p className="text-slate-200 text-sm font-semibold">Kebersihan: {formatCurrency(kebersihanRate)}</p>
          <p className="text-slate-200 text-sm font-semibold">Air Bersih: {formatCurrency(airRate)}</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-400 font-bold hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'verification'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Verifikasi Transfer ({pendingInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('manual_pay')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'manual_pay'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Input Bayar Tunai
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'expense'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Catat Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'ledger'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Buku Kas Transparan
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Ubah Nominal Iuran
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Memproses data...</div>
      ) : (
        <div className="min-h-[350px]">
          {/* TAB 1: VERIFICATIONS */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Menunggu Verifikasi Bukti Transfer</h3>
              {pendingInvoices.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                  Tidak ada bukti pembayaran transfer yang menunggu verifikasi.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingInvoices.map((inv) => (
                    <div key={inv.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-slate-200 font-bold">
                            Rumah {inv.house ? `Blok ${inv.house.block}-${inv.house.number}` : '-'}
                          </h4>
                          <p className="text-slate-400 text-xs mt-1">Tagihan Bulan: {inv.month}/{inv.year}</p>
                          <p className="text-emerald-400 text-sm font-extrabold mt-1">{formatCurrency(inv.total_amount)}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/35 text-amber-400 rounded text-[10px] font-bold">
                          PENDING
                        </span>
                      </div>

                      {inv.payment_proof && (
                        <div className="space-y-2 border-t border-slate-800/80 pt-3">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Foto Bukti Transfer:</span>
                          <div className="w-full h-48 bg-slate-950 rounded border border-slate-800 overflow-hidden relative">
                            <img
                              src={`http://127.0.0.1:8000/storage/${inv.payment_proof.file_path}`}
                              alt="Bukti Transfer"
                              className="object-contain w-full h-full"
                            />
                          </div>
                          {inv.payment_proof.notes && (
                            <p className="text-slate-300 text-xs italic bg-slate-950/40 p-2 rounded">
                              &ldquo;{inv.payment_proof.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleVerify(inv.id, 'approve')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all"
                        >
                          Konfirmasi Lunas
                        </button>
                        <button
                          onClick={() => handleVerify(inv.id, 'reject')}
                          className="flex-1 py-2 bg-rose-600/15 border border-rose-500/30 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs rounded-lg transition-all"
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

          {/* TAB 2: MANUAL PAYMENT */}
          {activeTab === 'manual_pay' && (
            <div className="max-w-md mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-2">Input Pembayaran Tunai (Manual)</h3>
              <p className="text-slate-400 text-xs mb-6">Gunakan form ini jika warga membayar iuran bulanan secara tunai ke Bendahara.</p>
              
              <form onSubmit={handleManualPaySubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Pilih Rumah Warga</label>
                  <select
                    value={manualHouseId}
                    onChange={(e) => setManualHouseId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                    required
                  >
                    <option value="" disabled>-- Pilih Blok / No Rumah --</option>
                    {houses.map((house) => (
                      <option key={house.id} value={house.id} className="bg-slate-950 text-slate-200">
                        Blok {house.block}-{house.number} ({house.status === 'occupied_owner' ? 'Pemilik' : house.status === 'rented' ? 'Kontrak' : 'Kosong'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">Bulan Tagihan</label>
                    <select
                      value={manualMonth}
                      onChange={(e) => setManualMonth(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                      required
                    >
                      <option value="" disabled>Bulan</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m} className="bg-slate-950 text-slate-200">{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-2">Tahun</label>
                    <select
                      value={manualYear}
                      onChange={(e) => setManualYear(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                      required
                    >
                      <option value="" disabled>Tahun</option>
                      <option value="2026" className="bg-slate-950 text-slate-200">2026</option>
                      <option value="2027" className="bg-slate-950 text-slate-200">2027</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg focus:outline-none active:scale-[0.98] transition-all mt-4"
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi Lunas Tunai'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: RECORD EXPENSE */}
          {activeTab === 'expense' && (
            <div className="max-w-md mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-2">Catat Pengeluaran Kas RT</h3>
              <p className="text-slate-400 text-xs mb-6">Setiap pencatatan pengeluaran kas wajib melampirkan foto bukti nota belanja.</p>

              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Nominal Pengeluaran (Rp)</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none"
                    placeholder="Contoh: 150000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Deskripsi Keperluan</label>
                  <input
                    type="text"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none"
                    placeholder="Contoh: Pembelian sapu lidi & plastik sampah"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Metode Pembayaran</label>
                  <select
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none"
                  >
                    <option value="cash" className="bg-slate-950">Cash / Tunai</option>
                    <option value="transfer" className="bg-slate-950">Transfer Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Unggah Foto Nota Belanja</label>
                  <input
                    id="receipt"
                    type="file"
                    onChange={(e) => setExpReceipt(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-slate-300 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-950 file:text-slate-300 file:hover:bg-slate-900 focus:outline-none cursor-pointer"
                    accept="image/*"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg focus:outline-none active:scale-[0.98] transition-all mt-4"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: LEDGER LIST */}
          {activeTab === 'ledger' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Riwayat Buku Kas Real-time</h3>
              {ledger.length === 0 ? (
                <div className="text-center py-12 text-slate-500">Belum ada transaksi di buku kas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Deskripsi / Komponen</th>
                        <th className="py-3 px-4">Metode</th>
                        <th className="py-3 px-4">Jenis</th>
                        <th className="py-3 px-4">Jumlah</th>
                        <th className="py-3 px-4">Nota / Bukti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {ledger.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(item.recorded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-slate-200">{item.description}</p>
                              <p className="text-[10px] text-slate-500">Oleh: {item.recorder?.name || 'Sistem'}</p>
                            </div>
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
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-md mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-2">Ubah Nominal Tarif Flat</h3>
              <p className="text-slate-400 text-xs mb-6">Perubahan nominal ini akan berlaku otomatis untuk tagihan bulan berikutnya.</p>

              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Nominal Iuran Kebersihan (Rp)</label>
                  <input
                    type="number"
                    value={kebersihanRate}
                    onChange={(e) => setKebersihanRate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2">Nominal Iuran Air Bersih (Rp)</label>
                  <input
                    type="number"
                    value={airRate}
                    onChange={(e) => setAirRate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none"
                    min="0"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg focus:outline-none active:scale-[0.98] transition-all mt-4"
                >
                  {submitting ? 'Menyimpan...' : 'Perbarui Nominal'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
