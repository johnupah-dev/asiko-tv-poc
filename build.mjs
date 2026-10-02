/* Builds the deployable site into docs/ — what gets uploaded to asiko.africa.
     node build.mjs
   docs/index.html is index.html with styles.css, data/channels.json and
   app.js inlined (one request, no fetch). docs/assets/ is a copy of assets/.
   Edit the sources, never docs/ by hand. */
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

const [html, css, js, cfgText] = await Promise.all([
  read('index.html'), read('styles.css'), read('app.js'), read('data/channels.json'),
]);
const cfg = JSON.parse(cfgText);

// fail the build rather than ship a broken line-up
const nums = new Set();
for (const c of cfg.channels) {
  if (!/^[a-z0-9]+$/.test(c.id)) throw new Error(`channel id "${c.id}" must be lowercase a-z0-9`);
  if (nums.has(c.num)) throw new Error(`duplicate channel number ${c.num}`);
  nums.add(c.num);
  if (!c.src && !cfg.networkFeed) throw new Error(`channel ${c.num} has no src and there is no networkFeed`);
  if (!c.programs || !c.programs.length) throw new Error(`channel ${c.num} has no programs`);
  if (c.logo) await readFile(new URL(c.logo, root));
}

// keep "</script>" inside JSON/JS from closing the inline tag early
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
const swap = (src, needle, replacement) => {
  if (!src.includes(needle)) throw new Error(`build: "${needle}" not found in index.html`);
  return src.replace(needle, () => replacement);
};

let out = swap(html, '<link rel="stylesheet" href="styles.css" />', `<style>\n${css}</style>`);
out = swap(out, '<script src="app.js"></script>',
  `<script>window.__ASIKO_CFG__ = ${safe(JSON.stringify(cfg))};</script>\n  <script>\n${safe(js)}</script>`);

const docs = new URL('docs/', root);
await mkdir(docs, { recursive: true });
await rm(new URL('assets/', docs), { recursive: true, force: true });
await cp(new URL('assets/', root), new URL('assets/', docs), { recursive: true });
await writeFile(new URL('index.html', docs), out);
console.log(`docs/index.html — ${cfg.channels.length} channels, ${(out.length / 1024).toFixed(0)} KB`);
