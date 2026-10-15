import { fakeClient } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";

const { createServer } = await import("../src/server.js");
const { setClient } = await import("../src/claude.js");

const server = createServer().listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());

const auth = { authorization: "Bearer test-token" };

test("dashboard is served; path traversal is not", async () => {
  const res = await fetch(base + "/");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Media Icons Agent/);
  assert.equal((await fetch(base + "/..%2Fpackage.json")).status, 404);
});

test("admin API needs the token", async () => {
  assert.equal((await fetch(base + "/api/divisions")).status, 401);
  const res = await fetch(base + "/api/divisions", { headers: auth });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).length, 12);
});

test("bad input is a 400, not a 500", async () => {
  const bad = await fetch(base + "/api/content", { method: "POST", headers: auth, body: "{nope" });
  assert.equal(bad.status, 400);
  const unknown = await fetch(base + "/api/content", { method: "POST", headers: auth, body: JSON.stringify({ divisionId: "x", platforms: ["x"], brief: "b" }) });
  assert.equal(unknown.status, 400);
  assert.match((await unknown.json()).error, /Unknown division/);
});

test("website leads: CORS for our sites, accepted at once", async () => {
  const fake = fakeClient();
  setClient(fake);
  fake.respond({
    divisionId: "asiko-tv", alsoRelevant: [], intent: "advertise", urgency: "normal", sentiment: "positive", leadScore: 70,
    language: "English", summary: "s", contact: { name: "", organisation: "", email: "", phone: "" },
    reply: { subject: "", body: "Thanks" }, escalate: false, escalationReason: "", nextActions: [],
  });
  const pre = await fetch(base + "/api/leads", { method: "OPTIONS", headers: { origin: "https://www.asiko.live" } });
  assert.equal(pre.headers.get("access-control-allow-origin"), "https://www.asiko.live");
  const other = await fetch(base + "/api/leads", { method: "OPTIONS", headers: { origin: "https://evil.example" } });
  assert.equal(other.headers.get("access-control-allow-origin"), null);
  const res = await fetch(base + "/api/leads", {
    method: "POST",
    headers: { origin: "https://www.asiko.live", "content-type": "application/json" },
    body: JSON.stringify({ formType: "Advertiser Enquiry", source: "asiko.live", fields: { name: "Kemi", email: "k@x.com", message: "Sponsor the food channels?" } }),
  });
  assert.equal(res.status, 202);
});

test("WhatsApp webhook rejects unsigned posts and verifies only with the token", async () => {
  assert.equal((await fetch(base + "/webhooks/whatsapp", { method: "POST", body: "{}" })).status, 401);
  assert.equal((await fetch(base + "/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=x&hub.challenge=1")).status, 403);
});
