// The conversational agent: staff ask in plain words ("draft three LinkedIn posts
// for the Sports Agency about Sportsville 2027 and check what's trending first")
// and it uses its tools — content, calendar, monitoring, enquiries, web search.
import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { getClient, BASE_PARAMS, WEB_TOOLS, textOf, webSources, AgentError } from "./claude.js";
import { config, todayLagos } from "./config.js";
import { systemPrompt, divisions } from "./kb.js";
import { generateContent, planCalendar, PLATFORMS, PERSONAS, postsMarkdown, calendarMarkdown } from "./content.js";
import { runMonitor, checkSites, monitorMarkdown } from "./monitor.js";
import { handleEnquiry, CHANNELS } from "./enquiry.js";
import { listEnquiries, latestReport } from "./store.js";
import { InputError } from "./errors.js";

const tools = [
  betaZodTool({
    name: "list_divisions",
    description: "List Media Icons Africa's divisions with their ids, one-liners and sites.",
    inputSchema: z.object({}),
    run: async () =>
      JSON.stringify(divisions().map((d) => ({ id: d.id, code: d.code, name: d.name, oneLiner: d.oneLiner, sites: d.sites }))),
  }),
  betaZodTool({
    name: "generate_content",
    description:
      "Write ready-to-post content for one division (or 'group') on one or more platforms, in the brand voice or as John Upah. Use for any request to draft posts, captions, scripts, emails, blogs or press releases.",
    inputSchema: z.object({
      divisionId: z.string().describe("division id from list_divisions, or 'group'"),
      platforms: z.array(z.enum(PLATFORMS)).min(1),
      brief: z.string().describe("what the content is about, key facts, the audience and the goal"),
      persona: z.enum(PERSONAS).optional(),
      variations: z.number().int().min(1).max(5).optional(),
    }),
    run: async (input) => postsMarkdown(await generateContent(input)),
  }),
  betaZodTool({
    name: "plan_calendar",
    description: "Plan a content calendar across all divisions and John Upah. Saves it to the reports folder.",
    inputSchema: z.object({
      startDate: z.string().describe("YYYY-MM-DD").optional(),
      days: z.number().int().min(1).max(31).optional(),
      focus: z.string().optional(),
    }),
    run: async (input) => calendarMarkdown(await planCalendar(input)),
  }),
  betaZodTool({
    name: "latest_monitor_report",
    description: "Read the most recent media-monitoring briefing (mentions, risks, opportunities, draft responses).",
    inputSchema: z.object({}),
    run: async () => {
      const r = latestReport("monitor");
      return r ? monitorMarkdown(r) : "No monitoring report yet — run run_monitor.";
    },
  }),
  betaZodTool({
    name: "run_monitor",
    description: "Run a fresh monitoring sweep now (news, feeds, our sites, web and social search). Takes a few minutes.",
    inputSchema: z.object({ web: z.boolean().optional().describe("false = skip live web/social search") }),
    run: async ({ web }) => monitorMarkdown(await runMonitor({ web: web ?? true })),
  }),
  betaZodTool({
    name: "check_sites",
    description: "Check that mediaiconsafrica.com, asiko.africa, asiko.live and fastonafrica.com are up, and how fast.",
    inputSchema: z.object({}),
    run: async () => JSON.stringify(await checkSites()),
  }),
  betaZodTool({
    name: "triage_enquiry",
    description: "Log an enquiry someone pasted in (email, DM, comment, call note), route it to a division and draft the reply.",
    inputSchema: z.object({
      channel: z.enum(CHANNELS),
      from: z.string().optional().describe("email, phone or handle"),
      name: z.string().optional(),
      message: z.string(),
    }),
    run: async (input) => JSON.stringify(await handleEnquiry(input)),
  }),
  betaZodTool({
    name: "list_enquiries",
    description: "List logged enquiries with their division, status and drafted reply.",
    inputSchema: z.object({
      status: z.enum(["new", "drafted", "approved", "sent", "dismissed", "error"]).optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
    run: async ({ status, limit }) =>
      JSON.stringify(
        listEnquiries({ status, limit: limit ?? 20 }).map((e) => ({
          id: e.id,
          receivedAt: e.receivedAt,
          channel: e.channel,
          name: e.name,
          status: e.status,
          division: e.triage?.divisionId,
          intent: e.triage?.intent,
          urgency: e.triage?.urgency,
          escalate: e.triage?.escalate,
          summary: e.triage?.summary,
        })),
      ),
  }),
];

/**
 * Answer one staff request.
 * @param {{role: "user"|"assistant", content: string}[]} history plain-text turns, last one from the user
 */
export async function chat(history) {
  const turns = history
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20);
  if (!turns.length || turns.at(-1).role !== "user") throw new InputError("The last message must be from the user.");

  const runner = getClient().beta.messages.toolRunner({
    ...BASE_PARAMS,
    model: config.model,
    max_tokens: 32000,
    max_iterations: 12,
    stream: true,
    system: systemPrompt(),
    output_config: { effort: "high" },
    tools: [...tools, ...WEB_TOOLS(6)],
    messages: [
      ...turns.map((m) => ({ role: m.role, content: m.content })),
      { role: "system", content: `Today is ${todayLagos()} (Lagos). Reply in Markdown. Show drafted content in full.` },
    ],
  });

  const sources = new Map();
  let last;
  for await (const stream of runner) {
    const message = await stream.finalMessage();
    last = message;
    for (const s of webSources(message.content)) sources.set(s.url, s);
    if (message.stop_reason === "pause_turn") runner.pushMessages({ role: "assistant", content: message.content });
  }
  if (!last) throw new AgentError("No answer came back.");
  if (last.stop_reason === "refusal") throw new AgentError("Claude declined this request.");
  return { reply: textOf(last) || "(no text reply)", sources: [...sources.values()] };
}
