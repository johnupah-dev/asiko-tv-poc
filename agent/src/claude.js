// Thin wrapper over the Anthropic SDK: one place for the model, the refusal
// fallback, structured outputs and the web-research loop.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { config } from "./config.js";
import { systemPrompt } from "./kb.js";

// If the model declines a request on policy grounds, the API re-runs it on the
// recommended fallback model inside the same call.
export const BASE_PARAMS = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
  thinking: { type: "adaptive" },
};

let client;
export function getClient() {
  return (client ??= new Anthropic());
}
/** Swap the client (tests use a fake). */
export function setClient(c) {
  client = c;
}

export class AgentError extends Error {}

function assertUsable(message) {
  if (message.stop_reason === "refusal") {
    const why = message.stop_details?.explanation || "the request was declined";
    throw new AgentError(`Claude declined this request: ${why}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new AgentError("The answer ran past the output limit — ask for fewer items at a time.");
  }
}

export function textOf(message) {
  return message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/**
 * One request, one schema-validated object back.
 * @param {{prompt: string, schema: import("zod").ZodType, effort?: string, maxTokens?: number}} opts
 */
export async function structured({ prompt, schema, effort = "medium", maxTokens = 16000 }) {
  // Some constraints (enums, number ranges) are checked client-side by the SDK
  // rather than by the API, so a rare mismatch gets one retry.
  for (let attempt = 1; ; attempt++) {
    let message;
    try {
      // Streamed so large outputs never hit the SDK's long-request timeout.
      message = await getClient()
        .beta.messages.stream({
          ...BASE_PARAMS,
          model: config.model,
          max_tokens: maxTokens,
          system: systemPrompt(),
          output_config: { effort, format: betaZodOutputFormat(schema) },
          messages: [{ role: "user", content: prompt }],
        })
        .finalMessage();
    } catch (err) {
      const formatMismatch = err instanceof Anthropic.AnthropicError && !(err instanceof Anthropic.APIError);
      if (!formatMismatch) throw err;
      if (attempt < 2) continue;
      throw new AgentError("Claude's answer did not match the expected format — try again.");
    }
    assertUsable(message);
    if (message.parsed_output) return message.parsed_output;
    if (attempt >= 2) throw new AgentError("Claude's answer did not match the expected format — try again.");
  }
}

export const WEB_TOOLS = (maxUses = 8) => [
  { type: "web_search_20260209", name: "web_search", max_uses: maxUses },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: maxUses },
];

/** Collect every URL the web tools returned, so reports can cite real links. */
export function webSources(content) {
  const out = new Map();
  for (const block of content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) if (r.url) out.set(r.url, { url: r.url, title: r.title || r.url });
    }
    if (block.type === "web_fetch_tool_result" && block.content?.url) {
      out.set(block.content.url, { url: block.content.url, title: block.content.url });
    }
  }
  return [...out.values()];
}

/**
 * Free-text research with web search and fetch. Resumes paused server-tool
 * turns until Claude finishes. Returns the findings text and the sources seen.
 */
export async function research({ prompt, effort = "medium", maxUses = 8 }) {
  const messages = [{ role: "user", content: prompt }];
  const sources = new Map();
  for (let turn = 0; turn < 6; turn++) {
    const message = await getClient()
      .beta.messages.stream({
        ...BASE_PARAMS,
        model: config.model,
        max_tokens: 64000,
        system: systemPrompt(),
        output_config: { effort },
        tools: WEB_TOOLS(maxUses),
        messages,
      })
      .finalMessage();
    for (const s of webSources(message.content)) sources.set(s.url, s);
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    assertUsable(message);
    return { text: textOf(message), sources: [...sources.values()] };
  }
  throw new AgentError("Web research did not finish — try again with a narrower question.");
}
