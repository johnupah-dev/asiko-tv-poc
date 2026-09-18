# Asiko TV — asiko.live launch site

A ready-to-deploy sales-funnel website for Asiko TV: channel guide, advertiser
funnel, channel/creator sign-up with a "test run" flow, legal pages, and a
lead-capture layer ready to connect to a real CRM.

## What's in here

```
index.html          Homepage
channels.html        Full 89-channel guide (search + genre filter + synopses)
advertise.html       Advertiser / partner funnel + enquiry form
join.html            Channel sign-up, creator sign-up, and "Test Run Your Channel" (tabs)
about.html            Company / vision page, Media Icons Africa credit
contact.html          General contact form
terms.html            Terms & Conditions
privacy.html          Privacy Policy
admin.html            Demo leads dashboard (session-only — see below)
assets/
  css/style.css        Design system
  js/main.js            Nav, reveal animations, toast helper
  js/leads.js            Lead capture + CRM bridge (see "Connecting marky.ai / a CRM")
  js/channel-guide.js    Search/filter logic for channels.html
  js/channels-data.json  All 89 channel entries (name, genre category, genre
                            tag, synopsis, status, logo) — generated from
                            ../data/channels-bouquet.json (the canonical source)
  img/logos/              Asiko TV logo marks
  img/brand/               Brand photography and marketing assets
  img/channels/            89 individual channel logos, from the Asiko TV Full
                            Channel Bouquet deck (Asiko_TV_Full_Channel_Bouquet_2.pptx)
```

## Deploying to asiko.live

This is a static site — no build step, no server-side code required.
Upload the whole folder to any static host or your existing web server
(Netlify, Vercel, an S3 + CloudFront bucket, or a plain Nginx/Apache box),
point asiko.live at it, and it's live.

## Deploying via GitHub Pages (mitigation for Hostinger's intermittent 502s)

Because this site has no PHP or other server-side code, it never needed
Hostinger's LiteSpeed/LSAPI backend at all — that backend is what has been
crash-looping (see the uptime monitor incidents: HTTP 502, `[Errno 111]
Connection refused`, cycling every 1–8 hours, while the fully static pages
served fine in between). Moving hosting to a static-only host removes that
failure mode entirely, since there is no PHP process to exhaust or restart.

`.github/workflows/deploy-pages.yml` publishes this folder to GitHub Pages
on every push to `master` that touches `site-asiko-live/`. One-time setup:

1. In the repo: **Settings → Pages → Build and deployment → Source →
   GitHub Actions**. Push to `master` (or run the workflow manually) and the
   site deploys to `https://<org-or-user>.github.io/<repo>/` — check the
   Actions run for the exact URL.
2. In the repo: **Settings → Pages → Custom domain** → enter `asiko.africa`
   (this commits the `CNAME` file already present in this folder) → enable
   **Enforce HTTPS** once the certificate is issued.
3. At your DNS provider (wherever `asiko.africa`'s DNS is managed —
   independent of Hostinger, and unrelated to who the domain is
   *registered* through):
   - `A` records for the apex `asiko.africa` → GitHub Pages' IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`
   - `CNAME` record for `www.asiko.africa` → `<org-or-user>.github.io.`
4. Wait for DNS propagation and the GitHub-issued TLS certificate, then
   verify both `https://asiko.africa` and `https://www.asiko.africa` load.

This can run in parallel with the existing Hostinger deployment (different
hosts, same DNS record either way) — cut over by changing the DNS records in
step 3 once you've verified the GitHub Pages copy looks right, no need to
wait on Hostinger support first.

## Connecting marky.ai or a real CRM

Every form (Advertise, List Your Channel, Join As A Creator, Test Run,
Contact) already works end-to-end: submissions are validated, and — because
I couldn't confirm the exact product/API you mean by "marky.ai" (there are
several similarly-named marketing tools) — right now they fall back to
opening a pre-filled email to **john.upah@mediaiconsltd.com** in the
visitor's own mail client, so no enquiry is ever silently lost.

To wire in a real backend:

1. Open `assets/js/leads.js`.
2. Set `CRM_ENDPOINT` near the top of the file to your webhook or API URL
   (a marky.ai inbound webhook, a Zapier/Make catcher, a HubSpot form
   endpoint, or your own `/api/leads` route).
3. That's it — every form will POST a JSON lead object to that URL
   automatically, and only fall back to email if the request fails.

The lead object shape sent to your endpoint:

```json
{
  "id": "lead_...",
  "formType": "Channel Sign-Up",
  "fields": { "channelName": "...", "email": "...", "...": "..." },
  "submittedAt": "2026-08-29T12:00:00.000Z",
  "source": "asiko.live"
}
```

## The admin.html leads dashboard

`admin.html` is a working demo of a CRM-style leads view, gated by a simple
client-side passcode (`asiko2026`) — **this is a demo lock, not real
security**, and the leads shown only exist for the current browser session
(they reset on refresh). It's there to show stakeholders the shape of a
leads dashboard while `CRM_ENDPOINT` is being wired up. Once you connect a
real backend, replace this page with a proper authenticated view backed by
your database or CRM.

## The 89-channel bouquet

`assets/js/channels-data.json` holds all 89 channels from the Asiko TV Full
Channel Bouquet deck, across 19 genre categories, each with its real logo,
genre tag and one-line synopsis. Every entry carries a `status`:

* `poc` — live right now on the asiko.africa proof-of-concept (26 channels).
  Renders with a red "Live on the POC" badge and sorts to the top.
* `interested` — on the bouquet / signed interest. Gold "Upcoming" badge.
* `queued` — onboarding queue; genre inferred from the name, synopsis pending.

Do not hand-edit `channels-data.json`. Edit the canonical source at
`../data/channels-bouquet.json` and regenerate:

```bash
# from the repo root
perl -MJSON::PP -0777 -e '
  my $d = JSON::PP->new->decode(do { local $/; open my $h,"<:encoding(UTF-8)","data/channels-bouquet.json"; <$h> });
  my @out = map { {
    slug=>$_->{slug}, name=>$_->{name}, category=>$_->{genreCategory},
    genreTag=>$_->{genreTag}, synopsis=>$_->{synopsis}//"", status=>$_->{status}, logo=>$_->{logo}
  } } @{$d->{channels}};
  open my $o,">:encoding(UTF-8)","site-asiko-live/assets/js/channels-data.json";
  print $o JSON::PP->new->canonical->pretty->indent_length(2)->encode(\@out);
'
```

For a quick one-off, add an entry to `channels-data.json` directly and drop
its logo in `assets/img/channels/`.

## Notes on what's aspirational vs. confirmed

The category-partner and travel-partner logos from your brand decks (banks,
telecoms, airlines, hotel groups, etc.) were **not** placed on the public
site as if they were signed partners — those were sector examples in your
internal pitch deck, not confirmed deals. `advertise.html` instead lists
those as open sponsorship *categories* by name only. As soon as a sponsor
signs, add their real logo to a "Trusted By" section — happy to build that
out once you confirm who's signed.
