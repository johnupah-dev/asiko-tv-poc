# Asiko Scheduler

The playout brain behind every Asiko TV channel. Built by Media Icons Africa.

Eyevinn Channel Engine runs each channel in **WebHook** mode: whenever it needs the
next programme it asks this service, `GET /nextVod/<channel>`. The scheduler answers
and, along the way:

| Job | How |
|---|---|
| Multi-title channels | Rotates through the channel's playlist (one Bunny collection per channel) |
| Upload → on air | Pulls Bunny Stream every 5 minutes when `BUNNY_*` is set; no redeploy, no commit |
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

## Deploy (Eyevinn OSC — My Apps)

Node.js app, `subPath: scheduler`. Parameter store values:

| Name | Value | Secret? |
|---|---|---|
| `BUNNY_LIBRARY_ID` | Bunny Stream library ID | no |
| `BUNNY_CDN_HOST` | e.g. `vz-xxxx-xxx.b-cdn.net` | no |
| `BUNNY_API_KEY` | Bunny Stream library API key — enter it yourself in the OSC dashboard | **yes** |
| `SLATE_URL` | HLS VOD to air when a channel has nothing playable | no |
| `ADMIN_KEY` | any long random string, for `POST /reload` | **yes** |

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
