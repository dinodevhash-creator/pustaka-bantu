import { useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ArrowUp } from 'lucide-react';
import { CATEGORIES, GUIDES, StudyScenario, ToolId } from './data/guides';
import {
  WorkHistoryCategory,
  WorkHistoryEntry,
  addWorkHistoryEntry,
  auth,
  deleteWorkHistoryEntry,
  ensureUserWorkspace,
  saveGuideNoteToCloud,
  signOutAccount,
  subscribeUserNotes,
  subscribeUserWorkspace,
  subscribeWorkHistory,
  syncWorkspaceProgress,
} from './firebase';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { GuideLibrary } from './components/GuideLibrary';
import { InteractiveToolkit } from './components/InteractiveToolkit';
import { ThesisRoadmap } from './components/ThesisRoadmap';
import { WorkHistorySection } from './components/WorkHistorySection';
import { LoginPage } from './components/LoginPage';
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

function checkedRecordToList(rec: Record<string, boolean>): string[] {
  return Object.entries(rec)
    .filter(([, checked]) => checked)
    .map(([k]) => k);
}

function listToCheckedRecord(list: string[]): Record<string, boolean> {
  const rec: Record<string, boolean> = {};
  for (const key of list) {
    rec[key] = true;
  }
  return rec;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [showLoginPage, setShowLoginPage] = useState<boolean>(() => {
    try {
      return window.location.hash === '#masuk';
    } catch {
      return false;
    }
  });

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
  const [localHistory, setLocalHistory] = useState<WorkHistoryEntry[]>(() =>
    readStorage<WorkHistoryEntry[]>('pustaka_work_history_v1', [])
  );
  const [cloudHistory, setCloudHistory] = useState<WorkHistoryEntry[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceReadyRef = useRef<boolean>(false);
  const noteTimersRef = useRef<Record<string, number>>({});

  // Keep latest local state accessible when signing in so local work merges smoothly
  const latestLocalRef = useRef({
    savedIds,
    helpfulIds,
    checkedSteps,
    thesisTasks,
    notes,
    pomodoroLog,
    localHistory,
  });
  latestLocalRef.current = {
    savedIds,
    helpfulIds,
    checkedSteps,
    thesisTasks,
    notes,
    pomodoroLog,
    localHistory,
  };

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

  // Persist local mirror
  useEffect(() => writeStorage('pustaka_saved_ids', savedIds), [savedIds]);
  useEffect(() => writeStorage('pustaka_liked_guides_v2', helpfulIds), [helpfulIds]);
  useEffect(() => writeStorage('pustaka_helpful_counts_v2', helpfulCounts), [helpfulCounts]);
  useEffect(() => writeStorage('pustaka_checked_steps', checkedSteps), [checkedSteps]);
  useEffect(() => writeStorage('pustaka_notes', notes), [notes]);
  useEffect(() => writeStorage('pustaka_thesis_tasks', thesisTasks), [thesisTasks]);
  useEffect(() => writeStorage('pustaka_pomodoro_log', pomodoroLog), [pomodoroLog]);
  useEffect(() => writeStorage('pustaka_work_history_v1', localHistory), [localHistory]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        setShowLoginPage(false);
      } else {
        workspaceReadyRef.current = false;
        setCloudHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initialize Firestore workspace & real-time listeners ONLY when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    let unsubWorkspace: (() => void) | null = null;
    let unsubNotes: (() => void) | null = null;
    let unsubHistory: (() => void) | null = null;

    const today = getTodayKey();
    const snapshot = latestLocalRef.current;

    setSyncingCloud(true);
    ensureUserWorkspace(user, {
      savedGuideIds: snapshot.savedIds,
      likedGuideIds: snapshot.helpfulIds,
      checkedStepKeys: checkedRecordToList(snapshot.checkedSteps),
      thesisTaskIds: checkedRecordToList(snapshot.thesisTasks),
      pomodoroSessionsToday: snapshot.pomodoroLog[today] || 0,
      pomodoroDate: today,
    })
      .then(async (merged) => {
        if (cancelled) return;
        workspaceReadyRef.current = true;
        setSavedIds(merged.savedGuideIds);
        setHelpfulIds(merged.likedGuideIds);
        setCheckedSteps(listToCheckedRecord(merged.checkedStepKeys));
        setThesisTasks(listToCheckedRecord(merged.thesisTaskIds));
        if (merged.pomodoroDate === today) {
          setPomodoroLog((prev) => ({ ...prev, [today]: merged.pomodoroSessionsToday }));
        }

        // Migrate any existing local notes into cloud subcollection
        const localNotesEntries = Object.entries(snapshot.notes).filter(
          ([, content]) => content.trim().length > 0
        );
        for (const [guideId, content] of localNotesEntries) {
          if (cancelled) break;
          await saveGuideNoteToCloud(user.uid, guideId, content).catch(() => {});
        }

        // Migrate any unsynced guest history items into cloud history
        const guestItems = snapshot.localHistory.filter((item) => item.ownerId === 'local');
        if (guestItems.length > 0 && !cancelled) {
          for (const item of guestItems.slice(0, 15)) {
            await addWorkHistoryEntry(user.uid, item.category, item.title, item.detail).catch(
              () => {}
            );
          }
          setLocalHistory([]);
        }

        if (cancelled) return;

        unsubWorkspace = subscribeUserWorkspace(user.uid, (ws) => {
          setSavedIds(ws.savedGuideIds);
          setHelpfulIds(ws.likedGuideIds);
          setCheckedSteps(listToCheckedRecord(ws.checkedStepKeys));
          setThesisTasks(listToCheckedRecord(ws.thesisTaskIds));
          if (ws.pomodoroDate === today) {
            setPomodoroLog((prev) => ({ ...prev, [today]: ws.pomodoroSessionsToday }));
          }
        });

        unsubNotes = subscribeUserNotes(user.uid, (cloudNotes) => {
          setNotes(cloudNotes);
        });

        unsubHistory = subscribeWorkHistory(user.uid, (entries) => {
          setCloudHistory(entries);
        });
      })
      .catch(() => {
        // Error already logged via handleFirestoreError
      })
      .finally(() => {
        if (!cancelled) setSyncingCloud(false);
      });

    return () => {
      cancelled = true;
      unsubWorkspace?.();
      unsubNotes?.();
      unsubHistory?.();
    };
  }, [authReady, user]);

  // Fetch real persisted helpful counts from server / Cloudflare KV (starts at 0)
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
      if (e.key === '/' && !isInputFocused && !showLoginPage) {
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
  }, [showLoginPage]);

  const pushWorkspaceToCloud = (overrides?: {
    savedGuideIds?: string[];
    likedGuideIds?: string[];
    checkedStepKeys?: string[];
    thesisTaskIds?: string[];
    pomodoroSessionsToday?: number;
  }) => {
    if (!user || !workspaceReadyRef.current) return;
    const today = getTodayKey();
    void syncWorkspaceProgress(user.uid, {
      savedGuideIds: overrides?.savedGuideIds ?? savedIds,
      likedGuideIds: overrides?.likedGuideIds ?? helpfulIds,
      checkedStepKeys: overrides?.checkedStepKeys ?? checkedRecordToList(checkedSteps),
      thesisTaskIds: overrides?.thesisTaskIds ?? checkedRecordToList(thesisTasks),
      pomodoroSessionsToday: overrides?.pomodoroSessionsToday ?? (pomodoroLog[today] || 0),
      pomodoroDate: today,
    }).catch(() => {});
  };

  const handleSaveHistory = (
    category: WorkHistoryCategory,
    title: string,
    detail: string
  ) => {
    if (user && workspaceReadyRef.current) {
      void addWorkHistoryEntry(user.uid, category, title, detail).catch(() => {});
      return;
    }

    const localEntry: WorkHistoryEntry = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ownerId: 'local',
      category,
      title: title.trim().slice(0, 160),
      detail: detail.trim().slice(0, 1200),
      createdAtMs: Date.now(),
    };
    setLocalHistory((prev) => [localEntry, ...prev].slice(0, 50));
  };

  const handleDeleteHistory = (entryId: string) => {
    if (user && workspaceReadyRef.current) {
      void deleteWorkHistoryEntry(user.uid, entryId).catch(() => {});
      return;
    }
    setLocalHistory((prev) => prev.filter((item) => item.id !== entryId));
  };

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
    const next = savedIds.includes(id)
      ? savedIds.filter((item) => item !== id)
      : [...savedIds, id];
    setSavedIds(next);
    pushWorkspaceToCloud({ savedGuideIds: next });
  };

  const toggleHelpful = (id: string) => {
    const alreadyLiked = helpfulIds.includes(id);
    const action: 'like' | 'unlike' = alreadyLiked ? 'unlike' : 'like';
    const nextLiked = alreadyLiked
      ? helpfulIds.filter((item) => item !== id)
      : [...helpfulIds, id];

    setHelpfulIds(nextLiked);
    setHelpfulCounts((prev) => {
      const current = prev[id] ?? 0;
      const next = action === 'like' ? current + 1 : Math.max(0, current - 1);
      return { ...prev, [id]: next };
    });
    pushWorkspaceToCloud({ likedGuideIds: nextLiked });

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
    const nextRec = { ...checkedSteps, [key]: !checkedSteps[key] };
    setCheckedSteps(nextRec);
    pushWorkspaceToCloud({ checkedStepKeys: checkedRecordToList(nextRec) });
  };

  const saveNote = (guideId: string, note: string) => {
    setNotes((prev) => ({ ...prev, [guideId]: note }));
    if (user && workspaceReadyRef.current) {
      if (noteTimersRef.current[guideId]) {
        window.clearTimeout(noteTimersRef.current[guideId]);
      }
      noteTimersRef.current[guideId] = window.setTimeout(() => {
        void saveGuideNoteToCloud(user.uid, guideId, note).catch(() => {});
      }, 450);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedGuideIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleThesisTask = (taskId: string) => {
    const nextRec = { ...thesisTasks, [taskId]: !thesisTasks[taskId] };
    setThesisTasks(nextRec);
    pushWorkspaceToCloud({ thesisTaskIds: checkedRecordToList(nextRec) });
  };

  const handleResetThesisTasks = () => {
    setThesisTasks({});
    pushWorkspaceToCloud({ thesisTaskIds: [] });
  };

  const todayKey = getTodayKey();
  const pomodoroSessionsToday = pomodoroLog[todayKey] || 0;

  const handleCompletePomodoro = (taskLabel: string) => {
    const nextCount = pomodoroSessionsToday + 1;
    setPomodoroLog((prev) => ({ ...prev, [todayKey]: nextCount }));
    pushWorkspaceToCloud({ pomodoroSessionsToday: nextCount });
    handleSaveHistory(
      'pomodoro',
      `Sesi fokus selesai: ${taskLabel.trim() || 'Belajar mandiri'}`,
      `Total sesi fokus selesai hari ini (${todayKey}): ${nextCount} sesi.`
    );
  };

  const activeHistoryEntries = user ? cloudHistory : localHistory;

  const completedChecklistCount =
    Object.values(checkedSteps).filter(Boolean).length +
    Object.values(thesisTasks).filter(Boolean).length;

  if (showLoginPage) {
    return (
      <LoginPage
        onSuccess={() => setShowLoginPage(false)}
        onContinueGuest={() => setShowLoginPage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-[#E8EEF9]">
      <Header
        user={user}
        savedCount={savedIds.length}
        historyCount={activeHistoryEntries.length}
        onNavigate={handleNavigate}
        onOpenLogin={() => setShowLoginPage(true)}
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
          onCompletePomodoro={handleCompletePomodoro}
          onSaveHistory={handleSaveHistory}
          isSignedIn={Boolean(user)}
        />

        <ThesisRoadmap
          completedTasks={thesisTasks}
          onToggleTask={handleToggleThesisTask}
          onResetTasks={handleResetThesisTasks}
          onJumpToGuide={handleJumpToGuide}
        />

        <WorkHistorySection
          user={user}
          authReady={authReady}
          entries={activeHistoryEntries}
          syncing={syncingCloud}
          onOpenLogin={() => setShowLoginPage(true)}
          onSignOut={() => void signOutAccount()}
          onDeleteEntry={handleDeleteHistory}
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
