# playout/ — provision linear channels on Eyevinn Open Source Cloud

Each Asiko TV channel is a continuous HLS stream. This folder creates them with
Eyevinn's `channel-engine` service (VOD2Live — it loops already-encoded video into a
24/7 linear stream, no live encoder per channel).

A channel is provisioned when it has a `loopSource` in `../data/channels.json` — the
HLS VOD playlist (e.g. on Bunny Stream) to loop. Channels without one are skipped and,
in the viewer, carry the network feed (`networkFeed`) until they get their own `src`.

## Prerequisites

1. An **Open Source Cloud** account at <https://app.osaas.io> with a card on file.
2. An **access token**: app.osaas.io → Settings → API. Put it in `playout/.env`
   (copy `playout/.env.example`).

## Cost (from Eyevinn, Sep 2026)

| Item | Tokens/day |
|---|---|
| 1 channel | 10 |
| 29 channels | 290 |
| storage + ad insertion + scheduler | ~30 |
| transcoding (batch — **turn it off after**) | 250/day |

## Run it

**Windows, no install:**

```bash
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 token       # auth check
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision   # create every channel with a loopSource
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 status      # URLs -> playout/playout.json
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 teardown    # delete every asiko* channel (they cost while running)
```

**Any dev, with Node:** `cd playout && npm install && npm run provision`

Both read `../data/channels.json`, create one `channel-engine` Loop instance per
channel with a `loopSource`, named `asiko<id>` (e.g. `asikomovieafrica`), wait for health, and write
`playout/playout.json` mapping each channel to its live HLS playback URL.

## Then

1. Open `playout/playout.json`, copy each `playback` URL.
2. Paste it into `data/channels.json` as that channel's `src`.
3. `node build.mjs` and upload `docs/` — that channel now plays its own feed.

## How the API wiring works

`osc-fast.ps1` does exactly what the Eyevinn SDK does under the hood:

1. `POST https://catalog.svc.prod.osaas.io/mysubscriptions` — `x-pat-jwt: Bearer <token>`,
   body `{"services":["channel-engine"]}` — activate the service.
2. `POST https://token.svc.prod.osaas.io/servicetoken` — same header, body
   `{"serviceId":"channel-engine"}` → short-lived **service token**.
3. `GET .../mysubscriptions` → the entry with `serviceId == "channel-engine"` → its `apiUrl`.
4. `POST <apiUrl>` — header `x-jwt: Bearer <service token>`, body
   `{"name","type":"Loop","url","opts":{…}}` — launch a channel.
5. `GET <apiUrl>/../health/<name>` — poll until `status == "running"`.
6. `DELETE <apiUrl>/<name>` — teardown.

Channel Engine instance names must be lowercase `a–z0–9`. The channel `id`s in
`data/channels.json` already satisfy this; they get an `asiko` prefix so `teardown`
can find them.

## Next (Layer 2 — ads)

Ads go into the streams server-side (the viewer app has no ad logic): Eyevinn's one-click **SGAI Pipeline** deploys the whole
ad stack plus a test ad server. That's a separate step — this folder only does playout.
