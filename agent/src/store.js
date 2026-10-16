// File-based storage under AGENT_DATA_DIR: one JSON file per enquiry, and dated
// reports. Small, inspectable, and easy to back up or move to a database later.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";

const dir = (...parts) => {
  const p = path.join(config.dataDir, ...parts);
  fs.mkdirSync(p, { recursive: true });
  return p;
};

const SAFE_ID = /^[a-z0-9_-]{1,80}$/i;

export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
}

function writeJson(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

// ---- enquiries -------------------------------------------------------------

export function saveEnquiry(enquiry) {
  if (!SAFE_ID.test(enquiry.id)) throw new Error("bad enquiry id");
  writeJson(path.join(dir("enquiries"), `${enquiry.id}.json`), enquiry);
  return enquiry;
}

export function getEnquiry(id) {
  if (!SAFE_ID.test(id)) return null;
  const file = path.join(dir("enquiries"), `${id}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

export function updateEnquiry(id, patch) {
  const current = getEnquiry(id);
  if (!current) return null;
  return saveEnquiry({ ...current, ...patch, updatedAt: new Date().toISOString() });
}

export function listEnquiries({ status, limit = 200 } = {}) {
  return fs
    .readdirSync(dir("enquiries"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir("enquiries"), f), "utf8")))
    .filter((e) => !status || e.status === status)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, limit);
}

// ---- reports & content -----------------------------------------------------

export function saveReport(kind, name, { json, markdown }) {
  const base = path.join(dir("reports", kind), name);
  if (json !== undefined) writeJson(`${base}.json`, json);
  if (markdown !== undefined) fs.writeFileSync(`${base}.md`, markdown);
  return base;
}

export function latestReport(kind) {
  const d = dir("reports", kind);
  const files = fs.readdirSync(d).filter((f) => f.endsWith(".json")).sort();
  if (!files.length) return null;
  return JSON.parse(fs.readFileSync(path.join(d, files.at(-1)), "utf8"));
}
