import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Moon,
  PlayCircle,
  RefreshCw,
  Search,
  Sun,
} from 'lucide-react';
import {
  DAILY_TIPS,
  DailyTip,
  STUDY_SCENARIOS,
  StudyScenario,
  ToolId,
} from '../data/guides';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  query: string;
  onQueryChange: (val: string) => void;
  onSubmitSearch: () => void;
  onQuickKeyword: (keyword: string) => void;
  onSelectScenario: (scenario: StudyScenario) => void;
  onOpenTool: (tool: ToolId) => void;
  onJumpToGuide: (guideId: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  totalGuides: number;
  totalCategories: number;
  completedChecklistCount: number;
  onOpenPromoVideo: () => void;
}

interface DailyTipStorage {
  date: string;
  tipId: string;
  seenIds: string[];
  daysViewed: number;
  readToday: boolean;
}

const QUICK_TOPICS = ['skripsi', 'sitasi', 'beasiswa', 'burnout', 'magang', 'spss'];
const DAILY_TIP_STORAGE_KEY = 'pustaka_daily_tip_v1';

function getLocalDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatIndonesianDate(): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return getLocalDateKey();
  }
}

function pickNextTip(seenIds: string[], excludeId?: string): { tip: DailyTip; nextSeen: string[] } {
  const unseen = DAILY_TIPS.filter((t) => !seenIds.includes(t.id) && t.id !== excludeId);
  if (unseen.length > 0) {
    const chosen = unseen[0];
    return { tip: chosen, nextSeen: [...seenIds, chosen.id] };
  }
  const pool = DAILY_TIPS.filter((t) => t.id !== excludeId);
  const chosen = pool[0] || DAILY_TIPS[0];
  return { tip: chosen, nextSeen: [chosen.id] };
}

function loadOrAdvanceDailyTip(): DailyTipStorage {
  const today = getLocalDateKey();
  try {
    const raw = window.localStorage.getItem(DAILY_TIP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyTipStorage>;
      if (
        parsed &&
        typeof parsed.date === 'string' &&
        typeof parsed.tipId === 'string' &&
        DAILY_TIPS.some((t) => t.id === parsed.tipId)
      ) {
        if (parsed.date === today) {
          return {
            date: today,
            tipId: parsed.tipId,
            seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [parsed.tipId],
            daysViewed: typeof parsed.daysViewed === 'number' && parsed.daysViewed >= 1 ? parsed.daysViewed : 1,
            readToday: Boolean(parsed.readToday),
          };
        }
        // New calendar day: pick next unseen tip & increment daysViewed
        const prevSeen = Array.isArray(parsed.seenIds) ? parsed.seenIds : [parsed.tipId];
        const { tip, nextSeen } = pickNextTip(prevSeen, parsed.tipId);
        return {
          date: today,
          tipId: tip.id,
          seenIds: nextSeen,
          daysViewed: (typeof parsed.daysViewed === 'number' ? parsed.daysViewed : 0) + 1,
          readToday: false,
        };
      }
    }
  } catch {
    // Fallback to fresh first-day state
  }

  // Deterministic starting index based on day-of-year so fresh visitors see a timely tip
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
  const firstTip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
  return {
    date: today,
    tipId: firstTip.id,
    seenIds: [firstTip.id],
    daysViewed: 1,
    readToday: false,
  };
}

export function HeroSection({
  query,
  onQueryChange,
  onSubmitSearch,
  onQuickKeyword,
  onSelectScenario,
  onOpenTool,
  onJumpToGuide,
  isDark,
  onToggleTheme,
  totalGuides,
  totalCategories,
  completedChecklistCount,
  onOpenPromoVideo,
}: HeroSectionProps) {
  const [dailyState, setDailyState] = useState<DailyTipStorage>(() =>
    loadOrAdvanceDailyTip()
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(dailyState));
    } catch {
      // Ignore storage restrictions
    }
  }, [dailyState]);

  const currentTip =
    DAILY_TIPS.find((t) => t.id === dailyState.tipId) || DAILY_TIPS[0];

  const handleNextTip = () => {
    setDailyState((prev) => {
      const { tip, nextSeen } = pickNextTip(prev.seenIds, prev.tipId);
      return {
        ...prev,
        tipId: tip.id,
        seenIds: nextSeen,
        readToday: false,
      };
    });
  };

  const handleToggleRead = () => {
    setDailyState((prev) => ({ ...prev, readToday: !prev.readToday }));
  };

  return (
    <section
      id="beranda"
      className="paper-grid border-b border-slate-200/80 dark:border-slate-800/80"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Editorial Headline + Instant Search + Tips Belajar Harian */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-[#52607A] dark:text-slate-400 mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular-nums">{totalGuides} panduan ringkas</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{totalCategories} topik akademik</span>
                  <span aria-hidden="true">·</span>
                  <span>5 alat hitung &amp; kerja</span>
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[#111C33] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                </button>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight text-[#111C33] dark:text-[#F1F5F9] leading-[1.08]"
                style={{
                  fontSize: 'clamp(2.1rem, 3.8vw, 3.25rem)',
                  textWrap: 'balance',
                }}
              >
                Pustaka Bantu Mahasiswa untuk Kuliah &amp; Skripsi Lebih Terarah
              </h1>

              <p className="mt-4 text-base text-[#4A5873] dark:text-slate-300 leading-relaxed max-w-[60ch]">
                Ketik masalah kuliahmu untuk jawaban instan dari {totalGuides} panduan
                terkurasi, lalu lanjutkan langsung dengan kalkulator Slovin, generator sitasi,
                pemilih uji statistik, dan pelacak progres skripsi.
              </p>

              {/* Hero Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitSearch();
                }}
                className="mt-6"
              >
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => onQueryChange(e.target.value)}
                      placeholder="Cari panduan: skripsi, Slovin, sitasi, burnout..."
                      aria-label="Cari bantuan akademik"
                      className="w-full h-12 pl-10 pr-14 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA] focus:ring-2 focus:ring-[#1D4ED8]/20 transition-colors"
                    />
                    <span className="hidden sm:inline-flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[11px] font-mono text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded">
                      /
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="h-12 px-5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] dark:bg-[#2563EB] dark:hover:bg-[#3B82F6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                  >
                    Cari Panduan
                  </button>
                </div>
              </form>

              {/* Quick Topic Keywords + Promo Video Trigger */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-[#52607A] dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span>Topik sering dicari:</span>
                  {QUICK_TOPICS.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => onQuickKeyword(word)}
                      className="font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onOpenPromoVideo}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#111C33] dark:text-slate-200 hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PlayCircle className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA]" />
                  <span>Video Promosi</span>
                </button>
              </div>
            </div>

            {/* Tips Belajar Harian (Tracked Daily in localStorage) */}
            <div className="mt-7 pt-5 border-t border-slate-200/80 dark:border-slate-800">
              <div className="rounded-xl bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52607A] dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
                      Tips Belajar Harian
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{currentTip.kind}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatIndonesianDate()}</span>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-[#52607A] dark:text-slate-400">
                    Hari ke-{dailyState.daysViewed} · {dailyState.seenIds.length}/{DAILY_TIPS.length} dibaca
                  </span>
                </div>

                <blockquote className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-[#111C33] dark:text-slate-100 font-medium">
                  “{currentTip.text}”
                </blockquote>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
                  <span className="text-xs text-[#52607A] dark:text-slate-400">
                    — {currentTip.authorOrContext}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentTip.relatedGuideId && (
                      <button
                        type="button"
                        onClick={() => onJumpToGuide(currentTip.relatedGuideId!)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                      >
                        <span>Baca panduan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleToggleRead}
                      aria-pressed={dailyState.readToday}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                        dailyState.readToday
                          ? 'border-emerald-600/50 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-[#52607A] dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {dailyState.readToday ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Sudah dipahami</span>
                        </>
                      ) : (
                        <>
                          <BookOpenCheck className="w-3.5 h-3.5" />
                          <span>Tandai dibaca</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextTip}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-[#52607A] dark:text-slate-300 hover:text-[#111C33] dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                      title="Lihat tips lainnya"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Tips lain</span>
                    </button>
                  </div>
                </div>
              </div>

              {completedChecklistCount > 0 && (
                <div className="mt-3 flex items-center justify-between text-xs text-[#52607A] dark:text-slate-400">
                  <span>Progres belajarmu tersimpan otomatis di peramban ini.</span>
                  <span className="font-mono tabular-nums font-medium text-[#111C33] dark:text-slate-200">
                    {completedChecklistCount} langkah selesai
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editorial Library Photography */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 min-h-[280px] lg:min-h-0">
            <ResilientImage
              src="/src/assets/images/hero_academic_desk_1795656702489.jpg"
              alt="Meja belajar perpustakaan kampus dengan buku catatan terbuka, pena, tumpukan literatur, dan laptop"
              fallbackTitle="Meja Belajar Pustaka Bantu"
              caption="Ruang baca akademik untuk riset, catatan kuliah, dan penyusunan tugas akhir."
              className="w-full h-full object-cover lg:h-full"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B1220]/90 via-[#0B1220]/55 to-transparent p-6 text-white">
              <p className="text-xs font-medium text-slate-200/90">
                Meja Riset Mahasiswa · Akses Terbuka
              </p>
              <p className="mt-1 font-display text-lg font-bold leading-snug">
                Dari ide judul skripsi hingga siap menghadapi penguji.
              </p>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quick Pathways Strip Below Hero Split */}
        <div className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 className="font-display text-lg font-bold text-[#111C33] dark:text-[#F1F5F9]">
              Sedang butuh bantuan untuk situasi apa hari ini?
            </h2>
            <span className="text-xs text-[#52607A] dark:text-slate-400">
              Pilih jalur cepat untuk menyaring panduan &amp; alat yang relevan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STUDY_SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                className="group flex flex-col justify-between bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 hover:border-[#1D4ED8]/50 dark:hover:border-[#60A5FA]/50 rounded-xl p-5 transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
                    {scenario.kicker}
                  </p>
                  <h3 className="mt-1.5 font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectScenario(scenario)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    <span>Lihat {scenario.guideIds.length} panduan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenTool(scenario.recommendedTool)}
                    className="text-xs font-medium text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {scenario.toolLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
