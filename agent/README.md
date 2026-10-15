# Media Icons Agent

The marketing and content agent for Media Icons Africa's 12 divisions and John Upah. It runs on
Claude (`claude-opus-5-5`) and does three jobs:

| Job | What it does |
|---|---|
| **Create content** | Ready-to-post copy for any division or for John Upah, on Instagram, Facebook, X, LinkedIn, TikTok, YouTube, WhatsApp, email, blog or press release, with hashtags, a call to action, a visual brief, a posting time and a list of facts to check. Plans a weekly calendar that keeps every division and John visible. |
| **Monitor social & digital media** | Google News for every brand and division, any RSS/YouTube feeds, an uptime check of our four websites, and a live web & social search. Turns it into a briefing: mentions with links, risks, opportunities, draft public replies and content ideas that ride what's happening. |
| **Respond to enquiries** | Website forms (asiko.live and the other sites), WhatsApp messages, and anything staff paste in (emails, DMs, comments, call notes) are triaged: owning division, intent, urgency, lead score, escalation, next actions — and a reply is drafted in the person's language. A person approves every reply before it goes out. |

Plus **Ask** — a chat where staff ask in plain words and the agent uses all of the above, and web
search, on its own: *"Check what's trending in Nollywood this week, then draft three Instagram
posts for Asiko TV that ride it."*

## Start

```bash
cd agent
npm install
cp .env.example .env        # put your ANTHROPIC_API_KEY in it
npm start                   # dashboard at http://localhost:8787
```

Or from the command line:

```bash
node src/cli.js divisions
node src/cli.js content -d sports-agency -p linkedin,x -b "Sportsville Special Recognition Awards 2027: nominations story"
node src/cli.js content -d group -p linkedin --john -b "Why FAST is Africa's moment"
node src/cli.js calendar --days 7 --focus "Media Sales Conference sponsorship push"
node src/cli.js monitor
node src/cli.js enquiry -c email -f ada@example.com "We want our church on TV. How do we start?"
node src/cli.js enquiries --status drafted
node src/cli.js approve <id>
node src/cli.js chat
```

## What the agent knows — `knowledge/`

Edit these files to change what the agent says. No code changes needed; restart the server or
press **Reload knowledge** in Settings.

| File | Contents |
|---|---|
| `divisions.json` | The 12 divisions: services, audiences, sites, keywords, hashtags |
| `group.md` | Mission, vision, pillars, sectors, sites, contact details, Asiko TV facts |
| `voice.md` | Brand voice and the per-platform rules |
| `john-upah.md` | John's bio facts and first-person voice |
| `policies.md` | House rules: no invented facts or prices, escalation, privacy, approvals |
| `watchlist.json` | Search terms, social handles, RSS/YouTube feeds and sites the monitor watches |

**Division 12 is a placeholder.** The website lists 11 divisions. Fill in the twelfth in
`divisions.json` and set `"confirmed": true`; until then the agent never mentions it publicly.

## Connecting the channels

**Website forms.** `POST /api/leads` accepts the lead object the asiko.live forms already send
(`site-asiko-live/assets/js/leads.js`). Once the agent is deployed, set `CRM_ENDPOINT` in that
file to `https://<agent-host>/api/leads`. Allowed sites are in `AGENT_ALLOWED_ORIGINS`.

**WhatsApp Business.** In the Meta developer console, point the webhook at
`https://<agent-host>/webhooks/whatsapp` with your `WHATSAPP_VERIFY_TOKEN`, and set
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_APP_SECRET`. Incoming messages are
triaged; approving a draft sends it. `WHATSAPP_AUTO_SEND=true` lets routine replies go without
waiting (escalations always wait).

**Email and social comments.** Paste them into **Enquiries** (or use `enquiry` on the CLI).
Approving an email reply opens it in your mail client ready to send.

## Running it every day

`.github/workflows/marketing-agent.yml` runs the monitor every morning at 06:17 Lagos time and
plans the coming week's calendar every Monday. Results are in the run summary and as artifacts.
Add the repo secret `ANTHROPIC_API_KEY` to switch it on. It can also be run by hand from the
Actions tab.

## Hosting the dashboard

It is a plain Node 20+ server (`npm start`) with no database: enquiries and reports are JSON files
under `AGENT_DATA_DIR`. Any Node host works (a VPS, Hostinger Node.js hosting, Render, Railway).
Set `AGENT_ADMIN_TOKEN` before exposing it — without it the server only listens on localhost.
Back up the data directory.

## Safety rails

- Never invents prices, clients, partners, figures or results; unknowns are flagged "to confirm".
- Enquiry text is treated as data, never as instructions to the agent.
- Replies are drafts until a person approves them; legal, press, regulator, investor and
  complaint cases are flagged for escalation.
- If Claude declines a request, the API retries it on its recommended fallback model; if that
  also declines, the enquiry is kept with an error instead of being lost.

## Tests

```bash
npm test
```

The tests run without an API key: they use a fake client and a local stand-in for the API.
