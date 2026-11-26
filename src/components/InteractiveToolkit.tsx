import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Check,
  Copy,
  FileText,
  FlaskConical,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  Presentation,
  RotateCcw,
  Save,
  Timer,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ToolId } from '../data/guides';
import { WorkHistoryCategory } from '../firebase';
import { PptGeneratorTool } from './PptGeneratorTool';

interface InteractiveToolkitProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  pomodoroSessionsToday: number;
  onCompletePomodoro: (taskLabel: string) => void;
  onSaveHistory: (category: WorkHistoryCategory, title: string, detail: string) => void;
  isSignedIn: boolean;
}

const TOOLS: { id: ToolId; label: string; shortDesc: string; icon: typeof Calculator }[] = [
  {
    id: 'slovin',
    label: 'Kalkulator Slovin',
    shortDesc: 'Hitung ukuran sampel & cadangan responden',
    icon: Calculator,
  },
  {
    id: 'sitasi',
    label: 'Generator Sitasi',
    shortDesc: 'Susun APA 7, Harvard, dan IEEE otomatis',
    icon: FileText,
  },
  {
    id: 'statistik',
    label: 'Pemilih Uji Statistik',
    shortDesc: 'Tentukan uji hipotesis & jalur menu SPSS',
    icon: FlaskConical,
  },
  {
    id: 'pesan-dosen',
    label: 'Pesan Dosen',
    shortDesc: 'Template WhatsApp & email bimbingan sopan',
    icon: MessageSquareText,
  },
  {
    id: 'pomodoro',
    label: 'Timer Pomodoro',
    shortDesc: 'Sesi fokus belajar dengan catatan gangguan',
    icon: Timer,
  },
  {
    id: 'ppt',
    label: 'Pembuat PPT',
    shortDesc: 'Susun & ekspor slide PowerPoint (.pptx)',
    icon: Presentation,
  },
];

/* -------------------------------------------------------------------------- */
/* 1. KALKULATOR SLOVIN                                                       */
/* -------------------------------------------------------------------------- */
function SlovinCalculator({
  onSaveHistory,
  isSignedIn,
}: {
  onSaveHistory: (category: WorkHistoryCategory, title: string, detail: string) => void;
  isSignedIn: boolean;
}) {
  const [population, setPopulation] = useState<number>(1200);
  const [marginPct, setMarginPct] = useState<number>(5);
  const [bufferPct, setBufferPct] = useState<number>(10);
  const [regVars, setRegVars] = useState<number>(3);
  const [savedFlag, setSavedFlag] = useState(false);

  const e = marginPct / 100;
  const safePop = Number.isFinite(population) && population > 0 ? population : 0;
  const rawN = safePop > 0 ? safePop / (1 + safePop * e * e) : 0;
  const minSample = Math.ceil(rawN);
  const withBuffer = Math.ceil(minSample * (1 + bufferPct / 100));
  const regMin = regVars * 15;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-5">
        <div>
          <h3 className="font-display text-xl font-bold text-[#111C33] dark:text-[#F1F5F9]">
            Kalkulator Ukuran Sampel Slovin
          </h3>
          <p className="mt-1 text-sm text-[#4A5873] dark:text-slate-300">
            Masukkan jumlah populasi penelitian (<span className="font-mono">N</span>) dan batas
            toleransi kesalahan (<span className="font-mono">e</span>) untuk memperoleh jumlah
            responden minimal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="slovin-pop"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1.5"
            >
              Jumlah Populasi (N)
            </label>
            <input
              id="slovin-pop"
              type="number"
              min={1}
              max={10000000}
              value={population || ''}
              onChange={(ev) => setPopulation(Math.max(0, Number(ev.target.value)))}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] font-mono tabular-nums text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>

          <div>
            <label
              htmlFor="slovin-buffer"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1.5"
            >
              Cadangan Drop-out: <span className="font-mono tabular-nums">{bufferPct}%</span>
            </label>
            <input
              id="slovin-buffer"
              type="range"
              min={0}
              max={25}
              step={5}
              value={bufferPct}
              onChange={(ev) => setBufferPct(Number(ev.target.value))}
              className="w-full accent-[#1D4ED8] mt-2.5 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums mt-1">
              <span>0%</span>
              <span>10% (disarankan)</span>
              <span>25%</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="slovin-margin"
              className="text-xs font-semibold text-[#111C33] dark:text-slate-200"
            >
              Margin of Error (e):{' '}
              <span className="font-mono tabular-nums text-[#1D4ED8] dark:text-[#60A5FA]">
                {marginPct}% ({e.toFixed(2)})
              </span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 5, 10].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMarginPct(preset)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    marginPct === preset
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-[#4A5873] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
          <input
            id="slovin-margin"
            type="range"
            min={1}
            max={15}
            step={1}
            value={marginPct}
            onChange={(ev) => setMarginPct(Number(ev.target.value))}
            className="w-full accent-[#1D4ED8] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums mt-1">
            <span>1% (ketat)</span>
            <span>5% (umum)</span>
            <span>10% (eksploratif)</span>
            <span>15%</span>
          </div>
        </div>

        {/* Regression Rule of Thumb Helper */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="reg-vars"
              className="text-xs font-semibold text-[#111C33] dark:text-slate-200"
            >
              Cek cepat untuk regresi linier — Jumlah variabel bebas:{' '}
              <span className="font-mono tabular-nums">{regVars}</span>
            </label>
            <input
              id="reg-vars"
              type="range"
              min={1}
              max={10}
              value={regVars}
              onChange={(ev) => setRegVars(Number(ev.target.value))}
              className="w-36 accent-[#1D4ED8] cursor-pointer"
            />
          </div>
          <p className="mt-1.5 text-xs text-[#52607A] dark:text-slate-400">
            Aturan praktis (15 responden/variabel): minimal{' '}
            <strong className="font-mono tabular-nums text-[#111C33] dark:text-white">
              {regMin} responden
            </strong>{' '}
            untuk {regVars} variabel bebas.
          </p>
        </div>
      </div>

      {/* Output Deck */}
      <div className="lg:col-span-5 bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#111B2E] border border-slate-200/80 dark:border-slate-800 rounded-lg p-4">
            <p className="text-xs text-[#52607A] dark:text-slate-400">Sampel minimal (n)</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-[#1D4ED8] dark:text-[#60A5FA]">
              {minSample.toLocaleString('id-ID')}
            </p>
            <p className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-400">
              tepat: {rawN.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111B2E] border border-slate-200/80 dark:border-slate-800 rounded-lg p-4">
            <p className="text-xs text-[#52607A] dark:text-slate-400">
              Target +{bufferPct}% cadangan
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-[#111C33] dark:text-white">
              {withBuffer.toLocaleString('id-ID')}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">antisipasi data kosong</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111B2E] border border-slate-200/80 dark:border-slate-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-2">
            Rincian perhitungan untuk Bab 3
          </p>
          <div className="font-mono text-xs text-[#4A5873] dark:text-slate-300 space-y-1 tabular-nums">
            <p>n = N / (1 + N · e²)</p>
            <p>
              n = {safePop.toLocaleString('id-ID')} / (1 + {safePop.toLocaleString('id-ID')} ·{' '}
              {e.toFixed(2)}²)
            </p>
            <p>
              n = {safePop.toLocaleString('id-ID')} / {(1 + safePop * e * e).toFixed(4)} ={' '}
              <strong className="text-[#111C33] dark:text-white">{rawN.toFixed(2)}</strong> ≈{' '}
              <strong className="text-[#1D4ED8] dark:text-[#60A5FA]">{minSample}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onSaveHistory(
              'slovin',
              `Sampel Slovin: n = ${minSample} (N = ${safePop.toLocaleString('id-ID')}, e = ${marginPct}%)`,
              `Populasi (N): ${safePop.toLocaleString('id-ID')}\nMargin of error (e): ${marginPct}%\nSampel minimal (n): ${minSample} (tepat: ${rawN.toFixed(2)})\nTarget dengan +${bufferPct}% cadangan: ${withBuffer} responden`
            );
            setSavedFlag(true);
            setTimeout(() => setSavedFlag(false), 2000);
          }}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {savedFlag ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>
            {savedFlag
              ? isSignedIn
                ? 'Tersimpan di Riwayat Akun Google'
                : 'Tersimpan di Riwayat Lokal'
              : 'Simpan Hasil ke Riwayat Kerja'}
          </span>
        </button>

        <p className="text-xs text-[#52607A] dark:text-slate-400 leading-relaxed">
          Untuk penelitian eksperimen atau uji daya statistik (power analysis) yang lebih presisi,
          konfirmasikan hasil ini dengan G*Power atau pedoman dosen pembimbing.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. GENERATOR SITASI OTOMATIS                                               */
/* -------------------------------------------------------------------------- */
type CitationStyle = 'apa' | 'harvard' | 'ieee';
type SourceKind = 'jurnal' | 'buku' | 'website';

function formatAuthorAPA(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Penulis';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(' ');
  return `${last}, ${initials}`;
}

function formatAuthorIEEE(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Penulis';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(' ');
  return `${initials} ${last}`;
}

function getSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'Penulis';
}

function CitationGenerator({
  onSaveHistory,
  isSignedIn,
}: {
  onSaveHistory: (category: WorkHistoryCategory, title: string, detail: string) => void;
  isSignedIn: boolean;
}) {
  const [style, setStyle] = useState<CitationStyle>('apa');
  const [kind, setKind] = useState<SourceKind>('jurnal');
  const [author, setAuthor] = useState('Budi Santoso');
  const [year, setYear] = useState('2024');
  const [title, setTitle] = useState(
    'Pengaruh Pembelajaran Berbasis Masalah terhadap Kemampuan Analisis Mahasiswa'
  );
  const [container, setContainer] = useState('Jurnal Pendidikan Tinggi Indonesia');
  const [volume, setVolume] = useState('12(2)');
  const [pagesOrUrl, setPagesOrUrl] = useState('114–128');
  const [copied, setCopied] = useState<'intext' | 'bib' | 'all' | null>(null);
  const [savedList, setSavedList] = useState<string[]>([]);
  const [savedToHistory, setSavedToHistory] = useState(false);

  const { inText, bibliography } = useMemo(() => {
    const surname = getSurname(author);
    const yr = year.trim() || 't.t.';
    const ttl = title.trim() || 'Judul karya tulis';
    const cont = container.trim() || (kind === 'buku' ? 'Nama Penerbit' : 'Nama Jurnal');
    const vol = volume.trim();
    const tail = pagesOrUrl.trim();

    if (style === 'apa') {
      const a = formatAuthorAPA(author);
      let bib = '';
      if (kind === 'jurnal') {
        bib = `${a} (${yr}). ${ttl}. ${cont}${vol ? `, ${vol}` : ''}${tail ? `, ${tail}` : ''}.`;
      } else if (kind === 'buku') {
        bib = `${a} (${yr}). ${ttl}. ${cont}.`;
      } else {
        bib = `${a} (${yr}). ${ttl}. ${cont}.${tail ? ` ${tail}` : ''}`;
      }
      return { inText: `(${surname}, ${yr})`, bibliography: bib };
    }

    if (style === 'harvard') {
      const a = formatAuthorAPA(author);
      let bib = '';
      if (kind === 'jurnal') {
        bib = `${a} (${yr}) '${ttl}', ${cont}${vol ? `, ${vol}` : ''}${tail ? `, hlm. ${tail}` : ''}.`;
      } else if (kind === 'buku') {
        bib = `${a} (${yr}) ${ttl}. ${cont}.`;
      } else {
        bib = `${a} (${yr}) ${ttl}. Tersedia di: ${tail || cont}.`;
      }
      return { inText: `(${surname}, ${yr})`, bibliography: bib };
    }

    // IEEE
    const a = formatAuthorIEEE(author);
    let bib = '';
    if (kind === 'jurnal') {
      bib = `[1] ${a}, "${ttl}," ${cont}${vol ? `, vol. ${vol}` : ''}${tail ? `, hlm. ${tail}` : ''}, ${yr}.`;
    } else if (kind === 'buku') {
      bib = `[1] ${a}, ${ttl}. ${cont}, ${yr}.`;
    } else {
      bib = `[1] ${a}, "${ttl}," ${cont}, ${yr}.${tail ? ` [Daring]. Tersedia: ${tail}` : ''}`;
    }
    return { inText: '[1]', bibliography: bib };
  }, [author, container, kind, pagesOrUrl, style, title, volume, year]);

  const copyText = async (text: string, which: 'intext' | 'bib' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // ignore
    }
  };

  const loadSample = (targetKind: SourceKind) => {
    setKind(targetKind);
    if (targetKind === 'jurnal') {
      setAuthor('Rina Wulandari');
      setYear('2025');
      setTitle('Strategi Active Recall dan Dampaknya pada Retensi Materi Kuliah');
      setContainer('Jurnal Psikologi Pendidikan Nusantara');
      setVolume('9(1)');
      setPagesOrUrl('45–58');
    } else if (targetKind === 'buku') {
      setAuthor('Sugiyono');
      setYear('2022');
      setTitle('Metode Penelitian Kuantitatif, Kualitatif, dan R&D');
      setContainer('Alfabeta');
      setVolume('');
      setPagesOrUrl('');
    } else {
      setAuthor('Kementerian Pendidikan Tinggi');
      setYear('2025');
      setTitle('Panduan Penulisan Artikel Ilmiah dan Etika Publikasi');
      setContainer('Portal Sinta Kemdiktisaintek');
      setVolume('');
      setPagesOrUrl('https://sinta.kemdiktisaintek.go.id');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-xl font-bold text-[#111C33] dark:text-[#F1F5F9]">
              Generator Sitasi APA 7, Harvard &amp; IEEE
            </h3>
            <p className="mt-1 text-sm text-[#4A5873] dark:text-slate-300">
              Susun format kutipan dalam teks dan daftar pustaka siap tempel.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(['apa', 'harvard', 'ieee'] as CitationStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStyle(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer uppercase ${
                  style === st
                    ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                    : 'text-[#52607A] dark:text-slate-400'
                }`}
              >
                {st === 'apa' ? 'APA 7' : st === 'harvard' ? 'Harvard' : 'IEEE'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#52607A] dark:text-slate-400">Jenis sumber:</span>
          {(['jurnal', 'buku', 'website'] as SourceKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => loadSample(k)}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer capitalize ${
                kind === k
                  ? 'border-[#1D4ED8] bg-[#1D4ED8]/10 text-[#1D4ED8] dark:text-[#60A5FA]'
                  : 'border-slate-200 dark:border-slate-700 text-[#4A5873] dark:text-slate-300'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="cit-author"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              Nama Lengkap Penulis
            </label>
            <input
              id="cit-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
          <div>
            <label
              htmlFor="cit-year"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              Tahun Terbit
            </label>
            <input
              id="cit-year"
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] font-mono text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="cit-title"
            className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
          >
            Judul Artikel / Buku / Halaman
          </label>
          <input
            id="cit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label
              htmlFor="cit-container"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              {kind === 'buku' ? 'Penerbit' : kind === 'jurnal' ? 'Nama Jurnal' : 'Nama Situs'}
            </label>
            <input
              id="cit-container"
              type="text"
              value={container}
              onChange={(e) => setContainer(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
          {kind === 'jurnal' && (
            <div>
              <label
                htmlFor="cit-vol"
                className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
              >
                Vol(No)
              </label>
              <input
                id="cit-vol"
                type="text"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="12(2)"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          )}
          <div className={kind === 'jurnal' ? '' : 'sm:col-span-2'}>
            <label
              htmlFor="cit-pages"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              {kind === 'website' ? 'URL / DOI' : 'Halaman / DOI (opsional)'}
            </label>
            <input
              id="cit-pages"
              type="text"
              value={pagesOrUrl}
              onChange={(e) => setPagesOrUrl(e.target.value)}
              placeholder={kind === 'website' ? 'https://...' : '114–128'}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
        </div>
      </div>

      {/* Output Deck */}
      <div className="lg:col-span-5 bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="bg-white dark:bg-[#111B2E] border border-slate-200/80 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-[#52607A] dark:text-slate-400">
              Kutipan dalam teks
            </span>
            <button
              type="button"
              onClick={() => copyText(inText, 'intext')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer"
            >
              {copied === 'intext' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'intext' ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <p className="font-mono text-sm text-[#111C33] dark:text-white">{inText}</p>
        </div>

        <div className="bg-white dark:bg-[#111B2E] border border-slate-200/80 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-[#52607A] dark:text-slate-400">
              Daftar pustaka ({style.toUpperCase()})
            </span>
            <button
              type="button"
              onClick={() => copyText(bibliography, 'bib')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer"
            >
              {copied === 'bib' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'bib' ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <p className="text-sm leading-relaxed text-[#111C33] dark:text-slate-100 select-all">
            {bibliography}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (!savedList.includes(bibliography)) {
                setSavedList((prev) => [...prev, bibliography]);
              }
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] hover:border-[#1D4ED8] text-[#111C33] dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah ke Daftar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSaveHistory(
                'sitasi',
                `Sitasi ${style.toUpperCase()}: ${author.trim() || 'Penulis'} (${year.trim() || 't.t.'})`,
                `Dalam teks: ${inText}\nDaftar pustaka: ${bibliography}`
              );
              setSavedToHistory(true);
              setTimeout(() => setSavedToHistory(false), 2000);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {savedToHistory ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>
              {savedToHistory
                ? isSignedIn
                  ? 'Masuk Riwayat Cloud'
                  : 'Tersimpan Lokal'
                : 'Simpan ke Riwayat'}
            </span>
          </button>
        </div>

        {savedList.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111C33] dark:text-slate-200 tabular-nums">
                Daftar terkumpul ({savedList.length})
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => copyText(savedList.join('\n\n'), 'all')}
                  className="font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline cursor-pointer"
                >
                  {copied === 'all' ? 'Semua Tersalin' : 'Salin Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setSavedList([])}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  aria-label="Hapus daftar sementara"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <ul className="space-y-1.5 max-h-36 overflow-y-auto text-xs text-[#4A5873] dark:text-slate-300">
              {savedList.map((entry, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded-lg bg-white dark:bg-[#111B2E] border border-slate-200/70 dark:border-slate-800"
                >
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. PEMILIH UJI STATISTIK INTERAKTIF                                        */
/* -------------------------------------------------------------------------- */
type StatGoal = 'beda' | 'hubungan' | 'pengaruh';
type StatData = 'numerik' | 'kategorik';
type StatGroup = '2-indep' | '2-pasang' | '3-lebih';
type StatDist = 'normal' | 'tidak-normal';

interface StatRecommendation {
  name: string;
  alternative: string;
  spssPath: string;
  prerequisites: string[];
  interpretation: string;
}

function getStatRecommendation(
  goal: StatGoal,
  dataType: StatData,
  group: StatGroup,
  dist: StatDist
): StatRecommendation {
  if (dataType === 'kategorik') {
    if (goal === 'pengaruh') {
      return {
        name: 'Regresi Logistik (Binary / Multinomial)',
        alternative: 'Uji Chi-Square untuk cek asosiasi awal',
        spssPath: 'Analyze → Regression → Binary Logistic',
        prerequisites: [
          'Variabel dependen berupa kategori (misal: Lulus / Tidak Lulus).',
          'Tidak mensyaratkan distribusi normal pada variabel prediktor.',
        ],
        interpretation:
          'Lihat nilai Sig. pada tabel Variables in the Equation (< 0,05 berarti berpengaruh signifikan) serta nilai Exp(B) / Odds Ratio.',
      };
    }
    return {
      name: 'Uji Chi-Square (χ²)',
      alternative: 'Fisher’s Exact Test bila sel dengan nilai harapan < 5 lebih dari 20%',
      spssPath: 'Analyze → Descriptive Statistics → Crosstabs → Statistics: Chi-square',
      prerequisites: [
        'Kedua variabel berskala nominal atau ordinal (kategorik).',
        'Observasi antarresponden bersifat saling bebas.',
      ],
      interpretation:
        'Bila Asymp. Sig. (2-sided) < 0,05 maka terdapat hubungan/perbedaan proporsi yang signifikan antar kategori.',
    };
  }

  if (goal === 'hubungan') {
    if (dist === 'normal') {
      return {
        name: 'Korelasi Pearson (Product Moment)',
        alternative: 'Korelasi Spearman jika data tidak normal atau ordinal',
        spssPath: 'Analyze → Correlate → Bivariate → centang Pearson',
        prerequisites: [
          'Kedua variabel berskala interval/rasio (numerik).',
          'Distribusi data normal (cek Shapiro-Wilk atau Kolmogorov-Smirnov).',
          'Hubungan antarvariabel bersifat linier.',
        ],
        interpretation:
          'Nilai r mendekati +1 atau -1 menandakan korelasi kuat; Sig. (2-tailed) < 0,05 berarti korelasi signifikan.',
      };
    }
    return {
      name: 'Korelasi Rank Spearman (rho)',
      alternative: 'Kendall’s Tau-b untuk sampel kecil atau banyak peringkat kembar',
      spssPath: 'Analyze → Correlate → Bivariate → centang Spearman',
      prerequisites: [
        'Cocok untuk data numerik tidak normal atau skala Likert/ordinal.',
        'Hubungan bersifat monotonik.',
      ],
      interpretation:
        'Koefisien rho menunjukkan arah dan kekuatan hubungan; Sig. (2-tailed) < 0,05 menandakan hubungan signifikan.',
    };
  }

  if (goal === 'pengaruh') {
    return {
      name: 'Regresi Linier Sederhana / Berganda',
      alternative: 'Transformasi data atau metode non-parametrik jika asumsi klasik gagal berat',
      spssPath: 'Analyze → Regression → Linear',
      prerequisites: [
        'Uji asumsi klasik: normalitas residual, multikolinearitas (VIF < 10), dan heteroskedastisitas.',
        'Minimal 10–15 responden untuk setiap variabel independen.',
      ],
      interpretation:
        'Periksa Adjusted R² untuk persentase kontribusi, uji F untuk pengaruh simultan, dan uji t (Sig. < 0,05) untuk pengaruh parsial.',
    };
  }

  // goal === 'beda' & dataType === 'numerik'
  if (group === '2-indep') {
    return dist === 'normal'
      ? {
          name: 'Independent Samples t-Test',
          alternative: 'Mann-Whitney U Test bila data tidak normal',
          spssPath: 'Analyze → Compare Means → Independent-Samples T Test',
          prerequisites: [
            'Dua kelompok berbeda dan tidak saling berhubungan (misal: Kelas A vs Kelas B).',
            'Data berdistribusi normal dan homogen (Levene’s Test > 0,05).',
          ],
          interpretation:
            'Sig. (2-tailed) < 0,05 menunjukkan terdapat perbedaan rata-rata yang signifikan antara kedua kelompok.',
        }
      : {
          name: 'Uji Mann-Whitney U',
          alternative: 'Independent t-Test bila distribusi normal',
          spssPath: 'Analyze → Nonparametric Tests → Legacy Dialogs → 2 Independent Samples',
          prerequisites: [
            'Dua kelompok saling bebas (independen).',
            'Tidak memerlukan asumsi normalitas data.',
          ],
          interpretation:
            'Jika Asymp. Sig. (2-tailed) < 0,05 maka terdapat perbedaan distribusi/median yang signifikan.',
        };
  }

  if (group === '2-pasang') {
    return dist === 'normal'
      ? {
          name: 'Paired Samples t-Test',
          alternative: 'Wilcoxon Signed-Rank Test bila selisih data tidak normal',
          spssPath: 'Analyze → Compare Means → Paired-Samples T Test',
          prerequisites: [
            'Subjek yang sama diukur dua kali (misal: Pre-test vs Post-test).',
            'Selisih skor berdistribusi normal.',
          ],
          interpretation:
            'Sig. (2-tailed) < 0,05 menunjukkan ada perubahan rata-rata yang bermakna antara sebelum dan sesudah perlakuan.',
        }
      : {
          name: 'Uji Wilcoxon Signed-Rank',
          alternative: 'Paired t-Test bila selisih skor normal',
          spssPath: 'Analyze → Nonparametric Tests → Legacy Dialogs → 2 Related Samples',
          prerequisites: [
            'Dua pengukuran berpasangan pada responden yang sama.',
            'Cocok untuk skala ordinal atau data numerik miring (skewed).',
          ],
          interpretation:
            'Asymp. Sig. (2-tailed) < 0,05 menandakan perbedaan signifikan antara kondisi sebelum dan sesudah.',
        };
  }

  return dist === 'normal'
    ? {
        name: 'One-Way ANOVA',
        alternative: 'Uji Kruskal-Wallis bila data tidak normal',
        spssPath: 'Analyze → Compare Means → One-Way ANOVA (tambahkan Post Hoc Tukey)',
        prerequisites: [
          'Membandingkan 3 kelompok atau lebih.',
          'Normalitas di tiap kelompok dan homogenitas varians.',
        ],
        interpretation:
          'Bila Sig. ANOVA < 0,05, lanjutkan melihat tabel Post Hoc (Tukey/Bonferroni) untuk tahu pasangan kelompok mana yang berbeda.',
      }
    : {
        name: 'Uji Kruskal-Wallis',
        alternative: 'One-Way ANOVA bila data memenuhi normalitas & homogenitas',
        spssPath: 'Analyze → Nonparametric Tests → Legacy Dialogs → K Independent Samples',
        prerequisites: [
          'Tiga atau lebih kelompok independen.',
          'Alternatif non-parametrik tanpa syarat distribusi normal.',
        ],
        interpretation:
          'Jika Asymp. Sig. < 0,05 maka minimal ada satu kelompok yang berbeda signifikan; lanjutkan uji perbandingan berpasangan.',
      };
}

function StatTestWizard({
  onSaveHistory,
  isSignedIn,
}: {
  onSaveHistory: (category: WorkHistoryCategory, title: string, detail: string) => void;
  isSignedIn: boolean;
}) {
  const [goal, setGoal] = useState<StatGoal>('beda');
  const [dataType, setDataType] = useState<StatData>('numerik');
  const [group, setGroup] = useState<StatGroup>('2-indep');
  const [dist, setDist] = useState<StatDist>('normal');
  const [savedFlag, setSavedFlag] = useState(false);

  const result = useMemo(
    () => getStatRecommendation(goal, dataType, group, dist),
    [goal, dataType, group, dist]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-6 space-y-5">
        <div>
          <h3 className="font-display text-xl font-bold text-[#111C33] dark:text-[#F1F5F9]">
            Pemilih Uji Statistik Interaktif
          </h3>
          <p className="mt-1 text-sm text-[#4A5873] dark:text-slate-300">
            Jawab pertanyaan singkat tentang desain risetmu untuk melihat uji statistik dan menu
            SPSS yang sesuai.
          </p>
        </div>

        {/* Step 1 */}
        <div>
          <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-2">
            01. Apa tujuan utama analisismu?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'beda', label: 'Beda Kelompok' },
              { id: 'hubungan', label: 'Hubungan / Korelasi' },
              { id: 'pengaruh', label: 'Pengaruh / Prediksi' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGoal(opt.id as StatGoal)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-center transition-colors cursor-pointer ${
                  goal === opt.id
                    ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 */}
        <div>
          <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-2">
            02. Apa jenis data variabel utamamu?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'numerik', label: 'Numerik / Skor (Interval, Rasio, Likert Total)' },
              { id: 'kategorik', label: 'Kategorik (Ya/Tidak, Jurusan, Nominal)' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDataType(opt.id as StatData)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-colors cursor-pointer ${
                  dataType === opt.id
                    ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 (conditional) */}
        {dataType === 'numerik' && goal === 'beda' && (
          <div>
            <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-2">
              03. Struktur kelompok yang dibandingkan?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: '2-indep', label: '2 Kelompok Berbeda' },
                { id: '2-pasang', label: 'Pre-test vs Post-test' },
                { id: '3-lebih', label: '3 Kelompok atau Lebih' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGroup(opt.id as StatGroup)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    group === opt.id
                      ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {dataType === 'numerik' && goal !== 'pengaruh' && (
          <div>
            <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-2">
              {goal === 'beda' ? '04.' : '03.'} Apakah data berdistribusi normal?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'normal', label: 'Normal (Sig. > 0,05)' },
                { id: 'tidak-normal', label: 'Tidak Normal / Ordinal' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDist(opt.id as StatDist)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    dist === opt.id
                      ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-[#111C33] dark:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendation Output */}
      <div className="lg:col-span-6 bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
            Rekomendasi Uji Statistik
          </p>
          <h4 className="mt-1 font-display text-2xl font-bold text-[#1D4ED8] dark:text-[#60A5FA]">
            {result.name}
          </h4>
          <p className="mt-1 text-xs text-[#52607A] dark:text-slate-400">
            Alternatif: {result.alternative}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111B2E] border border-slate-200/80 dark:border-slate-800 rounded-lg p-3.5">
          <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200">
            Jalur menu di SPSS
          </p>
          <p className="mt-1 font-mono text-xs text-[#1D4ED8] dark:text-[#60A5FA] break-words">
            {result.spssPath}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200">
            Syarat yang perlu dicek
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm text-[#4A5873] dark:text-slate-300 list-disc pl-4">
            {result.prerequisites.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200">
              Cara membaca hasil
            </p>
            <p className="mt-1 text-xs sm:text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed">
              {result.interpretation}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSaveHistory(
                'statistik',
                `Rekomendasi Uji: ${result.name}`,
                `Jalur SPSS: ${result.spssPath}\nAlternatif: ${result.alternative}\nInterpretasi: ${result.interpretation}`
              );
              setSavedFlag(true);
              setTimeout(() => setSavedFlag(false), 2000);
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {savedFlag ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>
              {savedFlag
                ? isSignedIn
                  ? 'Tersimpan di Riwayat Akun Google'
                  : 'Tersimpan di Riwayat Lokal'
                : 'Simpan Rekomendasi Uji ke Riwayat'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. GENERATOR PESAN BIMBINGAN DOSEN                                         */
/* -------------------------------------------------------------------------- */
type MessageScenario = 'kirim-draf' | 'minta-jadwal' | 'followup-revisi' | 'izin-kuliah';

function LecturerMessageBuilder({
  onSaveHistory,
  isSignedIn,
}: {
  onSaveHistory: (category: WorkHistoryCategory, title: string, detail: string) => void;
  isSignedIn: boolean;
}) {
  const [scenario, setScenario] = useState<MessageScenario>('kirim-draf');
  const [greeting, setGreeting] = useState('Selamat pagi');
  const [lecturer, setLecturer] = useState('Bapak/Ibu Dr. Hendra Wijaya');
  const [studentName, setStudentName] = useState('Alya Pratama');
  const [nim, setNim] = useState('2204110045');
  const [prodi, setProdi] = useState('Sistem Informasi');
  const [topic, setTopic] = useState('Revisi Bab 1 & Bab 2 Skripsi');
  const [timeSlot, setTimeSlot] = useState('Kamis, 10.00 WIB');
  const [copied, setCopied] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);

  const generatedMessage = useMemo(() => {
    const nama = studentName.trim() || '[Nama Lengkap]';
    const id = nim.trim() || '[NIM]';
    const jur = prodi.trim() || '[Program Studi]';
    const dosen = lecturer.trim() || 'Bapak/Ibu';
    const top = topic.trim() || '[Topik / Bab]';
    const waktu = timeSlot.trim() || '[Hari, Jam]';

    if (scenario === 'kirim-draf') {
      return `${greeting}, ${dosen}. Mohon maaf mengganggu waktu Bapak/Ibu.\n\nPerkenalkan saya ${nama} (NIM ${id}, Prodi ${jur}), mahasiswa bimbingan Bapak/Ibu. Melalui pesan ini saya bermaksud mengirimkan draf ${top} untuk mohon arahan dan masukan Bapak/Ibu.\n\nApabila Bapak/Ibu berkenan, kapan kiranya saya dapat melakukan bimbingan (usulan saya sekitar ${waktu})? Terima kasih banyak atas waktu dan bimbingan Bapak/Ibu.`;
    }
    if (scenario === 'minta-jadwal') {
      return `${greeting}, ${dosen}. Mohon maaf mengganggu waktu Bapak/Ibu.\n\nSaya ${nama} (NIM ${id}, Prodi ${jur}), mahasiswa bimbingan Bapak/Ibu. Saat ini saya telah menyelesaikan progres ${top} dan ingin berkonsultasi mengenai langkah selanjutnya.\n\nApakah Bapak/Ibu memiliki waktu luang sekitar ${waktu} untuk sesi bimbingan singkat? Saya siap menyesuaikan dengan jadwal Bapak/Ibu. Terima kasih banyak.`;
    }
    if (scenario === 'followup-revisi') {
      return `${greeting}, ${dosen}. Mohon maaf mengganggu kembali waktu Bapak/Ibu.\n\nSaya ${nama} (NIM ${id}, Prodi ${jur}). Izin menindaklanjuti draf ${top} yang sebelumnya telah saya kirimkan. Apabila ada bagian yang masih perlu saya perbaiki atau lengkapi lebih dulu, mohon arahannya.\n\nTerima kasih atas perhatian dan bimbingan Bapak/Ibu.`;
    }
    return `${greeting}, ${dosen}. Mohon maaf mengganggu waktu Bapak/Ibu.\n\nSaya ${nama} (NIM ${id}, Prodi ${jur}), mahasiswa kelas ${top}. Melalui pesan ini saya memohon izin tidak dapat mengikuti perkuliahan pada ${waktu} karena kondisi kesehatan yang kurang memungkinkan.\n\nSaya akan mengejar materi serta tugas dari pertemuan tersebut secara mandiri. Terima kasih atas pengertian Bapak/Ibu.`;
  }, [greeting, lecturer, nim, prodi, scenario, studentName, timeSlot, topic]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-6 space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[#111C33] dark:text-[#F1F5F9]">
            Generator Pesan Bimbingan Dosen
          </h3>
          <p className="mt-1 text-sm text-[#4A5873] dark:text-slate-300">
            Susun pesan WhatsApp atau email yang sopan, ringkas, dan jelas identitasnya dalam
            hitungan detik.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'kirim-draf', label: 'Kirim Draf Bab' },
            { id: 'minta-jadwal', label: 'Minta Jadwal' },
            { id: 'followup-revisi', label: 'Follow-up Sopan' },
            { id: 'izin-kuliah', label: 'Izin Kuliah' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScenario(item.id as MessageScenario)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                scenario === item.id
                  ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                  : 'border-slate-200 dark:border-slate-700 text-[#4A5873] dark:text-slate-300 bg-[#F7F9FC] dark:bg-[#0B1220]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="msg-greet"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              Salam Pembuka
            </label>
            <select
              id="msg-greet"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white"
            >
              <option value="Selamat pagi">Selamat pagi</option>
              <option value="Selamat siang">Selamat siang</option>
              <option value="Selamat sore">Selamat sore</option>
              <option value="Assalamu'alaikum warahmatullahi wabarakatuh">
                Assalamu&apos;alaikum Wr. Wb.
              </option>
            </select>
          </div>
          <div>
            <label
              htmlFor="msg-dosen"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              Nama &amp; Gelar Dosen
            </label>
            <input
              id="msg-dosen"
              type="text"
              value={lecturer}
              onChange={(e) => setLecturer(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="msg-name"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              Nama Mahasiswa
            </label>
            <input
              id="msg-name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="msg-nim"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              NIM &amp; Program Studi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="msg-nim"
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="NIM"
                className="w-full h-10 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] font-mono text-xs text-[#111C33] dark:text-white"
              />
              <input
                type="text"
                aria-label="Program studi"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                placeholder="Prodi"
                className="w-full h-10 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-xs text-[#111C33] dark:text-white"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="msg-topic"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              {scenario === 'izin-kuliah' ? 'Nama Mata Kuliah' : 'Topik / Bab yang Dibahas'}
            </label>
            <input
              id="msg-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="msg-time"
              className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1"
            >
              {scenario === 'izin-kuliah' ? 'Hari & Tanggal Kuliah' : 'Usulan Waktu Bimbingan'}
            </label>
            <input
              id="msg-time"
              type="text"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Preview Deck */}
      <div className="lg:col-span-6 bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#52607A] dark:text-slate-400">
            Pratinjau Pesan Siap Kirim
          </span>
          <span className="text-xs text-[#52607A] dark:text-slate-400">
            Kirim di jam kerja (08.00–16.00)
          </span>
        </div>

        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#111C33] dark:text-slate-100 bg-white dark:bg-[#111B2E] border border-slate-200/80 dark:border-slate-800 rounded-lg p-4">
          {generatedMessage}
        </pre>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Pesan Tersalin' : 'Salin Pesan'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(generatedMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs font-semibold text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] transition-colors whitespace-nowrap"
          >
            Buka di WhatsApp
          </a>

          <button
            type="button"
            onClick={() => {
              onSaveHistory(
                'pesan-dosen',
                `Draf Pesan: ${topic.trim() || 'Bimbingan Dosen'} (${lecturer.trim() || 'Dosen'})`,
                generatedMessage
              );
              setSavedFlag(true);
              setTimeout(() => setSavedFlag(false), 2000);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs font-semibold text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
          >
            {savedFlag ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            <span>
              {savedFlag
                ? isSignedIn
                  ? 'Tersimpan di Cloud'
                  : 'Tersimpan Lokal'
                : 'Simpan ke Riwayat'}
            </span>
          </button>

          <a
            href={`mailto:?subject=${encodeURIComponent(
              `Bimbingan ${topic} - ${studentName}`
            )}&body=${encodeURIComponent(generatedMessage)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs font-semibold text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] transition-colors whitespace-nowrap"
          >
            Buka di Email
          </a>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. TIMER FOKUS POMODORO                                                    */
/* -------------------------------------------------------------------------- */
const POMODORO_PRESETS = [
  { id: '25-5', label: 'Klasik 25 / 5', focus: 25, rest: 5 },
  { id: '50-10', label: 'Fokus Dalam 50 / 10', focus: 50, rest: 10 },
  { id: '15-3', label: 'Anti-Tunda 15 / 3', focus: 15, rest: 3 },
];

function playSoftChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.1);
  } catch {
    // Audio playback blocked or unavailable
  }
}

function PomodoroTimer({
  sessionsToday,
  onCompleteSession,
}: {
  sessionsToday: number;
  onCompleteSession: (taskLabel: string) => void;
}) {
  const [presetId, setPresetId] = useState('25-5');
  const [phase, setPhase] = useState<'fokus' | 'istirahat'>('fokus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [taskLabel, setTaskLabel] = useState('Menulis latar belakang Bab 1');
  const [distractionInput, setDistractionInput] = useState('');
  const [distractions, setDistractions] = useState<string[]>([
    'Cek jadwal bimbingan di grup angkatan setelah sesi',
  ]);

  const preset = POMODORO_PRESETS.find((p) => p.id === presetId) || POMODORO_PRESETS[0];
  const totalSeconds = (phase === 'fokus' ? preset.focus : preset.rest) * 60;
  const progressPct = Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100));

  const onCompleteRef = useRef(onCompleteSession);
  onCompleteRef.current = onCompleteSession;
  const taskLabelRef = useRef(taskLabel);
  taskLabelRef.current = taskLabel;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (soundOn) playSoftChime();
          if (phase === 'fokus') {
            onCompleteRef.current(taskLabelRef.current);
            setPhase('istirahat');
            return preset.rest * 60;
          } else {
            setPhase('fokus');
            return preset.focus * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, phase, preset.focus, preset.rest, soundOn]);

  const selectPreset = (id: string) => {
    const next = POMODORO_PRESETS.find((p) => p.id === id) || POMODORO_PRESETS[0];
    setPresetId(next.id);
    setRunning(false);
    setPhase('fokus');
    setSecondsLeft(next.focus * 60);
  };

  const switchPhase = (nextPhase: 'fokus' | 'istirahat') => {
    setRunning(false);
    setPhase(nextPhase);
    setSecondsLeft((nextPhase === 'fokus' ? preset.focus : preset.rest) * 60);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft((phase === 'fokus' ? preset.focus : preset.rest) * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Timer Stage */}
      <div className="lg:col-span-7 bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => switchPhase('fokus')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                phase === 'fokus'
                  ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                  : 'text-[#52607A] dark:text-slate-400'
              }`}
            >
              Sesi Fokus ({preset.focus} mnt)
            </button>
            <button
              type="button"
              onClick={() => switchPhase('istirahat')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                phase === 'istirahat'
                  ? 'bg-white dark:bg-[#111B2E] text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-[#52607A] dark:text-slate-400'
              }`}
            >
              Istirahat ({preset.rest} mnt)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundOn((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52607A] dark:text-slate-400 hover:text-[#111C33] dark:hover:text-white cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundOn ? 'Bel aktif' : 'Senyap'}</span>
          </button>
        </div>

        <div className="text-center py-4">
          <p className="text-xs font-semibold text-[#52607A] dark:text-slate-400">
            {phase === 'fokus'
              ? `Sedang fokus: ${taskLabel || 'Target belajar'}`
              : 'Waktunya peregangan & minum air tanpa membuka media sosial'}
          </p>
          <p className="mt-2 font-mono text-6xl sm:text-7xl font-bold tracking-tight tabular-nums text-[#111C33] dark:text-white">
            {mins}:{secs}
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                phase === 'fokus' ? 'bg-[#1D4ED8]' : 'bg-emerald-600'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setRunning((prev) => !prev)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{running ? 'Jeda' : 'Mulai Timer'}</span>
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-sm font-medium text-[#111C33] dark:text-slate-200 hover:border-slate-300 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {POMODORO_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPreset(p.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  presetId === p.id
                    ? 'bg-[#111C33] dark:bg-slate-200 text-white dark:text-[#0B1220]'
                    : 'bg-white dark:bg-[#111B2E] border border-slate-200 dark:border-slate-700 text-[#4A5873] dark:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span className="font-mono tabular-nums text-[#52607A] dark:text-slate-400">
            Sesi selesai hari ini: <strong className="text-[#111C33] dark:text-white">{sessionsToday}</strong>
          </span>
        </div>
      </div>

      {/* Target & Distraction Parking Lot */}
      <div className="lg:col-span-5 space-y-4">
        <div>
          <label
            htmlFor="pomo-task"
            className="block text-xs font-semibold text-[#111C33] dark:text-slate-200 mb-1.5"
          >
            Satu target untuk sesi ini
          </label>
          <input
            id="pomo-task"
            type="text"
            value={taskLabel}
            onChange={(e) => setTaskLabel(e.target.value)}
            placeholder="Misal: Ringkas 2 jurnal untuk Bab 2"
            className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1220] text-sm text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>

        <div className="bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#111C33] dark:text-slate-200">
              Parkir Gangguan (Kerjakan Nanti)
            </p>
            <p className="mt-0.5 text-xs text-[#52607A] dark:text-slate-400">
              Terlintas sesuatu saat belajar? Catat di sini agar tidak merusak fokus, lalu urus saat
              istirahat.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = distractionInput.trim();
              if (!val) return;
              setDistractions((prev) => [val, ...prev]);
              setDistractionInput('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={distractionInput}
              onChange={(e) => setDistractionInput(e.target.value)}
              placeholder="Tulis gangguan lalu Enter..."
              aria-label="Catat gangguan sementara"
              className="flex-1 h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2E] text-xs text-[#111C33] dark:text-white focus:outline-none focus:border-[#1D4ED8]"
            />
            <button
              type="submit"
              className="px-3 h-9 rounded-lg bg-[#111C33] dark:bg-slate-200 text-white dark:text-[#0B1220] text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Catat
            </button>
          </form>

          {distractions.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Belum ada catatan gangguan.</p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {distractions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#111B2E] border border-slate-200/70 dark:border-slate-800 text-xs text-[#111C33] dark:text-slate-200"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDistractions((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label="Hapus catatan gangguan"
                    className="text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN INTERACTIVE TOOLKIT SECTION                                           */
/* -------------------------------------------------------------------------- */
export function InteractiveToolkit({
  activeTool,
  onToolChange,
  pomodoroSessionsToday,
  onCompletePomodoro,
  onSaveHistory,
  isSignedIn,
}: InteractiveToolkitProps) {
  return (
    <section
      id="alat-bantu"
      className="py-12 lg:py-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0D1627]/60"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-6">
          <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
            Alat Kerja Interaktif · Langsung Pakai &amp; Simpan ke Riwayat
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111C33] dark:text-[#F1F5F9]">
            Bukan sekadar dibaca—hitung dan susun langsung
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#4A5873] dark:text-slate-300">
            Lima alat bantu praktis yang paling sering dicari mahasiswa saat menyusun skripsi,
            mengolah data, menghubungi dosen, dan menghadapi ujian.
          </p>
        </div>

        {/* Tool Selector Bar */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6"
          role="tablist"
          aria-label="Pilih alat bantu mahasiswa"
        >
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onToolChange(tool.id)}
                className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111B2E] text-[#111C33] dark:text-[#F1F5F9] hover:border-[#1D4ED8]/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mb-2 ${
                    isActive ? 'text-white' : 'text-[#1D4ED8] dark:text-[#60A5FA]'
                  }`}
                  aria-hidden="true"
                />
                <p className="font-display text-sm font-bold leading-tight whitespace-nowrap truncate">
                  {tool.label}
                </p>
                <p
                  className={`mt-1 text-xs leading-snug line-clamp-2 ${
                    isActive ? 'text-blue-100' : 'text-[#52607A] dark:text-slate-400'
                  }`}
                >
                  {tool.shortDesc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Tool Stage */}
        <div
          role="tabpanel"
          className="bg-white dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-7"
        >
          {activeTool === 'slovin' && (
            <SlovinCalculator onSaveHistory={onSaveHistory} isSignedIn={isSignedIn} />
          )}
          {activeTool === 'sitasi' && (
            <CitationGenerator onSaveHistory={onSaveHistory} isSignedIn={isSignedIn} />
          )}
          {activeTool === 'statistik' && (
            <StatTestWizard onSaveHistory={onSaveHistory} isSignedIn={isSignedIn} />
          )}
          {activeTool === 'pesan-dosen' && (
            <LecturerMessageBuilder onSaveHistory={onSaveHistory} isSignedIn={isSignedIn} />
          )}
          {activeTool === 'pomodoro' && (
            <PomodoroTimer
              sessionsToday={pomodoroSessionsToday}
              onCompleteSession={onCompletePomodoro}
            />
          )}
          {activeTool === 'ppt' && <PptGeneratorTool />}
        </div>
      </div>
    </section>
  );
}
