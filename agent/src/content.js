// Content generation: ready-to-post content for any division (or John Upah),
// and a weekly content calendar that keeps all divisions visible.
import { z } from "zod";
import { structured } from "./claude.js";
import { divisions, divisionIds, getDivision } from "./kb.js";
import { saveReport } from "./store.js";
import { todayLagos } from "./config.js";
import { InputError } from "./errors.js";

export const PLATFORMS = [
  "instagram",
  "facebook",
  "x",
  "linkedin",
  "tiktok",
  "youtube",
  "whatsapp",
  "email",
  "blog",
  "press-release",
];

export const PERSONAS = ["brand", "john-upah"];

const Post = z.object({
  platform: z.enum(PLATFORMS),
  divisionId: z.string().describe("id of the division this post promotes, or 'group'"),
  persona: z.enum(PERSONAS),
  title: z.string().describe("headline / subject line / video title; empty string if the platform has none"),
  hook: z.string().describe("the opening line that stops the scroll"),
  body: z.string().describe("the full, ready-to-post copy in the platform's format"),
  hashtags: z.array(z.string()),
  cta: z.string().describe("the single call to action"),
  link: z.string().describe("the URL the CTA points to, from the knowledge base"),
  visualBrief: z.string().describe("what the image, carousel, reel or thumbnail should show"),
  bestTime: z.string().describe("suggested day/time to post, West Africa Time"),
  toConfirm: z.array(z.string()).describe("facts the team must check before posting; empty if none"),
});

const ContentPack = z.object({ posts: z.array(Post) });

function checkDivision(divisionId) {
  if (divisionId === "group") return;
  const d = getDivision(divisionId);
  if (!d) throw new InputError(`Unknown division "${divisionId}". Known: group, ${divisionIds().join(", ")}`);
  if (!d.confirmed) throw new InputError(`Division "${divisionId}" is not confirmed yet — fill it in knowledge/divisions.json first.`);
}

/**
 * Generate ready-to-post content.
 * @param {{divisionId: string, platforms: string[], brief: string, persona?: string, variations?: number}} req
 */
export async function generateContent({ divisionId = "group", platforms, brief, persona = "brand", variations = 1 }) {
  checkDivision(divisionId);
  const bad = platforms.filter((p) => !PLATFORMS.includes(p));
  if (bad.length) throw new InputError(`Unknown platform(s): ${bad.join(", ")}. Use: ${PLATFORMS.join(", ")}`);
  if (!PERSONAS.includes(persona)) throw new InputError(`persona must be one of ${PERSONAS.join(", ")}`);
  const n = Math.min(Math.max(Number(variations) || 1, 1), 5);

  const who =
    persona === "john-upah"
      ? "Write in John Upah's own first-person voice, as thought leadership from the CEO."
      : "Write in the Media Icons Africa brand voice (the division's own account).";
  const prompt = `Create ${n} variation(s) of a post for EACH of these platforms: ${platforms.join(", ")}.
Division: ${divisionId === "group" ? "the whole group (Media Icons Africa)" : divisionId}.
${who}
Brief: ${brief}

Follow the platform norms in the brand voice section exactly. Use only facts from the knowledge
base or the brief; anything else goes in toConfirm. Where it is natural, cross-sell one other
division. Today is ${todayLagos()} (Lagos).`;

  const { posts } = await structured({ prompt, schema: ContentPack, effort: "high", maxTokens: 32000 });
  return posts;
}

const CalendarItem = z.object({
  divisionId: z.string(),
  platform: z.enum(PLATFORMS),
  persona: z.enum(PERSONAS),
  pillar: z.enum(["educate", "showcase", "social-proof", "behind-the-scenes", "offer", "community", "thought-leadership"]),
  idea: z.string().describe("one-sentence post idea, specific enough to brief a writer"),
  cta: z.string(),
});

const Calendar = z.object({
  theme: z.string().describe("the week's umbrella story for the ecosystem"),
  days: z.array(z.object({ date: z.string().describe("YYYY-MM-DD"), items: z.array(CalendarItem) })),
  notes: z.array(z.string()).describe("dates, events or risks the team should know about this week"),
});

/** Plan a content calendar covering every confirmed division plus John Upah. */
export async function planCalendar({ startDate = todayLagos(), days = 7, focus = "" } = {}) {
  const live = divisions();
  const span = Math.min(Math.max(Number(days) || 7, 1), 31);
  const prompt = `Plan a ${span}-day content calendar starting ${startDate} for the Media Icons Africa ecosystem.

Requirements:
- Every one of these ${live.length} divisions appears at least once per 7 days: ${live.map((d) => d.id).join(", ")}.
- John Upah (persona "john-upah") posts thought leadership on LinkedIn at least twice per 7 days, plus X.
- Asiko TV gets daily viewer-facing posts (channel highlights, "tune in on channel N").
- 3–6 items per day, spread across platforms; weekends lean to viewer and community content.
- At least one item per week shows the ecosystem: how divisions work together for one client.
- Note any relevant Nigerian/African holidays or industry moments in the period as notes, only if you are sure of the date.
${focus ? `- This period's focus: ${focus}` : ""}`;

  const calendar = await structured({ prompt, schema: Calendar, effort: "high", maxTokens: 32000 });
  saveReport("calendar", `calendar-${startDate}`, { json: calendar, markdown: calendarMarkdown(calendar) });
  return calendar;
}

export function calendarMarkdown(cal) {
  const lines = [`# Content calendar — ${cal.theme}`, ""];
  for (const day of cal.days) {
    lines.push(`## ${day.date}`, "", "| Division | Platform | Voice | Pillar | Idea | CTA |", "|---|---|---|---|---|---|");
    for (const i of day.items) {
      lines.push(`| ${i.divisionId} | ${i.platform} | ${i.persona} | ${i.pillar} | ${i.idea.replace(/\|/g, "/")} | ${i.cta.replace(/\|/g, "/")} |`);
    }
    lines.push("");
  }
  if (cal.notes.length) lines.push("## Notes", "", ...cal.notes.map((n) => `- ${n}`));
  return lines.join("\n");
}

export function postsMarkdown(posts) {
  return posts
    .map((p, i) =>
      [
        `## ${i + 1}. ${p.platform} · ${p.divisionId} · ${p.persona}`,
        p.title ? `**${p.title}**\n` : "",
        p.body,
        p.hashtags.length ? `\n${p.hashtags.join(" ")}` : "",
        `\n**CTA:** ${p.cta} — ${p.link}`,
        `**Visual:** ${p.visualBrief}`,
        `**Post at:** ${p.bestTime}`,
        p.toConfirm.length ? `**Check before posting:** ${p.toConfirm.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n---\n\n");
}
