# Asiko TV — Content Negotiation, Purchase, Onboarding & Monetisation Playbook

*Prepared for Media Icons Africa / Asiko TV content partnership discussions (e.g. Blessing Agofure and the wider Nigerian movie marketers/distributors network)*

---

## PHASE 1 — NEGOTIATION

### 1.1 Pre-negotiation prep
- Define your **content tiers** before you sit down: Premium/First-Window, Recent Catalogue (1–3 yrs), Deep Catalogue/Library. Each tier gets a different fee ceiling — don't negotiate title-by-title from zero each time.
- Set an internal **budget envelope per channel/genre** (e.g. how much you can commit monthly to fill a Nollywood drama channel vs a comedy channel) so you don't overspend chasing volume.
- Know your **walk-away structure**: guaranteed fee only, guaranteed fee + upside rev-share above a performance threshold, or pure rev-share with a minimum guarantee (MG) floor. Given Blessing's stated concern — producers were burned by promised rev-share that was never paid — lead with **MG + scheduled payment**, not pure rev-share.
- Prepare a **one-page content partner pitch**: who Asiko TV is, audience (diaspora UK/US/Canada/Europe + "community TV" for the global African marketplace), payment philosophy, and why guaranteed payment beats what MTN/Airtel/GTB-style platforms offered before.

### 1.2 Negotiation levers you control
- **Volume-for-rate**: bulk commitment (e.g. 100+ titles) in exchange for a lower per-title rate and priority payment terms.
- **Exclusivity-for-premium**: pay more only for exclusive or first-window rights; non-exclusive catalogue content should be priced lower since the owner can license it elsewhere too.
- **Payment cadence as a bargaining chip**: faster payment (Net-15 vs Net-45) can justify a lower headline fee.
- **Bundling**: pair a content owner's weaker titles with their stronger ones as a package rate, rather than cherry-picking only the best titles at a premium.
- **Most-Favoured-Nation (MFN) clause**: offer this to your best/highest-volume partners (like Blessing's network) in exchange for rate discipline — protects both sides.

### 1.3 What to walk into the room with (per title, from your existing checklist)
Title, synopsis, cast/crew, genre, year, runtime, rating, territory desired, exclusivity ask, term length, and your proposed fee band — plus the full deliverables list (master, trailer, BTS, promos, short-form cutdown rights, key art, stills, subtitles).

### 1.4 Red flags to probe during negotiation
- Unclear or undocumented chain of title (very common in older Nollywood catalogue — ask directly, don't assume)
- Music/soundtrack rights not cleared separately from the film licence
- Content already exclusively licensed to a competing platform without the supplier disclosing it
- No NFVCB classification/certificate

---

## PHASE 2 — PURCHASE / LICENSING (CONTRACT & LEGAL)

### 2.1 Core contract terms (the licence agreement itself)
- **Parties & rights holder warranty** — supplier warrants they own/control the rights they're licensing
- **Rights granted** — FAST/linear streaming, VOD (if any), mobile, IPTV; explicitly state **short-form/social cutdown rights** since older contracts rarely anticipated this
- **Territory** — must explicitly cover diaspora markets (UK/US/Canada/Europe), not just Nigeria
- **Term & renewal** — length, renewal mechanism, rate escalation on renewal
- **Exclusivity** — exclusive / non-exclusive, and if non-exclusive, any restriction on competing platforms
- **Licence fee & payment schedule** — amount, currency (consider USD given diaspora ad revenue), instalments vs lump sum, Net-terms
- **Reporting obligations** — what viewership data you owe the rights holder and how often
- **Advertising rights** — confirms you can monetise the title with pre-roll/mid-roll/sponsorship without further consent
- **Indemnity & takedown** — process if a third party disputes rights after the title goes live
- **Termination conditions**
- **Governing law/dispute resolution**

### 2.2 Deliverables checklist (contract schedule/exhibit)
Master file (broadcast-spec), trailer(s), BTS, promos, short-form clip source, key art (with/without title burned in), stills, synopsis (long/short/logline), cast & crew list, subtitle/caption files, NFVCB certificate, age rating, content warnings.

### 2.3 Payment operations
- Standardise a **PO/invoice-to-payment workflow** per title so payment delays (the exact failure mode that killed trust with prior platforms) can't happen quietly.
- Maintain a **payment status tracker** visible to the content/partnerships team — overdue payments should be a flagged, escalated item, not something that surfaces only when a producer complains.
- Decide early: pay per-title on delivery, or batch-pay monthly against a running schedule of onboarded titles.

---

## PHASE 3 — ONBOARDING (TECHNICAL & OPERATIONAL INGESTION)

### 3.1 Technical ingestion
- **Transcoding/QC**: verify delivered masters meet Bunny Stream/CloudStream ingest spec (resolution, codec, bitrate, audio channels); reject and request re-delivery if below spec rather than degrading quality on your end.
- **Ad break markers/SCTE-35 cue points**: insert or confirm ad insertion points in the master before scheduling — critical since this is the ad-monetisation backbone of a FAST platform.
- **Subtitle/caption ingestion**: attach SRT/VTT files; if not supplied, decide whether you commission them (relevant to the "Nollywood in Your Tongue" positioning).
- **Metadata entry into Hercules CMS**: title, synopsis (long/short/logline), genre tags, cast/crew, rating, keywords, EPG scheduling data.
- **Asset ingestion**: key art, stills, trailer, promo, short-form source clips — organised per title in the CMS so sales/marketing can pull them without re-requesting from the content owner.

### 3.2 Editorial/compliance onboarding
- Confirm NFVCB classification and cross-check against destination-market content standards (especially for diaspora-facing channels where standards may differ from domestic Nigerian broadcast norms).
- Flag any content needing a TV-safe/censored cut before scheduling.
- Content warnings attached at the metadata level so they surface correctly on-screen/in EPG.

### 3.3 Channel placement & scheduling
- Assign the title to the correct **channel bucket** within your linear lineup (2 channels per country / genre-based channels depending on final structure).
- Build the **EPG schedule slot(s)** — FAST is linear, so scheduling (day-part, repeat pattern, channel) directly affects ad inventory value, not just discovery.
- Set **rotation/refresh cadence** so titles don't go stale in the same slot indefinitely.

### 3.4 Rights/legal record-keeping
- Store the executed licence agreement, chain-of-title docs, and NFVCB cert against the title record — auditable, not just filed away.
- Set an internal **term-expiry alert** (e.g. 60/30 days before licence end) so titles don't accidentally air past their licensed window — a real legal exposure on a live linear platform.

### 3.5 Partner-facing onboarding
- Give the content owner/partner a simple **status update** once their title is live (channel, air date) — this is relationship maintenance, especially important for high-volume partners like Blessing's network who you want supplying repeat volume.
- Set up **reporting cadence** (viewership, and revenue if any rev-share applies) per the contract terms.

---

## PHASE 4 — MONETISATION (AD-SIDE FOCUS — THIS IS THE CORE OF A FAST BUSINESS)

Since Asiko TV is pure FAST (ad-supported linear, not subscription), the ad stack is not a bolt-on — it **is** the revenue model. Everything below should be built out with the same seriousness as the content pipeline itself.

### 4.1 Ad tech stack
- **Ad server/SSAI (server-side ad insertion)**: needed to stitch ads seamlessly into linear streams — confirm what Bunny Stream/CloudStream supports natively vs what you need to layer on (this determines ad-break reliability and CPM quality).
- **SCTE-35 cue points**: every title needs these embedded at ingestion (see 3.1) so ad breaks fire correctly and consistently.
- **Ad decisioning**: direct-sold campaigns need simple scheduling/trafficking; if you later add programmatic demand, you'll need an SSP/ad-exchange integration — sequence this after direct-sales revenue is proven, not before.
- **Frequency capping & ad rotation**: avoid the same ad repeating excessively in a session — directly affects advertiser satisfaction and renewal.
- **Measurement/verification**: ability to report impressions, completion rates, and (ideally) audience segments back to advertisers — this is what justifies premium CPMs over "spray and pray" inventory.

### 4.2 Inventory design
- **Ad load per hour** — decide your ad-minutes-per-hour target (industry FAST norm is typically 6–12 min/hour); too little underspends inventory, too much drives churn.
- **Pod structure** — pre-roll (channel/session start), mid-roll (in-content breaks tied to your SCTE-35 markers), and possibly post-roll/bumpers.
- **Sponsorship overlays** — bugs/watermarks, title sponsor cards ("this channel brought to you by X"), and interactive overlays if your CMS supports them.
- **Channel-level vs title-level inventory** — some advertisers will want a whole channel (category-exclusive sponsorship per your 30-sector model), others will want to buy against specific high-performing titles.

### 4.3 Monetisation packaging (aligned to your category-exclusivity model)
- **Tier 1 — Category-Exclusive Channel Sponsor**: one advertiser per sector (telecom, fintech, banking, beverages, automobile, FMCG, insurance, health/pharma, travel, beauty, e-commerce, betting/gaming, etc.) gets exclusive share-of-voice across a channel or content vertical. This is your anchor/premium package.
- **Tier 2 — Campaign/Flight Buys**: shorter-term direct-sold campaigns (weeks/months) for advertisers not ready for exclusivity.
- **Tier 3 — Content-Sponsorship**: sponsor a specific title or franchise (e.g. "brought to you by") — good entry point for mid-size brands and easier to sell per-title as new content lands.
- **Tier 4 — Programmatic/Remnant**: unsold inventory filled via ad-exchange demand once direct sales don't fill all slots — protects yield without leaving inventory empty.

### 4.4 Ad sales operations
- **Media kit** — reach/audience composition (diaspora demographics), channel lineup, ad formats, CPM/flat-rate card, case studies once available.
- **Rate card** — CPM by ad format (pre-roll/mid-roll/sponsorship) and by channel tier; build in a premium for category exclusivity.
- **Sales pipeline by sector** — map your 30 target sectors against known Nigerian/diaspora advertisers and agency contacts (MIPAN, ADVAN, EXMAN relationships you're already planning to leverage); assign one exclusive sponsor per sector as titles/channels are contracted.
- **Trafficking/ad-ops workflow** — booking → creative receipt/QC → scheduling against SCTE-35 markers → live monitoring → post-campaign reporting.
- **Billing & collections** — invoice cadence, payment terms with advertisers (often the inverse problem of content payments — you want to collect fast, pay content owners reliably).

### 4.5 Content-to-ad-revenue linkage
- Track **which titles/channels drive the strongest ad performance** (completion rates, session length) so future content acquisition spend follows what actually monetises — not just what's available or cheapest.
- If any content partner has a rev-share component, ad revenue attribution per title needs to be auditable and reportable back to them (ties directly into the reporting obligation in the licence contract).
- Build a simple internal dashboard: Title → Channel → Ad Impressions → Ad Revenue → Content Cost → Margin. This becomes your evidence base for renegotiating content deals and for your advertiser sales deck.

### 4.6 Metrics that matter for a FAST platform specifically
- **Fill rate** (% of ad inventory actually sold/served — the single biggest driver of whether the model works)
- **CPM achieved** (direct-sold vs programmatic)
- **Average session length / time watched** (drives ad exposure per viewer)
- **Ad completion rate**
- **Churn/return viewership** by channel (tells you which content is worth paying more to retain)

---

## Suggested sequencing

1. Lock negotiation framework and fee tiers → 2. Run first batch of licence agreements with Blessing's network (start with a manageable pilot batch, not all 1,000 titles at once) → 3. Onboard pilot titles fully (technical + metadata + ad markers) → 4. Launch ad sales against the pilot lineup using the category-exclusivity model → 5. Use real fill-rate/CPM data to justify scaling both content volume and advertiser tiers together, rather than scaling either alone.
