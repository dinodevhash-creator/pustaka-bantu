import { Fragment, RefObject, useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Globe,
  Maximize2,
  RotateCcw,
  Search,
  StickyNote,
  ThumbsUp,
  Video,
  Wrench,
  X,
} from 'lucide-react';
import {
  CATEGORIES,
  GUIDES,
  GuideItem,
  StudyScenario,
  TOOL_LABELS,
  ToolId,
} from '../data/guides';
import { InAppSearchTab } from './ScholarSearchModal';

interface GuideLibraryProps {
  query: string;
  onQueryChange: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  activeScenario: StudyScenario | null;
  onClearScenario: () => void;
  showSavedOnly: boolean;
  onToggleSavedOnly: (val: boolean) => void;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  helpfulIds: string[];
  helpfulCounts: Record<string, number>;
  onToggleHelpful: (id: string) => void;
  checkedSteps: Record<string, boolean>;
  onToggleStep: (guideId: string, stepIndex: number) => void;
  notes: Record<string, string>;
  onSaveNote: (guideId: string, note: string) => void;
  onOpenTool: (tool: ToolId) => void;
  expandedGuideIds: string[];
  onToggleExpand: (id: string) => void;
  autoFocusMode: boolean;
  onToggleAutoFocusMode: () => void;
  onOpenFocusMode: (guideId: string) => void;
  onOpenInAppSearch: (tab: InAppSearchTab, initialQuery: string) => void;
}

type SortMode = 'relevansi' | 'populer' | 'abjad';

function HighlightText({ text, terms }: { text: string; terms: string[] }) {
  const validTerms = terms.filter((t) => t.length >= 2);
  if (validTerms.length === 0) return <>{text}</>;

  const escaped = validTerms.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) => {
        const isMatch = validTerms.some(
          (t) => part.toLowerCase() === t.toLowerCase()
        );
        return isMatch ? (
          <mark key={idx} className="search-mark">
            {part}
          </mark>
        ) : (
          <Fragment key={idx}>{part}</Fragment>
        );
      })}
    </>
  );
}

export function GuideLibrary({
  query,
  onQueryChange,
  searchInputRef,
  activeCategory,
  onCategoryChange,
  activeScenario,
  onClearScenario,
  showSavedOnly,
  onToggleSavedOnly,
  savedIds,
  onToggleSave,
  helpfulIds,
  helpfulCounts,
  onToggleHelpful,
  checkedSteps,
  onToggleStep,
  notes,
  onSaveNote,
  onOpenTool,
  expandedGuideIds,
  onToggleExpand,
  autoFocusMode,
  onToggleAutoFocusMode,
  onOpenFocusMode,
  onOpenInAppSearch,
}: GuideLibraryProps) {
  const [sortMode, setSortMode] = useState<SortMode>('relevansi');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const terms = useMemo(
    () => trimmedQuery.toLowerCase().split(/\s+/).filter(Boolean),
    [trimmedQuery]
  );

  const filteredGuides = useMemo(() => {
    const scored = GUIDES.filter((g) => {
      if (showSavedOnly && !savedIds.includes(g.id)) return false;
      if (activeScenario && !activeScenario.guideIds.includes(g.id)) return false;
      if (!activeScenario && activeCategory !== 'Semua' && g.category !== activeCategory) {
        return false;
      }
      if (terms.length === 0) return true;
      const haystack = [
        g.category,
        g.title,
        g.summary,
        g.steps.join(' '),
        g.keywords,
        g.proTip,
      ]
        .join(' ')
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    }).map((g) => {
      const titleHay = `${g.title} ${g.keywords}`.toLowerCase();
      const score = terms.reduce(
        (acc, t) => acc + (titleHay.includes(t) ? 3 : 1),
        0
      );
      return { guide: g, score };
    });

    if (sortMode === 'populer') {
      scored.sort((a, b) => {
        const aVotes = helpfulCounts[a.guide.id] ?? 0;
        const bVotes = helpfulCounts[b.guide.id] ?? 0;
        return bVotes - aVotes;
      });
    } else if (sortMode === 'abjad') {
      scored.sort((a, b) => a.guide.title.localeCompare(b.guide.title, 'id'));
    } else if (terms.length > 0) {
      scored.sort((a, b) => b.score - a.score);
    }

    return scored.map((item) => item.guide);
  }, [activeCategory, activeScenario, helpfulCounts, savedIds, showSavedOnly, sortMode, terms]);

  const handleCopyGuide = async (guide: GuideItem) => {
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
      setCopiedId(guide.id);
      setTimeout(() => setCopiedId((curr) => (curr === guide.id ? null : curr)), 2000);
    } catch {
      // Fallback for restricted clipboard contexts
    }
  };

  const autoExpandAll = terms.length > 0 && filteredGuides.length <= 3;

  return (
    <section id="panduan" className="py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
              Pustaka Panduan · Ceklis Interaktif &amp; Catatan Pribadi
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C33] dark:text-[#F1F5F9]">
              Cari jawaban cepat, tandai progresmu
            </h2>
          </div>

          {/* View & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80"
              role="group"
              aria-label="Filter tampilan panduan"
            >
              <button
                type="button"
                onClick={() => onToggleSavedOnly(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !showSavedOnly
                    ? 'bg-white dark:bg-[#111B2E] text-[#111C33] dark:text-white shadow-xs'
                    : 'text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white'
                }`}
              >
                Semua ({GUIDES.length})
              </button>
              <button
                type="button"
                onClick={() => onToggleSavedOnly(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showSavedOnly
                    ? 'bg-white dark:bg-[#111B2E] text-[#111C33] dark:text-white shadow-xs'
                    : 'text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white'
                }`}
              >
                Tersimpan ({savedIds.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleAutoFocusMode}
              aria-pressed={autoFocusMode}
              title="Aktifkan agar membuka panduan langsung masuk ke tampilan baca bebas gangguan"
              className={`h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                autoFocusMode
                  ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] dark:hover:border-[#60A5FA]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>{autoFocusMode ? 'Mode Fokus: Aktif' : 'Mode Fokus'}</span>
            </button>

            <label className="sr-only" htmlFor="sort-guides">
              Urutkan panduan
            </label>
            <select
              id="sort-guides"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs font-medium text-[#111C33] dark:text-slate-200 cursor-pointer focus:outline-none focus:border-[#1D4ED8]"
            >
              <option value="relevansi">Urutkan: Relevansi</option>
              <option value="populer">Urutkan: Paling Membantu</option>
              <option value="abjad">Urutkan: A–Z</option>
            </select>
          </div>
        </div>

        {/* Search & External Academic Links Bar */}
        <div className="bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && trimmedQuery) {
                    e.preventDefault();
                    onOpenInAppSearch('web', trimmedQuery);
                  }
                }}
                placeholder="Ketik kata kunci (misal: latar belakang, Sinta, Slovin, wawancara, burnout)..."
                aria-label="Saring daftar panduan akademik"
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* In-App Web, Scholar, and YouTube Search Triggers (no new tab) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenInAppSearch('web', trimmedQuery)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {trimmedQuery
                    ? `Web: “${trimmedQuery.length > 14 ? `${trimmedQuery.slice(0, 14)}…` : trimmedQuery}”`
                    : 'Cari di Web'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenInAppSearch('scholar', trimmedQuery)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1D4ED8]/35 dark:border-[#60A5FA]/40 bg-[#1D4ED8]/8 dark:bg-[#60A5FA]/10 hover:bg-[#1D4ED8]/15 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cari Jurnal</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenInAppSearch('youtube', trimmedQuery)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] text-xs font-semibold text-[#111C33] dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>YouTube</span>
              </button>
            </div>
          </div>

          {/* Active Scenario Notice */}
          {activeScenario && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#111C33] dark:text-slate-200 font-medium">
                Menampilkan jalur cepat: <strong>{activeScenario.title}</strong>
              </span>
              <button
                type="button"
                onClick={onClearScenario}
                className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tampilkan semua panduan</span>
              </button>
            </div>
          )}

          {/* Category Interactive Filter Buttons */}
          {!activeScenario && (
            <div
              className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1"
              role="group"
              aria-label="Filter kategori panduan"
            >
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onCategoryChange(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#111C33] dark:bg-[#E8EEF9] text-white dark:text-[#0B1220]'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-[#4A5873] dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Result Count Line */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52607A] dark:text-slate-400 mb-4"
          aria-live="polite"
        >
          <span className="tabular-nums">
            Menampilkan {filteredGuides.length} panduan
            {trimmedQuery ? ` untuk “${trimmedQuery}”` : ''}
          </span>
          <span className="hidden sm:inline">
            {autoFocusMode
              ? 'Mode Fokus aktif — klik panduan untuk langsung membaca bebas gangguan'
              : 'Klik judul untuk membuka langkah ceklis, catatan, atau Mode Fokus'}
          </span>
        </div>

        {/* Empty State */}
        {filteredGuides.length === 0 ? (
          <div className="bg-white dark:bg-[#111B2E] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 sm:p-10 text-center">
            <p className="font-display text-lg font-bold text-[#111C33] dark:text-[#F1F5F9]">
              {showSavedOnly
                ? 'Belum ada panduan yang kamu simpan'
                : 'Tidak ada hasil yang cocok di pustaka ini'}
            </p>
            <p className="mt-2 text-sm text-[#52607A] dark:text-slate-400 max-w-md mx-auto">
              {showSavedOnly
                ? 'Klik tombol Simpan pada panduan yang sering kamu buka agar mudah ditemukan kembali di sini.'
                : 'Tekan Enter untuk langsung mencari di Google, atau pilih salah satu kata kunci populer berikut:'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {showSavedOnly ? (
                <button
                  type="button"
                  onClick={() => onToggleSavedOnly(false)}
                  className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold cursor-pointer"
                >
                  Jelajahi Semua Panduan
                </button>
              ) : (
                ['skripsi', 'jurnal', 'beasiswa', 'stres', 'statistik'].map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      onClearScenario();
                      onCategoryChange('Semua');
                      onQueryChange(word);
                    }}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs font-semibold text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] cursor-pointer"
                  >
                    {word}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {filteredGuides.map((guide) => {
              const isExpanded =
                autoExpandAll || expandedGuideIds.includes(guide.id);
              const isSaved = savedIds.includes(guide.id);
              const isHelpful = helpfulIds.includes(guide.id);
              const helpfulCount = helpfulCounts[guide.id] ?? 0;
              const doneSteps = guide.steps.filter(
                (_, idx) => checkedSteps[`${guide.id}:${idx}`]
              ).length;
              const userNote = notes[guide.id] || '';
              const isNoteOpen = openNoteId === guide.id;

              return (
                <article
                  key={guide.id}
                  className={`bg-white dark:bg-[#111B2E] border rounded-xl transition-colors ${
                    isExpanded
                      ? 'border-[#1D4ED8]/40 dark:border-[#60A5FA]/40'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (autoFocusMode) {
                        onOpenFocusMode(guide.id);
                      } else {
                        onToggleExpand(guide.id);
                      }
                    }}
                    aria-expanded={autoFocusMode ? undefined : isExpanded}
                    className="w-full text-left p-5 flex items-start justify-between gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] rounded-xl"
                  >
                    <div className="min-w-0">
                      {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#52607A] dark:text-slate-400">
                        <span className="font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
                          <HighlightText text={guide.category} terms={terms} />
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {doneSteps > 0
                            ? `${doneSteps}/${guide.steps.length} langkah selesai`
                            : `${guide.steps.length} langkah`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{guide.readMinutes} mnt baca</span>
                        {userNote.trim() && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#111C33] dark:text-slate-200 font-medium">
                              Ada catatan
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="mt-1.5 font-display text-lg font-bold text-[#111C33] dark:text-[#F1F5F9] leading-snug">
                        <HighlightText text={guide.title} terms={terms} />
                      </h3>
                      <p className="mt-1.5 text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed">
                        <HighlightText text={guide.summary} terms={terms} />
                      </p>
                    </div>

                    <span
                      className={`mt-1 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-[#52607A] dark:text-slate-400 shrink-0 transition-transform ${
                        !autoFocusMode && isExpanded ? 'rotate-180 bg-slate-50 dark:bg-slate-800' : ''
                      }`}
                      aria-hidden="true"
                    >
                      {autoFocusMode ? (
                        <Maximize2 className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {!autoFocusMode && isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/90">
                      <p className="mt-3 text-xs font-semibold text-[#52607A] dark:text-slate-400">
                        Langkah praktis (klik untuk menandai selesai)
                      </p>
                      <ol className="mt-2.5 space-y-2">
                        {guide.steps.map((step, idx) => {
                          const key = `${guide.id}:${idx}`;
                          const checked = Boolean(checkedSteps[key]);
                          return (
                            <li key={idx}>
                              <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#F7F9FC] dark:hover:bg-[#0B1220]/70 transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggleStep(guide.id, idx)}
                                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#1D4ED8] focus:ring-[#1D4ED8] cursor-pointer shrink-0"
                                />
                                <span
                                  className={`text-sm leading-relaxed ${
                                    checked
                                      ? 'line-through text-slate-400 dark:text-slate-500'
                                      : 'text-[#111C33] dark:text-slate-200'
                                  }`}
                                >
                                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500 mr-1.5 tabular-nums">
                                    {idx + 1}.
                                  </span>
                                  <HighlightText text={step} terms={terms} />
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ol>

                      {/* Practical Pro-Tip (clean surface contrast, zero thick left border) */}
                      <div className="mt-4 p-3.5 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/80 dark:border-slate-800">
                        <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200">
                          Catatan Praktis
                        </p>
                        <p className="mt-1 text-xs sm:text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed">
                          {guide.proTip}
                        </p>
                      </div>

                      {/* Personal Margin Note Box */}
                      {isNoteOpen && (
                        <div className="mt-3">
                          <label
                            htmlFor={`note-${guide.id}`}
                            className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1.5"
                          >
                            Catatan pribadimu untuk panduan ini (tersimpan lokal)
                          </label>
                          <textarea
                            id={`note-${guide.id}`}
                            rows={2}
                            value={userNote}
                            onChange={(e) => onSaveNote(guide.id, e.target.value)}
                            placeholder="Tulis pengingat, nama dosen, tenggat, atau link referensi..."
                            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs sm:text-sm text-[#111C33] dark:text-slate-100 focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>
                      )}

                      {/* Action Footer Row */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleHelpful(guide.id)}
                            aria-pressed={isHelpful}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                              isHelpful
                                ? 'border-[#1D4ED8] bg-[#1D4ED8]/10 text-[#1D4ED8] dark:text-[#60A5FA]'
                                : 'border-slate-200 dark:border-slate-700 text-[#52607A] dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="tabular-nums">Membantu ({helpfulCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleSave(guide.id)}
                            aria-pressed={isSaved}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                              isSaved
                                ? 'border-[#111C33] dark:border-slate-200 bg-[#111C33] dark:bg-slate-200 text-white dark:text-[#0B1220]'
                                : 'border-slate-200 dark:border-slate-700 text-[#52607A] dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenNoteId((curr) => (curr === guide.id ? null : guide.id))
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                              isNoteOpen || userNote.trim()
                                ? 'border-slate-400 dark:border-slate-500 text-[#111C33] dark:text-white'
                                : 'border-slate-200 dark:border-slate-700 text-[#52607A] dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            <span>{userNote.trim() ? 'Edit Catatan' : 'Catatan'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyGuide(guide)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-[#52607A] dark:text-slate-300 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {copiedId === guide.id ? (
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
                            onClick={() => onOpenFocusMode(guide.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#1D4ED8]/30 dark:border-[#60A5FA]/35 bg-[#1D4ED8]/8 dark:bg-[#60A5FA]/10 text-[#1D4ED8] dark:text-[#60A5FA] hover:bg-[#1D4ED8]/15 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Mode Fokus</span>
                          </button>
                        </div>

                        {guide.relatedTool && (
                          <button
                            type="button"
                            onClick={() => onOpenTool(guide.relatedTool!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] bg-[#1D4ED8]/8 dark:bg-[#60A5FA]/10 hover:bg-[#1D4ED8]/15 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{TOOL_LABELS[guide.relatedTool]}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
