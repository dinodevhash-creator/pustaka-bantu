import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  PPT_TEMPLATES,
  PPT_THEMES,
  PptDeckMeta,
  PptTemplateId,
  PptThemeId,
  SlideDraft,
  exportPresentationPptx,
  getTemplatePreset,
  parseRawTextToSlides,
} from '../utils/pptBuilder';

export function PptGeneratorTool() {
  const initialPreset = getTemplatePreset('sidang-skripsi');
  const [templateId, setTemplateId] = useState<PptTemplateId>('sidang-skripsi');
  const [themeId, setThemeId] = useState<PptThemeId>('akademik-biru');
  const [meta, setMeta] = useState<PptDeckMeta>(initialPreset.meta);
  const [slides, setSlides] = useState<SlideDraft[]>(initialPreset.slides);
  const [includeClosing, setIncludeClosing] = useState(true);

  const [rawText, setRawText] = useState('');
  const [showAutoParser, setShowAutoParser] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);

  // Preview index: 0 = cover, 1..slides.length = content slides, last = closing (if enabled)
  const [previewIdx, setPreviewIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportedFile, setExportedFile] = useState<string | null>(null);
  const [copiedOutline, setCopiedOutline] = useState(false);

  const theme = PPT_THEMES[themeId];
  const totalPreviewSlides = 1 + slides.length + (includeClosing ? 1 : 0);
  const safePreviewIdx = Math.min(previewIdx, totalPreviewSlides - 1);

  const handleSelectTemplate = (nextId: PptTemplateId) => {
    setTemplateId(nextId);
    setParseMessage(null);
    const preset = getTemplatePreset(nextId);
    setMeta(preset.meta);
    setSlides(preset.slides);
    setPreviewIdx(0);
    setShowAutoParser(nextId === 'teks-otomatis');
  };

  const handleAutoSplitText = () => {
    const generated = parseRawTextToSlides(rawText);
    if (generated.length === 0) {
      setParseMessage('Tempel minimal satu paragraf atau daftar poin terlebih dahulu.');
      return;
    }
    setSlides(generated);
    setPreviewIdx(1);
    setParseMessage(`Berhasil membentuk ${generated.length} slide konten dari teksmu.`);
  };

  const updateSlide = (index: number, patch: Partial<SlideDraft>) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleAddSlide = () => {
    const nextNum = slides.length + 1;
    const newSlide: SlideDraft = {
      id: `custom-${Date.now()}`,
      kicker: `Bagian ${String(nextNum).padStart(2, '0')}`,
      title: `Judul Slide ${nextNum}`,
      bullets: ['Poin utama pertama', 'Poin pendukung kedua'],
      notes: '',
    };
    setSlides((prev) => [...prev, newSlide]);
    setPreviewIdx(nextNum);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
    setPreviewIdx((curr) => Math.max(0, Math.min(curr, slides.length - 1)));
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
    setPreviewIdx(target + 1);
  };

  const handleExportPptx = async () => {
    setExporting(true);
    setExportedFile(null);
    try {
      const filename = await exportPresentationPptx({
        meta,
        slides,
        themeId,
        includeClosingSlide: includeClosing,
      });
      setExportedFile(filename);
      setTimeout(() => setExportedFile(null), 3500);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyOutline = async () => {
    const text = [
      `JUDUL: ${meta.title}`,
      meta.subtitle ? `SUBJUDUL: ${meta.subtitle}` : '',
      meta.presenter ? `PRESENTER: ${meta.presenter}` : '',
      '',
      ...slides.flatMap((s, i) => [
        `Slide ${i + 2}: ${s.title}`,
        ...s.bullets.map((b) => `- ${b}`),
        s.notes ? `Catatan presenter: ${s.notes}` : '',
        '',
      ]),
    ]
      .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedOutline(true);
      setTimeout(() => setCopiedOutline(false), 2000);
    } catch {
      // ignore restricted clipboard
    }
  };

  const activeContentIndex =
    safePreviewIdx >= 1 && safePreviewIdx <= slides.length ? safePreviewIdx - 1 : -1;
  const activeSlide = activeContentIndex >= 0 ? slides[activeContentIndex] : null;
  const isClosingPreview = includeClosing && safePreviewIdx === totalPreviewSlides - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-[#111C33] dark:text-[#F1F5F9]">
            Pembuat PPT Akademik Otomatis (.pptx)
          </h3>
          <p className="mt-1 text-sm text-[#4A5873] dark:text-slate-300 max-w-[66ch]">
            Pilih struktur presentasi kampus atau tempel ringkasan materimu untuk dipecah otomatis
            menjadi slide siap unduh ke PowerPoint, Google Slides, atau Canva — langsung di browser
            tanpa API key.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyOutline}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs font-semibold text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiedOutline ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Kerangka Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kerangka</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExportPptx()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            {exporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat .pptx...</span>
              </>
            ) : exportedFile ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>File .pptx Diunduh</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Unduh PowerPoint (.pptx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template Picker Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {PPT_TEMPLATES.map((tpl) => {
          const active = templateId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tpl.id)}
              aria-pressed={active}
              className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                active
                  ? 'border-[#1D4ED8] bg-[#1D4ED8]/8 dark:bg-[#60A5FA]/12'
                  : 'border-slate-200 dark:border-slate-800 bg-[#F7F9FC] dark:bg-[#0B1220] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <p
                className={`font-display text-xs sm:text-sm font-bold ${
                  active ? 'text-[#1D4ED8] dark:text-[#60A5FA]' : 'text-[#111C33] dark:text-[#F1F5F9]'
                }`}
              >
                {tpl.label}
              </p>
              <p className="mt-0.5 text-[11px] text-[#52607A] dark:text-slate-400">{tpl.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Metadata + Auto Text Splitter + Slide Editor */}
        <div className="lg:col-span-6 space-y-5">
          {/* Cover Details */}
          <div className="p-4 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200">
                Informasi Sampul &amp; Tema Slide
              </p>
              <button
                type="button"
                onClick={() => setPreviewIdx(0)}
                className="text-[11px] font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer"
              >
                Lihat Sampul
              </button>
            </div>

            <div>
              <label
                htmlFor="ppt-title"
                className="block text-[11px] font-medium text-[#52607A] dark:text-slate-400 mb-1"
              >
                Judul Presentasi
              </label>
              <input
                id="ppt-title"
                type="text"
                value={meta.title}
                onChange={(e) => setMeta((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs sm:text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="ppt-presenter"
                  className="block text-[11px] font-medium text-[#52607A] dark:text-slate-400 mb-1"
                >
                  Nama &amp; NIM
                </label>
                <input
                  id="ppt-presenter"
                  type="text"
                  value={meta.presenter}
                  onChange={(e) => setMeta((prev) => ({ ...prev, presenter: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label
                  htmlFor="ppt-inst"
                  className="block text-[11px] font-medium text-[#52607A] dark:text-slate-400 mb-1"
                >
                  Prodi / Kampus
                </label>
                <input
                  id="ppt-inst"
                  type="text"
                  value={meta.institution}
                  onChange={(e) => setMeta((prev) => ({ ...prev, institution: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="ppt-subtitle"
                  className="block text-[11px] font-medium text-[#52607A] dark:text-slate-400 mb-1"
                >
                  Subjudul / Mata Kuliah
                </label>
                <input
                  id="ppt-subtitle"
                  type="text"
                  value={meta.subtitle}
                  onChange={(e) => setMeta((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label
                  htmlFor="ppt-date"
                  className="block text-[11px] font-medium text-[#52607A] dark:text-slate-400 mb-1"
                >
                  Tanggal Presentasi
                </label>
                <input
                  id="ppt-date"
                  type="text"
                  value={meta.dateLabel}
                  onChange={(e) => setMeta((prev) => ({ ...prev, dateLabel: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>

            {/* Theme Swatches */}
            <div className="pt-1">
              <p className="text-[11px] font-medium text-[#52607A] dark:text-slate-400 mb-1.5">
                Tema Warna Presentasi
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.values(PPT_THEMES).map((t) => {
                  const selected = themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeId(t.id)}
                      aria-pressed={selected}
                      className={`inline-flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'border-[#1D4ED8] bg-white dark:bg-[#111B2E] text-[#111C33] dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#111B2E]/60 text-[#52607A] dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-xs shrink-0 border border-black/15"
                        style={{ backgroundColor: `#${t.coverBg}` }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Automatic Text-to-Slides Box */}
          <div className="p-4 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowAutoParser((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111C33] dark:text-slate-200 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" />
                <span>Pecah Teks / Catatan Menjadi Slide Otomatis</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAutoParser((prev) => !prev)}
                className="text-[11px] font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer"
              >
                {showAutoParser ? 'Sembunyikan' : 'Buka'}
              </button>
            </div>

            {showAutoParser && (
              <div className="mt-3 space-y-2.5">
                <p className="text-[11px] text-[#52607A] dark:text-slate-400 leading-relaxed">
                  Tempel catatan kuliah, ringkasan bab, atau draf makalah. Pisahkan antar bagian
                  dengan baris kosong atau awali judul slide dengan tanda <code className="font-mono">#</code>.
                </p>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`# Latar Belakang\n- Perkembangan teknologi mendorong digitalisasi kampus.\n- Mahasiswa membutuhkan ringkasan belajar yang terstruktur.\n\n# Metodologi\n- Survei dilakukan pada 100 responden mahasiswa aktif.\n- Data dianalisis menggunakan statistik deskriptif.`}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs text-[#111C33] dark:text-slate-100 leading-relaxed focus:outline-none focus:border-[#1D4ED8]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleAutoSplitText}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Buat Slide Otomatis
                  </button>
                  {parseMessage && (
                    <span className="text-[11px] font-medium text-[#1D4ED8] dark:text-[#60A5FA]">
                      {parseMessage}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Slide Content Editor */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200 tabular-nums">
                Daftar Slide Konten ({slides.length} slide + sampul
                {includeClosing ? ' + penutup' : ''})
              </p>
              <button
                type="button"
                onClick={handleAddSlide}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:border-[#1D4ED8] cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Slide</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {slides.map((slide, idx) => {
                const isSelected = activeContentIndex === idx;
                return (
                  <div
                    key={slide.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-[#1D4ED8] bg-white dark:bg-[#111B2E]'
                        : 'border-slate-200 dark:border-slate-800 bg-[#F7F9FC] dark:bg-[#0B1220]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewIdx(idx + 1)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="font-mono text-[11px] text-[#1D4ED8] dark:text-[#60A5FA] tabular-nums">
                          Slide {idx + 2}
                        </span>
                        <p className="font-display text-xs sm:text-sm font-bold text-[#111C33] dark:text-[#F1F5F9] truncate">
                          {slide.title || 'Tanpa judul'}
                        </p>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSlide(idx, -1)}
                          aria-label={`Pindah Slide ${idx + 2} ke atas`}
                          className="p-1 text-slate-400 hover:text-[#111C33] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === slides.length - 1}
                          onClick={() => handleMoveSlide(idx, 1)}
                          aria-label={`Pindah Slide ${idx + 2} ke bawah`}
                          className="p-1 text-slate-400 hover:text-[#111C33] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(idx)}
                            aria-label={`Hapus Slide ${idx + 2}`}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] text-[#52607A] dark:text-slate-400 mb-1">
                              Label Bagian
                            </label>
                            <input
                              type="text"
                              value={slide.kicker}
                              onChange={(e) => updateSlide(idx, { kicker: e.target.value })}
                              className="w-full h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] text-[#52607A] dark:text-slate-400 mb-1">
                              Judul Slide
                            </label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => updateSlide(idx, { title: e.target.value })}
                              className="w-full h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#52607A] dark:text-slate-400 mb-1">
                            Poin Isi Slide (satu baris = satu poin)
                          </label>
                          <textarea
                            rows={4}
                            value={slide.bullets.join('\n')}
                            onChange={(e) =>
                              updateSlide(idx, {
                                bullets: e.target.value.split('\n'),
                              })
                            }
                            className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs text-[#111C33] dark:text-slate-100 leading-relaxed focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#52607A] dark:text-slate-400 mb-1">
                            Catatan Presenter (muncul di Speaker Notes PowerPoint)
                          </label>
                          <input
                            type="text"
                            value={slide.notes}
                            onChange={(e) => updateSlide(idx, { notes: e.target.value })}
                            placeholder="Opsional: poin bicara atau antisipasi pertanyaan dosen..."
                            className="w-full h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs text-[#111C33] dark:text-slate-100 focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-[#4A5873] dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeClosing}
                onChange={(e) => setIncludeClosing(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#1D4ED8] focus:ring-[#1D4ED8] cursor-pointer"
              />
              <span>Sertakan slide penutup “Terima Kasih &amp; Sesi Tanya Jawab”</span>
            </label>
          </div>
        </div>

        {/* Right: Live 16:9 Slide Preview Canvas */}
        <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#111C33] dark:text-slate-200">
              Pratinjau Slide (16:9 Widescreen)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePreviewIdx <= 0}
                onClick={() => setPreviewIdx((p) => Math.max(0, p - 1))}
                aria-label="Slide sebelumnya"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-slate-200 disabled:opacity-35 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs tabular-nums text-[#52607A] dark:text-slate-400 px-1">
                {safePreviewIdx + 1} / {totalPreviewSlides}
              </span>
              <button
                type="button"
                disabled={safePreviewIdx >= totalPreviewSlides - 1}
                onClick={() => setPreviewIdx((p) => Math.min(totalPreviewSlides - 1, p + 1))}
                aria-label="Slide berikutnya"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-slate-200 disabled:opacity-35 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 16:9 Slide Frame */}
          <div
            className="w-full aspect-video rounded-xl border border-slate-300/80 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between p-6 sm:p-8 transition-colors"
            style={{
              backgroundColor:
                safePreviewIdx === 0 || isClosingPreview
                  ? `#${theme.coverBg}`
                  : `#${theme.slideBg}`,
              color:
                safePreviewIdx === 0 || isClosingPreview
                  ? `#${theme.coverText}`
                  : `#${theme.slideText}`,
            }}
          >
            {safePreviewIdx === 0 ? (
              /* Cover Preview */
              <>
                <div>
                  <div
                    className="w-12 h-1 rounded-xs mb-3"
                    style={{ backgroundColor: `#${theme.accent}` }}
                  />
                  {meta.institution && (
                    <p
                      className="text-[11px] sm:text-xs font-semibold"
                      style={{ color: `#${theme.coverMuted}` }}
                    >
                      {meta.institution}
                    </p>
                  )}
                  <h4 className="mt-2 font-display text-lg sm:text-2xl font-bold leading-snug line-clamp-3">
                    {meta.title || 'Judul Presentasi Akademik'}
                  </h4>
                  {meta.subtitle && (
                    <p
                      className="mt-2 text-xs sm:text-sm line-clamp-2"
                      style={{ color: `#${theme.coverMuted}` }}
                    >
                      {meta.subtitle}
                    </p>
                  )}
                </div>

                <div
                  className="pt-3 border-t flex items-center justify-between gap-2 text-[11px] sm:text-xs"
                  style={{ borderColor: `#${theme.border}55` }}
                >
                  <span className="font-semibold truncate">{meta.presenter || 'Nama Presenter'}</span>
                  <span className="shrink-0" style={{ color: `#${theme.coverMuted}` }}>
                    {meta.dateLabel}
                  </span>
                </div>
              </>
            ) : isClosingPreview ? (
              /* Closing Preview */
              <div className="my-auto text-center space-y-2">
                <div
                  className="w-12 h-1 rounded-xs mx-auto mb-3"
                  style={{ backgroundColor: `#${theme.accent}` }}
                />
                <h4 className="font-display text-2xl sm:text-3xl font-bold">Terima Kasih</h4>
                <p className="text-xs sm:text-sm" style={{ color: `#${theme.coverMuted}` }}>
                  Sesi Tanya Jawab &amp; Diskusi
                </p>
                <p
                  className="pt-4 text-[11px]"
                  style={{ color: `#${theme.coverMuted}` }}
                >
                  {[meta.presenter, meta.institution].filter(Boolean).join(' · ')}
                </p>
              </div>
            ) : activeSlide ? (
              /* Content Slide Preview */
              <>
                <div className="min-h-0">
                  {activeSlide.kicker && (
                    <p
                      className="text-[11px] font-bold"
                      style={{ color: `#${theme.accent}` }}
                    >
                      {activeSlide.kicker}
                    </p>
                  )}
                  <h4 className="mt-0.5 font-display text-base sm:text-xl font-bold leading-snug pb-2 border-b line-clamp-2"
                    style={{ borderColor: `#${theme.border}` }}
                  >
                    {activeSlide.title || `Slide ${safePreviewIdx + 1}`}
                  </h4>

                  <ul className="mt-3 space-y-1.5 text-[11px] sm:text-xs leading-relaxed list-disc pl-4">
                    {activeSlide.bullets
                      .filter((b) => b.trim().length > 0)
                      .slice(0, 6)
                      .map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                  </ul>
                </div>

                <div
                  className="pt-2 border-t flex items-center justify-between gap-2 text-[10px]"
                  style={{
                    borderColor: `#${theme.border}`,
                    color: `#${theme.slideMuted}`,
                  }}
                >
                  <span className="truncate">{meta.title}</span>
                  <span className="font-mono font-semibold tabular-nums shrink-0">
                    {safePreviewIdx + 1} / {totalPreviewSlides}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          {/* Quick Slide Filmstrip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: totalPreviewSlides }).map((_, idx) => {
              const label =
                idx === 0
                  ? 'Sampul'
                  : includeClosing && idx === totalPreviewSlides - 1
                    ? 'Penutup'
                    : `S${idx + 1}`;
              const active = safePreviewIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewIdx(idx)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Presenter Notes Box */}
          {activeSlide?.notes.trim() && (
            <div className="p-3 rounded-xl bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/80 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-[#52607A] dark:text-slate-400">
                Catatan Presenter (ikut masuk ke Speaker Notes .pptx)
              </p>
              <p className="mt-1 text-xs text-[#111C33] dark:text-slate-200 leading-relaxed">
                {activeSlide.notes}
              </p>
            </div>
          )}

          {exportedFile && (
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Berhasil mengunduh <span className="font-mono">{exportedFile}</span> — siap dibuka di
              PowerPoint, Google Slides, atau Canva.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
