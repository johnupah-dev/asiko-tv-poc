# Hand-made playlists (optional)

Normally channels come straight from Bunny Stream collections. To air a channel from
somewhere else, add `<channel-id>.json` here:

```json
{
  "channel": "ln247",
  "items": [
    { "id": "ep1", "title": "LN247 News Hour", "hlsUrl": "https://example.com/news/playlist.m3u8", "durationSec": 3600 }
  ]
}
```

`durationSec` is optional — the scheduler measures it. A Bunny collection for the same
channel takes priority over the file here.
