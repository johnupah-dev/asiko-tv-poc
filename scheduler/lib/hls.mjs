/* HLS helpers: check that a VOD is playable and measure its length.
   No dependencies — Node 20+ global fetch. */

const DEFAULT_TIMEOUT_MS = 5000;

async function getText(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** Sum of #EXTINF durations in a media playlist, in seconds. */
export function mediaDuration(text) {
  let total = 0;
  for (const m of text.matchAll(/#EXTINF:\s*([0-9.]+)/g)) total += Number(m[1]);
  return total;
}

/** First variant URI of a master playlist, resolved against its URL. */
export function firstVariant(text, baseUrl) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j].trim();
        if (l && !l.startsWith('#')) return new URL(l, baseUrl).href;
      }
    }
  }
  return null;
}

/**
 * Probe an HLS VOD. Resolves to { ok: true, durationSec } when the master and
 * first media playlist load and contain segments; { ok: false, error } otherwise.
 * Never throws.
 */
export async function probe(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  try {
    const master = await getText(url, timeoutMs);
    if (!master.startsWith('#EXTM3U')) return { ok: false, error: 'not an HLS playlist' };
    let media = master;
    const variant = firstVariant(master, url);
    if (variant) media = await getText(variant, timeoutMs);
    const durationSec = mediaDuration(media);
    if (!durationSec) return { ok: false, error: 'playlist has no segments' };
    if (!/#EXT-X-ENDLIST/.test(media)) return { ok: false, error: 'not a finished VOD (no ENDLIST)' };
    return { ok: true, durationSec };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'timeout' : e.message };
  }
}
