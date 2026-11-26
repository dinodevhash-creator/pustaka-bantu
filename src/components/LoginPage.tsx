import { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { ResilientImage } from './ResilientImage';

interface LoginPageProps {
  onSuccess: () => void;
  onContinueGuest: () => void;
}

const BENEFITS = [
  {
    title: 'Riwayat alat akademik otomatis tersimpan',
    desc: 'Simpan hasil hitung sampel Slovin, daftar sitasi APA/Harvard/IEEE, rekomendasi uji statistik, dan draf pesan bimbingan dosen.',
  },
  {
    title: 'Sinkronisasi lintas perangkat',
    desc: 'Lanjutkan ceklis 6 tahap progres skripsi, catatan pribadi di setiap panduan, dan panduan tersimpan dari laptop maupun ponsel.',
  },
  {
    title: 'Privat untuk akunmu sendiri',
    desc: 'Seluruh catatan dan riwayat kerja hanya dapat diakses oleh akun Google milikmu.',
  },
];

export function LoginPage({ onSuccess, onContinueGuest }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Jendela masuk Google ditutup sebelum selesai. Silakan coba lagi.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg(
          'Pop-up diblokir oleh peramban. Izinkan pop-up untuk halaman ini lalu klik Masuk lagi.'
        );
      } else {
        setErrorMsg('Gagal masuk dengan akun Google. Periksa koneksi internet lalu coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-grid bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-[#E8EEF9] flex flex-col">
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-[#F7F9FC]/90 dark:bg-[#0B1220]/90 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={onContinueGuest}
            className="font-display text-lg font-extrabold tracking-tight text-[#111C33] dark:text-[#F1F5F9] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Pustaka Bantu
          </button>

          <button
            type="button"
            onClick={onContinueGuest}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52607A] dark:text-slate-300 hover:text-[#111C33] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pustaka</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center py-10 lg:py-16">
        <div className="max-w-[1060px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: Sign-in Card */}
            <div className="lg:col-span-7 bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
                  Akun Mahasiswa · Sinkronisasi Cloud
                </p>
                <h1
                  className="mt-2 font-display font-extrabold tracking-tight text-[#111C33] dark:text-[#F1F5F9] leading-tight"
                  style={{
                    fontSize: 'clamp(1.85rem, 3.2vw, 2.5rem)',
                    textWrap: 'balance',
                  }}
                >
                  Masuk untuk menyimpan seluruh riwayat kerja kuliahmu
                </h1>
                <p className="mt-3 text-sm sm:text-base text-[#4A5873] dark:text-slate-300 leading-relaxed">
                  Gunakan akun Google pribadimu atau email kampus (.ac.id berbasis Google Workspace)
                  agar progres skripsi, catatan panduan, dan hasil alat bantu tidak hilang saat
                  berganti perangkat.
                </p>

                <ul className="mt-6 space-y-3.5">
                  {BENEFITS.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA] mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#111C33] dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="text-xs sm:text-sm text-[#52607A] dark:text-slate-400 leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {errorMsg && (
                  <div
                    role="alert"
                    className="mt-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs sm:text-sm text-rose-800 dark:text-rose-200"
                  >
                    {errorMsg}
                  </div>
                )}

                <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleLogin}
                    className="inline-flex items-center justify-center gap-3 h-12 px-6 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                    <span>{loading ? 'Menghubungkan ke Google…' : 'Masuk dengan Akun Google'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onContinueGuest}
                    className="h-12 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] hover:border-slate-300 dark:hover:border-slate-600 text-sm font-medium text-[#4A5873] dark:text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Lanjut sebagai Tamu
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-[#52607A] dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Data lokal yang sudah kamu kerjakan di peramban ini akan ikut digabungkan saat
                  pertama kali masuk.
                </span>
              </div>
            </div>

            {/* Right: Editorial Library Photography */}
            <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 min-h-[260px]">
              <ResilientImage
                src="/src/assets/images/study_calm_library_1795656705544.jpg"
                alt="Ruang baca kampus yang tenang dengan meja kayu dan jendela besar"
                fallbackTitle="Ruang Belajar Pustaka Bantu"
                caption="Bawa catatan dan riwayat skripsimu ke mana pun kamu belajar."
                className="w-full h-full object-cover lg:h-full"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B1220]/90 via-[#0B1220]/55 to-transparent p-6 text-white">
                <p className="text-xs font-medium text-slate-200/90">
                  Satu Akun · Semua Perangkat
                </p>
                <p className="mt-1 font-display text-lg font-bold leading-snug">
                  Semua progres skripsi dan riwayat kerja tetap rapi di satu tempat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
