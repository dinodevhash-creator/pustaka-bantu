import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { GUIDES, THESIS_STAGES } from '../data/guides';
import { ResilientImage } from './ResilientImage';

interface ThesisRoadmapProps {
  completedTasks: Record<string, boolean>;
  onToggleTask: (taskId: string) => void;
  onResetTasks: () => void;
  onJumpToGuide: (guideId: string) => void;
}

export function ThesisRoadmap({
  completedTasks,
  onToggleTask,
  onResetTasks,
  onJumpToGuide,
}: ThesisRoadmapProps) {
  const allTasks = THESIS_STAGES.flatMap((s) => s.tasks);
  const doneCount = allTasks.filter((t) => completedTasks[t.id]).length;
  const percent = Math.round((doneCount / allTasks.length) * 100);

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
                Peta Jalan Tugas Akhir · 6 Tahap Utama
              </p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C33] dark:text-[#F1F5F9]">
                Pelacak Progres Skripsi
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#4A5873] dark:text-slate-300 leading-relaxed max-w-[58ch]">
                Centang tonggak yang sudah kamu selesaikan dari pengajuan judul sampai sidang akhir.
                Setiap tahap terhubung langsung ke panduan praktis di pustaka.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
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

              {doneCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={onResetTasks}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ceklis skripsi</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 min-h-[210px]">
            <ResilientImage
              src="/src/assets/images/tool_thesis_studio_1795656703171.jpg"
              alt="Draf skripsi tercetak, catatan kerangka tangan, pensil mekanik, dan kopi di atas meja kerja"
              fallbackTitle="Peta Jalan Skripsi"
              caption="Langkah kecil yang konsisten mengantar drafmu sampai meja sidang."
              className="w-full h-full object-cover lg:h-full"
            />
          </div>
        </div>

        {/* 6 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {THESIS_STAGES.map((stage) => {
            const stageDone = stage.tasks.filter((t) => completedTasks[t.id]).length;
            const isStageComplete = stageDone === stage.tasks.length;
            return (
              <div
                key={stage.id}
                className={`bg-white dark:bg-[#111B2E] border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                  isStageComplete
                    ? 'border-emerald-600/50 dark:border-emerald-500/50'
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#52607A] dark:text-slate-400">
                    <span className="font-mono font-semibold tabular-nums">
                      Tahap {stage.number}
                    </span>
                    <span
                      className={`font-mono tabular-nums font-medium ${
                        isStageComplete
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-[#52607A] dark:text-slate-400'
                      }`}
                    >
                      {isStageComplete
                        ? 'Selesai'
                        : `${stageDone}/${stage.tasks.length}`}
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-display text-base font-bold text-[#111C33] dark:text-[#F1F5F9]">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#52607A] dark:text-slate-400 leading-relaxed">
                    {stage.subtitle}
                  </p>

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
