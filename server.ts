import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GUIDES } from './src/data/guides.ts';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const VALID_GUIDE_IDS = new Set<string>(GUIDES.map((g) => g.id));
const DATA_DIR = path.resolve(process.cwd(), 'data');
const COUNTS_FILE = path.join(DATA_DIR, 'helpful-counts.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadCounts(): Record<string, number> {
  const counts: Record<string, number> = Object.create(null);
  for (const id of VALID_GUIDE_IDS) {
    counts[id] = 0;
  }

  try {
    if (!fs.existsSync(COUNTS_FILE)) {
      return counts;
    }
    const raw = fs.readFileSync(COUNTS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      for (const id of VALID_GUIDE_IDS) {
        const val = parsed[id];
        if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
          counts[id] = val;
        }
      }
    }
  } catch {
    // Fall back to zero-initialized counts if file cannot be read
  }

  return counts;
}

function saveCounts(counts: Record<string, number>): void {
  ensureDataDir();
  const safePayload: Record<string, number> = {};
  for (const id of VALID_GUIDE_IDS) {
    safePayload[id] = Math.max(0, Math.floor(counts[id] || 0));
  }
  const tmpFile = `${COUNTS_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(safePayload, null, 2), 'utf8');
  fs.renameSync(tmpFile, COUNTS_FILE);
}

// Lightweight in-memory sliding window rate limit per IP for vote mutations
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(ip);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX_REQUESTS;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4kb' }));

  let helpfulCounts = loadCounts();

  app.get('/api/helpful', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ counts: helpfulCounts });
  });

  app.post('/api/helpful', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar.' });
      return;
    }

    const body = req.body as { guideId?: unknown; action?: unknown } | null;
    const guideId = typeof body?.guideId === 'string' ? body.guideId : '';
    const action = typeof body?.action === 'string' ? body.action : '';

    if (!VALID_GUIDE_IDS.has(guideId)) {
      res.status(400).json({ error: 'ID panduan tidak valid.' });
      return;
    }

    if (action !== 'like' && action !== 'unlike') {
      res.status(400).json({ error: 'Aksi harus berupa like atau unlike.' });
      return;
    }

    const current = helpfulCounts[guideId] || 0;
    const next = action === 'like' ? current + 1 : Math.max(0, current - 1);
    helpfulCounts[guideId] = next;

    try {
      saveCounts(helpfulCounts);
    } catch {
      // Keep updated count in memory even if disk write fails
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({ guideId, count: next, counts: helpfulCounts });
  });

  const SEARCH_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

  const decodeEntities = (input: string): string =>
    input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_m, code) => {
        const n = Number(code);
        return Number.isFinite(n) ? String.fromCharCode(n) : '';
      })
      .replace(/\s+/g, ' ')
      .trim();

  const stripHtmlTags = (html: string): string => decodeEntities(html.replace(/<[^>]+>/g, ' '));

  const normalizeExternalUrl = (raw: string): { url: string; domain: string } | null => {
    try {
      let candidate = decodeEntities(raw);
      const uddg = candidate.match(/[?&]uddg=([^&]+)/);
      if (uddg) candidate = decodeURIComponent(uddg[1]);
      if (candidate.startsWith('//')) candidate = `https:${candidate}`;
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      return {
        url: parsed.toString(),
        domain: parsed.hostname.replace(/^www\./i, ''),
      };
    } catch {
      return null;
    }
  };

  app.get('/api/search-web', async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({ error: 'Terlalu banyak permintaan. Coba sebentar lagi.', results: [] });
      return;
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 200) : '';
    if (!q) {
      res.status(400).json({ error: 'Kata kunci pencarian wajib diisi.', results: [] });
      return;
    }

    type WebItem = {
      title: string;
      url: string;
      domain: string;
      snippet: string;
      source: 'web' | 'wikipedia';
    };

    const fetchWiki = async (): Promise<WebItem[]> => {
      const wRes = await fetch(
        `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          q
        )}&format=json&srlimit=5`,
        {
          headers: { 'User-Agent': 'PustakaBantuMahasiswa/1.0' },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (!wRes.ok) return [];
      const wJson = (await wRes.json()) as {
        query?: { search?: Array<{ title?: string; snippet?: string; pageid?: number }> };
      };
      return (wJson.query?.search || [])
        .filter((item) => item.title && item.pageid)
        .map((item) => ({
          title: `${item.title} — Wikipedia Indonesia`,
          url: `https://id.wikipedia.org/?curid=${item.pageid}`,
          domain: 'id.wikipedia.org',
          snippet: stripHtmlTags(item.snippet || ''),
          source: 'wikipedia' as const,
        }));
    };

    try {
      const ddgRes = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=id-id`,
        {
          headers: {
            'User-Agent': SEARCH_UA,
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      const results: WebItem[] = [];
      const seen = new Set<string>();

      if (ddgRes.ok) {
        const html = await ddgRes.text();
        const blocks = html.split(/<div class="result results_links/i).slice(1);
        for (const block of blocks) {
          if (results.length >= 12) break;
          const linkMatch = block.match(
            /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
          );
          if (!linkMatch) continue;
          const normalized = normalizeExternalUrl(linkMatch[1]);
          if (!normalized || seen.has(normalized.url)) continue;
          if (normalized.domain.includes('duckduckgo.com')) continue;
          const title = stripHtmlTags(linkMatch[2]);
          if (!title) continue;
          const snipMatch =
            block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) ||
            block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
          seen.add(normalized.url);
          results.push({
            title,
            url: normalized.url,
            domain: normalized.domain,
            snippet: snipMatch ? stripHtmlTags(snipMatch[1]) : '',
            source: 'web',
          });
        }
      }

      if (results.length < 3) {
        const wikiItems = await fetchWiki().catch(() => []);
        for (const item of wikiItems) {
          if (!seen.has(item.url)) {
            seen.add(item.url);
            results.push(item);
          }
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json({ query: q, results });
    } catch {
      try {
        const wikiItems = await fetchWiki();
        res.json({ query: q, results: wikiItems });
      } catch {
        res.status(502).json({ error: 'Gagal memuat hasil pencarian web.', results: [] });
      }
    }
  });

  app.get('/api/search-youtube', async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({ error: 'Terlalu banyak permintaan. Coba sebentar lagi.', results: [] });
      return;
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 200) : '';
    if (!q) {
      res.status(400).json({ error: 'Kata kunci video wajib diisi.', results: [] });
      return;
    }

    const extractYtText = (obj: unknown): string => {
      if (!obj || typeof obj !== 'object') return '';
      const rec = obj as { simpleText?: unknown; runs?: Array<{ text?: unknown }> };
      if (typeof rec.simpleText === 'string') return rec.simpleText.trim();
      if (Array.isArray(rec.runs)) {
        return rec.runs
          .map((r) => (typeof r?.text === 'string' ? r.text : ''))
          .join('')
          .trim();
      }
      return '';
    };

    try {
      const ytRes = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
        {
          headers: {
            'User-Agent': SEARCH_UA,
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: AbortSignal.timeout(9000),
        }
      );

      if (!ytRes.ok) {
        res.status(502).json({ error: 'YouTube sedang tidak dapat dijangkau.', results: [] });
        return;
      }

      const html = await ytRes.text();
      const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
      if (!match) {
        res.json({ query: q, results: [] });
        return;
      }

      const data = JSON.parse(match[1]) as unknown;
      const results: Array<{
        id: string;
        title: string;
        channel: string;
        duration: string;
        views: string;
        published: string;
        thumbnail: string;
        url: string;
      }> = [];
      const seen = new Set<string>();

      const walk = (node: unknown): void => {
        if (!node || typeof node !== 'object' || results.length >= 16) return;
        if (Array.isArray(node)) {
          for (const item of node) {
            walk(item);
            if (results.length >= 16) return;
          }
          return;
        }
        const rec = node as Record<string, unknown>;
        const v = rec.videoRenderer as Record<string, unknown> | undefined;
        if (
          v &&
          typeof v.videoId === 'string' &&
          /^[a-zA-Z0-9_-]{11}$/.test(v.videoId) &&
          !seen.has(v.videoId)
        ) {
          const title = extractYtText(v.title);
          if (title) {
            seen.add(v.videoId);
            const thumbs = (v.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)
              ?.thumbnails;
            const bestThumb = thumbs?.[thumbs.length - 1]?.url || '';
            const safeThumb = bestThumb.startsWith('https://')
              ? bestThumb
              : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
            results.push({
              id: v.videoId,
              title,
              channel: extractYtText(v.ownerText) || extractYtText(v.longBylineText) || 'YouTube',
              duration: extractYtText(v.lengthText),
              views: extractYtText(v.shortViewCountText) || extractYtText(v.viewCountText),
              published: extractYtText(v.publishedTimeText),
              thumbnail: safeThumb,
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
            });
          }
        }
        for (const k of Object.keys(rec)) {
          walk(rec[k]);
          if (results.length >= 16) return;
        }
      };

      walk(data);
      res.setHeader('Cache-Control', 'public, max-age=180');
      res.json({ query: q, results });
    } catch {
      res.status(502).json({ error: 'Gagal memuat hasil video YouTube.', results: [] });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Pustaka Bantu server running on http://${HOST}:${PORT}`);
  });
}

startServer();
