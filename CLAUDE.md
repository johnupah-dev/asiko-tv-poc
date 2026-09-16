# Asiko TV — project memory

This file is read automatically at the start of every Claude Code session in
this repo. It's the durable index of the Asiko TV project — what it is, where
the code and docs live, what's live in production, and where things stood as
of the last status check. Read `docs-vision/README.md` next for the full
document index.

## What this is

**Asiko TV** is a free, ad-supported FAST (Free Ad-supported Streaming TV)
platform for African television — Nollywood, news, faith, music, comedy,
culture — built by **Media Icons Africa**, run by John Upah
(johnupah@gmail.com). This repo (`asiko-tv-poc`, internally `LOOP7`) is the
working proof of concept: a single-page front end plus the scripts that turn
its channels into a real 24/7 linear broadcast on cloud infrastructure.

## Live surfaces

- **www.asiko.africa** — the product itself: the channel grid / player POC
  (this repo's `index.html` + `app.js`, deployed via `deploy/`).
- **www.asiko.live** — the sales/funnel/marketing site (`site-asiko-live/`
  in this repo) — channel guide, "list your channel," advertiser pitch.
- Both are Media Icons Africa properties; **GitHub**: `johnupah-dev/asiko-tv-poc`
  (this repo, origin of both sites' source).

Check these two live URLs directly when you need current on-air state —
this file and `docs-vision/` describe the code and the plan, not a live feed.

## Infrastructure (already connected in this session)

- **Eyevinn Open Source Cloud (OSC)** — playout. An MCP server for OSC is
  connected in this session (tools prefixed `create-service-instance`,
  `list-service-instances`, etc. — see the OSC assistant role note). Channels
  run as `channel-engine` Loop instances, sourced from Bunny Stream URLs.
  Local provisioning scripts: `playout/osc-fast.ps1` / `playout/provision.mjs`,
  config in `playout/.env` (gitignored; template at `playout/.env.example`).
  Instance names are prefixed `asiko` (e.g. `asikoprime`); token cost is
  confirmed at **10 tokens/day per running channel**.
- **Bunny Stream / CDN** — video storage and delivery. Channels source from a
  Bunny Stream library; the pull zone **must** allow direct URL access (this
  broke ASIKO LIVE once — see status report `docs-vision/15-`) and
  `useDemuxedAudio` must match the source's mux layout (also broke ASIKO LIVE
  once, silently dropping audio). **Library ID: `749953`** (not sensitive —
  safe to keep in plain text). The library-scoped Stream API Key is NOT in
  this repo or this file — it should be set as an environment variable
  (e.g. `BUNNY_STREAM_API_KEY`) in the Claude Code environment's own config,
  never pasted into chat or committed. With both, Bunny's REST API is plain
  HTTPS — e.g. `GET https://video.bunnycdn.com/library/749953/videos` with
  header `AccessKey: <key>` — no connector needed, just `curl`/Bash.
- **Hostinger / cPanel** — hosts asiko.africa; `deploy/asiko.africa.htaccess`
  is the forced-HTTPS/HSTS config staged for it.
- **Hercules** — CMS (per the launch-ops plan doc).

## Repo layout

| Path | What it is |
|---|---|
| `index.html`, `app.js`, `styles.css` | The POC front end (asiko.africa) — 7→28-channel grid, player, simulated EPG/ad-revenue strip |
| `data/channels.json`, `data/channels-bouquet.json` | Channel config — the live 7/28-channel set and the full 89-channel bouquet respectively |
| `playout/` | Turns POC channels into real Eyevinn OSC `channel-engine` instances — see `playout/README.md` |
| `deploy/` | Hosting-side config (`.htaccess` for asiko.africa — forced HTTPS/HSTS) |
| `site-asiko-live/` | Source for www.asiko.live (marketing/funnel site — channel guide, join, advertise, admin) |
| `docs/` | Additional docs (`index.html`) |
| `docs-vision/` | **The knowledge base** — every strategy/vision/status doc as durable HTML (+ PDF/DOCX where generated). See `docs-vision/README.md` for the indexed table of contents (18 documents as of this writing). |
| `server.js`, `serve.ps1` | Local dev servers (Node / PowerShell, no build step, no deps beyond `hls.js` from CDN) |

## Where things stood — last status check (12 Sep 2026)

Full detail: `docs-vision/15-status-report-sep-2026.html`. Headline points,
likely stale by the time you read this — verify against the live sites and
OSC before acting on any of it:

- 28 channels live on asiko.africa; **only 1 (ASIKO LIVE)** was running on
  real Eyevinn + Bunny infrastructure end-to-end (video + audio) — the other
  27 were on stock test streams (Apple bip-bop / Mux / Unified Streaming demos).
- Three real bugs were found and fixed getting ASIKO LIVE working: Bunny
  blocking direct URL access, `useDemuxedAudio: false` silently dropping
  audio, and a mislabeled "1080p" tier actually serving 720p segments (this
  last one is a channel-engine manifest quirk, not fixed).
  The repeatable 6-step process for wiring up each remaining channel is in
  that report's "Creating the remaining 27" section.

## Infra groundwork update (16 Sep 2026)

All **28/28 channels now run on real Eyevinn `channel-engine` instances**
(`asiko01`–`asiko26`, `asiko28`, plus the pre-existing `mychannel` for
channel 27/ASIKO LIVE) — see commit `8bb1715`. `data/channels.json` `src`
fields point at these live instances. **Content is still placeholder**: every
instance loops one of two Eyevinn demo assets (`tearsofsteel_4k.mov` /
`VINN.mp4`) — real Asiko programming (Nollywood, news, faith, music etc.)
was expected ~5 days out from this update (so check the actual date before
trusting that window). No Bunny Stream credentials/connector were available
in that session, so **Bunny is still the open item**: either get Bunny API
access added, or get the real Bunny playback URLs handed over per-batch, then
swap each channel's `src` (delete + recreate the instance, or update its
`url` config, per `playout/README.md`'s 6-step process) — no front-end
changes needed either way.

Operational notes for next time you touch OSC channel-engine at this scale:
the platform's ingress controller throws frequent transient 409/500 errors
under concurrent instance creation, and — more importantly — a create call
can report success and even show "running" moments later, then silently
vanish. **Don't trust a single status check as final** — do a full
`list-service-instances` sweep at the end and reconcile against it before
declaring done. Token cost for 28 running instances: ~280/day against a
300/day refill (confirmed via `get-usage`) — sustainable but thin; recheck
before adding more always-on services.
- A mobile portrait video-stage regression was found and fixed same night;
  a **phone-landscape layout gap was still open** (serves the 10-column
  desktop grid squeezed into a short viewport).
  `9ed0069` (see `git log`) is a mobile fix landed after this report — check
  whether it covers landscape or just portrait before assuming either way.
- asiko.africa was still serving over **plain HTTP** ("Not secure") pending
  an AutoSSL click in cPanel — check current cert status before assuming
  fixed.
- asiko.live's rebuilt homepage/channel-guide (full 89-channel bouquet) was
  finished in-repo (`site-asiko-live/`) but **undeployed** — confirm current
  deploy state.
- Revenue/ad dashboard is entirely simulated — no real SCTE-35/SSAI or ad
  server yet.
- Cost model: `Asiko_Channel_Cost_Model.xlsx` (not in this repo) is the
  source of truth; Eyevinn Professional plan monthly fee and Bunny's
  storage/bandwidth rate card were unconfirmed as of that report.

## Document index (`docs-vision/`)

18 documents covering architecture, design spec, onboarding/ad-revenue,
launch checklists, week-1 plan, trail-to-launch financials, investor
readiness, channel-owner Q&A, POC→MVP transition, properties/positioning,
SWOT, niche/mitigations, team, the Sept 2026 status report, launch
operations plan, a homepage design concept, and the Digitex ad-tech
partnership playbook. Full table with descriptions and audience:
`docs-vision/README.md`.

**Not included here** (same account/company, different scope — ask if you
want these folded in too): MEDIA360 (a separate Media Icons Africa product —
reference build, teardown audit, build-status tracker), a general Nigerian
media/Nollywood contacts list, and a personal financial-planning briefing for
John Upah. None of these are part of the Asiko TV product itself.

## Working conventions

- No build step, no framework — plain HTML/CSS/JS. Keep it that way unless
  asked to change it.
- `data/channels.json` is the single source of truth for channel config —
  edit it, not hardcoded arrays in `app.js`, when changing channels.
- Real channel URLs come from `playout/playout.json` (generated, gitignored)
  — never hand-fabricate a playback URL.
- Contact/attribution: Media Icons Africa; John Upah, johnupah@gmail.com.
