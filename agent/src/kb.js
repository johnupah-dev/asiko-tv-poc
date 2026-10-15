// The knowledge base: everything the agent knows about the group, the divisions,
// John Upah, the brand voice and the house rules. It is loaded once and sent as a
// cached system prompt, so keep it byte-stable (no timestamps, sorted output).
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

const read = (name) => fs.readFileSync(path.join(config.knowledgeDir, name), "utf8");

let cache;

export function loadKnowledge() {
  if (cache) return cache;
  const { divisions } = JSON.parse(read("divisions.json"));
  const watchlist = JSON.parse(read("watchlist.json"));
  const ids = new Set();
  for (const d of divisions) {
    if (ids.has(d.id)) throw new Error(`divisions.json: duplicate division id "${d.id}"`);
    ids.add(d.id);
  }
  cache = {
    divisions,
    watchlist,
    group: read("group.md"),
    voice: read("voice.md"),
    john: read("john-upah.md"),
    policies: read("policies.md"),
  };
  return cache;
}

export function divisions({ includeUnconfirmed = false } = {}) {
  return loadKnowledge().divisions.filter((d) => includeUnconfirmed || d.confirmed);
}

export function divisionIds() {
  return divisions().map((d) => d.id);
}

export function getDivision(id) {
  return loadKnowledge().divisions.find((d) => d.id === id);
}

function divisionCard(d) {
  return [
    `### ${d.code} · ${d.name}  (id: ${d.id})`,
    d.oneLiner,
    d.services.length ? `Services: ${d.services.join("; ")}` : "",
    d.audiences.length ? `Audiences: ${d.audiences.join("; ")}` : "",
    d.sites.length ? `Sites: ${d.sites.join(", ")}` : "",
    d.socials ? `Socials: ${Object.entries(d.socials).map(([k, v]) => `${k} ${v}`).join(", ")}` : "",
    d.hashtags.length ? `Hashtags: ${d.hashtags.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const ROLE = `You are the marketing and content agent for Media Icons Africa — a Lagos media holding
company — working for all of its divisions and for its CEO, John Upah. Your job is to make Media
Icons Africa visibly the most complete media ecosystem in Nigeria and Africa: you create content,
monitor social and digital media, and handle enquiries so that every one is answered well and
routed to the right division.

You write like a senior Lagos media marketer who knows every division by heart. You always
follow the house rules below; when they conflict with a request, the rules win and you say why.`;

/** The cached system prompt shared by every task. */
export function systemPrompt() {
  const kb = loadKnowledge();
  const live = kb.divisions.filter((d) => d.confirmed);
  const pending = kb.divisions.filter((d) => !d.confirmed);
  const text = [
    ROLE,
    "# House rules\n" + kb.policies,
    kb.group,
    `# The divisions (${kb.divisions.length})\n\n` + live.map(divisionCard).join("\n\n"),
    pending.length
      ? `Unconfirmed (never mention publicly): ${pending.map((d) => `${d.code} ${d.id}`).join(", ")}`
      : "",
    kb.voice,
    kb.john,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

/** Reset the in-memory knowledge (tests, or after editing files while the server runs). */
export function reloadKnowledge() {
  cache = undefined;
  return loadKnowledge();
}
