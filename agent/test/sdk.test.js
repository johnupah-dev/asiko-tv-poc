// Drives the real Anthropic SDK against a local stand-in for the API, to check
// the requests we build (tool runner, fallbacks, pause_turn resume, retries).
import "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import Anthropic from "@anthropic-ai/sdk";

const { setClient, research, structured } = await import("../src/claude.js");
const { chat } = await import("../src/assistant.js");
const { z } = await import("zod");

const requests = [];
let replies = [];
const api = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    requests.push({ headers: req.headers, body: JSON.parse(body) });
    const next = replies.shift();
    const msg = { id: "msg_" + requests.length, type: "message", role: "assistant", model: "claude-opus-5-5", stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 }, ...next };
    if (JSON.parse(body).stream) {
      res.writeHead(200, { "content-type": "text/event-stream" });
      const ev = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
      ev("message_start", { message: { ...msg, content: [], stop_reason: null } });
      msg.content.forEach((block, index) => {
        if (block.type === "text") {
          ev("content_block_start", { index, content_block: { type: "text", text: "" } });
          ev("content_block_delta", { index, delta: { type: "text_delta", text: block.text } });
        } else ev("content_block_start", { index, content_block: block });
        ev("content_block_stop", { index });
      });
      ev("message_delta", { delta: { stop_reason: msg.stop_reason, stop_sequence: null }, usage: { output_tokens: 1 } });
      ev("message_stop", {});
      return res.end();
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(msg));
  });
});
api.listen(0, "127.0.0.1");
await new Promise((r) => api.once("listening", r));
test.after(() => api.close());
setClient(new Anthropic({ apiKey: "test", baseURL: `http://127.0.0.1:${api.address().port}`, maxRetries: 0 }));

test("chat: runs a tool, then answers; sends fallbacks and the date as a system message", async () => {
  requests.length = 0;
  replies = [
    { content: [{ type: "tool_use", id: "tu_1", name: "list_divisions", input: {} }], stop_reason: "tool_use" },
    { content: [{ type: "text", text: "We have 11 live divisions." }], stop_reason: "end_turn" },
  ];
  const { reply } = await chat([{ role: "user", content: "How many divisions?" }]);
  assert.equal(reply, "We have 11 live divisions.");
  const [first, second] = requests;
  assert.equal(first.body.fallbacks, "default");
  assert.match(first.headers["anthropic-beta"], /server-side-fallback-2026-07-01/);
  assert.equal(first.body.messages.at(-1).role, "system");
  assert.ok(first.body.tools.some((t) => t.type === "web_search_20260209"));
  const result = second.body.messages.at(-1).content[0];
  assert.equal(result.type, "tool_result");
  assert.match(JSON.stringify(result.content), /asiko-tv/);
});

test("research: resumes a paused server-tool turn and collects sources", async () => {
  requests.length = 0;
  replies = [
    { content: [{ type: "web_search_tool_result", tool_use_id: "srv_1", content: [{ type: "web_search_result", url: "https://n.example/1", title: "One", encrypted_content: "x" }] }], stop_reason: "pause_turn" },
    { content: [{ type: "text", text: "Found one mention." }], stop_reason: "end_turn" },
  ];
  const r = await research({ prompt: "What's new?" });
  assert.equal(r.text, "Found one mention.");
  assert.deepEqual(r.sources, [{ url: "https://n.example/1", title: "One" }]);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].body.messages.at(-1).role, "assistant");
});

test("structured: retries once when the answer breaks the schema", async () => {
  replies = [
    { content: [{ type: "text", text: JSON.stringify({ colour: "purple" }) }], stop_reason: "end_turn" },
    { content: [{ type: "text", text: JSON.stringify({ colour: "gold" }) }], stop_reason: "end_turn" },
  ];
  const out = await structured({ prompt: "p", schema: z.object({ colour: z.enum(["gold", "cream"]) }) });
  assert.deepEqual(out, { colour: "gold" });
});
