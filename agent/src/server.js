// HTTP server: the staff dashboard, the admin API, the public enquiry endpoint
// for our websites, and the WhatsApp webhook. No framework — node:http only.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, ROOT } from "./config.js";
import { divisions, reloadKnowledge } from "./kb.js";
import { generateContent, planCalendar } from "./content.js";
import { runMonitor, checkSites } from "./monitor.js";
import { handleEnquiry, approveEnquiry, dismissEnquiry, leadToEnquiry } from "./enquiry.js";
import { listEnquiries, getEnquiry, latestReport } from "./store.js";
import { chat } from "./assistant.js";
import { verifySignature, extractMessages } from "./whatsapp.js";
import { InputError } from "./errors.js";
import Anthropic from "@anthropic-ai/sdk";
import { AgentError } from "./claude.js";

const PUBLIC_DIR = path.join(ROOT, "public");
const MAX_BODY = 1_000_000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(res, status, body, headers = {}) {
  const json = typeof body !== "string";
  res.writeHead(status, { "content-type": json ? "application/json" : "text/plain; charset=utf-8", ...headers });
  res.end(json ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, "body too large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseJson(buf) {
  if (!buf.length) return {};
  try {
    return JSON.parse(buf.toString("utf8"));
  } catch {
    throw new HttpError(400, "invalid JSON");
  }
}

const isLoopback = (addr = "") => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(addr);

function requireAdmin(req) {
  if (!config.adminToken) {
    if (isLoopback(req.socket.remoteAddress)) return;
    throw new HttpError(403, "Set AGENT_ADMIN_TOKEN to use the dashboard from another machine.");
  }
  const given = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(config.adminToken);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(401, "wrong or missing admin token");
}

// Public endpoint protection: a small per-IP budget.
const hits = new Map();
function rateLimit(req, limit = 10, windowMs = 10 * 60 * 1000) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "?";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) throw new HttpError(429, "too many submissions — please WhatsApp us instead");
  recent.push(now);
  hits.set(ip, recent);
}

function cors(req) {
  const origin = req.headers.origin;
  if (origin && config.allowedOrigins.includes(origin)) {
    return { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "origin" };
  }
  return {};
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

function serveStatic(res, urlPath) {
  const rel = urlPath === "/" ? "index.html" : decodeURIComponent(urlPath).replace(/^\/+/, "");
  const file = path.resolve(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
  return true;
}

export async function route(req, res) {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;
  const m = req.method;

  // ---- public ----
  if (p === "/health") return send(res, 200, { ok: true });

  if (p === "/api/leads") {
    const h = cors(req);
    if (m === "OPTIONS") return send(res, 204, "", h);
    if (m !== "POST") throw new HttpError(405, "POST only");
    rateLimit(req);
    const lead = parseJson(await readBody(req));
    const input = leadToEnquiry(lead);
    if (!input.message.trim()) throw new HttpError(400, "empty enquiry");
    // Answer the website at once; triage runs in the background.
    handleEnquiry(input).catch((err) => console.error("triage failed:", err.message));
    return send(res, 202, { ok: true, message: "Thanks — the Media Icons team will be in touch shortly." }, h);
  }

  if (p === "/webhooks/whatsapp") {
    if (m === "GET") {
      const ok =
        config.whatsapp.verifyToken &&
        url.searchParams.get("hub.mode") === "subscribe" &&
        url.searchParams.get("hub.verify_token") === config.whatsapp.verifyToken;
      return ok ? send(res, 200, url.searchParams.get("hub.challenge") || "") : send(res, 403, "forbidden");
    }
    if (m === "POST") {
      const raw = await readBody(req);
      if (!verifySignature(raw, req.headers["x-hub-signature-256"])) throw new HttpError(401, "bad signature");
      for (const msg of extractMessages(parseJson(raw))) {
        handleEnquiry({ channel: "whatsapp", ...msg }).catch((err) => console.error("triage failed:", err.message));
      }
      return send(res, 200, { ok: true });
    }
  }

  // ---- staff ----
  if (p.startsWith("/api/")) {
    requireAdmin(req);
    const body = m === "POST" ? parseJson(await readBody(req)) : {};

    if (p === "/api/divisions" && m === "GET") return send(res, 200, divisions({ includeUnconfirmed: true }));
    if (p === "/api/knowledge/reload" && m === "POST") {
      reloadKnowledge();
      return send(res, 200, { ok: true });
    }
    if (p === "/api/content" && m === "POST") return send(res, 200, { posts: await generateContent(body) });
    if (p === "/api/calendar" && m === "POST") return send(res, 200, await planCalendar(body));
    if (p === "/api/monitor" && m === "GET") return send(res, 200, latestReport("monitor"));
    if (p === "/api/monitor" && m === "POST") return send(res, 200, await runMonitor({ web: body.web !== false }));
    if (p === "/api/sites" && m === "GET") return send(res, 200, await checkSites());
    if (p === "/api/chat" && m === "POST") return send(res, 200, await chat(body.messages || []));
    if (p === "/api/enquiries" && m === "GET") return send(res, 200, listEnquiries({ status: url.searchParams.get("status") || undefined }));
    if (p === "/api/enquiries" && m === "POST") return send(res, 200, await handleEnquiry(body));

    const em = p.match(/^\/api\/enquiries\/([A-Za-z0-9_-]+)(?:\/(approve|dismiss))?$/);
    if (em) {
      const [, id, action] = em;
      let result;
      if (!action && m === "GET") result = getEnquiry(id);
      else if (action === "approve" && m === "POST") result = await approveEnquiry(id, { body: body.body, approvedBy: body.approvedBy || "staff" });
      else if (action === "dismiss" && m === "POST") result = dismissEnquiry(id, body.reason || "");
      else throw new HttpError(405, "method not allowed");
      if (!result) throw new HttpError(404, "no such enquiry");
      return send(res, 200, result);
    }
    throw new HttpError(404, "not found");
  }

  if (m === "GET" && serveStatic(res, p)) return;
  throw new HttpError(404, "not found");
}

export function createServer() {
  return http.createServer((req, res) => {
    route(req, res).catch((err) => {
      let status = err instanceof HttpError ? err.status : 500;
      if (err instanceof InputError || err.name === "ZodError") status = 400;
      else if (err instanceof AgentError || err instanceof Anthropic.APIError) status = 502;
      if (status >= 500) console.error(err);
      if (!res.headersSent) send(res, status, { error: status === 500 ? "internal error" : err.message });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(ROOT, "src", "server.js")) {
  const host = process.env.HOST || (config.adminToken ? "0.0.0.0" : "127.0.0.1");
  createServer().listen(config.port, host, () => {
    console.log(`Media Icons agent on http://${host === "0.0.0.0" ? "localhost" : host}:${config.port}`);
    if (!config.adminToken) console.log("AGENT_ADMIN_TOKEN is not set: listening on localhost only.");
  });
}
