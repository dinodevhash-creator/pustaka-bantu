interface KVListKey<M = unknown> {
  name: string;
  expiration?: number;
  metadata?: M;
}

interface KVListResult<M = unknown> {
  keys: KVListKey<M>[];
  list_complete: boolean;
  cursor?: string;
}

interface KVNamespaceBinding {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { metadata?: Record<string, unknown> }
  ): Promise<void>;
  list<M = unknown>(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<KVListResult<M>>;
}

interface Env {
  PUSTAKA_KV?: KVNamespaceBinding;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const VALID_GUIDE_IDS = new Set<string>([
  'cara-memilih-topik-skripsi',
  'struktur-bab-skripsi',
  'menulis-latar-belakang-masalah',
  'tips-bimbingan-dengan-dosen',
  'persiapan-sidang-skripsi',
  'menghindari-plagiarisme',
  'format-sitasi-apa-harvard-ieee',
  'menulis-abstrak-yang-baik',
  'menulis-esai-dan-makalah',
  'mencari-jurnal-ilmiah-gratis',
  'cara-membaca-jurnal-dengan-cepat',
  'akreditasi-jurnal-sinta-dan-scopus',
  'menulis-tinjauan-pustaka',
  'teknik-belajar-efektif',
  'persiapan-uts-dan-uas',
  'mencatat-dengan-metode-cornell',
  'teknik-pomodoro',
  'cara-aktif-di-kelas-dan-diskusi',
  'memilih-uji-statistik',
  'menentukan-ukuran-sampel',
  'kuesioner-yang-valid-dan-reliabel',
  'mengatur-jadwal-kuliah-dan-tugas',
  'mengatasi-prokrastinasi',
  'menyeimbangkan-organisasi-dan-kuliah',
  'mencari-beasiswa',
  'menulis-esai-beasiswa',
  'mengatur-keuangan-bulanan',
  'menyusun-cv-mahasiswa',
  'mencari-magang',
  'persiapan-wawancara-kerja',
  'mengatasi-stres-dan-burnout',
  'kapan-harus-mencari-bantuan-profesional',
  'aplikasi-pendukung-kuliah',
  'bantuan-ai-untuk-belajar',
  'menyiapkan-slide-presentasi',
]);

const KEY_PREFIX = 'like:';
const MAX_BODY_BYTES = 4096;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function buildZeroCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of VALID_GUIDE_IDS) {
    counts[id] = 0;
  }
  return counts;
}

async function readAllCounts(kv: KVNamespaceBinding): Promise<Record<string, number>> {
  const counts = buildZeroCounts();
  let cursor: string | undefined;

  do {
    const listed = await kv.list<{ count?: number }>({
      prefix: KEY_PREFIX,
      limit: 1000,
      cursor,
    });

    for (const item of listed.keys) {
      const guideId = item.name.slice(KEY_PREFIX.length);
      if (!VALID_GUIDE_IDS.has(guideId)) continue;
      const metaCount = item.metadata?.count;
      if (typeof metaCount === 'number' && Number.isInteger(metaCount) && metaCount >= 0) {
        counts[guideId] = metaCount;
      } else {
        const raw = await kv.get(item.name);
        const parsed = raw ? Number.parseInt(raw, 10) : 0;
        counts[guideId] = Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
      }
    }

    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);

  return counts;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const kv = context.env.PUSTAKA_KV;
  if (!kv) {
    return jsonResponse(
      {
        error: 'Binding KV PUSTAKA_KV belum dikonfigurasi di Cloudflare Pages.',
        counts: buildZeroCounts(),
      },
      503
    );
  }

  try {
    const counts = await readAllCounts(kv);
    return jsonResponse({ counts });
  } catch {
    return jsonResponse(
      { error: 'Gagal membaca jumlah suka dari penyimpanan KV.' },
      500
    );
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const kv = context.env.PUSTAKA_KV;
  if (!kv) {
    return jsonResponse(
      { error: 'Binding KV PUSTAKA_KV belum dikonfigurasi di Cloudflare Pages.' },
      503
    );
  }

  const contentLengthHeader = context.request.headers.get('content-length');
  if (contentLengthHeader && Number(contentLengthHeader) > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Ukuran permintaan terlalu besar.' }, 413);
  }

  let body: { guideId?: unknown; action?: unknown } | null = null;
  try {
    const rawText = await context.request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Ukuran permintaan terlalu besar.' }, 413);
    }
    body = JSON.parse(rawText) as { guideId?: unknown; action?: unknown };
  } catch {
    return jsonResponse({ error: 'Format JSON tidak valid.' }, 400);
  }

  const guideId = typeof body?.guideId === 'string' ? body.guideId : '';
  const action = typeof body?.action === 'string' ? body.action : '';

  if (!VALID_GUIDE_IDS.has(guideId)) {
    return jsonResponse({ error: 'ID panduan tidak valid.' }, 400);
  }

  if (action !== 'like' && action !== 'unlike') {
    return jsonResponse({ error: 'Aksi harus berupa like atau unlike.' }, 400);
  }

  try {
    const key = `${KEY_PREFIX}${guideId}`;
    const existingRaw = await kv.get(key);
    const parsedExisting = existingRaw ? Number.parseInt(existingRaw, 10) : 0;
    const current = Number.isInteger(parsedExisting) && parsedExisting >= 0 ? parsedExisting : 0;
    const next = action === 'like' ? current + 1 : Math.max(0, current - 1);

    await kv.put(key, String(next), { metadata: { count: next } });

    return jsonResponse({ guideId, count: next });
  } catch {
    return jsonResponse(
      { error: 'Gagal menyimpan pembaruan suka ke penyimpanan KV.' },
      500
    );
  }
}
