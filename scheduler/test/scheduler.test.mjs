import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Scheduler } from '../lib/scheduler.mjs';
import { probe, mediaDuration } from '../lib/hls.mjs';

// tiny HLS origin: /good/master.m3u8 (2 x 10s segments), /live/ (no ENDLIST), everything else 404
const origin = http.createServer((req, res) => {
  req.url = new URL(req.url, 'http://x').pathname; // ignore query strings
  if (req.url === '/good/master.m3u8') return res.end('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nmedia.m3u8\n');
  if (req.url === '/good/media.m3u8') return res.end('#EXTM3U\n#EXTINF:10.0,\na.ts\n#EXTINF:10.0,\nb.ts\n#EXT-X-ENDLIST\n');
  if (req.url === '/live/master.m3u8') return res.end('#EXTM3U\n#EXTINF:6.0,\na.ts\n');
  res.statusCode = 404; res.end('nope');
});
await new Promise((r) => origin.listen(0, r));
const base = `http://127.0.0.1:${origin.address().port}`;
test.after(() => origin.close());

test('probe measures a good VOD and rejects broken or live ones', async () => {
  assert.deepEqual(await probe(`${base}/good/master.m3u8`), { ok: true, durationSec: 20 });
  assert.equal((await probe(`${base}/missing/master.m3u8`)).ok, false);
  assert.equal((await probe(`${base}/live/master.m3u8`)).ok, false);
  assert.equal(mediaDuration('#EXTINF:4.5,\nx\n#EXTINF:5.5,\ny'), 10);
});

const items = [
  { id: 'a', title: 'Film A', hlsUrl: `${base}/good/master.m3u8`, durationSec: 600 },
  { id: 'b', title: 'Broken B', hlsUrl: `${base}/missing/master.m3u8`, durationSec: 600 },
  { id: 'c', title: 'Film C', hlsUrl: `${base}/good/master.m3u8?c`, durationSec: 600 },
];

test('skips broken VODs and keeps rotating', async () => {
  const s = new Scheduler({ check: probe, now: () => 0 });
  s.setPlaylist('tattasetv', items);
  const titles = [];
  for (let i = 0; i < 4; i++) titles.push((await s.nextVod('tattasetv')).title);
  assert.deepEqual(titles, ['Film A', 'Film C', 'Film A', 'Film C']);
  assert.equal(s.status().tattasetv.broken[0].title, 'Broken B');
});

test('falls back to the slate when nothing is playable, and never throws', async () => {
  const slate = { title: 'Back shortly', hlsUrl: `${base}/good/master.m3u8?slate`, durationSec: 60 };
  const s = new Scheduler({ check: async () => ({ ok: false, error: 'down' }), slate });
  s.setPlaylist('estatetv', items);
  assert.equal((await s.nextVod('estatetv')).title, 'Back shortly');
  assert.equal((await s.nextVod('unknownchannel')).title, 'Back shortly');
  const bare = new Scheduler({ check: async () => { throw new Error('boom'); } });
  bare.setPlaylist('x', items);
  assert.equal((await bare.nextVod('x')).hlsUrl, null);
});

test('inserts a house-ad pre-roll every N items and logs it as-run', async () => {
  const ads = { every: 2, houseAds: [{ name: 'Estate TV promo', hlsUrl: 'https://ads/promo.m3u8', durationMs: 15000 }] };
  const s = new Scheduler({ check: async () => ({ ok: true }), ads, now: () => 0 });
  s.setPlaylist('hookedtv', items);
  const r1 = await s.nextVod('hookedtv');
  const r2 = await s.nextVod('hookedtv');
  assert.equal(r1.prerollUrl, undefined);
  assert.equal(r2.prerollUrl, 'https://ads/promo.m3u8');
  assert.equal(r2.prerollDurationMs, 15000);
  assert.equal(s.asRun('hookedtv')[1].ad, 'Estate TV promo');
});

test('starts at a wall-clock position, so restarts do not reset every channel to item 1', async () => {
  const s = new Scheduler({ check: async () => ({ ok: true }), now: () => 700 * 1000 }); // 700s into a 1800s loop
  s.setPlaylist('ln247', items);
  assert.equal((await s.nextVod('ln247')).title, 'Broken B'); // 600–1200s slot; check says ok here
});

test('guide shows what is on now and what comes next, back to back', async () => {
  let t = 0;
  const s = new Scheduler({ check: async () => ({ ok: true }), now: () => t });
  s.setPlaylist('foodies', items);
  await s.nextVod('foodies');
  t = 1000;
  const g = s.epg('foodies', 1);
  assert.equal(g.now.title, 'Film A');
  assert.ok(g.now.confirmed);
  assert.equal(g.programmes[1].start, g.now.end);
  assert.ok(g.programmes.at(-1).end >= t + 3600 * 1000);
});

test('playlist reload keeps the rotation position', async () => {
  const s = new Scheduler({ check: async () => ({ ok: true }), now: () => 0 });
  s.setPlaylist('sisitv', items);
  await s.nextVod('sisitv');
  s.setPlaylist('sisitv', items);
  assert.equal((await s.nextVod('sisitv')).title, 'Broken B');
});

test('an item without a known length takes its length from the health check', async () => {
  let t = 0;
  const s = new Scheduler({ check: probe, now: () => t });
  s.setPlaylist('webtv', [{ id: 'x', title: 'Unmeasured', hlsUrl: `${base}/good/master.m3u8?x` }]);
  await s.nextVod('webtv');
  t = 5000;
  assert.equal(s.epg('webtv', 1).now.title, 'Unmeasured');
  assert.equal(s.epg('webtv', 1).now.end, 20000);
});
