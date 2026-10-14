/* Friday ingest report: Bunny Stream collections -> channel playlists.

   The scheduler pulls from Bunny by itself every few minutes when its BUNNY_*
   settings are present, so this script is for checking an upload before it
   airs (and for writing playlists to disk when running without Bunny access).

     export BUNNY_LIBRARY_ID=123456
     export BUNNY_API_KEY=...            # Stream library API key — never commit it
     export BUNNY_CDN_HOST=vz-xxxx-xxx.b-cdn.net
     node ingest-bunny.mjs --dry         # report only (recommended first)
     node ingest-bunny.mjs --probe       # also load and measure every video
     node ingest-bunny.mjs               # write playlists/<channel>.json

   Matching and ordering rules: see lib/bunny.mjs. */

import { writeFile, mkdir } from 'node:fs/promises';
import { buildPlaylists } from './lib/bunny.mjs';
import { loadLineup } from './lib/lineup.mjs';

const env = process.env;
const DRY = process.argv.includes('--dry');
for (const k of ['BUNNY_LIBRARY_ID', 'BUNNY_API_KEY', 'BUNNY_CDN_HOST']) {
  if (!env[k]) { console.error(`Set ${k} first.`); process.exit(1); }
}

const lineup = await loadLineup();
const { playlists, report, unmatched, skipped } = await buildPlaylists({
  libraryId: env.BUNNY_LIBRARY_ID,
  apiKey: env.BUNNY_API_KEY,
  cdnHost: env.BUNNY_CDN_HOST,
  apiBase: env.BUNNY_API_BASE,
  lineup,
  probe: process.argv.includes('--probe'),
});

for (const s of skipped) console.log(`  skipped ${s}`);
console.table(report);
const fed = new Set(report.filter((r) => r.videos).map((r) => r.num));
const empty = lineup.filter((c) => !fed.has(c.num)).map((c) => `${c.num} ${c.name}`);
if (empty.length) console.log(`No content yet (shows "Coming soon"): ${empty.join(', ')}`);
if (unmatched.length) console.log(`Collections that match no channel — rename them: ${unmatched.join(', ')}`);
const thin = report.filter((r) => r.videos && r.hours < 6);
if (thin.length) console.log(`Under 6 hours of content (will repeat often): ${thin.map((r) => r.channel).join(', ')}`);

if (!DRY) {
  const dir = new URL('./playlists/', import.meta.url);
  await mkdir(dir, { recursive: true });
  for (const [id, doc] of playlists) if (doc.items.length) await writeFile(new URL(`${id}.json`, dir), JSON.stringify(doc, null, 2) + '\n');
}
console.log(DRY ? 'Dry run — nothing written.' : `Wrote ${[...playlists.values()].filter((d) => d.items.length).length} playlist(s) to scheduler/playlists/.`);
