#!/usr/bin/env node
// Command line for the Media Icons agent. Run `node src/cli.js help`.
import fs from "node:fs";
import { parseArgs } from "node:util";
import readline from "node:readline/promises";
import { divisions } from "./kb.js";
import { generateContent, planCalendar, postsMarkdown, calendarMarkdown, PLATFORMS } from "./content.js";
import { runMonitor, monitorMarkdown, checkSites } from "./monitor.js";
import { handleEnquiry, approveEnquiry } from "./enquiry.js";
import { listEnquiries } from "./store.js";
import { chat } from "./assistant.js";

const HELP = `Media Icons Africa — marketing & content agent

  divisions                                  list the divisions
  content  -d <division|group> -p <platforms> -b "<brief>" [--john] [-n 2] [-o out.md]
                                             write ready-to-post content
                                             platforms: ${PLATFORMS.join(",")}
  calendar [--start YYYY-MM-DD] [--days 7] [--focus "..."]
                                             plan a content calendar for every division
  monitor  [--no-web]                        run a monitoring sweep (news, feeds, sites, social)
  sites                                      check our four websites are up
  enquiry  -c <channel> [-f from] [--name N] "<message>"
                                             triage an enquiry and draft the reply
  enquiries [--status drafted]               list logged enquiries
  approve  <id> [--body "edited reply"]      approve (and send, on WhatsApp) a drafted reply
  chat                                       talk to the agent (it uses all of the above + web search)
`;

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    division: { type: "string", short: "d" },
    platforms: { type: "string", short: "p" },
    brief: { type: "string", short: "b" },
    john: { type: "boolean" },
    variations: { type: "string", short: "n" },
    out: { type: "string", short: "o" },
    start: { type: "string" },
    days: { type: "string" },
    focus: { type: "string" },
    "no-web": { type: "boolean" },
    channel: { type: "string", short: "c" },
    from: { type: "string", short: "f" },
    name: { type: "string" },
    status: { type: "string" },
    body: { type: "string" },
    json: { type: "boolean" },
  },
});

const [cmd, ...rest] = positionals;
const output = (data, markdown) => {
  const text = o.json ? JSON.stringify(data, null, 2) : markdown;
  if (o.out) {
    fs.writeFileSync(o.out, text);
    console.log(`saved ${o.out}`);
  } else console.log(text);
};

async function main() {
  switch (cmd) {
    case "divisions":
      for (const d of divisions({ includeUnconfirmed: true })) console.log(`${d.code}  ${d.id.padEnd(24)} ${d.name}${d.confirmed ? "" : "  [to confirm]"}`);
      break;
    case "content": {
      const posts = await generateContent({
        divisionId: o.division || "group",
        platforms: (o.platforms || "instagram,linkedin").split(",").map((s) => s.trim()),
        brief: o.brief || rest.join(" "),
        persona: o.john ? "john-upah" : "brand",
        variations: Number(o.variations || 1),
      });
      output(posts, postsMarkdown(posts));
      break;
    }
    case "calendar": {
      const cal = await planCalendar({ startDate: o.start, days: Number(o.days || 7), focus: o.focus || "" });
      output(cal, calendarMarkdown(cal));
      break;
    }
    case "monitor": {
      const r = await runMonitor({ web: !o["no-web"] });
      output(r, monitorMarkdown(r));
      break;
    }
    case "sites":
      console.table(await checkSites());
      break;
    case "enquiry": {
      const e = await handleEnquiry({ channel: o.channel || "other", from: o.from || "", name: o.name || "", message: rest.join(" ") });
      output(e, e.triage ? `${e.id} → ${e.triage.divisionId} (${e.triage.intent}, ${e.triage.urgency}${e.triage.escalate ? ", ESCALATE: " + e.triage.escalationReason : ""})\n\n${e.triage.reply.body}` : `${e.id}: ${e.error}`);
      break;
    }
    case "enquiries":
      for (const e of listEnquiries({ status: o.status })) {
        console.log(`${e.id}  ${e.receivedAt.slice(0, 16)}  ${e.status.padEnd(9)} ${(e.triage?.divisionId || "-").padEnd(22)} ${e.triage?.escalate ? "⚠ " : ""}${e.triage?.summary || e.message.slice(0, 80)}`);
      }
      break;
    case "approve": {
      const e = await approveEnquiry(rest[0], { body: o.body, approvedBy: "cli" });
      if (!e) throw new Error(`no enquiry ${rest[0]}`);
      console.log(`${e.id}: ${e.status}. ${e.delivery.note || e.delivery.error || ""}${e.delivery.url ? "\n" + e.delivery.url : ""}`);
      break;
    }
    case "chat": {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const history = [];
      console.log("Ask the agent anything. Empty line to quit.\n");
      for (;;) {
        const q = (await rl.question("you › ")).trim();
        if (!q) break;
        history.push({ role: "user", content: q });
        try {
          const { reply, sources } = await chat(history);
          history.push({ role: "assistant", content: reply });
          console.log(`\nagent › ${reply}\n${sources.length ? "\nSources:\n" + sources.map((s) => `- ${s.url}`).join("\n") + "\n" : ""}`);
        } catch (err) {
          history.pop();
          console.error(`error: ${err.message}\n`);
        }
      }
      rl.close();
      break;
    }
    default:
      console.log(HELP);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
