interface PagesContext {
  request: Request;
}

interface YouTubeSearchItem {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  published: string;
  thumbnail: string;
  url: string;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=180',
    },
  });
}

function isValidVideoId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function extractText(obj: unknown): string {
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
}

function extractVideosFromInitialData(data: unknown): YouTubeSearchItem[] {
  const results: YouTubeSearchItem[] = [];
  const seen = new Set<string>();

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object' || results.length >= 16) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
        if (results.length >= 16) return;
      }
      return;
    }

    const record = node as Record<string, unknown>;
    const v = record.videoRenderer as Record<string, unknown> | undefined;
    if (v && isValidVideoId(v.videoId) && !seen.has(v.videoId)) {
      const title = extractText(v.title);
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
          channel: extractText(v.ownerText) || extractText(v.longBylineText) || 'YouTube',
          duration: extractText(v.lengthText),
          views: extractText(v.shortViewCountText) || extractText(v.viewCountText),
          published: extractText(v.publishedTimeText),
          thumbnail: safeThumb,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
        });
      }
    }

    for (const key of Object.keys(record)) {
      walk(record[key]);
      if (results.length >= 16) return;
    }
  }

  walk(data);
  return results;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const reqUrl = new URL(context.request.url);
  const q = (reqUrl.searchParams.get('q') || '').trim().slice(0, 200);
  if (!q) {
    return jsonResponse({ error: 'Kata kunci video wajib diisi.', results: [] }, 400);
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(9000),
      }
    );

    if (!res.ok) {
      return jsonResponse({ error: 'YouTube sedang tidak dapat dijangkau.', results: [] }, 502);
    }

    const html = await res.text();
    const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
    if (!match) {
      return jsonResponse({ query: q, results: [] });
    }

    const parsed = JSON.parse(match[1]) as unknown;
    const results = extractVideosFromInitialData(parsed);
    return jsonResponse({ query: q, results });
  } catch {
    return jsonResponse({ error: 'Gagal memuat hasil video YouTube.', results: [] }, 502);
  }
}
