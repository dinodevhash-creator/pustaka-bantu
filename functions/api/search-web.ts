interface PagesContext {
  request: Request;
}

interface WebSearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  source: 'web' | 'wikipedia';
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=120',
    },
  });
}

function decodeHtmlEntities(input: string): string {
  return input
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
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' '));
}

function normalizeHttpUrl(raw: string): { url: string; domain: string } | null {
  try {
    let candidate = decodeHtmlEntities(raw);
    const uddg = candidate.match(/[?&]uddg=([^&]+)/);
    if (uddg) {
      candidate = decodeURIComponent(uddg[1]);
    }
    if (candidate.startsWith('//')) {
      candidate = `https:${candidate}`;
    }
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return {
      url: parsed.toString(),
      domain: parsed.hostname.replace(/^www\./i, ''),
    };
  } catch {
    return null;
  }
}

async function fetchDuckDuckGoResults(query: string): Promise<WebSearchResult[]> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=id-id`,
    {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) return [];

  const html = await res.text();
  const blocks = html.split(/<div class="result results_links/i).slice(1);
  const results: WebSearchResult[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    if (results.length >= 12) break;
    const linkMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const normalized = normalizeHttpUrl(linkMatch[1]);
    if (!normalized || seen.has(normalized.url)) continue;
    if (normalized.domain.includes('duckduckgo.com')) continue;

    const snippetMatch =
      block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);

    const title = stripTags(linkMatch[2]);
    if (!title) continue;

    seen.add(normalized.url);
    results.push({
      title,
      url: normalized.url,
      domain: normalized.domain,
      snippet: snippetMatch ? stripTags(snippetMatch[1]) : '',
      source: 'web',
    });
  }

  return results;
}

async function fetchWikipediaIdResults(query: string): Promise<WebSearchResult[]> {
  const url = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&srlimit=5`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PustakaBantuMahasiswa/1.0' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: { search?: Array<{ title?: string; snippet?: string; pageid?: number }> };
  };

  return (data.query?.search || [])
    .filter((item) => item.title && item.pageid)
    .map((item) => ({
      title: `${item.title} — Wikipedia Indonesia`,
      url: `https://id.wikipedia.org/?curid=${item.pageid}`,
      domain: 'id.wikipedia.org',
      snippet: stripTags(item.snippet || ''),
      source: 'wikipedia' as const,
    }));
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const reqUrl = new URL(context.request.url);
  const q = (reqUrl.searchParams.get('q') || '').trim().slice(0, 200);
  if (!q) {
    return jsonResponse({ error: 'Kata kunci pencarian wajib diisi.', results: [] }, 400);
  }

  try {
    let results = await fetchDuckDuckGoResults(q);
    if (results.length < 3) {
      const wiki = await fetchWikipediaIdResults(q).catch(() => []);
      const existing = new Set(results.map((r) => r.url));
      for (const item of wiki) {
        if (!existing.has(item.url)) {
          results.push(item);
        }
      }
    }
    return jsonResponse({ query: q, results });
  } catch {
    try {
      const wiki = await fetchWikipediaIdResults(q);
      return jsonResponse({ query: q, results: wiki });
    } catch {
      return jsonResponse({ error: 'Gagal memuat hasil pencarian web.', results: [] }, 502);
    }
  }
}
