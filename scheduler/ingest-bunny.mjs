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
     node ingest-bunny.mjs --out DIR --report FILE.md   # used by the sync workflow

   Matching and ordering rules: see lib/bunny.mjs. */

import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { buildPlaylists } from './lib/bunny.mjs';
import { loadLineup } from './lib/lineup.mjs';

const env = process.env;
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const OUT = opt('--out');
const REPORT = opt('--report');
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
  probe: argv.includes('--probe'),
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
  const dir = OUT ? pathToFileURL(OUT.replace(/\/?$/, '/')) : new URL('./playlists/', import.meta.url);
  await mkdir(dir, { recursive: true });
  for (const [id, doc] of playlists) if (doc.items.length) await writeFile(new URL(`${id}.json`, dir), JSON.stringify(doc, null, 2) + '\n');
}
if (REPORT) {
  const md = [
    `# Channel content — ${new Date().toISOString()}`,
    '',
    '| # | Channel | Bunny collection | Titles | Hours | Skipped |',
    '|---|---|---|---|---|---|',
    ...report.map((r) => `| ${r.num} | ${r.channel} | ${r.collection} | ${r.videos} | ${r.hours} | ${r.skipped} |`),
    '',
    skipped.length ? `**Skipped files**\n\n${skipped.map((s) => `- ${s}`).join('\n')}\n` : '',
    empty.length ? `**No content yet (Coming soon):** ${empty.join(', ')}\n` : '',
    unmatched.length ? `**Collections matching no channel — rename them:** ${unmatched.join(', ')}\n` : '',
    thin.length ? `**Under 6 hours (will repeat often):** ${thin.map((r) => r.channel).join(', ')}\n` : '',
  ].join('\n');
  await writeFile(REPORT, md);
}
console.log(DRY ? 'Dry run — nothing written.' : `Wrote ${[...playlists.values()].filter((d) => d.items.length).length} playlist(s) to ${OUT || 'scheduler/playlists/'}.`);
