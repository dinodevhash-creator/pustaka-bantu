import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Moon,
  StickyNote,
  Sun,
  ThumbsUp,
  Wrench,
} from 'lucide-react';
import { GuideItem, TOOL_LABELS, ToolId } from '../data/guides';

interface FocusReaderProps {
  guide: GuideItem;
  prevGuide: GuideItem | null;
  nextGuide: GuideItem | null;
  isDark: boolean;
  onToggleTheme: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  isHelpful: boolean;
  helpfulCount: number;
  onToggleHelpful: (id: string) => void;
  checkedSteps: Record<string, boolean>;
  onToggleStep: (guideId: string, stepIndex: number) => void;
  note: string;
  onSaveNote: (guideId: string, note: string) => void;
  isSignedIn: boolean;
  onSelectGuide: (guideId: string) => void;
  onOpenTool: (tool: ToolId) => void;
  onExit: () => void;
}

type FontScale = 'normal' | 'large' | 'xlarge';

const FONT_SCALE_KEY = 'pustaka_focus_font_scale_v1';

const SCALE_CLASSES: Record<FontScale, { body: string; step: string; label: string }> = {
  normal: {
    body: 'text-base leading-[1.75]',
    step: 'text-[15px] sm:text-base leading-[1.75]',
    label: 'Normal',
  },
  large: {
    body: 'text-[17px] sm:text-lg leading-[1.8]',
    step: 'text-base sm:text-[17px] leading-[1.8]',
    label: 'Besar',
  },
  xlarge: {
    body: 'text-lg sm:text-[19px] leading-[1.85]',
    step: 'text-[17px] sm:text-lg leading-[1.85]',
    label: 'Ekstra',
  },
};

export function FocusReader({
  guide,
  prevGuide,
  nextGuide,
  isDark,
  onToggleTheme,
  isSaved,
  onToggleSave,
  isHelpful,
  helpfulCount,
  onToggleHelpful,
  checkedSteps,
  onToggleStep,
  note,
  onSaveNote,
  isSignedIn,
  onSelectGuide,
  onOpenTool,
  onExit,
}: FocusReaderProps) {
  const [fontScale, setFontScale] = useState<FontScale>(() => {
    try {
      const saved = window.localStorage.getItem(FONT_SCALE_KEY);
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') return saved;
    } catch {
      // ignore
    }
    return 'normal';
  });
  const [showNote, setShowNote] = useState<boolean>(() => Boolean(note.trim()));
  const [copied, setCopied] = useState(false);

  // Scroll to top when switching guides inside Focus Mode
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setShowNote(Boolean(note.trim()));
    setCopied(false);
  }, [guide.id]);

  // Persist reading font size preference
  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_SCALE_KEY, fontScale);
    } catch {
      // ignore
    }
  }, [fontScale]);

  // Press Escape to leave Focus Mode (unless editing note textarea)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        target.blur();
        return;
      }
      e.preventDefault();
      onExit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onExit]);

  const doneSteps = guide.steps.filter((_, idx) => checkedSteps[`${guide.id}:${idx}`]).length;
  const progressPercent =
    guide.steps.length > 0 ? Math.round((doneSteps / guide.steps.length) * 100) : 0;

  const scale = SCALE_CLASSES[fontScale];

  const cycleFontScale = () => {
    setFontScale((prev) =>
      prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'
    );
  };

  const handleCopy = async () => {
    const text = [
      `${guide.title} (${guide.category})`,
      guide.summary,
      '',
      ...guide.steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      `Catatan praktis: ${guide.proTip}`,
      '— Pustaka Bantu Mahasiswa',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore restricted clipboard
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFC] dark:bg-[#090F1A] text-[#111C33] dark:text-[#E8EEF9]">
      {/* Quiet Top Reading Bar */}
      <div className="sticky top-0 z-30 bg-[#F9FAFC]/95 dark:bg-[#090F1A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Step Progress Hairline */}
        <div className="h-0.5 w-full bg-slate-200/60 dark:bg-slate-800/80">
          <div
            className="h-full bg-[#1D4ED8] dark:bg-[#60A5FA] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-[780px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#111C33] dark:text-slate-100 hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] rounded-md py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Keluar Mode Fokus</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={cycleFontScale}
              aria-label={`Ubah ukuran teks baca, saat ini ${scale.label}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2E] text-xs font-semibold text-[#4A5873] dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="font-display">Aa</span>
              <span className="hidden sm:inline text-[#52607A] dark:text-slate-400">
                {scale.label}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2E] text-[#4A5873] dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Distraction-Free Editorial Column */}
      <main className="flex-1 w-full max-w-[740px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <article>
          {/* Quiet Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[#52607A] dark:text-slate-400">
            <span className="font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
              {guide.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{guide.readMinutes} menit baca</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {doneSteps}/{guide.steps.length} langkah selesai
            </span>
          </div>

          {/* Guide Title */}
          <h1 className="mt-3 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#111C33] dark:text-[#F8FAFC] leading-[1.2] text-balance">
            {guide.title}
          </h1>

          {/* Lead Summary */}
          <p
            className={`mt-4 text-[#4A5873] dark:text-slate-300 ${scale.body} pb-7 border-b border-slate-200/80 dark:border-slate-800/80`}
          >
            {guide.summary}
          </p>

          {/* Interactive Step-by-Step Checklist */}
          <section className="mt-8" aria-labelledby="focus-steps-heading">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2
                id="focus-steps-heading"
                className="font-display text-base sm:text-lg font-bold text-[#111C33] dark:text-[#F1F5F9]"
              >
                Langkah Praktis
              </h2>
              <span className="font-mono text-xs tabular-nums text-[#52607A] dark:text-slate-400">
                {progressPercent}% selesai
              </span>
            </div>

            <ol className="space-y-3">
              {guide.steps.map((step, idx) => {
                const key = `${guide.id}:${idx}`;
                const checked = Boolean(checkedSteps[key]);
                return (
                  <li key={idx}>
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-colors cursor-pointer ${
                        checked
                          ? 'bg-slate-100/70 dark:bg-[#111B2E]/50 border-slate-200/70 dark:border-slate-800/70'
                          : 'bg-white dark:bg-[#111B2E] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleStep(guide.id, idx)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#1D4ED8] focus:ring-[#1D4ED8] cursor-pointer shrink-0"
                      />
                      <span
                        className={`${scale.step} ${
                          checked
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-[#111C33] dark:text-slate-100'
                        }`}
                      >
                        <span className="font-mono text-xs font-semibold text-[#52607A] dark:text-slate-400 mr-2 tabular-nums">
                          {idx + 1}.
                        </span>
                        {step}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Practical Pro-Tip */}
          <section className="mt-8 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800">
            <h2 className="text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
              Catatan Praktis
            </h2>
            <p className={`mt-2 text-[#111C33] dark:text-slate-200 ${scale.body}`}>
              {guide.proTip}
            </p>
          </section>

          {/* Personal Note Area */}
          {showNote && (
            <section className="mt-6">
              <label
                htmlFor="focus-personal-note"
                className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-2"
              >
                Catatan Pribadi ({isSignedIn ? 'tersinkron ke akun Google' : 'tersimpan lokal'})
              </label>
              <textarea
                id="focus-personal-note"
                rows={4}
                value={note}
                onChange={(e) => onSaveNote(guide.id, e.target.value)}
                placeholder="Tulis rangkuman, poin penting untuk dosen pembimbing, atau pengingat tugas..."
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-sm sm:text-base leading-relaxed text-[#111C33] dark:text-slate-100 focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
              />
            </section>
          )}

          {/* Quiet Action Row */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleHelpful(guide.id)}
                aria-pressed={isHelpful}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  isHelpful
                    ? 'border-[#1D4ED8] bg-[#1D4ED8]/10 text-[#1D4ED8] dark:text-[#60A5FA]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2E] text-[#4A5873] dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="tabular-nums">Membantu ({helpfulCount})</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSave(guide.id)}
                aria-pressed={isSaved}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  isSaved
                    ? 'border-[#111C33] dark:border-slate-200 bg-[#111C33] dark:bg-slate-200 text-white dark:text-[#0B1220]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2E] text-[#4A5873] dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNote((prev) => !prev)}
                aria-pressed={showNote}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  showNote || note.trim()
                    ? 'border-slate-400 dark:border-slate-600 bg-white dark:bg-[#111B2E] text-[#111C33] dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2E] text-[#4A5873] dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>{note.trim() ? 'Catatan Pribadi' : 'Tulis Catatan'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2E] text-[#4A5873] dark:text-slate-300 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copied ? (
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
            </div>

            {guide.relatedTool && (
              <button
                type="button"
                onClick={() => onOpenTool(guide.relatedTool!)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Buka {TOOL_LABELS[guide.relatedTool]}</span>
              </button>
            )}
          </div>

          {/* Sequential Guide Navigation inside Focus Mode */}
          {(prevGuide || nextGuide) && (
            <nav
              aria-label="Navigasi panduan berurutan"
              className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {prevGuide ? (
                <button
                  type="button"
                  onClick={() => onSelectGuide(prevGuide.id)}
                  className="text-left p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111B2E] hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#52607A] dark:text-slate-400">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Panduan sebelumnya</span>
                  </span>
                  <p className="mt-1 font-display text-sm font-bold text-[#111C33] dark:text-[#F1F5F9] line-clamp-2">
                    {prevGuide.title}
                  </p>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextGuide && (
                <button
                  type="button"
                  onClick={() => onSelectGuide(nextGuide.id)}
                  className="text-left sm:text-right p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111B2E] hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#52607A] dark:text-slate-400">
                    <span>Panduan berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <p className="mt-1 font-display text-sm font-bold text-[#111C33] dark:text-[#F1F5F9] line-clamp-2">
                    {nextGuide.title}
                  </p>
                </button>
              )}
            </nav>
          )}
        </article>
      </main>
    </div>
  );
}
