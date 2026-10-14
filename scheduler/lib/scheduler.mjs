/* Asiko Scheduler core — decides what each linear channel plays next.

   Eyevinn Channel Engine (WebHook plugin) calls GET /nextVod/<channel> whenever
   it needs the next VOD. This module answers it and, in doing so:
     - rotates through the channel's playlist, starting at a wall-clock position
       so a restart does not send every channel back to item 1;
     - checks each VOD before handing it out and skips broken ones;
     - falls back to a slate VOD when nothing on the channel is playable;
     - inserts house-ad pre-rolls every N items;
     - keeps an as-run log, which drives the real TV guide (EPG) and is the
       proof-of-play record for advertisers.
   Pure logic plus an injectable `check` function, so it is testable offline. */

const OK_TTL_MS = 10 * 60 * 1000;   // re-check a good VOD every 10 min
const BAD_TTL_MS = 2 * 60 * 1000;   // retry a broken VOD after 2 min
const AS_RUN_MAX = 500;             // entries kept per channel in memory

export class Scheduler {
  /**
   * @param {object} o
   * @param {(url:string)=>Promise<{ok:boolean,error?:string}>} o.check  VOD health check
   * @param {{title:string,hlsUrl:string,durationSec:number}} [o.slate]  fallback VOD
   * @param {{every:number, houseAds:{name:string,hlsUrl:string,durationMs:number}[]}} [o.ads]
   * @param {()=>number} [o.now]  clock (ms), injectable for tests
   */
  constructor({ check, slate = null, ads = null, now = () => Date.now() } = {}) {
    if (typeof check !== 'function') throw new Error('Scheduler needs a check() function');
    this.check = check;
    this.slate = slate;
    this.ads = ads && ads.every > 0 && ads.houseAds?.length ? ads : null;
    this.now = now;
    this.channels = new Map();   // id -> { items, pos, asRun, plays, adPos, started }
    this.health = new Map();     // hlsUrl -> { ok, error, at }
  }

  /** Replace a channel's playlist. Keeps the rotation position when it can. */
  setPlaylist(id, items) {
    const clean = (items || []).filter((it) => it && it.hlsUrl).map((it, i) => ({
      id: String(it.id ?? i),
      title: String(it.title ?? `Item ${i + 1}`),
      hlsUrl: String(it.hlsUrl),
      durationSec: Number(it.durationSec) > 0 ? Number(it.durationSec) : 0,
    }));
    const prev = this.channels.get(id);
    const ch = prev ?? { asRun: [], plays: 0, adPos: 0, pos: null };
    ch.items = clean;
    if (prev && prev.pos != null && clean.length) ch.pos = prev.pos % clean.length;
    else ch.pos = null; // decided on first call, from the wall clock
    this.channels.set(id, ch);
    return clean.length;
  }

  channelIds() { return [...this.channels.keys()]; }

  async isPlayable(url) {
    const t = this.now();
    const h = this.health.get(url);
    if (h && t - h.at < (h.ok ? OK_TTL_MS : BAD_TTL_MS)) return h.ok;
    let r;
    try { r = await this.check(url); } catch (e) { r = { ok: false, error: e.message }; }
    this.health.set(url, { ok: !!r.ok, error: r.ok ? null : r.error || 'failed', at: t, durationSec: r.durationSec || 0 });
    return !!r.ok;
  }

  /** Wall-clock start position, so restarts land mid-rotation, not on item 1. */
  wallClockPos(ch) {
    const total = ch.items.reduce((a, it) => a + (it.durationSec || 1800), 0);
    if (!total) return 0;
    let t = Math.floor(this.now() / 1000) % total;
    for (let i = 0; i < ch.items.length; i++) {
      t -= ch.items[i].durationSec || 1800;
      if (t < 0) return i;
    }
    return 0;
  }

  /** The response Channel Engine's WebHook plugin expects. Never throws. */
  async nextVod(id) {
    const ch = this.channels.get(id);
    let pick = null;
    if (ch && ch.items.length) {
      if (ch.pos == null) ch.pos = this.wallClockPos(ch);
      for (let tries = 0; tries < ch.items.length; tries++) {
        const it = ch.items[ch.pos];
        ch.pos = (ch.pos + 1) % ch.items.length;
        if (await this.isPlayable(it.hlsUrl)) {
          // learn the real length from the check, so the guide is right
          if (!it.durationSec) it.durationSec = Math.round(this.health.get(it.hlsUrl)?.durationSec || 0);
          pick = it;
          break;
        }
      }
    }
    const isSlate = !pick;
    if (isSlate) {
      if (!this.slate) return { id: 'none', title: 'Off air', hlsUrl: null, error: 'no playable VOD and no slate' };
      pick = { id: 'slate', ...this.slate };
    }

    const out = { id: `${id}-${pick.id}-${Date.now().toString(36)}`, title: pick.title, hlsUrl: pick.hlsUrl };
    let ad = null;
    if (ch && !isSlate) {
      ch.plays++;
      if (this.ads && ch.plays % this.ads.every === 0) {
        ad = this.ads.houseAds[ch.adPos++ % this.ads.houseAds.length];
        out.prerollUrl = ad.hlsUrl;
        out.prerollDurationMs = ad.durationMs;
      }
    }
    if (ch) this.logAsRun(ch, pick, isSlate, ad ? ad.name : null, ad ? ad.durationMs : 0);
    return out;
  }

  logAsRun(ch, item, isSlate, adName, adMs) {
    const t = this.now();
    const last = ch.asRun[ch.asRun.length - 1];
    const lastEnd = last ? last.start + (last.adMs || 0) + (last.durationSec || 0) * 1000 : 0;
    // Channel Engine asks for the next VOD ahead of time, so the item starts
    // when the previous one ends — or now, after a gap or restart.
    const start = Math.max(t, lastEnd);
    ch.asRun.push({ calledAt: t, start, title: item.title, itemId: item.id, durationSec: item.durationSec || 0, slate: isSlate, ad: adName, adMs });
    if (ch.asRun.length > AS_RUN_MAX) ch.asRun.splice(0, ch.asRun.length - AS_RUN_MAX);
    ch.started = ch.started ?? t;
  }

  /** Now + upcoming programmes for the TV guide, covering `hours` ahead. */
  epg(id, hours = 3) {
    const ch = this.channels.get(id);
    if (!ch) return null;
    const t = this.now();
    const until = t + hours * 3600 * 1000;
    const entries = [];
    for (const r of ch.asRun) {
      const end = r.start + (r.adMs || 0) + r.durationSec * 1000;
      if (end > t - 3600 * 1000) entries.push({ title: r.title, start: r.start, end, slate: r.slate, confirmed: true });
    }
    // project the rotation forward from the scheduler's position
    if (ch.items.length) {
      let pos = ch.pos ?? this.wallClockPos(ch);
      let cursor = entries.length ? entries[entries.length - 1].end : t;
      let guard = 0;
      while (cursor < until && guard++ < 500) {
        const it = ch.items[pos];
        pos = (pos + 1) % ch.items.length;
        const h = this.health.get(it.hlsUrl);
        if (h && !h.ok) continue; // known-broken items will be skipped on air
        const dur = (it.durationSec || 1800) * 1000;
        entries.push({ title: it.title, start: cursor, end: cursor + dur, confirmed: false });
        cursor += dur;
      }
    }
    const now = entries.find((e) => e.start <= t && t < e.end) ?? null;
    return { channel: id, generatedAt: t, now, programmes: entries.filter((e) => e.end > t) };
  }

  asRun(id, limit = 100) {
    const ch = this.channels.get(id);
    return ch ? ch.asRun.slice(-limit) : null;
  }

  status() {
    const out = {};
    for (const [id, ch] of this.channels) {
      const bad = ch.items.filter((it) => this.health.get(it.hlsUrl)?.ok === false);
      out[id] = {
        items: ch.items.length,
        hours: +(ch.items.reduce((a, it) => a + it.durationSec, 0) / 3600).toFixed(1),
        broken: bad.map((it) => ({ title: it.title, error: this.health.get(it.hlsUrl).error })),
        lastPlayed: ch.asRun.length ? ch.asRun[ch.asRun.length - 1].title : null,
        lastCall: ch.asRun.length ? new Date(ch.asRun[ch.asRun.length - 1].calledAt).toISOString() : null,
      };
    }
    return out;
  }
}
