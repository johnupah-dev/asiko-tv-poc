# playout/ — make the channels real (Roadmap Layer 1)

The POC front end fakes the linear feed in the browser. This folder turns the channels
in `../data/channels.json` into **real 24/7 linear channels** on **Eyevinn Open Source
Cloud** using the `channel-engine` service (VOD2Live: it joins already-encoded HLS
files into one continuous stream, with no live encoder per channel).

Nothing here changes the viewer experience. When it's done you copy the resulting
playback URLs into `data/channels.json` and the front end plays your real feeds.

## Prerequisites (yours to do)

1. An **Open Source Cloud** account at <https://app.osaas.io> with a **card on file**.
2. An **access token**: app.osaas.io → Settings → API. Put it in `playout/.env`
   (copy `playout/.env.example`).

## Cost (from Eyevinn, Sep 2026)

| Item | Tokens/day |
|---|---|
| 1 channel | 10 |
| 26 VOD channels (the two `live` channels are skipped) | 260 |
| storage + ad insertion + scheduler | ~30 |
| **Full bouquet total** | **~290/day** |
| transcoding (batch — **turn it off after**) | 250/day |

Free tier = 100 tokens total. Professional trial = 300/day for 14 days, card required.
The full bouquet sits right at the trial ceiling, so either upgrade or bring channels
up in batches with `--only` / `-Only`.

## How each channel is played out

`data/channels.json` decides, channel by channel:

| In `channels.json` | What gets created |
|---|---|
| `"live": true` | **Nothing.** It is already a live feed (e.g. ASIKO LIVE). |
| no `playout` block | **Loop** on the channel's `src`. One video, repeated. This is the original POC behaviour. |
| `"playout": { "type": "Playlist", "url": "…/movieafrica.txt" }` | **Playlist**: the `.txt` lists HLS URLs, one per line. They play top to bottom, then loop. **Use this for real channels.** |
| `"playout": { "type": "WebHook", "url": "https://…/nextVod" }` | **WebHook**: before each item the engine calls `GET <url>?channelId=…` and plays the `hlsUrl` in the JSON reply (`{ id, title, hlsUrl, prerollUrl?, prerollDurationMs? }`). Use this for dated schedules later (MVP W4). |
| `"playout": { "skip": true }` | Nothing. Leaves a channel out without deleting its config. |

### Idents and the off-air slate

Set these once for the whole network in `playoutDefaults` (top level of `channels.json`).
A channel's own `playout` block can override them, and `"preroll": null` turns the ident
off for that channel:

```json
"playoutDefaults": {
  "slate":   "https://<zone>.b-cdn.net/<slate-videoId>/playlist.m3u8",
  "preroll": { "url": "https://<zone>.b-cdn.net/<ident-videoId>/playlist.m3u8", "durationMs": 5000 }
},
"channels": [
  { "id": "movieafrica", "playout": {
      "type": "Playlist",
      "url": "https://<zone>.b-cdn.net/playlists/movieafrica.txt",
      "preroll": { "url": "https://<zone>.b-cdn.net/<movieafrica-ident>/playlist.m3u8", "durationMs": 6000 }
  }, … }
]
```

- **preroll**: plays **before every item** in the playlist, so it works as the channel
  ident between programmes. Channel Engine tags the preroll with HLS ad markers, which
  means server-side ad insertion can replace that slot later. If you don't want that,
  leave `preroll` out and put the ident clip into the playlist as its own line instead.
- **slate**: shown if a source fails to load, instead of a black screen.

### The on-screen logo

Channel Engine does not re-encode, so it **cannot draw a logo on the picture**. There
are two options:

1. **Burn it in at encode time** with a Bunny Stream library watermark. Set the watermark
   *before* uploading, and use one Bunny library per channel. The logo then shows on
   every platform the feed goes to.
2. **Asiko's own player** also shows the logo in its on-screen badge. That comes from each
   channel's `"logo"` field in `data/channels.json` (files are in `docs/assets/logos/`).

## Playlist files

The format is plain text: one HLS VOD URL per line, with nothing else in the uploaded
copy. See `playlists/example.txt`. All items in one channel must share the same encoding
ladder and audio layout (one Bunny library per channel with fixed resolutions does this
for you). Host the `.txt` on Bunny Storage behind a pull zone.

## Run it

**Windows, no install:**

```bash
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 check                 # every source reachable? (free)
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 token                 # auth check
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision             # create all
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision -Only movieafrica,ppg
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision -Only movieafrica -Recreate   # after changing type/url
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 status                # URLs -> playout/playout.json
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 teardown              # delete every asiko* channel
```

**Any dev, with Node:** `cd playout && npm install`, then
`node provision.mjs check | token | provision | status | teardown`, with the same
`--only a,b` and `--recreate` flags.

**Always run `check` first.** It downloads every playlist and every HLS URL in it (plus the
slate and ident) and flags anything that isn't a reachable `#EXTM3U` manifest. It costs
nothing on OSC. A **403 from Bunny** usually means *Block direct URL access* is switched on
for that library (the `mychannel` problem from September).

Instances are named `asiko<id>` with non-alphanumerics stripped (`ma-yoruba` →
`asikomayoruba`), max 20 characters, so `teardown` only ever touches Asiko channels.
Your existing `mychannel` instance is never touched.

## Then

1. Open `playout/playout.json`, copy each `playback` URL.
2. Paste it into `data/channels.json` as that channel's `src`, and mirror the change into
   the inline copy in `docs/index.html` (the deployed single-file build).
3. Update that channel's `programs` list to match the playlist order and running times,
   so the guide is right.

## How the API wiring works

`osc-fast.ps1` does exactly what the Eyevinn SDK does under the hood:

1. `POST https://catalog.svc.prod.osaas.io/mysubscriptions`, with header `x-pat-jwt: Bearer <token>`
   and body `{"services":["channel-engine"]}`: activates the service.
2. `POST https://token.svc.prod.osaas.io/servicetoken`, same header, body
   `{"serviceId":"channel-engine"}`: returns a short-lived **service token**.
3. `GET .../mysubscriptions`: the entry with `serviceId == "channel-engine"` gives its `apiUrl`.
4. `POST <apiUrl>`, with header `x-jwt: Bearer <service token>` and body
   `{"name","type","url","opts":{useDemuxedAudio, useVttSubtitles, defaultSlateUri?, preroll?}}`:
   launches a channel.
5. `GET <apiUrl>/../health/<name>`: poll until `status == "running"`.
6. `DELETE <apiUrl>/<name>`: teardown.

## Next (Layer 2 — ads)

Once the channels are real, replace the browser's simulated ad breaks with
**server-side ad insertion**: Eyevinn's one-click **SGAI Pipeline** deploys the whole
ad stack plus a test ad server. That's a separate step. This folder only does playout.
