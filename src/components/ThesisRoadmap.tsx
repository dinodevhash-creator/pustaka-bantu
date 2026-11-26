import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { GUIDES, THESIS_STAGES } from '../data/guides';

export interface ThesisReminderSummary {
  stageId: string;
  stageNumber: string;
  stageTitle: string;
  targetDate: string;
  daysLeft: number;
}

interface ThesisRoadmapProps {
  completedTasks: Record<string, boolean>;
  stageDeadlines: Record<string, string>;
  onChangeDeadline: (stageId: string, date: string) => void;
  onToggleTask: (taskId: string) => void;
  onResetTasks: () => void;
  onJumpToGuide: (guideId: string) => void;
}

const NOTIF_PREF_KEY = 'pustaka_thesis_notif_enabled_v1';
const NOTIF_SENT_KEY = 'pustaka_thesis_notif_sent_v1';

export function computeDaysUntil(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function getUrgentThesisReminders(
  stageDeadlines: Record<string, string>,
  completedTasks: Record<string, boolean>
): ThesisReminderSummary[] {
  const list: ThesisReminderSummary[] = [];
  for (const stage of THESIS_STAGES) {
    const isComplete = stage.tasks.every((t) => completedTasks[t.id]);
    if (isComplete) continue;
    const targetDate = stageDeadlines[stage.id];
    if (!targetDate) continue;
    const daysLeft = computeDaysUntil(targetDate);
    if (daysLeft === null) continue;
    if (daysLeft <= 3) {
      list.push({
        stageId: stage.id,
        stageNumber: stage.number,
        stageTitle: stage.title,
        targetDate,
        daysLeft,
      });
    }
  }
  return list.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function formatDeadlineRelative(daysLeft: number): string {
  if (daysLeft < 0) return `Terlewat ${Math.abs(daysLeft)} hari`;
  if (daysLeft === 0) return 'Jatuh tempo hari ini';
  if (daysLeft === 1) return 'Jatuh tempo besok';
  return `H-${daysLeft} lagi`;
}

function formatShortIndonesianDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(y, m - 1, d));
  } catch {
    return dateStr;
  }
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function ThesisRoadmap({
  completedTasks,
  stageDeadlines,
  onChangeDeadline,
  onToggleTask,
  onResetTasks,
  onJumpToGuide,
}: ThesisRoadmapProps) {
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(NOTIF_PREF_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'overall' | 'stage'>('overall');

  const allTasks = THESIS_STAGES.flatMap((s) => s.tasks);
  const doneCount = allTasks.filter((t) => completedTasks[t.id]).length;
  const remainingCount = allTasks.length - doneCount;
  const percent = Math.round((doneCount / allTasks.length) * 100);

  const overallPieData = useMemo(
    () => [
      { name: 'Selesai', value: doneCount, color: '#1D4ED8' },
      { name: 'Belum selesai', value: remainingCount, color: '#94A3B8' },
    ],
    [doneCount, remainingCount]
  );

  const stagePieData = useMemo(() => {
    const palette = ['#1D4ED8', '#0284C7', '#0D9488', '#059669', '#D97706', '#4F46E5'];
    const completedByStage = THESIS_STAGES.map((stage, idx) => ({
      name: `Tahap ${stage.number}: ${stage.title}`,
      shortName: `Tahap ${stage.number}`,
      value: stage.tasks.filter((t) => completedTasks[t.id]).length,
      total: stage.tasks.length,
      color: palette[idx % palette.length],
    }));
    const activeSlices = completedByStage.filter((item) => item.value > 0);
    if (remainingCount > 0) {
      activeSlices.push({
        name: 'Belum selesai',
        shortName: 'Tersisa',
        value: remainingCount,
        total: allTasks.length,
        color: '#94A3B8',
      });
    }
    return { activeSlices, completedByStage };
  }, [allTasks.length, completedTasks, remainingCount]);

  const urgentReminders = useMemo(
    () => getUrgentThesisReminders(stageDeadlines, completedTasks),
    [stageDeadlines, completedTasks]
  );

  // Fire browser Notification once per day per urgent stage when user opted in
  useEffect(() => {
    if (!browserNotifEnabled || urgentReminders.length === 0) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const today = getTodayDateString();
    let sentMap: Record<string, string> = {};
    try {
      const raw = window.localStorage.getItem(NOTIF_SENT_KEY);
      if (raw) sentMap = JSON.parse(raw) as Record<string, string>;
    } catch {
      sentMap = {};
    }

    let updated = false;
    for (const item of urgentReminders) {
      const key = `${item.stageId}:${item.targetDate}`;
      if (sentMap[key] === today) continue;
      try {
        new Notification(`Pengingat Skripsi · Tahap ${item.stageNumber}`, {
          body: `${item.stageTitle} — ${formatDeadlineRelative(item.daysLeft)} (${formatShortIndonesianDate(
            item.targetDate
          )}).`,
        });
        sentMap[key] = today;
        updated = true;
      } catch {
        // Ignore if browser blocks Notification constructor in embedded iframe
      }
    }

    if (updated) {
      try {
        window.localStorage.setItem(NOTIF_SENT_KEY, JSON.stringify(sentMap));
      } catch {
        // ignore
      }
    }
  }, [browserNotifEnabled, urgentReminders]);

  const handleToggleBrowserNotif = async () => {
    setNotifFeedback(null);

    if (browserNotifEnabled) {
      setBrowserNotifEnabled(false);
      try {
        window.localStorage.setItem(NOTIF_PREF_KEY, 'false');
      } catch {
        // ignore
      }
      setNotifFeedback('Notifikasi browser dimatikan. Pengingat di halaman tetap aktif.');
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifFeedback(
        'Peramban ini tidak mendukung notifikasi sistem; pengingat tetap tampil langsung di halaman.'
      );
      return;
    }

    if (Notification.permission === 'granted') {
      setBrowserNotifEnabled(true);
      try {
        window.localStorage.setItem(NOTIF_PREF_KEY, 'true');
      } catch {
        // ignore
      }
      setNotifFeedback('Notifikasi browser aktif untuk tenggat ≤ 3 hari.');
      return;
    }

    if (Notification.permission === 'denied') {
      setNotifFeedback(
        'Izin notifikasi diblokir di pengaturan peramban. Pengingat tetap aktif di halaman ini.'
      );
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setBrowserNotifEnabled(true);
        try {
          window.localStorage.setItem(NOTIF_PREF_KEY, 'true');
        } catch {
          // ignore
        }
        setNotifFeedback('Notifikasi browser aktif untuk tenggat ≤ 3 hari.');
      } else {
        setNotifFeedback(
          'Izin notifikasi tidak diberikan. Pengingat tenggat tetap muncul otomatis di halaman.'
        );
      }
    } catch {
      setNotifFeedback(
        'Notifikasi sistem tidak tersedia di jendela pratinjau; pengingat tetap aktif di halaman.'
      );
    }
  };

  return (
    <section
      id="progres-skripsi"
      className="py-12 lg:py-16 border-t border-slate-200/80 dark:border-slate-800/80"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Banner Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
          <div className="lg:col-span-7 bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
                Peta Jalan Tugas Akhir · 6 Tahap Utama &amp; Pengingat Tenggat
              </p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C33] dark:text-[#F1F5F9]">
                Pelacak Progres &amp; Tenggat Skripsi
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#4A5873] dark:text-slate-300 leading-relaxed max-w-[58ch]">
                Centang tonggak yang sudah selesai dan tetapkan tanggal target tiap tahap. Tahap
                yang mendekati tenggat (≤ 3 hari) atau terlewat akan otomatis memunculkan pengingat
                di peramban.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-[#111C33] dark:text-slate-200">
                    Progres keseluruhan
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[#1D4ED8] dark:text-[#60A5FA]">
                    {percent}% ({doneCount}/{allTasks.length} tonggak)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#1D4ED8] dark:bg-[#3B82F6] transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Reminder Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleToggleBrowserNotif}
                  aria-pressed={browserNotifEnabled}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    browserNotifEnabled
                      ? 'border-[#1D4ED8] bg-[#1D4ED8]/10 text-[#1D4ED8] dark:text-[#60A5FA]'
                      : 'border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  {browserNotifEnabled ? (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Notifikasi Browser Aktif</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-3.5 h-3.5" />
                      <span>Aktifkan Notifikasi Browser</span>
                    </>
                  )}
                </button>

                {doneCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetTasks}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ceklis skripsi</span>
                  </button>
                )}
              </div>

              {notifFeedback && (
                <p className="text-xs text-[#52607A] dark:text-slate-400">{notifFeedback}</p>
              )}

              {/* Active Urgent Deadlines Summary */}
              {urgentReminders.length > 0 && (
                <div className="rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800/70 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {urgentReminders.length} tahap skripsi mendekati atau melewati tenggat
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-amber-900/90 dark:text-amber-100/90">
                    {urgentReminders.map((item) => (
                      <li
                        key={item.stageId}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span>
                          Tahap {item.stageNumber}: <strong>{item.stageTitle}</strong>
                        </span>
                        <span className="font-mono tabular-nums font-semibold">
                          {formatDeadlineRelative(item.daysLeft)} (
                          {formatShortIndonesianDate(item.targetDate)})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Recharts Pie Chart */}
          <div className="lg:col-span-5 bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
                  Visualisasi Progres · Dinamis
                </p>
                <h3 className="mt-0.5 font-display text-lg font-bold text-[#111C33] dark:text-[#F1F5F9]">
                  Grafik Penyelesaian Tugas
                </h3>
              </div>

              <div
                className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                role="group"
                aria-label="Mode tampilan grafik skripsi"
              >
                <button
                  type="button"
                  onClick={() => setChartMode('overall')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    chartMode === 'overall'
                      ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#52607A] dark:text-slate-400'
                  }`}
                >
                  Keseluruhan
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('stage')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    chartMode === 'stage'
                      ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#52607A] dark:text-slate-400'
                  }`}
                >
                  Per Tahap
                </button>
              </div>
            </div>

            {/* Chart Stage */}
            <div className="relative h-56 w-full min-w-0 my-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartMode === 'overall' ? overallPieData : stagePieData.activeSlices}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={doneCount > 0 && remainingCount > 0 ? 2 : 0}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={350}
                  >
                    {(chartMode === 'overall' ? overallPieData : stagePieData.activeSlices).map(
                      (entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => {
                      const num = typeof value === 'number' ? value : Number(value) || 0;
                      const pct = Math.round((num / allTasks.length) * 100);
                      return [`${num} tugas (${pct}%)`, String(name ?? '')];
                    }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      backgroundColor: 'rgba(17, 27, 46, 0.95)',
                      color: '#F1F5F9',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: '#F1F5F9' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Live Percentage Readout */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-3xl font-bold tabular-nums text-[#111C33] dark:text-white leading-none">
                  {percent}%
                </span>
                <span className="mt-1 text-[11px] font-medium text-[#52607A] dark:text-slate-400 tabular-nums">
                  {doneCount}/{allTasks.length} tugas
                </span>
              </div>
            </div>

            {/* Clean Unboxed Legend */}
            {chartMode === 'overall' ? (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#111C33] dark:text-slate-200">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#1D4ED8] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Selesai:{' '}
                    <strong className="font-mono tabular-nums">
                      {doneCount} ({percent}%)
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#52607A] dark:text-slate-400">
                  <span
                    className="w-2.5 h-2.5 rounded-xs bg-[#94A3B8] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Tersisa:{' '}
                    <strong className="font-mono tabular-nums">
                      {remainingCount} ({100 - percent}%)
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-x-3 gap-y-1.5 text-[11px]">
                {stagePieData.completedByStage.map((item) => (
                  <div
                    key={item.shortName}
                    className="flex items-center justify-between gap-1 text-[#4A5873] dark:text-slate-300"
                  >
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.shortName}</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#111C33] dark:text-slate-100">
                      {item.value}/{item.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 6 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {THESIS_STAGES.map((stage) => {
            const stageDone = stage.tasks.filter((t) => completedTasks[t.id]).length;
            const isStageComplete = stageDone === stage.tasks.length;
            const targetDate = stageDeadlines[stage.id] || '';
            const daysLeft = targetDate ? computeDaysUntil(targetDate) : null;
            const isOverdue = !isStageComplete && daysLeft !== null && daysLeft < 0;
            const isApproaching =
              !isStageComplete && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

            return (
              <div
                key={stage.id}
                className={`bg-white dark:bg-[#111B2E] border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                  isStageComplete
                    ? 'border-emerald-600/50 dark:border-emerald-500/50'
                    : isOverdue
                      ? 'border-rose-400/80 dark:border-rose-600/70'
                      : isApproaching
                        ? 'border-amber-400/90 dark:border-amber-600/70'
                        : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#52607A] dark:text-slate-400">
                    <span className="font-mono font-semibold tabular-nums">
                      Tahap {stage.number}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono tabular-nums font-medium ${
                        isStageComplete
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : isOverdue
                            ? 'text-rose-700 dark:text-rose-400'
                            : isApproaching
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-[#52607A] dark:text-slate-400'
                      }`}
                    >
                      {isStageComplete ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai</span>
                        </>
                      ) : isOverdue && daysLeft !== null ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{formatDeadlineRelative(daysLeft)}</span>
                        </>
                      ) : isApproaching && daysLeft !== null ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDeadlineRelative(daysLeft)}</span>
                        </>
                      ) : (
                        <span>
                          {stageDone}/{stage.tasks.length}
                        </span>
                      )}
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#52607A] dark:text-slate-400 leading-relaxed">
                    {stage.subtitle}
                  </p>

                  {/* Target Deadline Picker (Saved in localStorage) */}
                  <div className="mt-3 p-2.5 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`deadline-${stage.id}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#52607A] dark:text-slate-400"
                      >
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Tanggal target</span>
                      </label>
                      {targetDate && (
                        <button
                          type="button"
                          onClick={() => onChangeDeadline(stage.id, '')}
                          aria-label={`Hapus target tanggal Tahap ${stage.number}`}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <input
                        id={`deadline-${stage.id}`}
                        type="date"
                        value={targetDate}
                        onChange={(e) => onChangeDeadline(stage.id, e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] font-mono text-xs tabular-nums text-[#111C33] dark:text-slate-100 focus:outline-none focus:border-[#1D4ED8]"
                      />
                    </div>
                    {targetDate && daysLeft !== null && !isStageComplete && daysLeft > 3 && (
                      <p className="mt-1 text-[11px] font-mono tabular-nums text-[#52607A] dark:text-slate-400">
                        Target {formatShortIndonesianDate(targetDate)} · {formatDeadlineRelative(daysLeft)}
                      </p>
                    )}
                  </div>

                  <ul className="mt-4 space-y-2">
                    {stage.tasks.map((task) => {
                      const checked = Boolean(completedTasks[task.id]);
                      return (
                        <li key={task.id}>
                          <label className="flex items-start gap-2.5 text-xs sm:text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleTask(task.id)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#1D4ED8] focus:ring-[#1D4ED8] cursor-pointer shrink-0"
                            />
                            <span
                              className={
                                checked
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-[#111C33] dark:text-slate-200'
                              }
                            >
                              {task.label}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-3 gap-y-1.5">
                  {stage.relatedGuideIds.map((gid) => {
                    const g = GUIDES.find((item) => item.id === gid);
                    if (!g) return null;
                    return (
                      <button
                        key={gid}
                        type="button"
                        onClick={() => onJumpToGuide(gid)}
                        className="inline-flex items-center gap-0.5 text-xs font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 cursor-pointer"
                      >
                        <span>{g.title}</span>
                        <ArrowUpRight className="w-3 h-3 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
