/* Bunny Stream -> channel playlists. One Bunny collection per channel.

   A collection feeds a channel when its name matches the channel's id, its
   name, or starts with its number: "Tattase TV", "tattasetv", "10 Tattase TV"
   and "10 - anything" all feed channel 10. Accents and symbols are ignored
   ("C-Suite Café TV" = "csuitecafetv", "Asiko TV+" = "asikotvplus").
   Videos play in title order; a leading "01 ", "02 - " … sets the order and
   is dropped from the on-air title. Only finished encodes are used. */

import { probe as probeHls } from './hls.mjs';

const FINISHED = new Set([4]);

export const norm = (s) => String(s)
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]/g, '');

export function matcher(lineup) {
  const byKey = new Map();
  const byNum = new Map();
  for (const c of lineup) {
    byKey.set(norm(c.id), c);
    byKey.set(norm(c.name), c);
    byNum.set(Number(c.num), c);
  }
  return (collectionName) => {
    const key = norm(collectionName);
    if (byKey.has(key)) return byKey.get(key);
    const m = String(collectionName).trim().match(/^(?:ch(?:annel)?\s*)?(\d{1,3})(?:\b|[\s\-._])/i);
    return m ? byNum.get(Number(m[1])) ?? null : null;
  };
}

export const cleanTitle = (t) => String(t).replace(/^\d{2,3}(\s*[-.)_]\s*|\s+)/, '').trim() || String(t);

/**
 * @returns {Promise<{playlists: Map<string, object>, report: object[], unmatched: string[], skipped: string[]}>}
 */
export async function buildPlaylists({ libraryId, apiKey, cdnHost, lineup, apiBase = 'https://video.bunnycdn.com', probe = false }) {
  const base = `${apiBase.replace(/\/$/, '')}/library/${libraryId}`;
  async function api(path) {
    const res = await fetch(`${base}${path}`, {
      headers: { AccessKey: apiKey, accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Bunny API ${path.split('?')[0]} -> HTTP ${res.status}`);
    return res.json();
  }
  async function all(path) {
    const out = [];
    for (let page = 1; page < 100; page++) {
      const r = await api(`${path}${path.includes('?') ? '&' : '?'}page=${page}&itemsPerPage=1000`);
      out.push(...(r.items || []));
      if (!r.items?.length || out.length >= (r.totalItems ?? out.length)) break;
    }
    return out;
  }

  const match = matcher(lineup);
  const playlists = new Map();
  const report = [];
  const unmatched = [];
  const skipped = [];

  for (const col of await all('/collections')) {
    const ch = match(col.name);
    if (!ch) { unmatched.push(col.name); continue; }
    const videos = await all(`/videos?collection=${encodeURIComponent(col.guid)}&orderBy=title`);
    videos.sort((a, b) => String(a.title).localeCompare(String(b.title), 'en', { numeric: true }));
    const items = playlists.get(ch.id)?.items ?? [];
    let skippedHere = 0;
    for (const v of videos) {
      if (!FINISHED.has(v.status)) { skipped.push(`[${ch.name}] ${v.title} — still encoding (status ${v.status})`); skippedHere++; continue; }
      const hlsUrl = `${cdnHost.includes('://') ? cdnHost.replace(/\/$/, '') : `https://${cdnHost}`}/${v.guid}/playlist.m3u8`;
      let durationSec = Math.round(Number(v.length) || 0);
      if (probe) {
        const r = await probeHls(hlsUrl, { timeoutMs: 10000 });
        if (!r.ok) { skipped.push(`[${ch.name}] ${v.title} — ${r.error}`); skippedHere++; continue; }
        durationSec = Math.round(r.durationSec);
      }
      items.push({ id: v.guid, title: cleanTitle(v.title), hlsUrl, durationSec });
    }
    playlists.set(ch.id, { channel: ch.id, name: ch.name, source: `bunny:${col.name}`, updatedAt: new Date().toISOString(), items });
    report.push({ num: ch.num, channel: ch.name, collection: col.name, videos: items.length, hours: +(items.reduce((a, it) => a + it.durationSec, 0) / 3600).toFixed(1), skipped: skippedHere });
  }
  report.sort((a, b) => a.num - b.num);
  return { playlists, report, unmatched, skipped };
}
