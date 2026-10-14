# Asiko TV — Friday channel upload runbook

Goal: every channel with cleared content airing its own programmes, with a real TV
guide, automatic skipping of bad files and a slate instead of dead air. Channels
without content show **Coming soon** and carry the Asiko network feed.

Who: **Team** = Media Icons staff. **Claude** = done from the Claude chat with the
Eyevinn and GitHub connections.

---

## Thursday — get ready

| # | Step | Who |
|---|---|---|
| 1 | Merge the pull request once its checks are green. Nothing changes on asiko.africa yet (Coming soon and the live guide stay switched off). | John |
| 2 | **Bunny library settings** (Stream → library → Encoding): enable exactly **360p, 480p and 720p**, nothing else. Every video must get the *same* quality ladder or channels can stall when one programme ends and the next begins. | Team |
| 3 | In the same library, create **one collection per channel** you will launch, named exactly as on asiko.africa (e.g. `Tattase TV`, `Estate TV`, `LN247`). | Team |
| 4 | Make a 30–60 second **"Asiko TV — back shortly"** video, upload it to Bunny (outside the channel collections) and copy its HLS link. This is the slate. | Team |
| 5 | In the Eyevinn OSC dashboard → parameter store for the scheduler, enter `BUNNY_API_KEY` (Bunny → library → API) and `ADMIN_KEY` yourself. Never paste keys into chat or GitHub. | John |
| 6 | Deploy the scheduler with the library ID, CDN host and slate link; confirm `/health` answers. | Claude |

## Friday morning — upload

7. **Upload files** into each channel's collection. File spec:
   - MP4, H.264 video, AAC stereo audio, **720p or 1080p**, 25 or 30 fps
   - Normal loudness (no programme much louder than the rest; aim for −23 LUFS)
   - No black lead-in longer than 2 seconds, no burned-in third-party logos
   - Name files `01 Title`, `02 Title` … to set the running order
   - **Rights:** only titles Media Icons owns or has a signed licence for
8. Wait until Bunny shows every video as **Finished** — unfinished videos are not aired.
9. **Pre-air report** (Claude): per channel, how many titles and hours, which files were
   skipped and why, any collection whose name matches no channel. Fix and re-check.

## Friday — go live, one channel first

10. Claude creates the **first channel only** (e.g. Tattase TV) in WebHook mode and
    watches it for 15 minutes: picture, sound, programme change-over, guide.
    *If sound is missing:* recreate it with `DEMUXED_AUDIO=false` and recheck.
11. When it is clean, Claude creates **every channel that has content** — only those,
    so no money is spent on empty channels.
12. Claude writes each channel's playback link into the line-up, switches on
    **Coming soon** and the **live guide**, and opens a pull request. John merges →
    asiko.africa updates within minutes.
13. Claude sets the repo variable `SCHEDULER_URL` so the **on-air monitor** checks the
    scheduler too. Alerts arrive as GitHub issues ("Asiko TV on-air alert"), emailed to
    everyone watching the repo — make sure the people on call are watching it.

## After go-live

- **Adding programmes:** upload to the channel's Bunny collection. On air within about
  5 minutes of Bunny finishing — no code, no deploy.
- **Removing a title:** delete it from the collection.
- **A new channel:** create its collection and upload; then Claude creates its playout
  channel and adds its link (steps 10–12 for that channel).
- **House ads:** put ad videos in Bunny and list them in `scheduler/ads.json`
  (`"every": 3` = a pre-roll before every third programme).
- **After 72 hours stable:** decide whether to delete the old demo channels
  `asiko01`–`asiko28`, which still loop Eyevinn's test film and cost tokens daily.

## If something goes wrong

| Symptom | What happens automatically | What to do |
|---|---|---|
| One video is corrupt | Skipped; listed under the channel in `/health` and the monitor report | Re-upload it |
| A whole channel's feed fails | Viewers on that channel see the Asiko network feed within seconds; the site retries the channel every minute | Check the monitor issue; Claude restarts or recreates that channel |
| Scheduler down | Channel Engine plays its slate | Claude restarts the scheduler app on OSC |
| Bunny API unreachable | Scheduler keeps the last good playlists | Nothing — it recovers on the next pull |
| Bad release of the site | — | Revert the last merge on GitHub; the deploy re-runs with the previous version |
