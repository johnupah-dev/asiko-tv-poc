// Social & digital media monitoring. Gathers signals from Google News, any RSS
// feeds in the watchlist, a health check of our own sites, and Claude's web
// search across social platforms — then turns them into a briefing with risks,
// opportunities, draft responses and content ideas.
import { z } from "zod";
import { loadKnowledge, divisionIds } from "./kb.js";
import { research, structured } from "./claude.js";
import { saveReport } from "./store.js";
import { todayLagos } from "./config.js";

const TIMEOUT_MS = 15000;

async function fetchText(url, { method = "GET" } = {}) {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "user-agent": "MediaIconsAgent/1.0 (+https://www.mediaiconsafrica.com)" },
  });
  return { status: res.status, ok: res.ok, text: method === "HEAD" ? "" : await res.text() };
}

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();

/** Minimal RSS/Atom parser — enough for news and YouTube feeds. */
export function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/g) || [];
  for (const b of blocks) {
    const tag = (name) => {
      const m = b.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
      return m ? decode(m[1]) : "";
    };
    const atomLink = b.match(/<link[^>]*href="([^"]+)"/);
    items.push({
      title: tag("title"),
      url: tag("link") || (atomLink ? atomLink[1] : ""),
      date: tag("pubDate") || tag("published") || tag("updated"),
      source: tag("source"),
    });
  }
  return items;
}

const googleNews = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:7d`)}&hl=en-NG&gl=NG&ceid=NG:en`;

async function collectNews(terms) {
  const results = await Promise.allSettled(
    terms.map(async (t) => {
      const { ok, status, text } = await fetchText(googleNews(t.q));
      if (!ok) throw new Error(`HTTP ${status}`);
      return parseFeed(text).slice(0, 10).map((i) => ({ ...i, term: t.q, divisionId: t.divisionId }));
    }),
  );
  return {
    items: results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
    errors: results.flatMap((r, i) => (r.status === "rejected" ? [`Google News "${terms[i].q}": ${r.reason.message}`] : [])),
  };
}

async function collectFeeds(feeds) {
  const results = await Promise.allSettled(
    feeds.map(async (url) => {
      const { ok, status, text } = await fetchText(url);
      if (!ok) throw new Error(`HTTP ${status}`);
      return parseFeed(text).slice(0, 10).map((i) => ({ ...i, feed: url }));
    }),
  );
  return {
    items: results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
    errors: results.flatMap((r, i) => (r.status === "rejected" ? [`Feed ${feeds[i]}: ${r.reason.message}`] : [])),
  };
}

/** Uptime and response time for our own sites. */
export async function checkSites(sites = loadKnowledge().watchlist.sites) {
  return Promise.all(
    sites.map(async (url) => {
      const start = Date.now();
      try {
        const { status, ok } = await fetchText(url);
        return { url, up: ok, status, ms: Date.now() - start };
      } catch (err) {
        return { url, up: false, status: 0, ms: Date.now() - start, error: err.message };
      }
    }),
  );
}

const Mention = z.object({
  title: z.string(),
  url: z.string(),
  source: z.string().describe("publication or platform"),
  date: z.string(),
  divisionId: z.string().describe("division it concerns, 'group' or 'john-upah'"),
  sentiment: z.enum(["positive", "neutral", "negative", "mixed"]),
  whyItMatters: z.string(),
});

const Report = z.object({
  headline: z.string().describe("one-sentence summary of the period"),
  summary: z.string().describe("3–6 sentence briefing for John Upah"),
  mentions: z.array(Mention),
  risks: z.array(z.object({ issue: z.string(), severity: z.enum(["low", "medium", "high"]), url: z.string(), recommendedAction: z.string() })),
  opportunities: z.array(z.object({ opportunity: z.string(), divisionId: z.string(), url: z.string(), action: z.string() })),
  responses: z.array(
    z.object({ url: z.string(), platform: z.string(), context: z.string(), draftReply: z.string(), needsApproval: z.boolean() }),
  ),
  contentIdeas: z.array(z.object({ divisionId: z.string(), platform: z.string(), idea: z.string(), whyNow: z.string() })),
  gaps: z.array(z.string()).describe("sources that could not be checked or questions left open"),
});

/**
 * Run a full monitoring sweep.
 * @param {{web?: boolean}} opts web=false skips Claude's live web/social search (cheaper, news+feeds only)
 */
export async function runMonitor({ web = true } = {}) {
  const { watchlist } = loadKnowledge();
  const [news, feeds, sites] = await Promise.all([
    collectNews(watchlist.terms),
    collectFeeds(watchlist.feeds),
    checkSites(watchlist.sites),
  ]);

  let webFindings = { text: "", sources: [] };
  const gaps = [...news.errors, ...feeds.errors];
  if (web) {
    try {
      webFindings = await research({
        effort: "medium",
        maxUses: 10,
        prompt: `Search the web and social media for what was said in the last 7 days about:
${watchlist.terms.map((t) => `- ${t.q}`).join("\n")}
Social accounts to check: ${JSON.stringify(watchlist.socialHandles)}
Industry topics worth a reaction: ${watchlist.industryTerms.join("; ")}

Report every relevant mention you actually find with its URL, date, platform and what it says.
Include customer complaints or questions in comments, press coverage, competitor moves (e.g. other
African FAST/streaming platforms) and trends our divisions could ride. Say clearly what you could not access.`,
      });
    } catch (err) {
      gaps.push(`Web/social search failed: ${err.message}`);
    }
  }

  const signals = {
    date: todayLagos(),
    news: news.items,
    feeds: feeds.items,
    sites,
    webFindings: webFindings.text,
    webSources: webFindings.sources,
    gaps,
  };

  const report = await structured({
    schema: Report,
    effort: "high",
    maxTokens: 32000,
    prompt: `Here are this period's monitoring signals for Media Icons Africa (JSON):

${JSON.stringify(signals, null, 1)}

Write the monitoring briefing. Rules: only list mentions that appear in the signals, with their real
URLs — drop anything irrelevant (name clashes, unrelated people). Any site that is down or slower than
4000 ms is a risk. Draft public replies in the brand voice for comments/posts that deserve one
(needsApproval is true for anything negative, legal, press or investor related). Suggest content ideas
that ride what is happening, for specific divisions (${divisionIds().join(", ")}, group, john-upah).
Carry every gap forward into "gaps".`,
  });

  const result = { date: signals.date, generatedAt: new Date().toISOString(), sites, ...report, sourcesChecked: webFindings.sources.length + news.items.length + feeds.items.length };
  saveReport("monitor", `monitor-${signals.date}`, { json: result, markdown: monitorMarkdown(result) });
  return result;
}

export function monitorMarkdown(r) {
  const L = [`# Media monitor — ${r.date}`, "", `**${r.headline}**`, "", r.summary, ""];
  L.push("## Our sites", "", "| Site | Status | Response |", "|---|---|---|");
  for (const s of r.sites) L.push(`| ${s.url} | ${s.up ? "up" : `DOWN (${s.status || s.error})`} | ${s.ms} ms |`);
  L.push("");
  if (r.risks.length) {
    L.push("## Risks", "");
    for (const x of r.risks) L.push(`- **${x.severity.toUpperCase()}** ${x.issue} — ${x.recommendedAction} ${x.url}`);
    L.push("");
  }
  if (r.mentions.length) {
    L.push("## Mentions", "");
    for (const m of r.mentions) L.push(`- [${m.title}](${m.url}) — ${m.source}, ${m.date} · ${m.divisionId} · ${m.sentiment}. ${m.whyItMatters}`);
    L.push("");
  }
  if (r.opportunities.length) {
    L.push("## Opportunities", "");
    for (const o of r.opportunities) L.push(`- **${o.divisionId}:** ${o.opportunity} → ${o.action} ${o.url}`);
    L.push("");
  }
  if (r.responses.length) {
    L.push("## Draft responses", "");
    for (const x of r.responses) L.push(`- ${x.platform} ${x.url}${x.needsApproval ? " **(needs approval)**" : ""}\n  > ${x.draftReply}`);
    L.push("");
  }
  if (r.contentIdeas.length) {
    L.push("## Content ideas", "");
    for (const c of r.contentIdeas) L.push(`- **${c.divisionId} / ${c.platform}:** ${c.idea} — _${c.whyNow}_`);
    L.push("");
  }
  if (r.gaps.length) L.push("## Not checked / open questions", "", ...r.gaps.map((g) => `- ${g}`));
  return L.join("\n");
}
