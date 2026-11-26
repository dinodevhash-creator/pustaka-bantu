import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Video,
  X,
} from 'lucide-react';
import { WorkHistoryCategory } from '../firebase';

export type InAppSearchTab = 'web' | 'scholar' | 'youtube';

interface ScholarSearchModalProps {
  isOpen: boolean;
  initialTab: InAppSearchTab;
  initialQuery: string;
  onClose: () => void;
  onSaveHistory: (category: WorkHistoryCategory, title: string, detail: string) => void;
  isSignedIn: boolean;
}

interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

interface CrossrefDatePart {
  'date-parts'?: number[][];
}

interface CrossrefLink {
  URL?: string;
  'content-type'?: string;
}

interface CrossrefWorkItem {
  DOI?: string;
  URL?: string;
  title?: string[];
  author?: CrossrefAuthor[];
  editor?: CrossrefAuthor[];
  'container-title'?: string[];
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  type?: string;
  abstract?: string;
  'is-referenced-by-count'?: number;
  published?: CrossrefDatePart;
  'published-print'?: CrossrefDatePart;
  'published-online'?: CrossrefDatePart;
  issued?: CrossrefDatePart;
  link?: CrossrefLink[];
}

interface ScholarPaper {
  id: string;
  doi: string;
  title: string;
  authorsDisplay: string;
  authorsApa: string;
  year: number | null;
  venue: string;
  publisher: string;
  volume: string;
  issue: string;
  page: string;
  typeLabel: string;
  citations: number;
  abstractText: string;
  doiUrl: string;
  pdfUrl: string | null;
  apaCitation: string;
}

interface WebSearchItem {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  source: 'web' | 'wikipedia';
}

interface YouTubeVideoItem {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  published: string;
  thumbnail: string;
  url: string;
}

type SortOption = 'relevance' | 'is-referenced-by-count' | 'published';
type YearFilter = 'all' | '5y' | '3y';

const QUICK_TOPICS: Record<InAppSearchTab, string[]> = {
  web: [
    'cara membuat latar belakang skripsi',
    'contoh rumusan masalah penelitian',
    'perbedaan kualitatif dan kuantitatif',
    'cara menghitung rumus slovin',
    'tips menghadapi sidang skripsi',
  ],
  scholar: [
    'computer vision',
    'motivasi belajar mahasiswa',
    'metode penelitian kualitatif',
    'kesehatan mental mahasiswa',
    'kecerdasan buatan pendidikan',
  ],
  youtube: [
    'cara membuat latar belakang skripsi',
    'tutorial SPSS uji validitas dan reliabilitas',
    'cara pakai Mendeley di Word',
    'tips presentasi sidang skripsi',
    'cara mencari jurnal Sinta dan Scopus',
  ],
};

const TYPE_LABELS: Record<string, string> = {
  'journal-article': 'Artikel Jurnal',
  'proceedings-article': 'Prosiding',
  'book-chapter': 'Bab Buku',
  book: 'Buku',
  'posted-content': 'Pracetak',
  dissertation: 'Disertasi',
  report: 'Laporan',
};

const JUNK_TITLE_PATTERN =
  /^(editorial board|front matter|back matter|table of contents|contents|cover|index|masthead|erratum|corrigendum|issue information|list of reviewers)$/i;

function sanitizeHttpUrl(raw?: string): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function stripAbstractMarkup(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYear(item: CrossrefWorkItem): number | null {
  const candidates = [
    item.published?.['date-parts']?.[0]?.[0],
    item['published-online']?.['date-parts']?.[0]?.[0],
    item['published-print']?.['date-parts']?.[0]?.[0],
    item.issued?.['date-parts']?.[0]?.[0],
  ];
  for (const yr of candidates) {
    if (typeof yr === 'number' && yr >= 1800 && yr <= 2100) return yr;
  }
  return null;
}

function formatPeopleDisplay(
  authors?: CrossrefAuthor[],
  editors?: CrossrefAuthor[]
): { display: string; apa: string; hasPeople: boolean } {
  const isEditorFallback = (!authors || authors.length === 0) && Boolean(editors?.length);
  const people = authors && authors.length > 0 ? authors : editors || [];

  const displayNames = people
    .map((a) => {
      if (a.name) return a.name.trim();
      const parts = [a.given?.trim(), a.family?.trim()].filter(Boolean);
      return parts.join(' ');
    })
    .filter(Boolean);

  if (displayNames.length === 0) {
    return { display: 'Penulis tidak tercantum', apa: 'Anonim', hasPeople: false };
  }

  const displayBase =
    displayNames.length <= 3
      ? displayNames.join(', ')
      : `${displayNames.slice(0, 3).join(', ')}, dkk. (${displayNames.length} penulis)`;

  const apaList = people
    .slice(0, 6)
    .map((a) => {
      if (a.name && !a.family) return a.name.trim();
      const family = a.family?.trim() || '';
      const initials = (a.given || '')
        .split(/[\s-]+/)
        .filter(Boolean)
        .map((part) => `${part[0].toUpperCase()}.`)
        .join(' ');
      if (family && initials) return `${family}, ${initials}`;
      return family || initials;
    })
    .filter(Boolean);

  let apa = 'Anonim';
  if (apaList.length === 1) {
    apa = apaList[0];
  } else if (people.length > 6) {
    apa = `${apaList[0]} et al.`;
  } else if (apaList.length > 1) {
    apa = `${apaList.slice(0, -1).join(', ')}, & ${apaList[apaList.length - 1]}`;
  }

  return {
    display: isEditorFallback ? `Ed. ${displayBase}` : displayBase,
    apa: isEditorFallback ? `${apa} (Ed.)` : apa,
    hasPeople: true,
  };
}

function buildApaCitation(paper: {
  authorsApa: string;
  year: number | null;
  title: string;
  venue: string;
  volume: string;
  issue: string;
  page: string;
  doiUrl: string;
}): string {
  const yearPart = paper.year ? `(${paper.year})` : '(n.d.)';
  const volIssue = paper.volume
    ? paper.issue
      ? `, ${paper.volume}(${paper.issue})`
      : `, ${paper.volume}`
    : '';
  const pagePart = paper.page ? `, ${paper.page}` : '';
  const venuePart = paper.venue ? ` ${paper.venue}${volIssue}${pagePart}.` : '';
  const doiPart = paper.doiUrl ? ` ${paper.doiUrl}` : '';
  return `${paper.authorsApa} ${yearPart}. ${paper.title}.${venuePart}${doiPart}`.trim();
}

function isMeaningfulCrossrefItem(item: CrossrefWorkItem): boolean {
  const title = (item.title?.[0] || '').replace(/\s+/g, ' ').trim();
  if (!title || title.length < 4 || JUNK_TITLE_PATTERN.test(title)) return false;
  const hasPeople = Boolean(item.author?.length || item.editor?.length);
  return hasPeople;
}

function mapCrossrefItem(item: CrossrefWorkItem, idx: number): ScholarPaper {
  const doi = (item.DOI || '').trim();
  const title = (item.title?.[0] || 'Tanpa judul').replace(/\s+/g, ' ').trim();
  const venue = (item['container-title']?.[0] || item.publisher || 'Publikasi Ilmiah')
    .replace(/\s+/g, ' ')
    .trim();
  const year = extractYear(item);
  const people = formatPeopleDisplay(item.author, item.editor);
  const volume = (item.volume || '').trim();
  const issue = (item.issue || '').trim();
  const page = (item.page || '').trim();
  const doiUrl =
    sanitizeHttpUrl(doi ? `https://doi.org/${doi}` : undefined) ||
    sanitizeHttpUrl(item.URL) ||
    '';

  const rawPdf = item.link?.find(
    (l) => l['content-type']?.toLowerCase().includes('pdf') && sanitizeHttpUrl(l.URL)
  )?.URL;
  const pdfUrl = sanitizeHttpUrl(rawPdf);

  const apaCitation = buildApaCitation({
    authorsApa: people.apa,
    year,
    title,
    venue,
    volume,
    issue,
    page,
    doiUrl,
  });

  return {
    id: doi || `paper-${idx}-${title.slice(0, 20)}`,
    doi,
    title,
    authorsDisplay: people.display,
    authorsApa: people.apa,
    year,
    venue,
    publisher: (item.publisher || '').trim(),
    volume,
    issue,
    page,
    typeLabel: TYPE_LABELS[item.type || ''] || 'Karya Ilmiah',
    citations: typeof item['is-referenced-by-count'] === 'number' ? item['is-referenced-by-count'] : 0,
    abstractText: stripAbstractMarkup(item.abstract),
    doiUrl,
    pdfUrl,
    apaCitation,
  };
}

const SCHOLAR_FETCH_ROWS = 22;

export function ScholarSearchModal({
  isOpen,
  initialTab,
  initialQuery,
  onClose,
  onSaveHistory,
  isSignedIn,
}: ScholarSearchModalProps) {
  const [activeTab, setActiveTab] = useState<InAppSearchTab>(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [submittedTerm, setSubmittedTerm] = useState('');

  // Scholar tab state
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [papers, setPapers] = useState<ScholarPaper[]>([]);
  const [scholarOffset, setScholarOffset] = useState(0);
  const [scholarTotal, setScholarTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Web tab state
  const [webResults, setWebResults] = useState<WebSearchItem[]>([]);

  // YouTube tab state
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideoItem | null>(null);
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});

  // Shared UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runScholarSearch = useCallback(
    async (
      term: string,
      sort: SortOption,
      yearRange: YearFilter,
      offset: number,
      append: boolean
    ) => {
      const clean = term.trim();
      if (!clean) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setErrorMsg(null);
      }

      try {
        const filters = ['type:journal-article', 'type:proceedings-article'];
        const currentYear = new Date().getFullYear();
        if (yearRange === '5y') {
          filters.push(`from-pub-date:${currentYear - 5}`);
        } else if (yearRange === '3y') {
          filters.push(`from-pub-date:${currentYear - 3}`);
        }

        const fetchCrossref = async (queryParam: 'query.title' | 'query.bibliographic') => {
          const params = new URLSearchParams({
            [queryParam]: clean,
            rows: String(SCHOLAR_FETCH_ROWS),
            offset: String(offset),
            sort,
            order: 'desc',
            filter: filters.join(','),
          });
          const res = await fetch(`https://api.crossref.org/works?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = (await res.json()) as {
            message?: { 'total-results'?: number; items?: CrossrefWorkItem[] };
          };
          const raw = json.message?.items || [];
          const filtered = raw.filter(isMeaningfulCrossrefItem);
          return {
            items: filtered.map((item, idx) => mapCrossrefItem(item, offset + idx)),
            total: json.message?.['total-results'] ?? filtered.length,
          };
        };

        let result = await fetchCrossref('query.title');
        if (!append && result.items.length < 3) {
          const fallback = await fetchCrossref('query.bibliographic');
          if (fallback.items.length > result.items.length) {
            result = fallback;
          }
        }

        setScholarTotal(result.total);
        setScholarOffset(offset + SCHOLAR_FETCH_ROWS);
        setSubmittedTerm(clean);
        setPapers((prev) => {
          if (!append) return result.items;
          const existing = new Set(prev.map((p) => p.id));
          return [...prev, ...result.items.filter((p) => !existing.has(p.id))];
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setErrorMsg('Gagal memuat artikel ilmiah saat ini. Periksa koneksi internet lalu coba lagi.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const runWebSearch = useCallback(async (term: string) => {
    const clean = term.trim();
    if (!clean) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/search-web?q=${encodeURIComponent(clean)}`, {
        signal: controller.signal,
      });
      const data = (await res.json()) as { results?: WebSearchItem[]; error?: string };
      if (!res.ok && (!data.results || data.results.length === 0)) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSubmittedTerm(clean);
      setWebResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setErrorMsg('Gagal memuat hasil pencarian web saat ini. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const runYoutubeSearch = useCallback(async (term: string) => {
    const clean = term.trim();
    if (!clean) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorMsg(null);
    setPlayingVideo(null);
    try {
      const res = await fetch(`/api/search-youtube?q=${encodeURIComponent(clean)}`, {
        signal: controller.signal,
      });
      const data = (await res.json()) as { results?: YouTubeVideoItem[]; error?: string };
      if (!res.ok && (!data.results || data.results.length === 0)) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSubmittedTerm(clean);
      setVideos(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setErrorMsg('Gagal memuat hasil video YouTube saat ini. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const executeTabSearch = useCallback(
    (tab: InAppSearchTab, term: string, sort: SortOption, yearRange: YearFilter) => {
      if (!term.trim()) return;
      if (tab === 'scholar') {
        void runScholarSearch(term, sort, yearRange, 0, false);
      } else if (tab === 'web') {
        void runWebSearch(term);
      } else {
        void runYoutubeSearch(term);
      }
    },
    [runScholarSearch, runWebSearch, runYoutubeSearch]
  );

  // Sync tab + query when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setSearchTerm(initialQuery);
    setExpandedIds({});
    setPlayingVideo(null);
    setErrorMsg(null);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    if (initialQuery.trim()) {
      executeTabSearch(initialTab, initialQuery, sortBy, yearFilter);
    } else {
      setSubmittedTerm('');
      setPapers([]);
      setWebResults([]);
      setVideos([]);
    }

    return () => {
      window.clearTimeout(focusTimer);
      abortRef.current?.abort();
    };
  }, [isOpen, initialTab, initialQuery]);

  // Escape to close & lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSwitchTab = (nextTab: InAppSearchTab) => {
    if (nextTab === activeTab) return;
    setActiveTab(nextTab);
    setErrorMsg(null);
    setPlayingVideo(null);
    if (searchTerm.trim()) {
      executeTabSearch(nextTab, searchTerm, sortBy, yearFilter);
    } else {
      setSubmittedTerm('');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeTabSearch(activeTab, searchTerm, sortBy, yearFilter);
  };

  const handleSortChange = (nextSort: SortOption) => {
    setSortBy(nextSort);
    if (searchTerm.trim() && activeTab === 'scholar') {
      void runScholarSearch(searchTerm, nextSort, yearFilter, 0, false);
    }
  };

  const handleYearChange = (nextYear: YearFilter) => {
    setYearFilter(nextYear);
    if (searchTerm.trim() && activeTab === 'scholar') {
      void runScholarSearch(searchTerm, sortBy, nextYear, 0, false);
    }
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch {
      // ignore restricted clipboard
    }
  };

  const handleSaveReference = (id: string, title: string, detail: string) => {
    onSaveHistory('sitasi', title, detail);
    setSavedIds((prev) => ({ ...prev, [id]: true }));
  };

  const trimmed = searchTerm.trim();
  const fallbackExternal =
    activeTab === 'web'
      ? {
          label: 'Buka di Google (tab baru)',
          url: trimmed
            ? `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
            : 'https://www.google.com/',
          sourceNote: 'Hasil pencarian web terbuka langsung di aplikasi',
        }
      : activeTab === 'youtube'
        ? {
            label: 'Buka di YouTube (tab baru)',
            url: trimmed
              ? `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmed)}`
              : 'https://www.youtube.com/',
            sourceNote: 'Video dapat diputar langsung di dalam halaman ini',
          }
        : {
            label: 'Buka di Google Scholar (tab baru)',
            url: trimmed
              ? `https://scholar.google.com/scholar?q=${encodeURIComponent(trimmed)}`
              : 'https://scholar.google.com/',
            sourceNote: 'Artikel berpenulis dari indeks terbuka Crossref',
          };

  const placeholderText =
    activeTab === 'web'
      ? 'Cari materi kuliah, definisi, contoh skripsi...'
      : activeTab === 'youtube'
        ? 'Cari tutorial SPSS, Mendeley, sidang skripsi...'
        : 'Cari judul jurnal, topik penelitian, atau DOI...';

  const hasMoreScholar =
    activeTab === 'scholar' &&
    papers.length > 0 &&
    scholarOffset < scholarTotal &&
    papers.length < 45;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inapp-search-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] max-w-[940px] flex flex-col rounded-none sm:rounded-2xl bg-[#F7F9FC] dark:bg-[#0B1220] border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Compact Top Bar with Tab Switcher + Close */}
        <div className="bg-white dark:bg-[#111B2E] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 id="inapp-search-title" className="sr-only">
              Pencarian Web, Jurnal, dan YouTube
            </h2>
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
              role="tablist"
              aria-label="Sumber pencarian"
            >
              {(
                [
                  { id: 'web', label: 'Web', icon: Globe },
                  { id: 'scholar', label: 'Jurnal', icon: BookOpen },
                  { id: 'youtube', label: 'YouTube', icon: Video },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSwitchTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                        : 'text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel pencarian"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-[#52607A] dark:text-slate-300 hover:text-[#111C33] dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slim Single-Row Search Bar */}
        <div className="bg-white dark:bg-[#111B2E] border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search
                className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholderText}
                aria-label="Kata kunci pencarian"
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-[#F1F5F9] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#1D4ED8] dark:focus:border-[#60A5FA]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Hapus kata kunci"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="h-10 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {loading ? 'Mencari...' : 'Cari'}
            </button>
          </form>
        </div>

        {/* Scrollable Content Body (Filters scroll naturally on mobile for maximum reading room) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Scholar Filter Strip */}
          {activeTab === 'scholar' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div
                className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800"
                role="group"
                aria-label="Filter rentang tahun publikasi"
              >
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: '5y', label: '5 Thn' },
                    { id: '3y', label: '3 Thn' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleYearChange(opt.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      yearFilter === opt.id
                        ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                        : 'text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="scholar-sort" className="text-xs text-[#52607A] dark:text-slate-400">
                  Urut:
                </label>
                <select
                  id="scholar-sort"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs font-medium text-[#111C33] dark:text-slate-200 cursor-pointer focus:outline-none focus:border-[#1D4ED8]"
                >
                  <option value="relevance">Paling Relevan</option>
                  <option value="is-referenced-by-count">Sitasi Terbanyak</option>
                  <option value="published">Terbaru</option>
                </select>
              </div>
            </div>
          )}

          {/* Embedded In-App YouTube Player */}
          {activeTab === 'youtube' && playingVideo && (
            <div className="bg-white dark:bg-[#111B2E] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="aspect-video w-full bg-slate-950">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${playingVideo.id}?autoplay=1&rel=0`}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
              <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm sm:text-base font-bold text-[#111C33] dark:text-[#F1F5F9] leading-snug">
                    {playingVideo.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#52607A] dark:text-slate-400">
                    {playingVideo.channel}
                    {playingVideo.views ? ` · ${playingVideo.views} ditonton` : ''}
                    {playingVideo.published ? ` · ${playingVideo.published}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayingVideo(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#52607A] dark:text-slate-300 hover:text-[#111C33] dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
                >
                  Tutup Pemutar
                </button>
              </div>
            </div>
          )}

          {/* Initial Empty State (No query submitted yet) */}
          {!loading && !errorMsg && !submittedTerm && (
            <div className="bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 text-center">
              {activeTab === 'web' ? (
                <Globe className="w-8 h-8 text-[#1D4ED8] dark:text-[#60A5FA] mx-auto" />
              ) : activeTab === 'youtube' ? (
                <Video className="w-8 h-8 text-[#1D4ED8] dark:text-[#60A5FA] mx-auto" />
              ) : (
                <BookOpen className="w-8 h-8 text-[#1D4ED8] dark:text-[#60A5FA] mx-auto" />
              )}
              <h3 className="mt-3 font-display text-base sm:text-lg font-bold text-[#111C33] dark:text-[#F1F5F9]">
                {activeTab === 'web'
                  ? 'Cari artikel dan materi web langsung di sini'
                  : activeTab === 'youtube'
                    ? 'Cari dan tonton video belajar langsung di sini'
                    : 'Temukan referensi jurnal ilmiah langsung di sini'}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#52607A] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {activeTab === 'web'
                  ? 'Hasil pencarian web dan ensiklopedia tampil tanpa berpindah tab, bisa langsung disimpan ke Riwayat Kerja.'
                  : activeTab === 'youtube'
                    ? 'Klik video mana saja untuk memutarnya langsung di dalam jendela ini tanpa membuka tab YouTube baru.'
                    : 'Menampilkan artikel jurnal & prosiding yang memiliki data penulis lengkap, jumlah sitasi, serta salin APA 7.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {QUICK_TOPICS[activeTab].map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSearchTerm(topic);
                      executeTabSearch(activeTab, topic, sortBy, yearFilter);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] text-xs font-medium text-[#111C33] dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-sm text-[#52607A] dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D4ED8] dark:text-[#60A5FA]" />
              <span>
                {activeTab === 'web'
                  ? 'Menelusuri halaman web...'
                  : activeTab === 'youtube'
                    ? 'Mencari video pembelajaran...'
                    : 'Menelusuri artikel ilmiah...'}
              </span>
            </div>
          )}

          {/* Error State */}
          {!loading && errorMsg && (
            <div className="bg-white dark:bg-[#111B2E] border border-rose-200 dark:border-rose-800/70 rounded-xl p-6 text-center">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{errorMsg}</p>
              <button
                type="button"
                onClick={() => executeTabSearch(activeTab, searchTerm, sortBy, yearFilter)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* TAB 1: WEB RESULTS */}
          {!loading && !errorMsg && activeTab === 'web' && submittedTerm && (
            <>
              {webResults.length === 0 ? (
                <div className="bg-white dark:bg-[#111B2E] border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
                  <p className="font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                    Tidak ada hasil web untuk “{submittedTerm}”
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#52607A] dark:text-slate-400">
                    Coba kata kunci yang lebih singkat atau lebih umum.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#52607A] dark:text-slate-400 tabular-nums">
                    Menampilkan {webResults.length} hasil web untuk “{submittedTerm}”
                  </p>
                  {webResults.map((item) => {
                    const id = `web:${item.url}`;
                    const isCopied = copiedId === id;
                    const isSaved = Boolean(savedIds[id]);
                    return (
                      <article
                        key={item.url}
                        className="bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#52607A] dark:text-slate-400">
                          <span className="font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
                            {item.domain}
                          </span>
                          {item.source === 'wikipedia' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Ensiklopedia</span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-1 font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9] leading-snug">
                          {item.title}
                        </h3>
                        {item.snippet && (
                          <p className="mt-1.5 text-xs sm:text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed">
                            {item.snippet}
                          </p>
                        )}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(id, `${item.title}\n${item.url}`)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] cursor-pointer whitespace-nowrap"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Tautan</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() =>
                                handleSaveReference(
                                  id,
                                  `Web: ${item.title}`,
                                  `${item.url}\n${item.snippet}`
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                                isSaved
                                  ? 'border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 cursor-default'
                                  : 'border-slate-200 dark:border-slate-700 text-[#4A5873] dark:text-slate-300 hover:border-[#1D4ED8] cursor-pointer'
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <BookmarkCheck className="w-3.5 h-3.5" />
                                  <span>{isSignedIn ? 'Tersimpan di Akun' : 'Tersimpan'}</span>
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </>
                              )}
                            </button>
                          </div>

                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 whitespace-nowrap"
                          >
                            <span>Buka Halaman</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: SCHOLAR RESULTS */}
          {!loading && !errorMsg && activeTab === 'scholar' && submittedTerm && (
            <>
              {papers.length === 0 ? (
                <div className="bg-white dark:bg-[#111B2E] border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
                  <p className="font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                    Tidak ada artikel berpenulis yang cocok untuk “{submittedTerm}”
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#52607A] dark:text-slate-400">
                    Coba kata kunci bahasa Inggris, istilah lebih umum, atau pilih filter Semua Tahun.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#52607A] dark:text-slate-400 tabular-nums">
                    Menampilkan {papers.length} artikel berpenulis untuk “{submittedTerm}”
                  </p>

                  {papers.map((paper) => {
                    const isExpanded = Boolean(expandedIds[paper.id]);
                    const isSaved = Boolean(savedIds[paper.id]);
                    const isCopied = copiedId === paper.id;

                    return (
                      <article
                        key={paper.id}
                        className="bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#52607A] dark:text-slate-400">
                          <span className="font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
                            {paper.typeLabel}
                          </span>
                          {paper.year && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{paper.year}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {paper.citations.toLocaleString('id-ID')} sitasi
                          </span>
                          {paper.venue && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[260px] sm:max-w-[340px]">
                                {paper.venue}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="mt-1.5 font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9] leading-snug">
                          {paper.title}
                        </h3>

                        <p className="mt-1 text-xs sm:text-sm text-[#4A5873] dark:text-slate-300">
                          {paper.authorsDisplay}
                        </p>

                        {paper.abstractText && (
                          <p
                            className={`mt-2 text-xs sm:text-sm text-[#52607A] dark:text-slate-400 leading-relaxed ${
                              isExpanded ? '' : 'line-clamp-3'
                            }`}
                          >
                            {paper.abstractText}
                          </p>
                        )}

                        {isExpanded && (
                          <div className="mt-3 p-3.5 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#52607A] dark:text-slate-400">
                              {paper.publisher && <span>Penerbit: {paper.publisher}</span>}
                              {paper.volume && (
                                <span className="tabular-nums">
                                  Vol. {paper.volume}
                                  {paper.issue ? `(${paper.issue})` : ''}
                                </span>
                              )}
                              {paper.page && <span className="tabular-nums">Hlm. {paper.page}</span>}
                              {paper.doi && <span className="font-mono">DOI: {paper.doi}</span>}
                            </div>
                            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                              <p className="font-semibold text-[#111C33] dark:text-slate-200 mb-1">
                                Format Sitasi APA 7:
                              </p>
                              <p className="text-[#4A5873] dark:text-slate-300 leading-relaxed select-all">
                                {paper.apaCitation}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyText(paper.id, paper.apaCitation)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>APA 7 Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin APA 7</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSaveReference(
                                  paper.id,
                                  `Referensi: ${paper.title}`,
                                  paper.apaCitation
                                )
                              }
                              disabled={isSaved}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                                isSaved
                                  ? 'border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 cursor-default'
                                  : 'border-slate-200 dark:border-slate-700 text-[#4A5873] dark:text-slate-300 hover:border-[#1D4ED8] cursor-pointer'
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <BookmarkCheck className="w-3.5 h-3.5" />
                                  <span>{isSignedIn ? 'Tersimpan di Akun' : 'Tersimpan'}</span>
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedIds((prev) => ({ ...prev, [paper.id]: !prev[paper.id] }))
                              }
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white cursor-pointer whitespace-nowrap"
                            >
                              <span>{isExpanded ? 'Tutup Detail' : 'Detail & Sitasi'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {paper.pdfUrl && (
                              <a
                                href={paper.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 whitespace-nowrap"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </a>
                            )}
                            {paper.doiUrl && (
                              <a
                                href={paper.doiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 whitespace-nowrap"
                              >
                                <span>Buka DOI</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {hasMoreScholar && (
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        disabled={loadingMore}
                        onClick={() =>
                          void runScholarSearch(
                            submittedTerm,
                            sortBy,
                            yearFilter,
                            scholarOffset,
                            true
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs font-semibold text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] disabled:opacity-50 cursor-pointer"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memuat artikel berikutnya...</span>
                          </>
                        ) : (
                          <span>Muat Lebih Banyak</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 3: YOUTUBE RESULTS */}
          {!loading && !errorMsg && activeTab === 'youtube' && submittedTerm && (
            <>
              {videos.length === 0 ? (
                <div className="bg-white dark:bg-[#111B2E] border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
                  <p className="font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                    Tidak ada video yang cocok untuk “{submittedTerm}”
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#52607A] dark:text-slate-400">
                    Coba kata kunci tutorial lain yang lebih singkat.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#52607A] dark:text-slate-400 tabular-nums">
                    Menampilkan {videos.length} video untuk “{submittedTerm}” — klik video untuk
                    memutar langsung di sini
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {videos.map((video) => {
                      const isPlaying = playingVideo?.id === video.id;
                      const saveKey = `yt:${video.id}`;
                      const isSaved = Boolean(savedIds[saveKey]);
                      const thumbFailed = Boolean(failedThumbIds[video.id]);

                      return (
                        <article
                          key={video.id}
                          className={`bg-white dark:bg-[#111B2E] border rounded-xl overflow-hidden flex flex-col justify-between transition-colors ${
                            isPlaying
                              ? 'border-[#1D4ED8] dark:border-[#60A5FA]'
                              : 'border-slate-200/90 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <button
                              type="button"
                              onClick={() => setPlayingVideo(video)}
                              className="group relative block w-full aspect-video bg-slate-900 overflow-hidden cursor-pointer text-left"
                            >
                              {!thumbFailed ? (
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={() =>
                                    setFailedThumbIds((prev) => ({ ...prev, [video.id]: true }))
                                  }
                                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300">
                                  <Video className="w-8 h-8" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-center justify-center">
                                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/95 text-[#111C33] shadow-md group-hover:scale-105 transition-transform">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </span>
                              </div>
                              {video.duration && (
                                <span className="absolute right-2 bottom-2 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[11px] tabular-nums">
                                  {video.duration}
                                </span>
                              )}
                            </button>

                            <div className="p-3.5">
                              <button
                                type="button"
                                onClick={() => setPlayingVideo(video)}
                                className="text-left font-display text-sm font-bold text-[#111C33] dark:text-[#F1F5F9] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] line-clamp-2 leading-snug cursor-pointer"
                              >
                                {video.title}
                              </button>
                              <p className="mt-1 text-xs text-[#52607A] dark:text-slate-400 truncate">
                                {video.channel}
                                {video.views ? ` · ${video.views}` : ''}
                                {video.published ? ` · ${video.published}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setPlayingVideo(video)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1D4ED8]/10 text-[#1D4ED8] dark:text-[#60A5FA] hover:bg-[#1D4ED8]/20 cursor-pointer whitespace-nowrap"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{isPlaying ? 'Sedang Diputar' : 'Putar di Sini'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() =>
                                handleSaveReference(
                                  saveKey,
                                  `Video: ${video.title}`,
                                  `${video.channel} — ${video.url}`
                                )
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                                isSaved
                                  ? 'border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 cursor-default'
                                  : 'border-slate-200 dark:border-slate-700 text-[#4A5873] dark:text-slate-300 hover:border-[#1D4ED8] cursor-pointer'
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <BookmarkCheck className="w-3.5 h-3.5" />
                                  <span>Tersimpan</span>
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                  <span>Simpan</span>
                                </>
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Slim Footer */}
        <div className="bg-white dark:bg-[#111B2E] border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52607A] dark:text-slate-400 shrink-0">
          <span className="truncate">{fallbackExternal.sourceNote}</span>
          <a
            href={fallbackExternal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            <span>{fallbackExternal.label}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
