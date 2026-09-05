# LOOP7 — a 7-channel FAST streaming POC

**FAST** = *Free Ad-supported Streaming TV*. Like Pluto TV: you don't log in, you don't
pay, you "channel surf" a set of always-on linear channels, and the money comes from
ads and sponsorship, not subscriptions.

This repo is a **working proof of concept** you can open in a browser right now. It is
the front end of the product — the part viewers touch — plus a simulated ad/revenue
layer so you can see how monetisation behaves. The production plumbing (real playout,
real ad insertion) is described in **[Roadmap to MVP](#roadmap-to-mvp)** below.

---

## What works today

Open it and you get:

- **7 linear channels** (Prime Reel, Toonwave, Terra Live, Nightfall, Rewind 88,
  Field Notes, Pulse), each with its own genre, colour and program schedule.
- **"Live" behaviour** — every channel is playing at a position tied to the wall
  clock. Refresh the page or switch away and back: the show has moved on, exactly like
  real TV. You cannot pause or rewind the channel.
- **A program guide** (the *Guide* button, or press `G`) — a scrollable grid of
  what's on now and next across all 7 channels, with a live "now" line.
- **Ad breaks** — after ~150 seconds of viewing, the channel cuts to a 2-slot ad
  break with a countdown, then rejoins the live point. Each ad is logged.
- **A live revenue strip** along the bottom — impressions served, fill rate, blended
  eCPM, estimated gross revenue, and the split between **Direct-sold**,
  **Programmatic** and **House** demand. Numbers persist on your device between
  sessions.
- **Keyboard**: `1`–`7` change channel, `M` mute/unmute, `G` guide, `Esc` close.

### Honest scope

- **Video content is public test streams** (Blender open movies / standard HLS test
  assets), reused across channels with different branding and schedules. Real
  programming is a licensing/content task — see the roadmap.
- **Ads are simulated in the browser.** No real ad server, no real bids, no real
  money. The revenue panel is a model, not an earnings report — it exists to show the
  shape of the business and to be the slot where a real ad server plugs in.
- **Playout is client-side.** Production FAST runs the linear stream on a server so
  every viewer sees the same frame and ads can be stitched in server-side.

---

## Run it

**Windows, nothing installed** — in this folder:

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

**If you have Node.js** (any dev will):

```bash
node server.js
```

Either way, open **http://localhost:4173**. No build step, no dependencies.

> In the Claude Code desktop app you can also just hit **Run / Preview** — it's wired
> up via `.claude/launch.json` (uses the PowerShell server).

The video player library (`hls.js`) loads from a public CDN, so the first load needs
internet. Everything else is local files.

---

## How it's built (and why)

| Decision | Choice | Why |
| --- | --- | --- |
| App type | Single-page static site (HTML/CSS/JS, no framework) | A POC should be trivial to run, read and hand to any developer. No build tooling to rot. |
| Video format | **HLS** (`.m3u8`) via `hls.js` | The universal streaming format; every FAST platform and every CDN speaks it. |
| "Live" trick | Seek a looping video file to `now % duration` | This is a **linear / FAST** product, not on-demand: everyone sees the same frame, no pause/scrub/rewind, no library. The POC fakes the linear feed with zero server; production replaces it with a real continuous playout stream (Channel Engine + SCTE‑35 ad markers) — the viewer UI does not change. |
| Schedule (EPG) | Static JSON, computed against the clock | Mirrors how real playout separates the *stream* from the *schedule metadata*. |
| Ad model | Client-side break scheduler + weighted "SSP" picker | Demonstrates avail → creative → impression → revenue. This is the seam where SpringServe / an SSP connects. |
| State | `localStorage` | No accounts, no backend. Fine for a POC dashboard. |
| Config | Everything in `data/channels.json` | Channels, schedules, ad creatives, CPMs and demand weights are all editable in one file with no code changes. |

### File map

```
loop7/
├── index.html          # layout: player stage, channel rail, revenue strip, guide
├── styles.css           # "broadcast control room" dark theme, all tokens up top
├── app.js               # player, linear-sync, EPG, ad-break engine, revenue model
├── data/channels.json   # 7 channels + schedules + monetisation config  <-- edit me
├── serve.ps1            # zero-install dev server (Windows PowerShell)
├── server.js            # same thing for Node.js
└── .claude/launch.json  # "Run" button config for the desktop app
```

### Change the channels

Open `data/channels.json`. Each channel is:

```json
{
  "num": 1, "id": "prime", "name": "PRIME REEL", "genre": "Cinema",
  "accent": "#F2B441",
  "src": "https://.../playlist.m3u8",
  "programs": [ { "title": "Feature: Steel Horizon", "duration": 120 } ]
}
```

`duration` is in minutes. Swap `src` for any HLS stream, rename programs, add or
remove channels — the UI rebuilds itself.

---

## About "connect to Git, Claude Code, Eyevinn"

Straight answer, since you asked me to make the calls:

- **Git / Claude Code** — this folder is a git repository with a first commit. That's
  the "connect to Git" part done. Pushing it to GitHub needs *your* GitHub account
  (I can't create one for you); when you're ready, create an empty repo there and I'll
  give you the two commands to push.
- **Eyevinn** — Eyevinn's platform is **Open Source Cloud** (osaas.io). It's the
  fastest route from this POC to a real running FAST channel, and it's what the
  roadmap below is built around. **I can't sign you up or enter payment details** —
  account creation and billing are yours to do. Once you've created the account and
  added a card, I can drive the setup from there.

So: the POC is real and runnable now. The next stage needs you to create ~4 accounts
and add billing. I've listed exactly which, below.

---

## Roadmap to MVP

Think of it as three layers. The POC already has Layer 3. MVP means making Layers 1
and 2 real.

### Layer 1 — Content & playout (make the channels real)

| Step | What | Tool |
| --- | --- | --- |
| 1.1 | Get content you're allowed to stream: public-domain film libraries, an AVOD content deal, or your own footage. Even 20–40 hours per channel is enough to launch a loop. | Licensing / your call |
| 1.2 | Transcode + package each asset to HLS. | **Eyevinn Encore** (transcoding) on Open Source Cloud, or Cloudflare Stream / AWS MediaConvert |
| 1.3 | Store the packaged files + serve them over a CDN. | Cloudflare R2 + CDN, AWS S3 + CloudFront, or Bunny.net |
| 1.4 | Run a real linear playout engine that loops/schedules those assets into one continuous HLS stream per channel. | **Eyevinn Channel Engine** (`@eyevinn/channel-engine`) on Open Source Cloud — one instance per channel, fed by an MRSS or schedule file |
| 1.5 | Point `channels.json` `src` at the Channel Engine output URLs. **The front end doesn't change.** | this repo |

### Layer 2 — Monetisation (make the money real)

| Step | What | Tool |
| --- | --- | --- |
| 2.1 | Server-side ad insertion (SSAI): the playout stream carries ad-break markers; a stitcher fills them per viewer and splices ads into the HLS so they can't be blocked. | **Eyevinn Ad Server / Ad Normalizer** (VAST/VMAP) on Open Source Cloud, or AWS MediaTailor |
| 2.2 | An ad server to manage inventory, direct deals, and priorities. | **SpringServe** (the FAST industry standard) or Google Ad Manager |
| 2.3 | Programmatic demand: connect one SSP to start (they bring the advertisers and the OpenRTB auction). | Publica (by IAS), Nexxen, or Magnite |
| 2.4 | Direct sponsorship: sell "presenting sponsor of Channel X" and hour-block sponsorships yourself — highest margin, no tech dependency, good for launch. | Sales |
| 2.5 | Measurement: log impressions/completions to an analytics endpoint; reconcile against the ad server. | Simple events API + a dashboard (this POC's revenue strip becomes a real report) |

### Layer 3 — Product (done in this POC, needs hardening)

Player, channel surfing, EPG, ad-break UX, revenue dashboard. For MVP: move state to a
small backend, add basic analytics, wrap it for web + one connected-TV platform
(Roku / Fire TV via a web-based channel, or an Android TV build).

### What only you can do

1. **Create accounts** (all free to start): Eyevinn **Open Source Cloud**
   (app.osaas.io), a **CDN/storage** provider (Cloudflare recommended), **GitHub**,
   and register a **domain**.
2. **Add a payment method** to Open Source Cloud and the CDN. Nothing streams to an
   audience without this.
3. **Secure content rights** for 7 channels of programming. This is the long pole —
   start now, in parallel with everything else.
4. **Sign up with an ad server** (SpringServe) and **one SSP**. Both require a
   registered business entity and a review of your inventory.
5. **Legal basics**: company entity, privacy policy (ads = data collection), cookie/
   consent handling, content licences, music rights.

### Rough cost to run an MVP

- Open Source Cloud compute (7 Channel Engines + ad server): tens of dollars/day,
  scales with channel count, not audience.
- **CDN egress is the real variable cost** — roughly 0.9 GB per viewer-hour at
  TV quality, at ~$0.02–0.06/GB. 10,000 viewer-hours/month ≈ 9 TB ≈ $200–500/month.
- Ad server + SSP: usually a revenue share (a few percent) rather than a fixed fee.
- Break-even is a fill-rate-and-CPM question — the POC's revenue strip is where you
  model it.

### Suggested first three steps

1. **You**: create the Open Source Cloud account + add a card; create a GitHub repo
   and tell me the URL.
2. **Me**: push this repo to your GitHub, then stand up one real Channel Engine on
   Open Source Cloud for **Channel 1** using placeholder public-domain content, and
   repoint `channels.json` at it. One channel, end to end, for real.
3. **Both**: once Channel 1 is genuinely live, clone the setup to channels 2–7 and
   wire SpringServe into the ad breaks.

---

## Roadmap at a glance

```
         CONTENT            PLAYOUT             AD INSERTION         PRODUCT
        ---------          ---------           -------------        ---------
 [ license / PD / own ]                                        [ this repo: player ]
          |                                                          |  + EPG
          v                                                          |  + ad-break UX
 [ Eyevinn Encore ] --> [ Eyevinn Channel ] --> [ Eyevinn Ad     ] --> + revenue report
   transcode+package      Engine  x7            Normalizer / SSAI ]     (web + CTV)
          |                    |                       |
          v                    v                       v
 [ CDN: Cloudflare ]    [ 1 stream / channel ]  [ SpringServe + SSP ]
                                                [ + direct sponsors ]
```

---

*POC built as a starting point. Everything here is meant to be replaced piece by piece
with the production components above, without rewriting the viewer experience.*
