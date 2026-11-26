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
