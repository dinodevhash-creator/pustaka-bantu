import { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Check,
  Clock,
  Cloud,
  Copy,
  LogIn,
  LogOut,
  Trash2,
} from 'lucide-react';
import { WorkHistoryCategory, WorkHistoryEntry } from '../firebase';

interface WorkHistorySectionProps {
  user: User | null;
  authReady: boolean;
  entries: WorkHistoryEntry[];
  syncing: boolean;
  onOpenLogin: () => void;
  onSignOut: () => void;
  onDeleteEntry: (entryId: string) => void;
}

const CATEGORY_LABELS: Record<'semua' | WorkHistoryCategory, string> = {
  semua: 'Semua',
  slovin: 'Slovin',
  sitasi: 'Sitasi',
  statistik: 'Uji Statistik',
  'pesan-dosen': 'Pesan Dosen',
  pomodoro: 'Pomodoro',
  skripsi: 'Skripsi',
  panduan: 'Panduan',
};

function formatTimestamp(ms: number): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return '';
  }
}

export function WorkHistorySection({
  user,
  authReady,
  entries,
  syncing,
  onOpenLogin,
  onSignOut,
  onDeleteEntry,
}: WorkHistorySectionProps) {
  const [filter, setFilter] = useState<'semua' | WorkHistoryCategory>('semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleEntries = useMemo(() => {
    if (filter === 'semua') return entries;
    return entries.filter((e) => e.category === filter);
  }, [entries, filter]);

  const handleCopy = async (entry: WorkHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(`${entry.title}\n\n${entry.detail}`);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId((curr) => (curr === entry.id ? null : curr)), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <section
      id="riwayat-kerja"
      className="py-12 lg:py-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0D1627]/60"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
              Riwayat Kerja Mahasiswa · {user ? 'Tersinkron ke Akun Google' : 'Mode Tamu Lokal'}
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C33] dark:text-[#F1F5F9]">
              Arsip pekerjaan &amp; akun belajarmu
            </h2>
          </div>

          {authReady && user ? (
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-xl px-4 py-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Foto profil'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                  {(user.displayName || user.email || 'M').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111C33] dark:text-white truncate max-w-[180px]">
                  {user.displayName || 'Akun Google'}
                </p>
                <p className="text-[11px] text-[#52607A] dark:text-slate-400 truncate max-w-[180px]">
                  {syncing ? 'Menyinkronkan…' : user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#4A5873] dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk dengan Akun Google</span>
            </button>
          )}
        </div>

        {/* Cloud Sync Prompt for Guest Visitors */}
        {authReady && !user && (
          <div className="mb-6 bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <Cloud className="w-5 h-5 text-[#1D4ED8] dark:text-[#60A5FA] mt-0.5 shrink-0" />
              <div>
                <h3 className="font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                  Masuk dengan Google agar riwayat tidak hilang saat ganti perangkat
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed max-w-2xl">
                  Saat ini riwayat hasil hitung Slovin, sitasi, uji statistik, pesan dosen,
                  catatan pribadi, dan progres skripsi hanya tersimpan di peramban ini. Masuk
                  sekali dengan akun Google untuk mencadangkan semuanya otomatis.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-4 py-2.5 rounded-xl bg-[#111C33] dark:bg-slate-200 text-white dark:text-[#0B1220] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              Buka Halaman Masuk
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4"
          role="group"
          aria-label="Filter kategori riwayat kerja"
        >
          {(Object.keys(CATEGORY_LABELS) as ('semua' | WorkHistoryCategory)[]).map((key) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#111C33] dark:bg-[#E8EEF9] text-white dark:text-[#0B1220]'
                    : 'bg-white dark:bg-[#111B2E] border border-slate-200 dark:border-slate-800 text-[#4A5873] dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {CATEGORY_LABELS[key]}
              </button>
            );
          })}
        </div>

        {/* History List */}
        {visibleEntries.length === 0 ? (
          <div className="bg-white dark:bg-[#111B2E] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
            <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
              Belum ada riwayat kerja pada kategori ini
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-[#52607A] dark:text-slate-400 max-w-md mx-auto">
              Gunakan tombol <strong>Simpan ke Riwayat</strong> pada Kalkulator Slovin, Generator
              Sitasi, Pemilih Uji Statistik, atau Generator Pesan Dosen — atau selesaikan sesi
              Pomodoro untuk mencatat pekerjaanmu di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleEntries.map((entry) => (
              <article
                key={entry.id}
                className="bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52607A] dark:text-slate-400">
                    <span className="font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
                      {CATEGORY_LABELS[entry.category]}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums">
                      {formatTimestamp(entry.createdAtMs)}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                    {entry.title}
                  </h3>
                  {entry.detail && (
                    <p className="mt-2 text-xs sm:text-sm text-[#4A5873] dark:text-slate-300 whitespace-pre-line leading-relaxed bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/70 dark:border-slate-800 rounded-lg p-3">
                      {entry.detail}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(entry)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#52607A] dark:text-slate-300 hover:border-slate-300 cursor-pointer"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    aria-label="Hapus riwayat kerja"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#52607A] dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
