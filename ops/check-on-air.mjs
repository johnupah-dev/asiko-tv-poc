/* On-air check for Asiko TV — run by .github/workflows/on-air-monitor.yml
   every 10 minutes, or by hand: node ops/check-on-air.mjs

   Checks, in order of how much of the service they take down:
     1. the viewer site (SITE_URL, default https://www.asiko.africa)
     2. the network feed — every channel's fallback
     3. each channel's own feed (live playlist loads and is moving)
     4. the Asiko Scheduler, when SCHEDULER_URL is set (up, playlists loaded,
        broken uploads flagged)
   Prints a Markdown report to stdout and writes it to ops/on-air-report.md.
   Exit code 1 when anything is down, 0 when all is well (warnings allowed). */

import { readFile, writeFile } from 'node:fs/promises';

const SITE = process.env.SITE_URL || 'https://www.asiko.africa';
const SCHED = (process.env.SCHEDULER_URL || '').replace(/\/$/, '');
const cfg = JSON.parse(await readFile(new URL('../data/channels.json', import.meta.url), 'utf8'));

async function get(url, ms = 10000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms), redirect: 'follow', headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** A live HLS feed is healthy when its media playlist loads, has segments, and moves. */
async function liveFeed(url) {
  const master = await get(url);
  if (!master.startsWith('#EXTM3U')) throw new Error('not an HLS playlist');
  const line = master.split(/\r?\n/).find((l, i, a) => i > 0 && a[i - 1].startsWith('#EXT-X-STREAM-INF'));
  const mediaUrl = line ? new URL(line.trim(), url).href : url;
  const seq = (t) => Number((t.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/) || [])[1] ?? NaN);
  const a = await get(mediaUrl);
  if (!/#EXTINF/.test(a)) throw new Error('no segments');
  const target = Number((a.match(/#EXT-X-TARGETDURATION:(\d+)/) || [])[1] || 6);
  await new Promise((r) => setTimeout(r, Math.min(15, target + 2) * 1000));
  const b = await get(mediaUrl);
  if (seq(a) === seq(b) && a === b) throw new Error('stalled — playlist not advancing');
  return 'live';
}

const rows = [];
const down = [];
const warn = [];
const add = (name, ok, detail, level = 'down') => {
  rows.push(`| ${ok ? '🟢' : level === 'warn' ? '🟡' : '🔴'} | ${name} | ${detail} |`);
  if (!ok) (level === 'warn' ? warn : down).push(`${name}: ${detail}`);
};

try {
  const html = await get(SITE);
  add('Viewer site', /Asiko/i.test(html), SITE);
} catch (e) { add('Viewer site', false, `${SITE} — ${e.message}`); }

const feeds = new Map([[cfg.networkFeed, 'Network feed (fallback for every channel)']]);
for (const c of cfg.channels) if (c.src) feeds.set(c.src, `${String(c.num).padStart(2, '0')} ${c.name}`);
await Promise.all([...feeds].map(async ([url, name]) => {
  try { add(name, true, await liveFeed(url)); } catch (e) { add(name, false, e.message); }
}));

if (SCHED) {
  try {
    const h = JSON.parse(await get(`${SCHED}/health`));
    add('Scheduler', !!h.ok, `${h.onAir} channel(s) with content, up ${Math.round(h.uptimeSec / 60)} min`);
    if (h.bunny && h.bunny.ok === false) add('Scheduler ← Bunny', false, `last pull failed: ${h.bunny.error}`, 'warn');
    for (const [id, s] of Object.entries(h.channels || {})) {
      if (s.broken?.length) add(`Uploads on ${id}`, false, `${s.broken.length} file(s) skipped: ${s.broken.map((b) => `${b.title} (${b.error})`).join('; ')}`, 'warn');
    }
  } catch (e) { add('Scheduler', false, `${SCHED} — ${e.message}`); }
}

const status = down.length ? `🔴 ${down.length} problem(s) on air` : warn.length ? `🟡 on air, ${warn.length} warning(s)` : '🟢 all on air';
const report = [
  `## ${status}`,
  `Checked ${new Date().toISOString()} — ${feeds.size} feed(s)${SCHED ? ' + scheduler' : ''}.`,
  '',
  '| | Check | Detail |',
  '|---|---|---|',
  ...rows.sort((a, b) => (a.includes('🔴') ? -1 : b.includes('🔴') ? 1 : 0)),
].join('\n');
console.log(report);
await writeFile(new URL('./on-air-report.md', import.meta.url), report + '\n');
process.exit(down.length ? 1 : 0);
