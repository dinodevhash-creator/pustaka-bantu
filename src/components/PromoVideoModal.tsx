import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  Film,
  Loader2,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

interface PromoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VideoAspect = '16:9' | '9:16';

const TOTAL_DURATION_SEC = 24;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = 'left'
): number {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  ctx.textAlign = align;
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function renderPromoFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSec: number,
  isVertical: boolean
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  const t = clamp(timeSec, 0, TOTAL_DURATION_SEC);
  const padX = isVertical ? 56 : 92;
  const contentW = w - padX * 2;

  // Determine scene & local progress
  let scene = 1;
  let localT = t;
  let sceneDur = 4.5;
  if (t < 4.5) {
    scene = 1;
    localT = t;
    sceneDur = 4.5;
  } else if (t < 9.5) {
    scene = 2;
    localT = t - 4.5;
    sceneDur = 5.0;
  } else if (t < 14.5) {
    scene = 3;
    localT = t - 9.5;
    sceneDur = 5.0;
  } else if (t < 19.5) {
    scene = 4;
    localT = t - 14.5;
    sceneDur = 5.0;
  } else {
    scene = 5;
    localT = t - 19.5;
    sceneDur = 4.5;
  }

  const fadeIn = easeOutCubic(localT / 0.55);
  const fadeOut = scene === 5 ? 1 : easeOutCubic((sceneDur - localT) / 0.4);
  const sceneAlpha = clamp(Math.min(fadeIn, fadeOut), 0, 1);

  const isDarkScene = scene === 1 || scene === 3 || scene === 5;
  const bg = isDarkScene ? '#0B1220' : '#F7F9FC';
  const fg = isDarkScene ? '#F8FAFC' : '#111C33';
  const muted = isDarkScene ? '#94A3B8' : '#52607A';
  const accent = isDarkScene ? '#60A5FA' : '#1D4ED8';
  const cardBg = isDarkScene ? '#111B2E' : '#FFFFFF';
  const borderCol = isDarkScene ? '#1E293B' : '#E2E8F0';

  // Background fill
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle ruled editorial lines
  ctx.strokeStyle = isDarkScene ? 'rgba(148,163,184,0.06)' : 'rgba(17,28,51,0.045)';
  ctx.lineWidth = 1;
  const gridStep = isVertical ? 44 : 38;
  for (let gy = gridStep; gy < h; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  // Subtle atmospheric radial accent
  const grad = ctx.createRadialGradient(
    w * 0.82,
    h * 0.18,
    20,
    w * 0.82,
    h * 0.18,
    Math.max(w, h) * 0.65
  );
  grad.addColorStop(0, isDarkScene ? 'rgba(29, 78, 216, 0.28)' : 'rgba(29, 78, 216, 0.10)');
  grad.addColorStop(1, 'rgba(29, 78, 216, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = sceneAlpha;

  // Persistent quiet top brand bar inside frame
  ctx.fillStyle = accent;
  ctx.fillRect(padX, isVertical ? 64 : 46, 48, 5);
  ctx.font = `600 ${isVertical ? 20 : 18}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = muted;
  ctx.textAlign = 'left';
  ctx.fillText('Pustaka Bantu Mahasiswa', padX + 62, isVertical ? 73 : 54);

  // Scene indicator top right
  ctx.font = `600 ${isVertical ? 18 : 16}px "IBM Plex Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`0${scene} / 05`, w - padX, isVertical ? 73 : 54);

  // ---------------- SCENE 1: HOOK ----------------
  if (scene === 1) {
    const lift = (1 - easeOutCubic(localT / 0.7)) * 36;
    const baseY = isVertical ? 300 : 210;

    ctx.font = `700 ${isVertical ? 22 : 20}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    ctx.fillText('UNTUK MAHASISWA INDONESIA', padX, baseY - 36 + lift);

    ctx.font = `800 ${isVertical ? 58 : 62}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = fg;
    const afterTitle = drawWrappedText(
      ctx,
      'Skripsi buntu? Tugas kuliah menumpuk?',
      padX,
      baseY + 26 + lift,
      contentW,
      isVertical ? 70 : 74
    );

    ctx.font = `400 ${isVertical ? 26 : 24}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = muted;
    drawWrappedText(
      ctx,
      'Satu ruang kerja akademik yang tenang untuk mencari panduan, menghitung data, dan menuntaskan target kuliahmu.',
      padX,
      afterTitle + 28 + lift * 0.6,
      isVertical ? contentW : contentW * 0.78,
      isVertical ? 38 : 35
    );

    // Animated pain-to-relief strip
    const pills = [
      'Cari topik & jurnal tanpa pusing',
      'Alat bantu riset & PPT otomatis',
      'Pelacak progres & tenggat skripsi',
    ];
    const stripY = isVertical ? 740 : 480;
    pills.forEach((label, idx) => {
      const pAnim = easeOutCubic((localT - 0.8 - idx * 0.35) / 0.55);
      if (pAnim <= 0) return;
      ctx.save();
      ctx.globalAlpha = sceneAlpha * pAnim;
      const yOffset = isVertical ? stripY + idx * 82 : stripY;
      const cardW = isVertical ? contentW : (contentW - 36) / 3;
      const cardX = isVertical ? padX : padX + idx * (cardW + 18);
      drawRoundedRect(ctx, cardX, yOffset + (1 - pAnim) * 20, cardW, 64, 14);
      ctx.fillStyle = cardBg;
      ctx.fill();
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(cardX + 24, yOffset + 32 + (1 - pAnim) * 20, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `600 ${isVertical ? 22 : 17}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = fg;
      ctx.textAlign = 'left';
      ctx.fillText(label, cardX + 42, yOffset + 38 + (1 - pAnim) * 20);
      ctx.restore();
    });
  }

  // ---------------- SCENE 2: 35 PANDUAN + MODE FOKUS ----------------
  if (scene === 2) {
    const lift = (1 - easeOutCubic(localT / 0.6)) * 28;
    const headY = isVertical ? 185 : 138;

    ctx.font = `700 ${isVertical ? 20 : 18}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    ctx.fillText('PUSTAKA PANDUAN & MODE FOKUS', padX, headY + lift);

    ctx.font = `800 ${isVertical ? 46 : 44}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = fg;
    const nextY = drawWrappedText(
      ctx,
      '35 Panduan Praktis dengan Ceklis & Mode Baca Bebas Gangguan',
      padX,
      headY + 52 + lift,
      contentW,
      isVertical ? 56 : 54
    );

    // Animated Search Bar Mockup
    const searchY = nextY + 26;
    drawRoundedRect(ctx, padX, searchY, contentW, 64, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 2;
    ctx.stroke();

    const fullQuery = 'cara menulis latar belakang skripsi';
    const typedChars = Math.floor(clamp((localT - 0.35) / 1.4, 0, 1) * fullQuery.length);
    const typedText = fullQuery.slice(0, typedChars);

    ctx.font = `500 ${isVertical ? 22 : 21}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#111C33';
    ctx.textAlign = 'left';
    ctx.fillText(`🔍  ${typedText}${typedChars < fullQuery.length ? '|' : ''}`, padX + 24, searchY + 40);

    // Guide Cards
    const guides = [
      {
        cat: 'Skripsi & Penulisan',
        title: 'Menulis latar belakang masalah',
        sub: '4 langkah praktis · Mode Fokus · Catatan pribadi',
      },
      {
        cat: 'Referensi & Jurnal',
        title: 'Mencari jurnal ilmiah & akreditasi Sinta',
        sub: 'Cari jurnal Crossref, Web & YouTube langsung di web',
      },
      {
        cat: 'Statistik & Data',
        title: 'Memilih uji statistik & ukuran sampel',
        sub: 'Terhubung langsung ke Kalkulator Slovin & jalur SPSS',
      },
    ];

    const listStartY = searchY + 92;
    guides.forEach((g, idx) => {
      const a = easeOutCubic((localT - 0.9 - idx * 0.35) / 0.55);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = sceneAlpha * a;
      const cy = listStartY + idx * (isVertical ? 148 : 96) + (1 - a) * 20;
      const ch = isVertical ? 128 : 82;
      drawRoundedRect(ctx, padX, cy, contentW, ch, 16);
      ctx.fillStyle = cardBg;
      ctx.fill();
      ctx.strokeStyle = idx === 0 ? '#1D4ED8' : borderCol;
      ctx.lineWidth = idx === 0 ? 2 : 1.5;
      ctx.stroke();

      ctx.font = `700 ${isVertical ? 18 : 14}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = accent;
      ctx.textAlign = 'left';
      ctx.fillText(g.cat, padX + 24, cy + (isVertical ? 34 : 26));

      ctx.font = `700 ${isVertical ? 25 : 21}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = fg;
      ctx.fillText(g.title, padX + 24, cy + (isVertical ? 70 : 52));

      ctx.font = `400 ${isVertical ? 19 : 15}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = muted;
      ctx.fillText(g.sub, padX + 24, cy + (isVertical ? 104 : 72));
      ctx.restore();
    });
  }

  // ---------------- SCENE 3: 6 ALAT BANTU ----------------
  if (scene === 3) {
    const lift = (1 - easeOutCubic(localT / 0.6)) * 28;
    const headY = isVertical ? 180 : 134;

    ctx.font = `700 ${isVertical ? 20 : 18}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    ctx.fillText('ALAT BANTU AKADEMIK INTERAKTIF', padX, headY + lift);

    ctx.font = `800 ${isVertical ? 48 : 46}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = fg;
    const nextY = drawWrappedText(
      ctx,
      '6 Tool Praktis Siap Pakai di Browser',
      padX,
      headY + 52 + lift,
      contentW,
      isVertical ? 58 : 56
    );

    const tools = [
      { num: '01', name: 'Kalkulator Slovin', desc: 'Hitung sampel & cadangan responden' },
      { num: '02', name: 'Generator Sitasi', desc: 'Format APA 7, Harvard & IEEE instan' },
      { num: '03', name: 'Pemilih Uji Statistik', desc: 'Rekomendasi uji & jalur menu SPSS' },
      { num: '04', name: 'Pesan Dosen', desc: 'Template WA & email bimbingan sopan' },
      { num: '05', name: 'Timer Pomodoro', desc: 'Sesi fokus + pencatat gangguan' },
      { num: '06', name: 'Pembuat PPT (.pptx)', desc: 'Template sidang & pecah teks otomatis' },
    ];

    const cols = isVertical ? 2 : 3;
    const gap = isVertical ? 18 : 20;
    const boxW = (contentW - gap * (cols - 1)) / cols;
    const boxH = isVertical ? 215 : 168;
    const gridY = nextY + 34;

    tools.forEach((tool, idx) => {
      const a = easeOutCubic((localT - 0.45 - idx * 0.22) / 0.5);
      if (a <= 0) return;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const bx = padX + col * (boxW + gap);
      const by = gridY + row * (boxH + gap) + (1 - a) * 24;
      const isHighlight = Math.floor((localT - 0.5) / 0.65) % tools.length === idx;

      ctx.save();
      ctx.globalAlpha = sceneAlpha * a;
      drawRoundedRect(ctx, bx, by, boxW, boxH, 16);
      ctx.fillStyle = isHighlight ? '#1D4ED8' : cardBg;
      ctx.fill();
      ctx.strokeStyle = isHighlight ? '#60A5FA' : borderCol;
      ctx.lineWidth = isHighlight ? 2 : 1.5;
      ctx.stroke();

      ctx.font = `700 ${isVertical ? 18 : 15}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = isHighlight ? '#DBEAFE' : accent;
      ctx.textAlign = 'left';
      ctx.fillText(tool.num, bx + 22, by + 38);

      ctx.font = `700 ${isVertical ? 24 : 21}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      const afterName = drawWrappedText(
        ctx,
        tool.name,
        bx + 22,
        by + 74,
        boxW - 44,
        isVertical ? 30 : 27
      );

      ctx.font = `400 ${isVertical ? 18 : 15}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = isHighlight ? '#E0E7FF' : muted;
      drawWrappedText(ctx, tool.desc, bx + 22, afterName + 10, boxW - 44, isVertical ? 24 : 21);
      ctx.restore();
    });
  }

  // ---------------- SCENE 4: PELACAK SKRIPSI, GRAFIK, PDF & KALENDER ----------------
  if (scene === 4) {
    const lift = (1 - easeOutCubic(localT / 0.6)) * 28;
    const headY = isVertical ? 180 : 134;

    ctx.font = `700 ${isVertical ? 20 : 18}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    ctx.fillText('PELACAK PROGRES & TENGGAT SKRIPSI', padX, headY + lift);

    ctx.font = `800 ${isVertical ? 46 : 44}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = fg;
    const nextY = drawWrappedText(
      ctx,
      'Grafik Dinamis, Laporan PDF & Sinkron Kalender',
      padX,
      headY + 52 + lift,
      contentW,
      isVertical ? 56 : 54
    );

    const chartProgress = easeOutCubic((localT - 0.3) / 2.2);
    const pct = Math.round(chartProgress * 85);

    const cx = isVertical ? w / 2 : padX + 210;
    const cy = isVertical ? nextY + 210 : nextY + 215;
    const radius = isVertical ? 140 : 128;

    // Donut track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 28;
    ctx.stroke();

    // Active arc
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      radius,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (pct / 100)
    );
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center percentage readout
    ctx.font = `700 ${isVertical ? 58 : 54}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = '#111C33';
    ctx.textAlign = 'center';
    ctx.fillText(`${pct}%`, cx, cy + 12);
    ctx.font = `500 ${isVertical ? 20 : 17}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = muted;
    ctx.fillText('6 Tahap Skripsi', cx, cy + 46);

    // Feature Callout Cards
    const features = [
      { title: 'Laporan Mingguan PDF & Cetak A4', desc: 'Siap dikirim atau dibawa saat bimbingan dosen' },
      { title: 'Ekspor Google Calendar & File .ics', desc: 'Pengingat otomatis H-1 di HP dan laptopmu' },
      { title: 'Riwayat Kerja Tersinkron Google', desc: 'Catatan & hasil alat bantu aman lintas perangkat' },
    ];

    const listX = isVertical ? padX : padX + 430;
    const listW = isVertical ? contentW : contentW - 430;
    const listY = isVertical ? cy + 200 : nextY + 75;

    features.forEach((f, idx) => {
      const a = easeOutCubic((localT - 0.7 - idx * 0.35) / 0.55);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = sceneAlpha * a;
      const fy = listY + idx * (isVertical ? 124 : 102) + (1 - a) * 20;
      const fh = isVertical ? 104 : 86;
      drawRoundedRect(ctx, listX, fy, listW, fh, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `700 ${isVertical ? 23 : 20}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.fillStyle = '#111C33';
      ctx.textAlign = 'left';
      ctx.fillText(f.title, listX + 24, fy + (isVertical ? 44 : 36));

      ctx.font = `400 ${isVertical ? 19 : 16}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = muted;
      ctx.fillText(f.desc, listX + 24, fy + (isVertical ? 78 : 65));
      ctx.restore();
    });
  }

  // ---------------- SCENE 5: OUTRO CTA ----------------
  if (scene === 5) {
    const a = easeOutCubic(localT / 0.8);
    const centerY = h * 0.45;

    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(w / 2 - 44, centerY - 120 + (1 - a) * 20, 88, 6);

    ctx.font = `800 ${isVertical ? 58 : 64}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.fillStyle = '#F8FAFC';
    drawWrappedText(
      ctx,
      'Pustaka Bantu Mahasiswa',
      w / 2,
      centerY - 40 + (1 - a) * 20,
      contentW,
      isVertical ? 68 : 74,
      'center'
    );

    ctx.font = `400 ${isVertical ? 26 : 24}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#CBD5E1';
    drawWrappedText(
      ctx,
      'Panduan kuliah, pencarian jurnal & video, alat bantu riset, pembuat PPT, hingga pelacak skripsi dalam satu web.',
      w / 2,
      centerY + (isVertical ? 115 : 54) + (1 - a) * 16,
      isVertical ? contentW - 30 : contentW * 0.78,
      isVertical ? 38 : 36,
      'center'
    );

    // Clean CTA Button visual
    const btnW = isVertical ? 420 : 400;
    const btnH = 66;
    const btnX = (w - btnW) / 2;
    const btnY = centerY + (isVertical ? 265 : 155);
    const btnAnim = easeOutCubic((localT - 0.5) / 0.6);

    ctx.save();
    ctx.globalAlpha = sceneAlpha * btnAnim;
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 14);
    ctx.fillStyle = '#1D4ED8';
    ctx.fill();
    ctx.font = `700 ${isVertical ? 23 : 21}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Mulai Belajar Gratis Sekarang →', w / 2, btnY + 41);
    ctx.restore();
  }

  // Bottom progress hairline inside video
  ctx.globalAlpha = 1;
  ctx.fillStyle = isDarkScene ? 'rgba(255,255,255,0.12)' : 'rgba(17,28,51,0.10)';
  ctx.fillRect(0, h - 8, w, 8);
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, h - 8, w * (t / TOTAL_DURATION_SEC), 8);

  ctx.restore();
}

function formatSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `00:${String(s).padStart(2, '0')}`;
}

export function PromoVideoModal({ isOpen, onClose }: PromoVideoModalProps) {
  const [aspect, setAspect] = useState<VideoAspect>('16:9');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Subtle ambient chord synthesizer using Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const chordTimerRef = useRef<number | null>(null);

  const stopAmbientAudio = useCallback(() => {
    if (chordTimerRef.current) {
      window.clearInterval(chordTimerRef.current);
      chordTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      audioDestRef.current = null;
      musicGainRef.current = null;
    }
  }, []);

  const startAmbientAudio = useCallback(
    (captureDestination: boolean) => {
      stopAmbientAudio();
      if (muted && !captureDestination) return null;

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;

        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.075;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1100;

        filter.connect(master);
        master.connect(ctx.destination);

        let dest: MediaStreamAudioDestinationNode | null = null;
        if (captureDestination && typeof ctx.createMediaStreamDestination === 'function') {
          dest = ctx.createMediaStreamDestination();
          master.connect(dest);
        }

        audioCtxRef.current = ctx;
        audioDestRef.current = dest;
        musicGainRef.current = master;

        const chords = [
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [220.0, 261.63, 329.63, 392.0], // Am7
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [196.0, 246.94, 293.66, 329.63], // G6
        ];

        let step = 0;
        const playChord = () => {
          if (!audioCtxRef.current) return;
          const now = ctx.currentTime;
          const notes = chords[step % chords.length];
          step += 1;

          notes.forEach((freq) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(0.22, now + 0.4);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 3.7);

            osc.connect(g);
            g.connect(filter);
            osc.start(now);
            osc.stop(now + 3.8);
          });
        };

        playChord();
        chordTimerRef.current = window.setInterval(playChord, 3800);
        return dest;
      } catch {
        return null;
      }
    },
    [muted, stopAmbientAudio]
  );

  // Sync mute state cleanly
  useEffect(() => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = muted ? 0 : 0.075;
    }
  }, [muted]);

  const drawAt = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderPromoFrame(ctx, canvas.width, canvas.height, t, aspect === '9:16');
    },
    [aspect]
  );

  // Redraw when modal opens or aspect changes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setRecording(false);
      stopAmbientAudio();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    timeRef.current = 0;
    setCurrentTime(0);
    setDownloadDone(false);
    setRecordError(null);
    const timer = window.setTimeout(() => {
      drawAt(0);
      setIsPlaying(true);
    }, 80);

    return () => {
      window.clearTimeout(timer);
      stopAmbientAudio();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, aspect, drawAt, stopAmbientAudio]);

  // Playback animation loop
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
      if (!recording) stopAmbientAudio();
      return;
    }

    if (!recording && !audioCtxRef.current && !muted) {
      startAmbientAudio(false);
    }

    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const next = timeRef.current + dt;
      if (next >= TOTAL_DURATION_SEC) {
        timeRef.current = TOTAL_DURATION_SEC;
        setCurrentTime(TOTAL_DURATION_SEC);
        drawAt(TOTAL_DURATION_SEC);
        setIsPlaying(false);
        return;
      }

      timeRef.current = next;
      setCurrentTime(next);
      drawAt(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawAt, isOpen, isPlaying, muted, recording, startAmbientAudio, stopAmbientAudio]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !recording) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, recording]);

  if (!isOpen) return null;

  const canvasWidth = aspect === '16:9' ? 1280 : 720;
  const canvasHeight = aspect === '16:9' ? 720 : 1280;

  const handleTogglePlay = () => {
    if (recording) return;
    if (timeRef.current >= TOTAL_DURATION_SEC) {
      timeRef.current = 0;
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReplay = () => {
    if (recording) return;
    timeRef.current = 0;
    setCurrentTime(0);
    drawAt(0);
    setIsPlaying(true);
  };

  const handleDownloadVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || recording) return;
    setRecordError(null);
    setDownloadDone(false);

    if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      setRecordError('Browser ini belum mendukung perekaman video WebM langsung.');
      return;
    }

    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const supportedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));

    try {
      const videoStream = canvas.captureStream(30);
      const audioDest = muted ? null : startAmbientAudio(true);
      const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
      if (audioDest) {
        tracks.push(...audioDest.stream.getAudioTracks());
      }
      const combined = new MediaStream(tracks);

      const recorder = new MediaRecorder(
        combined,
        supportedMime ? { mimeType: supportedMime, videoBitsPerSecond: 3_500_000 } : undefined
      );

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = () => {
        stopAmbientAudio();
        setRecording(false);
        const blob = new Blob(chunks, { type: supportedMime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-promosi-pustaka-bantu-${aspect === '16:9' ? '16x9' : '9x16'}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        setDownloadDone(true);
        setTimeout(() => setDownloadDone(false), 3500);
      };

      // Reset playback to 0 and record full 24s clip cleanly
      timeRef.current = 0;
      setCurrentTime(0);
      drawAt(0);
      setRecording(true);
      setIsPlaying(true);
      recorder.start(250);

      const checkStop = window.setInterval(() => {
        if (timeRef.current >= TOTAL_DURATION_SEC - 0.05) {
          window.clearInterval(checkStop);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, 150);
    } catch {
      stopAmbientAudio();
      setRecording(false);
      setRecordError('Gagal memulai perekaman video di perangkat ini.');
    }
  };

  const progressPct = Math.round((currentTime / TOTAL_DURATION_SEC) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-video-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !recording) onClose();
      }}
    >
      <div className="w-full max-w-[920px] max-h-[94dvh] flex flex-col rounded-2xl bg-[#F7F9FC] dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-[#111B2E] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Film className="w-4 h-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" />
            <div className="min-w-0">
              <h2
                id="promo-video-title"
                className="font-display text-base sm:text-lg font-bold text-[#111C33] dark:text-[#F1F5F9] truncate"
              >
                Video Promosi Pustaka Bantu
              </h2>
              <p className="text-[11px] text-[#52607A] dark:text-slate-400">
                Durasi 24 detik · Siap tonton &amp; unduh (.webm) untuk YouTube, Reels, atau TikTok
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
              role="group"
              aria-label="Pilih rasio video"
            >
              <button
                type="button"
                disabled={recording}
                onClick={() => setAspect('16:9')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  aspect === '16:9'
                    ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                    : 'text-[#52607A] dark:text-slate-400'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9</span>
              </button>
              <button
                type="button"
                disabled={recording}
                onClick={() => setAspect('9:16')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  aspect === '9:16'
                    ? 'bg-white dark:bg-[#111B2E] text-[#1D4ED8] dark:text-[#60A5FA] shadow-xs'
                    : 'text-[#52607A] dark:text-slate-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Reels</span>
              </button>
            </div>

            <button
              type="button"
              disabled={recording}
              onClick={onClose}
              aria-label="Tutup pemutar video promosi"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-[#52607A] dark:text-slate-300 hover:text-[#111C33] dark:hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-[#090F1A]">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className={`rounded-xl shadow-2xl border border-slate-800 bg-[#0B1220] ${
              aspect === '16:9'
                ? 'w-full max-w-[780px] aspect-video'
                : 'h-[58dvh] max-h-[540px] aspect-[9/16]'
            }`}
          />
        </div>

        {/* Controls Footer */}
        <div className="bg-white dark:bg-[#111B2E] border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 space-y-3 shrink-0">
          {/* Scrubber */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-[#52607A] dark:text-slate-400 w-11">
              {formatSec(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={TOTAL_DURATION_SEC}
              step={0.1}
              disabled={recording}
              value={currentTime}
              onChange={(e) => {
                const v = Number(e.target.value);
                timeRef.current = v;
                setCurrentTime(v);
                drawAt(v);
              }}
              aria-label="Geser waktu video"
              className="flex-1 accent-[#1D4ED8] cursor-pointer"
            />
            <span className="font-mono text-xs tabular-nums text-[#52607A] dark:text-slate-400 w-11 text-right">
              {formatSec(TOTAL_DURATION_SEC)}
            </span>
          </div>

          {/* Playback & Download Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={recording}
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111C33] dark:bg-[#E8EEF9] text-white dark:text-[#0B1220] text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Jeda</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Putar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={recording}
                onClick={handleReplay}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#111C33] dark:text-slate-200 hover:border-[#1D4ED8] cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi</span>
              </button>

              <button
                type="button"
                disabled={recording}
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Nyalakan musik latar' : 'Bisukan musik latar'}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#52607A] dark:text-slate-300 hover:text-[#111C33] dark:hover:text-white cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{muted ? 'Bisu' : 'Musik'}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={recording}
              onClick={handleDownloadVideo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-70 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {recording ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="tabular-nums">Merekam Video ({progressPct}%)...</span>
                </>
              ) : downloadDone ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Video .webm Diunduh</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Video (.webm)</span>
                </>
              )}
            </button>
          </div>

          {recordError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{recordError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
