# Asiko TV — www.asiko.africa

Free, ad-supported African television: **29 always-on channels**, no subscription,
no sign-up. Open the site, pick a channel, watch.

## The launch line-up

| # | Channel | # | Channel |
|---|---|---|---|
| 1 | Asiko TV+ | 16 | Teen Africa |
| 2 | Movie Africa | 17 | Charmin Kids |
| 3 | Movie Africa Epic | 18 | PPG — Praise, Power & Glory |
| 4 | Movie Africa Series | 19 | Bounce TV |
| 5 | Movie Africa Hausa | 20 | Web TV |
| 6 | Movie Africa Igbo | 21 | LN247 |
| 7 | Movie Africa Yoruba | 22 | Estate TV |
| 8 | Amen Movies | 23 | C-Suite Café TV |
| 9 | Zeb Ejiro TV | 24 | Waves TV |
| 10 | Tattase TV | 25 | The Humour Network |
| 11 | Foodies & Spice | 26 | Women Connect |
| 12 | Sate TV | 27 | Sportsville TV |
| 13 | Sisi TV | 28 | Travel Nigeria |
| 14 | Hooked TV | 29 | Diner en Blanc LIVE |
| 15 | MUB TV | | |

## What viewers get

- **Live channels** — every channel is a continuous HLS stream from Eyevinn Channel
  Engine. Switching between channels that share a feed is instant.
- **Channel rail** with logos and what's on now; **Channels** overlay grouped by genre;
  **TV Guide** with a three-hour now/next grid.
- **Remote-style keys**: type a channel number (`2` `7` → Sportsville TV), `↑`/`↓` or
  `PgUp`/`PgDn` to surf, `C` channels, `G` guide, `M` mute, `Esc` close.
- **Shareable links**: `www.asiko.africa/#12` opens channel 12.
- The last channel watched is remembered on the device.

## Files

```
index.html            page markup
styles.css            design tokens + layout
app.js                player, rail, guide, channels overlay, keys
data/channels.json    the line-up: channels, logos, feeds, guide schedules  <-- edit me
assets/               favicon + channel logos (assets/channels/)
build.mjs             builds docs/ — the upload bundle for asiko.africa
docs/                 GENERATED — never edit by hand
deploy/               .htaccess for the asiko.africa cPanel host
playout/              provisions channels on Eyevinn Open Source Cloud
site-asiko-live/      asiko.live marketing / sales site (separate static site)
```

## Run it locally

```bash
node server.js          # or, on Windows: powershell -ExecutionPolicy Bypass -File serve.ps1
```

Open http://localhost:4173.

## Publish to asiko.africa

```bash
node build.mjs
```

Upload the contents of `docs/` (`index.html` and the `assets/` folder) to the web root
of asiko.africa. The build inlines the CSS, config and script into one `index.html`,
and fails if a channel number is duplicated, a logo file is missing, or a channel has
no stream.

## Channel config (`data/channels.json`)

```json
{
  "networkFeed": "https://…/master.m3u8",
  "channels": [
    { "num": 2, "id": "movieafrica", "name": "Movie Africa", "genre": "Nollywood & Beyond",
      "category": "movies", "logo": "assets/channels/movie-africa.png",
      "src": "https://…/master.m3u8",
      "programs": [ { "title": "Morning Movie", "duration": 120 } ] }
  ]
}
```

- `src` — the channel's own HLS stream. **A channel without `src` carries
  `networkFeed`**, so every channel always plays. Today every channel carries the
  network feed; give each one its own `src` as its playout comes up
  (see `playout/README.md`).
- `programs` — the guide schedule, durations in minutes, repeating through the day.
- `live: true` + `liveTitle` — a live-event channel (shown with a LIVE tag, no schedule).
- `category` — which group it sits in on the Channels overlay (`sections`).
- `logo` — optional; channels without one get a lettermark.
- `id` — lowercase `a–z0–9`, also used as the Channel Engine instance name.

## Ads

Ads belong in the streams, inserted server-side (Eyevinn ad insertion / SSAI), so
they can't be blocked. The viewer app carries no ad logic and needs no change when
ad insertion is switched on. Advertising and channel
listing enquiries go to the contacts in the site footer.
