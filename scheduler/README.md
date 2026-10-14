# Asiko Scheduler

The playout brain behind every Asiko TV channel. Built by Media Icons Africa.

Eyevinn Channel Engine runs each channel in **WebHook** mode: whenever it needs the
next programme it asks this service, `GET /nextVod/<channel>`. The scheduler answers
and, along the way:

| Job | How |
|---|---|
| Multi-title channels | Rotates through the channel's playlist (one Bunny collection per channel) |
| Upload → on air | Bunny collections → sync workflow (every 10 min) → scheduler (every 5 min); no redeploy |
| Never dead air | Checks each video before airing it and skips broken ones; slate when nothing is playable |
| Survives restarts | Starts each channel at a wall-clock position, not item 1 |
| Real TV guide | `/epg` and `/epg/<channel>` from what actually aired plus the rotation ahead |
| Ads (house pre-rolls) | `ads.json` — a pre-roll every N programmes, rotated |
| Proof of play | `/asrun/<channel>` — what aired, when, with which ad |
| Monitoring | `/health` — per-channel content hours, skipped files, last Bunny pull |

## Run locally

```bash
cd scheduler
npm test                      # 12 tests, no network needed
PLAYLIST_DIR=playlists npm start
curl localhost:8080/health
```

## How content reaches the scheduler

1. Team uploads to Bunny Stream — one collection per channel.
2. GitHub Actions **Sync channels from Bunny** (every 10 min) reads every collection,
   loads every finished video to make sure it plays, and publishes one playlist per
   channel to the `channel-playlists` branch, with a `REPORT.md` of what will air
   and what was skipped. The Bunny key lives only in GitHub's encrypted secrets.
3. The scheduler reads those playlists every 5 minutes (`playlistBase` in
   `config.json`). No secrets on the scheduler host, nothing to redeploy.

The scheduler can also pull Bunny directly if `BUNNY_LIBRARY_ID`, `BUNNY_API_KEY`
and `BUNNY_CDN_HOST` are set in its environment.

## Deploy (Eyevinn OSC — My Apps)

Node.js app from this repo, `subPath: scheduler`. No parameter store needed —
settings are in `config.json`:

| Setting | Meaning |
|---|---|
| `playlistBase` | where the sync workflow publishes playlists |
| `slate.hlsUrl` | HLS VOD aired when a channel has nothing playable |

Optional environment: `ADMIN_KEY` (enables `POST /reload`), `RELOAD_MIN`.

## Content rules (Bunny)

- One collection per channel, named after the channel ("Tattase TV"), its id (`tattasetv`)
  or its number ("10 Tattase TV").
- Titles play in title order. Start them `01 `, `02 ` … to set the running order; the
  number is dropped from the on-air title.
- Only videos Bunny has finished encoding go on air.
- `node ingest-bunny.mjs --dry` shows exactly what each channel will air before it airs.

## Files

```
server.mjs          HTTP service
lib/scheduler.mjs   rotation, skip-broken, slate, pre-rolls, as-run, EPG
lib/bunny.mjs       Bunny collections -> playlists
lib/hls.mjs         VOD health check + length measurement
lib/lineup.mjs      channel line-up (copy of data/channels.json; npm run lineup)
ingest-bunny.mjs    pre-air report / write playlists to disk
ads.json            house-ad pre-rolls ({"every": 3, "houseAds": [...]})
playlists/          optional hand-made playlists (<channel>.json)
```
