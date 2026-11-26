import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { CATEGORIES, GUIDES, StudyScenario, ToolId } from './data/guides';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { GuideLibrary } from './components/GuideLibrary';
import { InteractiveToolkit } from './components/InteractiveToolkit';
import { ThesisRoadmap } from './components/ThesisRoadmap';
import { FooterSection } from './components/FooterSection';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or privacy restrictions
  }
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('pustaka_tema');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeScenario, setActiveScenario] = useState<StudyScenario | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId>('slovin');
  const [expandedGuideIds, setExpandedGuideIds] = useState<string[]>([
    'cara-memilih-topik-skripsi',
    'menentukan-ukuran-sampel',
  ]);

  const [savedIds, setSavedIds] = useState<string[]>(() =>
    readStorage<string[]>('pustaka_saved_ids', [])
  );
  const [helpfulIds, setHelpfulIds] = useState<string[]>(() =>
    readStorage<string[]>('pustaka_liked_guides_v2', [])
  );
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>(() =>
    readStorage<Record<string, number>>('pustaka_helpful_counts_v2', {})
  );
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>(() =>
    readStorage<Record<string, boolean>>('pustaka_checked_steps', {})
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    readStorage<Record<string, string>>('pustaka_notes', {})
  );
  const [thesisTasks, setThesisTasks] = useState<Record<string, boolean>>(() =>
    readStorage<Record<string, boolean>>('pustaka_thesis_tasks', {})
  );
  const [pomodoroLog, setPomodoroLog] = useState<Record<string, number>>(() =>
    readStorage<Record<string, number>>('pustaka_pomodoro_log', {})
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem('pustaka_tema', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Persist user progress locally
  useEffect(() => writeStorage('pustaka_saved_ids', savedIds), [savedIds]);
  useEffect(() => writeStorage('pustaka_liked_guides_v2', helpfulIds), [helpfulIds]);
  useEffect(() => writeStorage('pustaka_helpful_counts_v2', helpfulCounts), [helpfulCounts]);
  useEffect(() => writeStorage('pustaka_checked_steps', checkedSteps), [checkedSteps]);
  useEffect(() => writeStorage('pustaka_notes', notes), [notes]);
  useEffect(() => writeStorage('pustaka_thesis_tasks', thesisTasks), [thesisTasks]);
  useEffect(() => writeStorage('pustaka_pomodoro_log', pomodoroLog), [pomodoroLog]);

  // Fetch real persisted helpful counts from server (starts at 0 until someone likes)
  useEffect(() => {
    let active = true;
    fetch('/api/helpful', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { counts?: Record<string, number> } | null) => {
        if (active && data?.counts && typeof data.counts === 'object') {
          setHelpfulCounts(data.counts);
        }
      })
      .catch(() => {
        // Gracefully stay on local counts when running purely static
      });
    return () => {
      active = false;
    };
  }, []);

  // Global "/" shortcut to jump to search input + scroll-to-top visibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const onScroll = () => {
      setShowScrollTop(window.scrollY > 480);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'tersimpan') {
      setShowSavedOnly(true);
      setActiveScenario(null);
      scrollToId('panduan');
      return;
    }
    if (sectionId === 'panduan') {
      setShowSavedOnly(false);
    }
    scrollToId(sectionId);
  };

  const handleOpenTool = (tool: ToolId) => {
    setActiveTool(tool);
    scrollToId('alat-bantu');
  };

  const handleQuickKeyword = (word: string) => {
    setShowSavedOnly(false);
    setActiveScenario(null);
    setActiveCategory('Semua');
    setQuery(word);
    scrollToId('panduan');
    setTimeout(() => searchInputRef.current?.focus(), 250);
  };

  const handleSelectScenario = (scenario: StudyScenario) => {
    setShowSavedOnly(false);
    setQuery('');
    setActiveScenario(scenario);
    setExpandedGuideIds(scenario.guideIds.slice(0, 2));
    scrollToId('panduan');
  };

  const handleJumpToGuide = (guideId: string) => {
    const found = GUIDES.find((g) => g.id === guideId);
    if (!found) return;
    setShowSavedOnly(false);
    setActiveScenario(null);
    setActiveCategory(found.category);
    setQuery('');
    setExpandedGuideIds((prev) =>
      prev.includes(guideId) ? prev : [...prev, guideId]
    );
    scrollToId('panduan');
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleHelpful = (id: string) => {
    const alreadyLiked = helpfulIds.includes(id);
    const action: 'like' | 'unlike' = alreadyLiked ? 'unlike' : 'like';

    setHelpfulIds((prev) =>
      alreadyLiked ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setHelpfulCounts((prev) => {
      const current = prev[id] ?? 0;
      const next = action === 'like' ? current + 1 : Math.max(0, current - 1);
      return { ...prev, [id]: next };
    });

    fetch('/api/helpful', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideId: id, action }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { guideId?: string; count?: number } | null) => {
        if (data?.guideId && typeof data.count === 'number') {
          setHelpfulCounts((prev) => ({ ...prev, [data.guideId!]: data.count! }));
        }
      })
      .catch(() => {
        // Keep optimistic local count if running statically without API server
      });
  };

  const toggleStep = (guideId: string, stepIndex: number) => {
    const key = `${guideId}:${stepIndex}`;
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveNote = (guideId: string, note: string) => {
    setNotes((prev) => ({ ...prev, [guideId]: note }));
  };

  const toggleExpand = (id: string) => {
    setExpandedGuideIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const todayKey = getTodayKey();
  const pomodoroSessionsToday = pomodoroLog[todayKey] || 0;

  const completedChecklistCount =
    Object.values(checkedSteps).filter(Boolean).length +
    Object.values(thesisTasks).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-[#E8EEF9]">
      <Header
        savedCount={savedIds.length}
        onNavigate={handleNavigate}
        onOpenFocusTimer={() => handleOpenTool('pomodoro')}
      />

      <main className="flex-1">
        <HeroSection
          query={query}
          onQueryChange={(val) => {
            setQuery(val);
            if (activeScenario) setActiveScenario(null);
          }}
          onSubmitSearch={() => {
            setShowSavedOnly(false);
            scrollToId('panduan');
          }}
          onQuickKeyword={handleQuickKeyword}
          onSelectScenario={handleSelectScenario}
          onOpenTool={handleOpenTool}
          onJumpToGuide={handleJumpToGuide}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          totalGuides={GUIDES.length}
          totalCategories={CATEGORIES.length - 1}
          completedChecklistCount={completedChecklistCount}
        />

        <GuideLibrary
          query={query}
          onQueryChange={setQuery}
          searchInputRef={searchInputRef}
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat);
            setActiveScenario(null);
          }}
          activeScenario={activeScenario}
          onClearScenario={() => setActiveScenario(null)}
          showSavedOnly={showSavedOnly}
          onToggleSavedOnly={setShowSavedOnly}
          savedIds={savedIds}
          onToggleSave={toggleSave}
          helpfulIds={helpfulIds}
          helpfulCounts={helpfulCounts}
          onToggleHelpful={toggleHelpful}
          checkedSteps={checkedSteps}
          onToggleStep={toggleStep}
          notes={notes}
          onSaveNote={saveNote}
          onOpenTool={handleOpenTool}
          expandedGuideIds={expandedGuideIds}
          onToggleExpand={toggleExpand}
        />

        <InteractiveToolkit
          activeTool={activeTool}
          onToolChange={setActiveTool}
          pomodoroSessionsToday={pomodoroSessionsToday}
          onCompletePomodoro={() =>
            setPomodoroLog((prev) => ({
              ...prev,
              [todayKey]: (prev[todayKey] || 0) + 1,
            }))
          }
        />

        <ThesisRoadmap
          completedTasks={thesisTasks}
          onToggleTask={(taskId) =>
            setThesisTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
          }
          onResetTasks={() => setThesisTasks({})}
          onJumpToGuide={handleJumpToGuide}
        />
      </main>

      <FooterSection
        onJumpToMentalHealth={() => {
          setShowSavedOnly(false);
          setActiveScenario(null);
          setQuery('');
          setActiveCategory('Kesehatan Mental');
          setExpandedGuideIds([
            'mengatasi-stres-dan-burnout',
            'kapan-harus-mencari-bantuan-profesional',
          ]);
          scrollToId('panduan');
        }}
        onScrollTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Kembali ke atas"
          className="fixed right-5 bottom-5 z-30 w-11 h-11 rounded-full bg-[#111C33] dark:bg-[#E8EEF9] text-white dark:text-[#0B1220] shadow-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
