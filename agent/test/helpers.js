// Test setup: a throwaway data dir and a fake Anthropic client, set before the
// agent modules are imported.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.AGENT_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "mia-test-"));
process.env.AGENT_ADMIN_TOKEN = "test-token";
process.env.AGENT_ALLOWED_ORIGINS = "https://www.asiko.live";
process.env.WHATSAPP_APP_SECRET = "shh";

/** A fake client whose beta.messages.parse returns queued answers and records calls. */
export function fakeClient() {
  const calls = [];
  const queue = [];
  return {
    calls,
    respond(parsed, extra = {}) {
      queue.push({ stop_reason: "end_turn", content: [], parsed_output: parsed, ...extra });
    },
    beta: {
      messages: {
        stream: (params) => {
          calls.push(params);
          return {
            finalMessage: async () => {
              if (!queue.length) throw new Error("fake client: no queued response");
              return queue.shift();
            },
          };
        },
      },
    },
  };
}
