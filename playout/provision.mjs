/**
 * playout/provision.mjs -- SDK version of osc-fast.ps1 (for "any dev").
 *
 * Reads ../data/channels.json (the same file the front end uses).
 *
 * WebHook mode (production) — set SCHEDULER_URL. One Channel Engine "WebHook"
 * instance per channel the Asiko Scheduler has content for; the engine asks
 * the scheduler what to play next (rotation, skip-broken, slate, house ads).
 * SLATE_URL (optional) becomes the engine's own fallback slate.
 *
 * Loop mode (legacy POC) — no SCHEDULER_URL. One "Loop" instance per channel
 * that has a `loopSource`.
 *
 *   cd playout && npm install
 *   export OSC_ACCESS_TOKEN=eyJ...            # https://app.osaas.io -> Settings -> API
 *   node provision.mjs token                  # auth check
 *   node provision.mjs provision              # create every channel with a loopSource
 *   node provision.mjs status                 # health + playback URLs -> playout.json
 *   node provision.mjs teardown               # delete every asiko* channel
 *   node provision.mjs apply-src              # write live playback URLs into data/channels.json
 *   REPLACE=1 node provision.mjs provision    # recreate channels whose type/url changed
 */
import { readFile, writeFile } from 'node:fs/promises';
import { Context, listInstances, removeInstance } from '@osaas/client-core';
import { createChannelEngineInstance } from '@osaas/client-services';

const SERVICE = 'channel-engine';
const PREFIX = process.env.ASIKO_PREFIX ?? 'asiko';
const cmd = process.argv[2] ?? 'status';

if (!process.env.OSC_ACCESS_TOKEN) {
  console.error('Set OSC_ACCESS_TOKEN first (https://app.osaas.io -> Settings -> API).');
  process.exit(1);
}
const ctx = new Context();
const cfg = JSON.parse(await readFile(new URL('../data/channels.json', import.meta.url), 'utf8'));

const SCHED = process.env.SCHEDULER_URL?.replace(/\/$/, '');
const checkId = (c) => {
  if (!/^[a-z0-9]+$/.test(c.id)) throw new Error(`channel id "${c.id}" must be lowercase a-z0-9`);
  if (`${PREFIX}${c.id}`.length > 20) throw new Error(`instance name ${PREFIX}${c.id} is over 20 characters`);
};

let plan;
if (SCHED) {
  // only channels the scheduler actually has content for — no paying for empty channels
  const health = await (await fetch(`${SCHED}/health`)).json();
  const onAir = new Set(Object.keys(health.channels || {}));
  plan = cfg.channels.filter((c) => onAir.has(c.id)).map((c) => {
    checkId(c);
    const opts = { useDemuxedAudio: process.env.DEMUXED_AUDIO !== 'false', useVttSubtitles: false };
    if (process.env.SLATE_URL) opts.defaultSlateUri = process.env.SLATE_URL;
    return { id: c.id, name: `${PREFIX}${c.id}`, label: c.name, type: 'WebHook', url: `${SCHED}/nextVod/${c.id}`, opts };
  });
  console.log(`WebHook mode: scheduler has content for ${plan.length} of ${cfg.channels.length} channels.`);
} else {
  plan = cfg.channels.filter((c) => c.loopSource).map((c) => {
    checkId(c);
    return { id: c.id, name: `${PREFIX}${c.id}`, label: c.name, type: 'Loop', url: c.loopSource, opts: { useDemuxedAudio: false, useVttSubtitles: false } };
  });
}

const sat = () => ctx.getServiceAccessToken(SERVICE);
const live = async () => (await listInstances(ctx, SERVICE, await sat())) ?? [];

async function token() {
  await sat();
  console.log('Auth OK. channel-engine reachable.');
}

async function provision() {
  const have = new Map((await live()).map((c) => [c.name, c]));
  for (const p of plan) {
    const cur = have.get(p.name);
    if (cur) {
      const same = cur.type === p.type && cur.url === p.url;
      if (same || !process.env.REPLACE) { console.log(`= ${p.name}  already running${same ? '' : ' (different source — REPLACE=1 to recreate)'} - skip`); continue; }
      process.stdout.write(`~ ${p.name}  replacing ... `);
      console.log(await removeInstance(ctx, SERVICE, p.name, await sat()));
    }
    process.stdout.write(`+ ${p.name}  launching ${p.type} <- ${p.url} ... `);
    const inst = await createChannelEngineInstance(ctx, { name: p.name, type: p.type, url: p.url, opts: p.opts });
    console.log(`ok -> ${inst.playback ?? inst.url}`);
  }
  await status();
}

async function status() {
  const map = new Map((await live()).map((c) => [c.name, c]));
  const rows = plan.map((p) => {
    const c = map.get(p.name);
    return {
      id: p.id, label: p.label, instance: p.name,
      status: c ? 'present' : 'absent',
      playback: c ? (c.playback ?? c.url) : null,
      source: p.url,
    };
  });
  console.table(rows.map(({ id, label, status, playback }) => ({ id, label, status, playback })));
  await writeFile(
    new URL('./playout.json', import.meta.url),
    JSON.stringify({ generatedAt: new Date().toISOString(), channels: rows }, null, 2),
  );
  console.log('wrote playout/playout.json');
  console.log('Next: copy each playback URL into data/channels.json as that channel\'s "src".');
}

async function teardown() {
  const token = await sat();
  const targets = (await live()).filter((c) => c.name.startsWith(PREFIX));
  for (const t of targets) {
    process.stdout.write(`- ${t.name}  deleting ... `);
    console.log(await removeInstance(ctx, SERVICE, t.name, token));
  }
  if (!targets.length) console.log('nothing to remove');
}

async function applySrc() {
  const map = new Map((await live()).map((c) => [c.name, c]));
  let n = 0;
  for (const c of cfg.channels) {
    const inst = map.get(`${PREFIX}${c.id}`);
    const url = inst && (inst.playback ?? inst.url);
    if (url && url.endsWith('.m3u8')) { c.src = url; n++; }
  }
  await writeFile(new URL('../data/channels.json', import.meta.url), JSON.stringify(cfg, null, 2) + '\n');
  console.log(`data/channels.json: ${n} channel(s) now have their own src. Run node build.mjs, then commit.`);
}

const table = { token, provision, status, teardown, 'apply-src': applySrc };
if (!table[cmd]) { console.error(`unknown command "${cmd}"`); process.exit(1); }
await table[cmd]();
