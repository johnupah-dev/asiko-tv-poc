import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { matcher, cleanTitle, buildPlaylists, norm } from '../lib/bunny.mjs';
import { readSourceLineup } from '../lib/lineup.mjs';

const lineup = await readSourceLineup();

test('scheduler/lineup.json matches data/channels.json (run: npm run lineup)', async () => {
  const copy = JSON.parse(await readFile(new URL('../lineup.json', import.meta.url), 'utf8')).channels;
  assert.deepEqual(copy, lineup);
});

test('collections match channels by id, name, accents/symbols ignored, or number', () => {
  const m = matcher(lineup);
  assert.equal(m('Tattase TV').id, 'tattasetv');
  assert.equal(m('tattasetv').id, 'tattasetv');
  assert.equal(m('10 Tattase TV').id, 'tattasetv');
  assert.equal(m('10 - anything').id, 'tattasetv');
  assert.equal(m('C-Suite Café TV').id, 'csuitecafe');
  assert.equal(m('Asiko TV+').id, 'asikotvplus');
  assert.equal(m('Movie Africa Yoruba').id, 'mayoruba');
  assert.equal(m('Random uploads'), null);
  assert.equal(norm('Café'), 'cafe');
});

test('order prefixes are dropped from on-air titles, real numbers kept', () => {
  assert.equal(cleanTitle('01 Lagos Nights'), 'Lagos Nights');
  assert.equal(cleanTitle('02 - Cooking with Nena'), 'Cooking with Nena');
  assert.equal(cleanTitle('2 Weeks in Lekki'), '2 Weeks in Lekki');
  assert.equal(cleanTitle('1960'), '1960');
});

test('builds playlists from a Bunny library, skipping unfinished encodes', async () => {
  const cols = [{ guid: 'c1', name: 'Tattase TV' }, { guid: 'c2', name: 'Unsorted' }];
  const vids = {
    c1: [
      { guid: 'v2', title: '02 Lagos Nights', length: 1500, status: 4 },
      { guid: 'v1', title: '01 Cooking with Nena', length: 1800, status: 4 },
      { guid: 'v3', title: '03 Raw cut', length: 900, status: 3 },
    ],
    c2: [],
  };
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (req.headers.accesskey !== 'secret') { res.statusCode = 401; return res.end(); }
    const first = u.searchParams.get('page') === '1';
    if (u.pathname.endsWith('/collections')) return res.end(JSON.stringify({ totalItems: cols.length, items: first ? cols : [] }));
    const list = vids[u.searchParams.get('collection')];
    res.end(JSON.stringify({ totalItems: list.length, items: first ? list : [] }));
  });
  await new Promise((r) => srv.listen(0, r));
  try {
    const r = await buildPlaylists({
      libraryId: 1, apiKey: 'secret', cdnHost: 'vz-test.b-cdn.net', lineup,
      apiBase: `http://127.0.0.1:${srv.address().port}`,
    });
    const doc = r.playlists.get('tattasetv');
    assert.deepEqual(doc.items.map((i) => i.title), ['Cooking with Nena', 'Lagos Nights']);
    assert.equal(doc.items[0].hlsUrl, 'https://vz-test.b-cdn.net/v1/playlist.m3u8');
    assert.deepEqual(r.unmatched, ['Unsorted']);
    assert.equal(r.skipped.length, 1);
    await assert.rejects(buildPlaylists({ libraryId: 1, apiKey: 'wrong', cdnHost: 'x', lineup, apiBase: `http://127.0.0.1:${srv.address().port}` }), /HTTP 401/);
  } finally {
    srv.close();
  }
});
