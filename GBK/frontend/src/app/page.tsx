import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col justify-between text-slate-100 font-sans relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            R
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white leading-none tracking-tight">Rukun-Net</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Griya Bumi Kamuning</span>
          </div>
        </div>

        <Link
          href="/login"
          className="px-4 py-2 border border-indigo-500/30 hover:border-indigo-400 text-indigo-400 hover:text-indigo-300 text-sm font-semibold rounded-xl transition-all"
        >
          Masuk Portal
        </Link>
      </header>

      {/* Hero Body */}
      <main className="max-w-4xl w-full mx-auto px-6 py-16 text-center space-y-8 relative z-10 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <span className="px-3.5 py-1.5 bg-indigo-500/15 border border-indigo-500/25 rounded-full text-indigo-300 text-xs font-bold tracking-wide uppercase inline-block">
            Portal Swadaya Warga &bull; Rev7 Final
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none">
            Transparansi Kas & <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Tata Kelola Swadaya Warga
            </span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Selamat datang di Rukun-Net Griya Bumi Kamuning. Platform digital kependudukan mandiri, tata kelola iuran kebersihan & air flat rate, serta transparansi buku kas keuangan komplek.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto pt-4">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 text-left space-y-4 shadow-xl transition-all hover:scale-[1.01]">
            <h3 className="text-lg font-bold text-white">Sensus Mandiri</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Daftarkan diri Anda beserta anggota keluarga yang tinggal serumah di Griya Bumi Kamuning untuk terdata secara digital.
            </p>
            <Link
              href="/register"
              className="inline-block w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/40 transition-all"
            >
              Mulai Sensus Mandiri
            </Link>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-6 text-left space-y-4 shadow-xl transition-all hover:scale-[1.01]">
            <h3 className="text-lg font-bold text-white">Pembayaran & Transparansi</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Lihat tagihan bulanan (Kebersihan & Air), bayar secara transfer/digital, verifikasi tunai, dan pantau buku kas RT real-time.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-center font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all"
            >
              Masuk Aplikasi
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-slate-500 text-xs relative z-10 bg-slate-950/20">
        &copy; 2026 Rukun-Net &mdash; Griya Bumi Kamuning. Dikelola Secara Swadaya oleh Warga.
      </footer>
    </div>
  );
}

