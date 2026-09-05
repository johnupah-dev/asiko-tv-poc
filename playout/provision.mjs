/**
 * playout/provision.mjs -- SDK version of osc-fast.ps1 (for "any dev").
 *
 * Reads ../data/channels.json (the same file the front end uses) and creates
 * one Eyevinn Channel Engine "Loop" instance per channel from its `src`.
 *
 *   cd playout && npm install
 *   export OSC_ACCESS_TOKEN=eyJ...            # https://app.osaas.io -> Settings -> API
 *   node provision.mjs token                  # auth check
 *   node provision.mjs provision              # create all 7
 *   node provision.mjs status                 # health + playback URLs -> playout.json
 *   node provision.mjs teardown               # delete all 7
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

const plan = cfg.channels.map((c) => {
  if (!/^[a-z0-9]+$/.test(c.id)) throw new Error(`channel id "${c.id}" must be lowercase a-z0-9`);
  return { id: c.id, name: `${PREFIX}${c.id}`, label: c.name, type: 'Loop', url: c.src };
});

const sat = () => ctx.getServiceAccessToken(SERVICE);
const live = async () => (await listInstances(ctx, SERVICE, await sat())) ?? [];

async function token() {
  await sat();
  console.log('Auth OK. channel-engine reachable.');
}

async function provision() {
  const have = new Set((await live()).map((c) => c.name));
  for (const p of plan) {
    if (have.has(p.name)) { console.log(`= ${p.name}  already running - skip`); continue; }
    process.stdout.write(`+ ${p.name}  launching Loop <- ${p.url} ... `);
    const inst = await createChannelEngineInstance(ctx, {
      name: p.name, type: p.type, url: p.url,
      opts: { useDemuxedAudio: false, useVttSubtitles: false },
    });
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

const table = { token, provision, status, teardown };
if (!table[cmd]) { console.error(`unknown command "${cmd}"`); process.exit(1); }
await table[cmd]();
