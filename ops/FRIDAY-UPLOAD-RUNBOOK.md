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
| 3 | **One collection per channel:** run *Actions → Create Bunny channel collections* once (after step 5) — it creates all 29, named as on asiko.africa. | Claude |
| 4 | Make a 30–60 second **"Asiko TV — back shortly"** video, upload it to Bunny (outside the channel collections) and send Claude its HLS link. This is the slate (until then the current network-feed video is used). | Team |
| 5 | GitHub → asiko-tv-poc → Settings → Secrets and variables → Actions: add **secret** `BUNNY_API_KEY` (Bunny → Stream library → API) and **variables** `BUNNY_LIBRARY_ID` and `BUNNY_CDN_HOST` (`vz-bb76db1f-290.b-cdn.net`). Never paste the key into chat. | John |
| 6 | Run **Actions → Sync channels from Bunny → Run workflow** once; its summary shows what each channel will air. Claude confirms the scheduler picks the playlists up (`/health`). | John + Claude |

## Friday morning — upload

7. **Upload files** into each channel's collection. File spec:
   - MP4, H.264 video, AAC stereo audio, **720p or 1080p**, 25 or 30 fps
   - Normal loudness (no programme much louder than the rest; aim for −23 LUFS)
   - No black lead-in longer than 2 seconds, no burned-in third-party logos
   - Name files `01 Title`, `02 Title` … to set the running order
   - **Rights:** only titles Media Icons owns or has a signed licence for
8. Wait until Bunny shows every video as **Finished** — unfinished videos are not aired.
9. **Pre-air report:** the *Sync channels from Bunny* run summary (and `REPORT.md` on the
   `channel-playlists` branch) lists, per channel, titles, hours and every skipped file
   with the reason, plus any collection whose name matches no channel. Fix and re-run.

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

- **Adding programmes:** upload to the channel's Bunny collection. In the rotation within
  about 15 minutes of Bunny finishing (sync every 10 min + scheduler reload every 5) —
  no code, no deploy.
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
| Bunny or GitHub unreachable | Scheduler keeps the last good playlists | Nothing — it recovers on the next sync |
| Bad release of the site | — | Revert the last merge on GitHub; the deploy re-runs with the previous version |
