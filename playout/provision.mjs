/**
 * playout/provision.mjs -- SDK version of osc-fast.ps1 (for "any dev").
 *
 * Reads ../data/channels.json (the same file the front end uses) and creates
 * one Eyevinn Channel Engine instance per channel:
 *   - a channel with a `playout` block uses it   ({ type: "Playlist", url: ".../movieafrica.txt" })
 *   - a channel without one loops its `src`      (type "Loop", the original POC behaviour)
 *   - a channel with `live: true` is skipped     (it is already a live feed)
 * Top-level `playoutDefaults` (slate, preroll ident) apply to every channel
 * unless the channel's own `playout` overrides them.
 *
 *   cd playout && npm install
 *   export OSC_ACCESS_TOKEN=eyJ...            # https://app.osaas.io -> Settings -> API
 *   node provision.mjs token                  # auth check
 *   node provision.mjs check                  # every playlist + VOD URL is reachable (no OSC cost)
 *   node provision.mjs provision              # create all channels
 *   node provision.mjs provision --only movieafrica,ppg   # create a batch
 *   node provision.mjs provision --recreate   # delete + recreate (e.g. after changing type)
 *   node provision.mjs status                 # playback URLs -> playout.json
 *   node provision.mjs teardown               # delete every asiko* channel
 */
import { readFile, writeFile } from 'node:fs/promises';

const SERVICE = 'channel-engine';
const PREFIX = process.env.ASIKO_PREFIX ?? 'asiko';
const argv = process.argv.slice(2);
const cmd = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--only') ?? 'status';
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const only = opt('only')?.split(',').map((s) => s.trim()).filter(Boolean);

const cfg = JSON.parse(await readFile(new URL('../data/channels.json', import.meta.url), 'utf8'));
const defaults = cfg.playoutDefaults ?? {};

/* Instance names: lowercase a-z0-9, max 20 chars (OSC / K8s rule). */
const instanceName = (id) => `${PREFIX}${id.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

function buildOpts(p) {
  const opts = { useDemuxedAudio: false, useVttSubtitles: false };
  const slate = p.slate ?? defaults.slate;
  const preroll = p.preroll === null ? null : (p.preroll ?? defaults.preroll);
  if (slate) opts.defaultSlateUri = slate;
  if (preroll?.url) opts.preroll = { url: preroll.url, duration: String(preroll.durationMs) };
  return opts;
}

const plan = cfg.channels
  .filter((c) => !c.live && !c.playout?.skip)
  .filter((c) => !only || only.includes(c.id))
  .map((c) => {
    const p = c.playout ?? {};
    const type = p.type ?? 'Loop';
    const url = p.url ?? c.src;
    if (!['Loop', 'Playlist', 'WebHook'].includes(type)) throw new Error(`${c.id}: unknown playout.type "${type}"`);
    if (!/^https?:\/\//.test(url ?? '')) throw new Error(`${c.id}: playout needs an http(s) url`);
    return { id: c.id, name: instanceName(c.id), label: c.name, type, url, opts: buildOpts(p) };
  });

if (only) {
  const missing = only.filter((id) => !plan.some((p) => p.id === id));
  if (missing.length) throw new Error(`--only: not found (or live/skipped): ${missing.join(', ')}`);
}
for (const p of plan) {
  if (p.name.length > 20) throw new Error(`instance name "${p.name}" is over 20 chars - shorten the channel id`);
}
const dupes = plan.map((p) => p.name).filter((n, i, a) => a.indexOf(n) !== i);
if (dupes.length) throw new Error(`two channels map to the same instance name: ${dupes.join(', ')}`);

/* ---------- check: reachability of every source, before paying for channels ---------- */

async function probe(url) {
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow' });
    const body = r.ok ? await r.text() : '';
    return { ok: r.ok, status: r.status, body };
  } catch (e) {
    return { ok: false, status: e.cause?.code ?? e.message, body: '' };
  }
}

async function check() {
  let bad = 0;
  for (const p of plan) {
    const urls = [];
    if (p.type === 'Playlist') {
      const r = await probe(p.url);
      if (!r.ok) { console.log(`x ${p.id}  playlist ${r.status}  ${p.url}`); bad++; continue; }
      const lines = r.body.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      if (!lines.length) { console.log(`x ${p.id}  playlist is empty  ${p.url}`); bad++; continue; }
      urls.push(...lines);
    } else if (p.type === 'Loop') {
      urls.push(p.url);
    } else {
      console.log(`- ${p.id}  WebHook - not probed (${p.url})`);
    }
    if (p.opts.preroll) urls.push(p.opts.preroll.url);
    if (p.opts.defaultSlateUri) urls.push(p.opts.defaultSlateUri);

    const fails = [];
    for (const u of urls) {
      const r = await probe(u);
      if (!r.ok) fails.push(`${r.status} ${u}`);
      else if (!r.body.startsWith('#EXTM3U')) fails.push(`not an HLS manifest: ${u}`);
    }
    if (fails.length) { bad++; console.log(`x ${p.id}  ${fails.length}/${urls.length} failed`); fails.forEach((f) => console.log(`    ${f}`)); }
    else console.log(`ok ${p.id}  ${p.type}  ${urls.length} URL(s)`);
  }
  console.log(bad ? `\n${bad} channel(s) have problems. A 403 from Bunny usually means "Block direct URL access" is on.` : '\nAll sources reachable.');
  if (bad) process.exitCode = 1;
}

/* ---------- OSC ---------- */

async function osc() {
  if (!process.env.OSC_ACCESS_TOKEN) {
    console.error('Set OSC_ACCESS_TOKEN first (https://app.osaas.io -> Settings -> API).');
    process.exit(1);
  }
  const { Context, listInstances, removeInstance } = await import('@osaas/client-core');
  const { createChannelEngineInstance } = await import('@osaas/client-services');
  const ctx = new Context();
  const sat = () => ctx.getServiceAccessToken(SERVICE);
  return {
    sat,
    live: async () => (await listInstances(ctx, SERVICE, await sat())) ?? [],
    create: (body) => createChannelEngineInstance(ctx, body),
    remove: async (name) => removeInstance(ctx, SERVICE, name, await sat()),
  };
}

async function token() {
  await (await osc()).sat();
  console.log('Auth OK. channel-engine reachable.');
}

async function provision() {
  const o = await osc();
  const have = new Set((await o.live()).map((c) => c.name));
  console.log(`${plan.length} channel(s) planned, ~${plan.length * 10} OSC tokens/day while running.`);
  for (const p of plan) {
    if (have.has(p.name)) {
      if (!flag('recreate')) { console.log(`= ${p.name}  already running - skip (use --recreate)`); continue; }
      process.stdout.write(`~ ${p.name}  deleting for recreate ... `);
      await o.remove(p.name);
      console.log('ok');
      await new Promise((r) => setTimeout(r, 2000));
    }
    process.stdout.write(`+ ${p.name}  ${p.type} <- ${p.url} ... `);
    const inst = await o.create({ name: p.name, type: p.type, url: p.url, opts: p.opts });
    console.log(`ok -> ${inst.playback ?? inst.url}`);
  }
  await status(o);
}

async function status(o) {
  o ??= await osc();
  const map = new Map((await o.live()).map((c) => [c.name, c]));
  const rows = plan.map((p) => {
    const c = map.get(p.name);
    return {
      id: p.id, label: p.label, instance: p.name, type: p.type,
      status: c ? 'present' : 'absent',
      playback: c ? (c.playback ?? c.url) : null,
      source: p.url,
    };
  });
  console.table(rows.map(({ id, type, status, playback }) => ({ id, type, status, playback })));
  await writeFile(
    new URL('./playout.json', import.meta.url),
    JSON.stringify({ generatedAt: new Date().toISOString(), channels: rows }, null, 2),
  );
  console.log('wrote playout/playout.json');
  console.log('Next: copy each playback URL into data/channels.json as that channel\'s "src".');
}

async function teardown() {
  const o = await osc();
  const targets = (await o.live())
    .filter((c) => c.name.startsWith(PREFIX))
    .filter((c) => !only || plan.some((p) => p.name === c.name));
  for (const t of targets) {
    process.stdout.write(`- ${t.name}  deleting ... `);
    console.log(await o.remove(t.name));
  }
  if (!targets.length) console.log('nothing to remove');
}

const table = { token, check, provision, status: () => status(), teardown };
if (!table[cmd]) { console.error(`unknown command "${cmd}"`); process.exit(1); }
await table[cmd]();
