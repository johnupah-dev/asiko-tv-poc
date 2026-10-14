/* Asiko Scheduler — HTTP service. Built by Media Icons Africa.

   Endpoints
     GET /nextVod/:channel     Channel Engine WebHook plugin (what plays next)
     GET /epg                  now/next for every channel (viewer TV guide)
     GET /epg/:channel         full guide for one channel, next 3 hours (?hours=)
     GET /asrun/:channel       proof-of-play log (?limit=)
     GET /health               service + per-channel playlist health
     POST /reload              re-read playlists now (needs ADMIN_KEY)

   Environment
     PORT            default 8080
     PLAYLIST_DIR    default ./playlists      (one <channel>.json per channel)
     PLAYLIST_BASE   optional URL; <base>/<channel>.json overrides disk copies,
                     so playlists can change without redeploying this service
     BUNNY_LIBRARY_ID, BUNNY_API_KEY, BUNNY_CDN_HOST
                     when set, channels are pulled straight from Bunny Stream
                     collections on every reload (upload -> on air in minutes);
                     a failed pull keeps the last good playlists
     ADS_FILE        default ./ads.json
     SLATE_URL       HLS VOD played when a channel has nothing playable
     SLATE_TITLE     default "Asiko TV — back shortly"
     SLATE_DURATION  seconds, default 60
     ADMIN_KEY       required for POST /reload
     RELOAD_MIN      minutes between automatic playlist reloads, default 5 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Scheduler } from './lib/scheduler.mjs';
import { probe } from './lib/hls.mjs';
import { buildPlaylists } from './lib/bunny.mjs';
import { loadLineup } from './lib/lineup.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;
const PORT = Number(env.PORT || 8080);
const PLAYLIST_DIR = path.resolve(here, env.PLAYLIST_DIR || 'playlists');
const ADS_FILE = path.resolve(here, env.ADS_FILE || 'ads.json');
const RELOAD_MS = Number(env.RELOAD_MIN || 5) * 60 * 1000;

const log = (...a) => console.log(new Date().toISOString(), ...a);

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

const ads = await readJson(ADS_FILE, null);
const slate = env.SLATE_URL
  ? { title: env.SLATE_TITLE || 'Asiko TV — back shortly', hlsUrl: env.SLATE_URL, durationSec: Number(env.SLATE_DURATION || 60) }
  : null;

const sched = new Scheduler({ check: (url) => probe(url), slate, ads });

async function remotePlaylist(id) {
  if (!env.PLAYLIST_BASE) return null;
  try {
    const res = await fetch(`${env.PLAYLIST_BASE.replace(/\/$/, '')}/${id}.json`, { signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

const lineup = await loadLineup();
const known = new Set(lineup.map((c) => c.id));
let lastBunny = { at: null, ok: null, error: null, report: [], unmatched: [] };

async function bunnyPlaylists() {
  if (!(env.BUNNY_LIBRARY_ID && env.BUNNY_API_KEY && env.BUNNY_CDN_HOST)) return null;
  try {
    const r = await buildPlaylists({
      libraryId: env.BUNNY_LIBRARY_ID, apiKey: env.BUNNY_API_KEY, cdnHost: env.BUNNY_CDN_HOST,
      apiBase: env.BUNNY_API_BASE, lineup,
    });
    lastBunny = { at: new Date().toISOString(), ok: true, error: null, report: r.report, unmatched: r.unmatched };
    return r.playlists;
  } catch (e) {
    lastBunny = { ...lastBunny, at: new Date().toISOString(), ok: false, error: e.message };
    log('bunny pull failed — keeping last good playlists:', e.message);
    return null;
  }
}

/** Load every playlist. Bunny beats PLAYLIST_BASE beats disk. A channel whose
    new copy fails to load keeps its last good playlist. */
async function loadPlaylists() {
  const fromBunny = await bunnyPlaylists();
  let loaded = 0;
  for (const id of known) {
    let doc = fromBunny?.get(id);
    if (!doc?.items?.length) doc = (await remotePlaylist(id)) ?? (await readJson(path.join(PLAYLIST_DIR, `${id}.json`), null));
    if (!doc || !Array.isArray(doc.items) || !doc.items.length) continue;
    sched.setPlaylist(id, doc.items);
    loaded++;
  }
  log(`playlists loaded: ${loaded} of ${known.size} channel(s)`);
  fillDurations();
  return loaded;
}

/** Measure items that arrived without a duration, so the guide is accurate. */
async function fillDurations() {
  for (const id of sched.channelIds()) {
    const ch = sched.channels.get(id);
    for (const it of ch.items) {
      if (it.durationSec) continue;
      const r = await probe(it.hlsUrl);
      if (r.ok) it.durationSec = Math.round(r.durationSec);
    }
  }
}

function send(res, code, body, extra = {}) {
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
    ...extra,
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (req.method === 'GET' && parts[0] === 'nextVod') {
      const id = (parts[1] || url.searchParams.get('channel') || url.searchParams.get('channelId') || '').toLowerCase();
      const out = await sched.nextVod(id);
      log(`nextVod ${id} -> ${out.title}${out.prerollUrl ? ' (+preroll)' : ''}`);
      return send(res, 200, out);
    }
    if (req.method === 'GET' && parts[0] === 'epg' && !parts[1]) {
      const all = {};
      for (const id of sched.channelIds()) {
        const g = sched.epg(id, 1);
        all[id] = { now: g.now, next: g.programmes.find((p) => p !== g.now) ?? null };
      }
      return send(res, 200, { generatedAt: Date.now(), channels: all }, { 'cache-control': 'public, max-age=30' });
    }
    if (req.method === 'GET' && parts[0] === 'epg') {
      const hours = Math.min(24, Math.max(1, Number(url.searchParams.get('hours') || 3)));
      const g = sched.epg(parts[1], hours);
      return g ? send(res, 200, g, { 'cache-control': 'public, max-age=30' }) : send(res, 404, { error: 'unknown channel' });
    }
    if (req.method === 'GET' && parts[0] === 'asrun' && parts[1]) {
      const limit = Math.min(500, Number(url.searchParams.get('limit') || 100));
      const r = sched.asRun(parts[1], limit);
      return r ? send(res, 200, { channel: parts[1], plays: r }) : send(res, 404, { error: 'unknown channel' });
    }
    if (req.method === 'GET' && (parts[0] === 'health' || parts.length === 0)) {
      return send(res, 200, { ok: true, service: 'asiko-scheduler', builtBy: 'Media Icons Africa', uptimeSec: Math.round(process.uptime()), slate: !!slate, houseAds: ads?.houseAds?.length || 0, lineup: known.size, onAir: sched.channelIds().length, bunny: lastBunny, channels: sched.status() });
    }
    if (req.method === 'POST' && parts[0] === 'reload') {
      if (!env.ADMIN_KEY || req.headers['x-admin-key'] !== env.ADMIN_KEY) return send(res, 401, { error: 'unauthorized' });
      return send(res, 200, { loaded: await loadPlaylists() });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    log('error', e);
    send(res, 500, { error: 'internal error' });
  }
});

await loadPlaylists();
setInterval(() => loadPlaylists().catch((e) => log('reload failed', e)), RELOAD_MS).unref();
server.listen(PORT, () => log(`asiko-scheduler listening on :${PORT}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
