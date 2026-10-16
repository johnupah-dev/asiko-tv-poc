/* Creates one Bunny Stream collection per Asiko channel that doesn't have one yet,
   named exactly as the channel ("Tattase TV"). Existing collections — matched by
   the same rules the scheduler uses — are left alone. Safe to run any time.

     BUNNY_LIBRARY_ID=... BUNNY_API_KEY=... node create-collections.mjs [--dry] */

import { matcher } from './lib/bunny.mjs';
import { loadLineup } from './lib/lineup.mjs';

const env = process.env;
for (const k of ['BUNNY_LIBRARY_ID', 'BUNNY_API_KEY']) {
  if (!env[k]) { console.error(`Set ${k} first.`); process.exit(1); }
}
const DRY = process.argv.includes('--dry');
const base = `${(env.BUNNY_API_BASE || 'https://video.bunnycdn.com').replace(/\/$/, '')}/library/${env.BUNNY_LIBRARY_ID}`;
const headers = { AccessKey: env.BUNNY_API_KEY, accept: 'application/json', 'content-type': 'application/json' };

async function api(path, init = {}) {
  const res = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(20000), ...init });
  if (!res.ok) throw new Error(`Bunny API ${path.split('?')[0]} -> HTTP ${res.status}`);
  return res.json();
}

const lineup = await loadLineup();
const existing = [];
for (let page = 1; page < 100; page++) {
  const r = await api(`/collections?page=${page}&itemsPerPage=100`);
  existing.push(...(r.items || []));
  if (!r.items?.length || existing.length >= (r.totalItems ?? existing.length)) break;
}
const match = matcher(lineup);
const covered = new Set(existing.map((c) => match(c.name)?.id).filter(Boolean));

let created = 0;
for (const ch of lineup) {
  if (covered.has(ch.id)) { console.log(`= ${String(ch.num).padStart(2, '0')} ${ch.name} — collection exists`); continue; }
  if (DRY) { console.log(`+ ${String(ch.num).padStart(2, '0')} ${ch.name} — would create`); continue; }
  await api('/collections', { method: 'POST', body: JSON.stringify({ name: ch.name }) });
  console.log(`+ ${String(ch.num).padStart(2, '0')} ${ch.name} — created`);
  created++;
}
console.log(DRY ? 'Dry run — nothing created.' : `Created ${created} collection(s); ${covered.size} already existed.`);
