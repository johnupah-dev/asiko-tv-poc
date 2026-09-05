# playout/ — make the channels real (Roadmap Layer 1)

The POC front end fakes the linear feed in the browser. This folder turns the
**same 7 channels** (`../data/channels.json`) into **real 24/7 linear channels** on
**Eyevinn Open Source Cloud** using the `channel-engine` service (VOD2Live — it loops
already-encoded video into a continuous HLS stream, no live encoder per channel).

Nothing here changes the viewer experience. When it's done you copy the resulting
playback URLs into `data/channels.json` and the front end is playing your real feeds.

## Prerequisites (yours to do)

1. An **Open Source Cloud** account at <https://app.osaas.io> with a **card on file**
   (every paid plan has a 14-day free trial; the POC fits the trial).
2. An **access token**: app.osaas.io → Settings → API. Put it in `playout/.env`
   (copy `playout/.env.example`).

## Cost (from Eyevinn, Sep 2026)

| Item | Tokens/day |
|---|---|
| 1 channel | 10 |
| 7 channels | 70 |
| storage + ad insertion + scheduler | ~30 |
| **7-channel POC total** | **~100/day** |
| transcoding (batch — **turn it off after**) | 250/day |

Free tier = 100 tokens total. Professional trial = 300/day for 14 days, card required.

## Run it

**Windows, no install:**

```bash
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 token       # auth check
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 provision   # create all 7
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 status      # URLs -> playout/playout.json
powershell -ExecutionPolicy Bypass -File playout/osc-fast.ps1 teardown    # delete all 7 (they cost while running)
```

**Any dev, with Node:** `cd playout && npm install && npm run provision`

Both read `../data/channels.json`, create one `channel-engine` Loop instance per
channel named `asiko<id>` (e.g. `asikoprime`), wait for health, and write
`playout/playout.json` mapping each channel to its live HLS playback URL.

## Then

1. Open `playout/playout.json`, copy each `playback` URL.
2. Paste it into `data/channels.json` as that channel's `src`.
3. Reload the front end — real linear channels now.

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

Once the channels are real, replace the browser's simulated ad breaks with
**server-side ad insertion**: Eyevinn's one-click **SGAI Pipeline** deploys the whole
ad stack plus a test ad server. That's a separate step — this folder only does playout.
