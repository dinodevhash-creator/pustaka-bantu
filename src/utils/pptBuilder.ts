import PptxGenJS from 'pptxgenjs';

export type PptTemplateId = 'sidang-skripsi' | 'makalah-kuliah' | 'laporan-magang' | 'teks-otomatis';
export type PptThemeId = 'akademik-biru' | 'hijau-riset' | 'minimal-gelap' | 'editorial-hangat';

export interface SlideDraft {
  id: string;
  kicker: string;
  title: string;
  bullets: string[];
  notes: string;
}

export interface PptDeckMeta {
  title: string;
  subtitle: string;
  presenter: string;
  institution: string;
  dateLabel: string;
}

export interface PptThemeSpec {
  id: PptThemeId;
  name: string;
  coverBg: string;
  coverText: string;
  coverMuted: string;
  slideBg: string;
  slideText: string;
  slideMuted: string;
  accent: string;
  accentSoft: string;
  border: string;
}

export const PPT_THEMES: Record<PptThemeId, PptThemeSpec> = {
  'akademik-biru': {
    id: 'akademik-biru',
    name: 'Biru Akademik',
    coverBg: '111C33',
    coverText: 'F8FAFC',
    coverMuted: 'CBD5E1',
    slideBg: 'F8FAFC',
    slideText: '111C33',
    slideMuted: '475569',
    accent: '1D4ED8',
    accentSoft: 'DBEAFE',
    border: 'CBD5E1',
  },
  'hijau-riset': {
    id: 'hijau-riset',
    name: 'Hijau Riset',
    coverBg: '064E3B',
    coverText: 'F8FAF9',
    coverMuted: 'A7F3D0',
    slideBg: 'F8FAF9',
    slideText: '0F2922',
    slideMuted: '475569',
    accent: '059669',
    accentSoft: 'D1FAE5',
    border: 'CBD5E1',
  },
  'minimal-gelap': {
    id: 'minimal-gelap',
    name: 'Minimalis Gelap',
    coverBg: '0B1220',
    coverText: 'F8FAFC',
    coverMuted: '94A3B8',
    slideBg: '0F172A',
    slideText: 'F1F5F9',
    slideMuted: '94A3B8',
    accent: '38BDF8',
    accentSoft: '1E293B',
    border: '334155',
  },
  'editorial-hangat': {
    id: 'editorial-hangat',
    name: 'Editorial Hangat',
    coverBg: '1C1917',
    coverText: 'FAF8F5',
    coverMuted: 'D6D3D1',
    slideBg: 'FAF8F5',
    slideText: '1C1917',
    slideMuted: '57534E',
    accent: 'B45309',
    accentSoft: 'FEF3C7',
    border: 'E7E5E4',
  },
};

export const PPT_TEMPLATES: Array<{
  id: PptTemplateId;
  label: string;
  desc: string;
}> = [
  {
    id: 'sidang-skripsi',
    label: 'Sidang Skripsi / Sempro',
    desc: 'Struktur lengkap Bab 1–5 + Penutup',
  },
  {
    id: 'makalah-kuliah',
    label: 'Makalah / Tugas Kuliah',
    desc: 'Ringkas 5–6 slide siap diskusi kelas',
  },
  {
    id: 'laporan-magang',
    label: 'Laporan Magang / Proyek',
    desc: 'Profil, capaian kerja, dan evaluasi',
  },
  {
    id: 'teks-otomatis',
    label: 'Pecah dari Teks Bebas',
    desc: 'Tempel catatan atau draf, otomatis jadi slide',
  },
];

function makeId(prefix: string, idx: number): string {
  return `${prefix}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getTemplatePreset(templateId: PptTemplateId): {
  meta: PptDeckMeta;
  slides: SlideDraft[];
} {
  const today = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (templateId === 'makalah-kuliah') {
    return {
      meta: {
        title: 'Transformasi Pembelajaran Digital di Perguruan Tinggi',
        subtitle: 'Presentasi Tugas Mata Kuliah — Kelompok 2',
        presenter: 'Nama Mahasiswa (NIM 220101045)',
        institution: 'Program Studi Pendidikan / Ilmu Komputer',
        dateLabel: today,
      },
      slides: [
        {
          id: makeId('mk', 1),
          kicker: '01 · Pendahuluan',
          title: 'Mengapa Topik Ini Penting Dibahas?',
          bullets: [
            'Perubahan pola belajar mahasiswa pasca adopsi platform digital kampus.',
            'Kesenjangan antara ketersediaan teknologi dan efektivitas pemahaman materi.',
            'Tujuan presentasi: memetakan tantangan sekaligus strategi penerapan efektif.',
          ],
          notes: 'Buka presentasi dengan contoh pengalaman belajar di kelas sehari-hari.',
        },
        {
          id: makeId('mk', 2),
          kicker: '02 · Landasan Konsep',
          title: 'Konsep dan Kerangka Teori Utama',
          bullets: [
            'Blended learning menggabungkan interaksi tatap muka dan eksplorasi mandiri.',
            'Active recall dan spaced repetition terbukti meningkatkan retensi konsep.',
            'Evaluasi formatif berkala membantu dosen mendeteksi miskonsepsi lebih awal.',
          ],
          notes: 'Sebutkan 1–2 sumber jurnal utama yang dipakai dalam makalah.',
        },
        {
          id: makeId('mk', 3),
          kicker: '03 · Analisis & Studi Kasus',
          title: 'Temuan Utama dari Studi Kasus Kampus',
          bullets: [
            'Mahasiswa lebih aktif ketika materi dilengkapi kuis singkat dan studi kasus nyata.',
            'Hambatan utama berupa distraksi gawai dan kurangnya panduan belajar terstruktur.',
            'Kolaborasi kelompok daring meningkat bila peran setiap anggota dibagi jelas.',
          ],
          notes: 'Jelaskan contoh konkret dari data atau artikel studi kasus.',
        },
        {
          id: makeId('mk', 4),
          kicker: '04 · Rekomendasi & Penutup',
          title: 'Kesimpulan dan Poin Diskusi Kelas',
          bullets: [
            'Teknologi hanya berdampak positif bila dipadukan dengan metode belajar aktif.',
            'Perlu panduan ringkas dan umpan balik cepat agar mahasiswa tidak kewalahan.',
            'Pertanyaan diskusi: metode kuliah mana yang paling efektif bagi kelas kita?',
          ],
          notes: 'Ajak audiens berdiskusi menggunakan pertanyaan penutup.',
        },
      ],
    };
  }

  if (templateId === 'laporan-magang') {
    return {
      meta: {
        title: 'Laporan Praktik Kerja Lapangan & Proyek Akhir',
        subtitle: 'Divisi Pengembangan Produk & Analisis Data',
        presenter: 'Nama Mahasiswa (NIM 220101045)',
        institution: 'Fakultas Teknik & Ilmu Komputer',
        dateLabel: today,
      },
      slides: [
        {
          id: makeId('mg', 1),
          kicker: '01 · Profil Instansi',
          title: 'Gambaran Mitra Magang dan Peran Tim',
          bullets: [
            'Lokasi & periode magang: PT Mitra Teknologi Nusantara (3 bulan).',
            'Penempatan pada tim operasional digital dan pelaporan mingguan.',
            'Tanggung jawab utama: analisis kebutuhan, dokumentasi, dan uji fitur.',
          ],
          notes: 'Jelaskan secara singkat struktur tim dan pembimbing lapangan.',
        },
        {
          id: makeId('mg', 2),
          kicker: '02 · Ruang Lingkup',
          title: 'Masalah Kerja yang Ditangani Selama Magang',
          bullets: [
            'Proses rekap data harian masih dilakukan manual di beberapa lembar terpisah.',
            'Waktu penyusunan laporan mingguan memakan rata-rata 4–5 jam kerja.',
            'Target proyek: menyederhanakan alur pencatatan dan mempercepat validasi.',
          ],
          notes: 'Fokus pada kondisi awal sebelum proyek dikerjakan.',
        },
        {
          id: makeId('mg', 3),
          kicker: '03 · Implementasi',
          title: 'Langkah Penyelesaian dan Hasil Utama',
          bullets: [
            'Merancang template input terstandar dengan validasi otomatis.',
            'Menyusun panduan operasional singkat untuk 8 anggota tim terkait.',
            'Hasil uji coba: waktu rekap mingguan berkurang hingga 55%.',
          ],
          notes: 'Tunjukkan angka capaian terukur agar penguji melihat dampak nyata.',
        },
        {
          id: makeId('mg', 4),
          kicker: '04 · Refleksi & Saran',
          title: 'Pembelajaran dan Rekomendasi Lanjutan',
          bullets: [
            'Peningkatan keterampilan komunikasi lintas divisi dan manajemen tenggat.',
            'Saran untuk mitra: integrasi otomatisasi penuh ke sistem internal.',
            'Saran untuk kampus: pembekalan studi kasus industri sebelum keberangkatan.',
          ],
          notes: 'Tutup dengan ucapan terima kasih kepada pembimbing kampus dan mitra.',
        },
      ],
    };
  }

  if (templateId === 'teks-otomatis') {
    return {
      meta: {
        title: 'Ringkasan Materi Presentasi',
        subtitle: 'Disusun Otomatis dari Catatan Kuliah',
        presenter: 'Nama Mahasiswa',
        institution: 'Universitas / Program Studi',
        dateLabel: today,
      },
      slides: [
        {
          id: makeId('tx', 1),
          kicker: 'Slide 01',
          title: 'Pokok Bahasan Utama',
          bullets: [
            'Tempel catatan atau paragraf panjang pada kolom "Pecah Teks Otomatis".',
            'Gunakan tanda # di awal baris untuk menandai judul slide baru (opsional).',
            'Klik "Buat Slide Otomatis" untuk memecah teks menjadi poin-poin ringkas.',
          ],
          notes: 'Kamu dapat langsung menempel ringkasan bab atau makalah lalu memprosesnya.',
        },
      ],
    };
  }

  // Default: sidang-skripsi
  return {
    meta: {
      title: 'Pengaruh Strategi Belajar Terstruktur terhadap Ketuntasan Skripsi Mahasiswa',
      subtitle: 'Presentasi Sidang Tugas Akhir / Seminar Proposal',
      presenter: 'Nama Mahasiswa (NIM 220101045)',
      institution: 'Program Studi S1 · Universitas',
      dateLabel: today,
    },
    slides: [
      {
        id: makeId('sk', 1),
        kicker: 'Bab 1 · Pendahuluan',
        title: 'Latar Belakang dan Urgensi Penelitian',
        bullets: [
          'Keterlambatan penyelesaian tugas akhir masih menjadi kendala utama mahasiswa tingkat akhir.',
          'Studi terdahulu menunjukkan manajemen tenggat dan umpan balik terukur berperan signifikan.',
          'Diperlukan evaluasi empiris mengenai strategi kerja terstruktur pada konteks kampus lokal.',
        ],
        notes: 'Mulai dengan data/fenomena singkat, lalu langsung hubungkan ke celah penelitian.',
      },
      {
        id: makeId('sk', 2),
        kicker: 'Bab 1 · Fokus Riset',
        title: 'Rumusan Masalah dan Tujuan Penelitian',
        bullets: [
          'Rumusan 1: Seberapa besar pengaruh perencanaan tenggat terhadap progres mingguan?',
          'Rumusan 2: Faktor pendukung apa yang paling dominan menjaga konsistensi penulisan?',
          'Tujuan: Mengukur pengaruh antarvariabel dan merumuskan rekomendasi praktis bagi mahasiswa.',
        ],
        notes: 'Pastikan jumlah tujuan sejajar dengan jumlah rumusan masalah.',
      },
      {
        id: makeId('sk', 3),
        kicker: 'Bab 2 · Landasan Teori',
        title: 'Tinjauan Pustaka dan Kerangka Pemikiran',
        bullets: [
          'Self-Regulated Learning (Zimmerman): perencanaan, pemantauan, dan refleksi diri.',
          'Penelitian terdahulu (2021–2025) menegaskan peran umpan balik mingguan terhadap motivasi.',
          'Hipotesis utama: strategi terstruktur berpengaruh positif signifikan terhadap ketuntasan.',
        ],
        notes: 'Soroti kebaruan penelitianmu dibanding studi terdahulu.',
      },
      {
        id: makeId('sk', 4),
        kicker: 'Bab 3 · Metodologi',
        title: 'Desain, Sampel, dan Teknik Analisis Data',
        bullets: [
          'Pendekatan kuantitatif survei dengan sampel 120 mahasiswa tingkat akhir (rumus Slovin, e = 5%).',
          'Instrumen kuesioner skala Likert 1–5 yang telah lolos uji validitas dan reliabilitas (α > 0,70).',
          'Analisis data menggunakan uji asumsi klasik dan regresi linier berganda di SPSS.',
        ],
        notes: 'Siapkan jawaban cepat bila penguji menanyakan alasan pemilihan jumlah sampel dan uji.',
      },
      {
        id: makeId('sk', 5),
        kicker: 'Bab 4 · Hasil & Pembahasan',
        title: 'Temuan Utama Penelitian',
        bullets: [
          'Variabel perencanaan tenggat berpengaruh positif dan signifikan (p < 0,05).',
          'Koefisien determinasi (R²) menunjukkan model menjelaskan 62% variasi ketuntasan tugas.',
          'Temuan sejalan dengan teori regulasi diri dan memperkuat bukti empiris sebelumnya.',
        ],
        notes: 'Tekankan angka utama yang menjawab rumusan masalah; jangan membaca seluruh tabel.',
      },
      {
        id: makeId('sk', 6),
        kicker: 'Bab 5 · Penutup',
        title: 'Kesimpulan dan Saran Penelitian',
        bullets: [
          'Kesimpulan: Strategi pencatatan progres dan tenggat mingguan mempercepat penyelesaian skripsi.',
          'Saran praktis: Mahasiswa disarankan memecah bab menjadi target kecil terukur per minggu.',
          'Saran riset lanjut: Gunakan desain longitudinal lintas fakultas dengan sampel lebih besar.',
        ],
        notes: 'Tutup dengan tenang dan persilakan dewan penguji memberikan pertanyaan/masukan.',
      },
    ],
  };
}

function cleanBulletLine(raw: string): string {
  return raw
    .replace(/^[-*•\d.)]+\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitLongParagraphToBullets(paragraph: string, maxBullets = 4): string[] {
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (sentences.length <= 1) {
    return [paragraph.trim().slice(0, 220)];
  }
  return sentences.slice(0, maxBullets).map((s) => (s.length > 190 ? `${s.slice(0, 187)}...` : s));
}

/**
 * Automatically parses free-form notes/text into structured presentation slides.
 * Supports:
 * - Markdown headings (# / ##) as slide titles
 * - Blank-line separated sections where first short line is title and remaining lines are bullets
 * - Long prose paragraphs split cleanly into 3-4 concise bullet points per slide
 */
export function parseRawTextToSlides(rawText: string): SlideDraft[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  // Check if user used markdown headings (# or ##)
  const hasHeadings = /^#{1,3}\s+.+/m.test(normalized);
  const slides: SlideDraft[] = [];

  if (hasHeadings) {
    const sections = normalized.split(/(?=^#{1,3}\s+)/m).map((s) => s.trim()).filter(Boolean);
    sections.forEach((sec, idx) => {
      const lines = sec.split('\n').map((l) => l.trim()).filter(Boolean);
      const firstLine = lines[0] || `Bagian ${idx + 1}`;
      const title = firstLine.replace(/^#{1,3}\s+/, '').trim() || `Bagian ${idx + 1}`;
      const bodyLines = lines.slice(1);
      let bullets: string[] = [];

      if (bodyLines.length === 1 && bodyLines[0].length > 140) {
        bullets = splitLongParagraphToBullets(bodyLines[0], 5);
      } else {
        bullets = bodyLines
          .map(cleanBulletLine)
          .filter(Boolean)
          .slice(0, 5);
      }

      if (bullets.length === 0) {
        bullets = ['Tambahkan poin penjelasan utama untuk bagian ini.'];
      }

      slides.push({
        id: makeId('auto', idx + 1),
        kicker: `Bagian ${String(idx + 1).padStart(2, '0')}`,
        title,
        bullets,
        notes: '',
      });
    });
    return slides.slice(0, 12);
  }

  // Otherwise split by blank lines into sections/paragraphs
  const blocks = normalized
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let title = `Poin Bahasan ${idx + 1}`;
    let bullets: string[] = [];

    if (lines.length === 1) {
      const sentences = splitLongParagraphToBullets(lines[0], 4);
      if (sentences.length > 1) {
        title = sentences[0].replace(/[.!?]+$/, '').slice(0, 72);
        bullets = sentences.slice(1);
      } else {
        title = `Pembahasan ${idx + 1}`;
        bullets = sentences;
      }
    } else {
      const firstLooksLikeTitle =
        lines[0].length <= 85 && !/^[-*•]\s/.test(lines[0]);
      if (firstLooksLikeTitle) {
        title = lines[0].replace(/[:.]+$/, '').trim();
        bullets = lines.slice(1).map(cleanBulletLine).filter(Boolean).slice(0, 5);
      } else {
        title = `Pembahasan ${idx + 1}`;
        bullets = lines.map(cleanBulletLine).filter(Boolean).slice(0, 5);
      }
    }

    if (bullets.length === 0) {
      bullets = [cleanBulletLine(lines[0])];
    }

    slides.push({
      id: makeId('auto', idx + 1),
      kicker: `Bagian ${String(idx + 1).padStart(2, '0')}`,
      title,
      bullets,
      notes: '',
    });
  });

  return slides.slice(0, 12);
}

function toSafeFilenameSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 42);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  return `presentasi-${slug || 'akademik'}-${dateStr}.pptx`;
}

export async function exportPresentationPptx(params: {
  meta: PptDeckMeta;
  slides: SlideDraft[];
  themeId: PptThemeId;
  includeClosingSlide: boolean;
}): Promise<string> {
  const { meta, slides, themeId, includeClosingSlide } = params;
  const theme = PPT_THEMES[themeId];
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
  pptx.author = meta.presenter || 'Mahasiswa';
  pptx.company = meta.institution || 'Pustaka Bantu Mahasiswa';
  pptx.title = meta.title || 'Presentasi Akademik';
  pptx.subject = meta.subtitle || 'Materi Presentasi';

  const totalSlideCount = 1 + slides.length + (includeClosingSlide ? 1 : 0);

  // 1. COVER SLIDE
  const cover = pptx.addSlide();
  cover.background = { color: theme.coverBg };

  // Subtle top accent line
  cover.addShape(pptx.ShapeType.rect, {
    x: 0.85,
    y: 0.9,
    w: 1.4,
    h: 0.08,
    fill: { color: theme.accent },
    line: { color: theme.accent, width: 0 },
  });

  if (meta.institution.trim()) {
    cover.addText(meta.institution.trim(), {
      x: 0.85,
      y: 1.18,
      w: 11.4,
      h: 0.4,
      fontFace: 'Calibri',
      fontSize: 14,
      bold: true,
      color: theme.coverMuted,
    });
  }

  cover.addText(meta.title.trim() || 'Judul Presentasi Akademik', {
    x: 0.85,
    y: 1.85,
    w: 11.4,
    h: 2.3,
    fontFace: 'Calibri',
    fontSize: 36,
    bold: true,
    color: theme.coverText,
    valign: 'top',
    breakLine: true,
  });

  if (meta.subtitle.trim()) {
    cover.addText(meta.subtitle.trim(), {
      x: 0.85,
      y: 4.3,
      w: 10.8,
      h: 0.7,
      fontFace: 'Calibri',
      fontSize: 18,
      color: theme.coverMuted,
    });
  }

  // Bottom divider & presenter info
  cover.addShape(pptx.ShapeType.rect, {
    x: 0.85,
    y: 5.7,
    w: 11.6,
    h: 0.02,
    fill: { color: theme.border },
    line: { color: theme.border, width: 0 },
  });

  cover.addText(meta.presenter.trim() || 'Nama Presenter', {
    x: 0.85,
    y: 5.95,
    w: 7.5,
    h: 0.5,
    fontFace: 'Calibri',
    fontSize: 15,
    bold: true,
    color: theme.coverText,
  });

  if (meta.dateLabel.trim()) {
    cover.addText(meta.dateLabel.trim(), {
      x: 8.6,
      y: 5.95,
      w: 3.85,
      h: 0.5,
      fontFace: 'Calibri',
      fontSize: 14,
      color: theme.coverMuted,
      align: 'right',
    });
  }

  // 2. CONTENT SLIDES
  slides.forEach((s, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: theme.slideBg };
    const slideNumber = idx + 2;

    // Top subtle hairline bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.1,
      fill: { color: theme.accent },
      line: { color: theme.accent, width: 0 },
    });

    // Kicker text
    if (s.kicker.trim()) {
      slide.addText(s.kicker.trim(), {
        x: 0.85,
        y: 0.55,
        w: 9.5,
        h: 0.35,
        fontFace: 'Calibri',
        fontSize: 13,
        bold: true,
        color: theme.accent,
      });
    }

    // Slide Title
    slide.addText(s.title.trim() || `Slide ${slideNumber}`, {
      x: 0.85,
      y: 0.95,
      w: 11.6,
      h: 0.95,
      fontFace: 'Calibri',
      fontSize: 28,
      bold: true,
      color: theme.slideText,
      valign: 'top',
    });

    // Subtle divider under title
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.85,
      y: 1.98,
      w: 11.6,
      h: 0.02,
      fill: { color: theme.border },
      line: { color: theme.border, width: 0 },
    });

    // Structured Bullet Points
    const cleanBullets = s.bullets.map((b) => b.trim()).filter(Boolean);
    const bulletItems = (
      cleanBullets.length > 0 ? cleanBullets : ['Tambahkan poin materi di sini.']
    ).map((text) => ({
      text,
      options: {
        bullet: { type: 'bullet' as const },
        paraSpaceAfter: 14,
        breakLine: true,
      },
    }));

    slide.addText(bulletItems, {
      x: 0.95,
      y: 2.3,
      w: 11.4,
      h: 4.35,
      fontFace: 'Calibri',
      fontSize: cleanBullets.length > 5 ? 16 : 19,
      color: theme.slideText,
      valign: 'top',
      lineSpacingMultiple: 1.25,
    });

    // Footer bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.85,
      y: 6.82,
      w: 11.6,
      h: 0.015,
      fill: { color: theme.border },
      line: { color: theme.border, width: 0 },
    });

    slide.addText(meta.title.trim().slice(0, 72) || 'Presentasi Akademik', {
      x: 0.85,
      y: 6.92,
      w: 9.2,
      h: 0.35,
      fontFace: 'Calibri',
      fontSize: 10.5,
      color: theme.slideMuted,
    });

    slide.addText(`${slideNumber} / ${totalSlideCount}`, {
      x: 10.4,
      y: 6.92,
      w: 2.05,
      h: 0.35,
      fontFace: 'Calibri',
      fontSize: 10.5,
      bold: true,
      color: theme.slideMuted,
      align: 'right',
    });

    if (s.notes.trim()) {
      slide.addNotes(s.notes.trim());
    }
  });

  // 3. CLOSING SLIDE
  if (includeClosingSlide) {
    const closing = pptx.addSlide();
    closing.background = { color: theme.coverBg };

    closing.addShape(pptx.ShapeType.rect, {
      x: 5.95,
      y: 2.1,
      w: 1.4,
      h: 0.08,
      fill: { color: theme.accent },
      line: { color: theme.accent, width: 0 },
    });

    closing.addText('Terima Kasih', {
      x: 1,
      y: 2.45,
      w: 11.333,
      h: 1.1,
      fontFace: 'Calibri',
      fontSize: 42,
      bold: true,
      color: theme.coverText,
      align: 'center',
    });

    closing.addText('Sesi Tanya Jawab & Diskusi', {
      x: 1,
      y: 3.65,
      w: 11.333,
      h: 0.6,
      fontFace: 'Calibri',
      fontSize: 20,
      color: theme.coverMuted,
      align: 'center',
    });

    closing.addText(
      [meta.presenter.trim(), meta.institution.trim()].filter(Boolean).join('  ·  '),
      {
        x: 1,
        y: 5.3,
        w: 11.333,
        h: 0.5,
        fontFace: 'Calibri',
        fontSize: 14,
        color: theme.coverMuted,
        align: 'center',
      }
    );
  }

  const filename = toSafeFilenameSlug(meta.title);
  await pptx.writeFile({ fileName: filename });
  return filename;
}
