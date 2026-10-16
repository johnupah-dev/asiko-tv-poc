/* The channel line-up the scheduler serves. Source of truth is
   data/channels.json; scheduler/lineup.json is a copy so the scheduler can be
   deployed on its own. `npm run lineup` refreshes the copy; a test fails if
   they drift apart. */

import { readFile, writeFile } from 'node:fs/promises';

const COPY = new URL('../lineup.json', import.meta.url);
const SOURCE = new URL('../../data/channels.json', import.meta.url);

export const slim = (channels) => channels.map(({ num, id, name }) => ({ num, id, name }));

export async function loadLineup() {
  for (const f of [COPY, SOURCE]) {
    try {
      const doc = JSON.parse(await readFile(f, 'utf8'));
      return slim(doc.channels ?? doc);
    } catch {}
  }
  throw new Error('No line-up found: scheduler/lineup.json or data/channels.json');
}

export async function readSourceLineup() {
  return slim(JSON.parse(await readFile(SOURCE, 'utf8')).channels);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()) && process.argv.includes('--write')) {
  const lineup = await readSourceLineup();
  await writeFile(COPY, JSON.stringify({ channels: lineup }, null, 2) + '\n');
  console.log(`scheduler/lineup.json — ${lineup.length} channels`);
}
