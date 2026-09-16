*Built by Media Icons Africa*

# Asiko TV / FOA: Buy Distribution, Don't Build It
### Implementation breakdown — channel-in-a-box vendors, FAST aggregators, boutique/regional alternatives, pricing, and a revised rollout plan

---

## 1. The core call: you're right, and here's why

Media Icons Africa's edge is content, relationships, and sales — thirty-plus years of it. The current Asiko TV stack (Hostinger Cloud Startup + KVM 8 + Hercules in Docker + Bunny Stream, managed by FOA) is a from-scratch broadcast operation: ingest, scheduling, SSAI ad-stitching, SCTE-35 markers, EPG generation, CDN delivery, and — eventually — Smart TV app submissions to Roku, Samsung, LG, Amazon, and Vizio, each with its own certification process. That's a systems-engineering org, not a media sales org, and it's the single biggest execution risk sitting inside a plan that also has a $2,000 bootstrap ceiling and a 108-channel ambition.

The FAST industry has already solved this problem commercially, at prices that are compatible with the budget already set. Two separate things get bought instead of built:

1. **The technical pipeline** (playout, SSAI, SCTE-35, EPG, transcoding, multi-platform delivery) — bought from a channel-in-a-box vendor.
2. **The living-room shelf space** (a listing inside Roku, Samsung TV Plus, Pluto TV, LG Channels, Amazon Freevee, Vizio) — bought either through that same vendor's distribution network, or negotiated directly.

Nobody builds a Roku channel certification pipeline and an SSAI stack to launch two Nollywood channels. The vendors below exist specifically so nobody has to.

---

## 2. The two layers, and who sits in each

**Layer 1 — Channel-in-a-box / playout-as-a-service.** These vendors take a video file library or live feed and turn it into a scheduled, SCTE-35-tagged, ad-stitched linear channel, then push that single feed out to dozens of platforms through one integration. This replaces the Bunny Stream/Hercules/KVM 8 build entirely for the FAST use case.

**Layer 2 — The platforms themselves** (Pluto TV, Samsung TV Plus, The Roku Channel, LG Channels, Amazon Freevee, Vizio WatchFree+). These are curated, closed shelves. There's no self-serve upload button — a platform's content-partnerships team has to say yes, carriage is granted through a negotiated deal, and the standard commercial term is a revenue share (no listing fee) rather than a subscription price. Channel-in-a-box vendors maintain pre-built pipes into most of these, which is the main reason to route through one rather than knocking on each platform's door separately.

---

## 3. Vendor comparison: channel-in-a-box / distribution

| Vendor | Pricing model | Reach / integrations | Best fit | Watch-outs |
|---|---|---|---|---|
| **Amagi** (FASTKit / CONNECT) | Minimal-to-zero upfront; revenue-share or inventory-share by platform; enterprise-grade contracts | 400+ channels, 50+ platforms via the CONNECT marketplace; full CLOUDPORT cloud broadcast stack | Largest, most established option; best if aiming for a serious multi-channel footprint (10+) with premium ad-sales support | Built for scale — onboarding and account management feel enterprise-weight for a 1–7 channel POC; pricing isn't published, expect a sales conversation and minimums |
| **Wurl** (Global FAST Pass) | Flat monthly fee per channel + usage fees (CDN/GB for DTC streamers, or a flat connector fee for headend delivery); "pay-as-you-grow" | 3,000+ channels distributed, 50+ countries, 55+ platforms including Roku, Samsung TV Plus, LG, Vizio; AdPool programmatic ad marketplace | Direct precedent in this exact content category — **Cineverse used Wurl to launch Nolly Africa HD (African Movie Channel's Nollywood FAST channel) onto Roku, Fire TV, Vizio, Samsung, and Google TV.** That's the closest real-world comp to Asiko TV | Pricing not published; scales with usage, so cost grows with success rather than being a flat surprise — but budget for CDN fees once viewership is real |
| **Frequency** | Flat monthly fee per channel, explicitly "no connector fees, no unexpected charges" — same price whether delivering to one distributor or many | 350M+ viewer reach, integrated with every major FAST platform; Managed Channel Services available for hands-off operation | Cleanest, most transparent pricing structure of the majors; good if predictable billing matters more than having the single largest marketplace | Newer/smaller than Amagi in raw scale; managed-service tier likely carries its own premium |
| **Veset** | Published starting price: **$499/channel/month**, SCTE-35 + third-party ad insertion included | Cloud FAST playout, multi-platform delivery | Useful as a like-for-like price anchor when negotiating with the others, since it's one of the few vendors that publishes a number | Smaller footprint than Amagi/Wurl/Frequency; verify current platform list directly |
| **FASTChannels.tv** | Starting at **$250/month** flat; choice of (a) revenue-share model with the monthly fee as a minimum guarantee, or (b) flat technology-licensing fee with no revenue share | Positioned for solo creators through mid-size operators | Cheapest published entry point — closest fit to a $2,000 bootstrap ceiling; good for a lean 1–2 channel proof of concept before committing further budget | Smallest and newest of the group; less brand leverage when it's time to pitch premium platforms directly |
| **Cineverse (Matchpoint)** | Not self-serve; content-partnership deal, typically revenue-share | 70,000+ pieces of content distributed across FAST/AVOD/SVOD; itself runs on Wurl's Global FAST Pass under the hood | **Not a pure tech vendor — a media company that already runs a Nollywood-adjacent FAST channel (Nolly Africa HD) and has direct African-diaspora audience experience.** Worth a direct partnership conversation, not just a tech RFP | Cineverse would be a partner/co-owner of the channel relationship, not a neutral infrastructure supplier — different kind of deal than the pure-tech vendors above |

**Rough cost math at launch scale:** Frequency/Amagi's published industry ballpark is $250–$500/channel/month for standard playout, rising with managed services or premium ad-sales support. At FASTChannels.tv's $250/month entry price, a 7-channel POC lineup (Asiko TV's own stated near-term target) runs roughly **$1,750/month** in pure tech fees before content and marketing — real money, but a fraction of the engineering cost of building SSAI and multi-platform certification in-house, and it fits inside iterative testing against the existing $2,000 ceiling if launched channel-by-channel rather than all seven at once.

---

## 4. Vendor comparison: going direct to a platform (no aggregator)

| Platform | How carriage works | Cost | Fit for Asiko TV |
|---|---|---|---|
| **Pluto TV** | Content-partnerships team pitch → carriage + rev-share deal; works with 170+ content partners already, including African-diaspora content (Demand Africa) | No listing fee; negotiated ad rev-share | Proven category fit — Pluto already carries Nollywood/diaspora content, which strengthens a pitch |
| **Samsung TV Plus** | Same model — pitch, deal, deliver broadcast-grade feed | No listing fee; negotiated rev-share | Large Smart TV install base relevant to a diaspora, TV-owning audience |
| **The Roku Channel / Roku Direct Publisher** | Direct Publisher is a self-service SDK path for building a standalone Roku channel app (more dev work); The Roku Channel (the aggregated guide) is carriage-by-deal like the above | No listing fee for carriage; Direct Publisher requires in-house app development (SceneGraph/BrightScript) | ~145M US streaming households reached. Carriage route is lower-effort than the Direct Publisher app-build route |
| **LG Channels** | Carriage by deal; Cineverse has used this route repeatedly (e.g., the Historian channel) | No listing fee; negotiated rev-share | Reasonable secondary target once the channel has a track record elsewhere |

The pattern across every major platform is identical: **no listing fee, revenue share instead, and a mandatory technical bar** (reliable HLS/DASH stream, SCTE-35 markers, machine-readable EPG, rights clearance) that a channel-in-a-box vendor clears automatically as part of onboarding. This is the real argument for going through a vendor first rather than direct: the vendor's pipe already meets every platform's technical requirements, so the only remaining conversation is content and audience fit.

---

## 5. Pros and cons, side by side

**Build it in-house (current Hostinger/Hercules/Bunny Stream path)**
- ✅ Full ownership of the stack, no revenue share to a tech vendor
- ✅ Total control over the "own your bag" positioning already established for Asiko TV
- ❌ SSAI, SCTE-35 compliance, and per-platform certification (Roku, Samsung, LG, Amazon) are specialist broadcast-engineering work Media Icons Africa doesn't currently have in-house
- ❌ Every new platform is a new integration and a new cert cycle — this doesn't scale to a 108-channel, pan-African ambition without a dedicated engineering team
- ❌ Concentrates execution risk on the part of the plan furthest from Media Icons Africa's actual strength

**Buy distribution (Wurl / Amagi / Frequency / FASTChannels.tv route)**
- ✅ One integration reaches 50+ platforms instead of negotiating and re-engineering per platform
- ✅ SSAI, SCTE-35, EPG, and transcoding are the vendor's problem, not Media Icons Africa's
- ✅ Direct precedent exists in exactly this content category (Nolly Africa HD via Cineverse/Wurl)
- ✅ Published entry pricing ($250–$500/channel/month) is compatible with launching a small lineup and scaling channel-by-channel
- ❌ Revenue share reduces the top line versus a fully owned stack
- ❌ Still dependent on a third party's reliability and roadmap
- ❌ Doesn't remove the need for rights-cleared, well-programmed content — the vendor gets you distributed, not watched

**Direct-to-platform only (skip the aggregator, pitch Pluto/Samsung/Roku/LG directly)**
- ✅ No vendor middleman or its fee
- ❌ Still need broadcast-grade SSAI/SCTE-35/EPG delivery in-house or from a separate tech partner — this option doesn't actually remove the engineering burden, it just removes the multi-platform convenience layer
- ❌ Each platform is a separate pitch, deal, and technical integration — slower and more fragmented than one vendor relationship
- Not really a standalone option for a lean team — more realistic as the *result* of going through a vendor first, then adding direct deals once there's a track record

---

## 6. Beyond the majors: boutique and regional vendors that still land on the recognized names

Amagi, Wurl, Frequency, Veset, FASTChannels.tv, and Cineverse are the names that dominate every "top FAST vendor" list. They're not the only route onto Roku, Samsung TV Plus, Pluto TV, and LG Channels — a second tier of smaller, often more accessible vendors builds on the same underlying platform relationships (several of them are literally built by former Amagi/Wurl engineers or partner directly with those majors for delivery) and can be easier to get a real conversation with at Asiko TV's current stage.

| Vendor | What makes it different | Pricing signal | Reach into the recognized platforms |
|---|---|---|---|
| **Zype** (a Backlight product) | API/CMS-first — built for teams with some in-house technical capacity who want more control over the playout layer than a pure managed service, without building it from raw infrastructure | Tiered: "Playout Standard" (30fps/10mbps, SSAI, API access) and "Playout Advanced" (60fps/20mbps); destination connectors sold as add-ons — no public headline number, but structured like a SaaS tier rather than an enterprise contract | Pre-built connectors into The Roku Channel, Samsung TV Plus, Hulu+ Live TV, Pluto TV, Xumo, and TCLtv+ |
| **Simplestream** | UK/EU-headquartered — genuinely useful if any part of the diaspora-audience strategy leans into the UK market specifically, since European vendors often have different (sometimes better) rate structures and ad-network relationships for that region | Not published; positions itself as full-service (branded apps + FAST) rather than pure playout-for-hire | 50+ integrated ad networks; distributes to major FAST/CTV platforms from a UK/EU base |
| **Revidd** | Positions itself explicitly around **branded ownership** — you get your own channel inside your own apps on Apple TV, Roku, Samsung, LG, Fire TV, and Android TV (not just a feed handed to someone else's guide), with FAST distribution to third-party platforms as an additional layer on top. Already serves **broadcasters across 14–15 countries, explicitly including diaspora, faith, and regional TV channels** — closest philosophical match to "own your bag" of any vendor on either list | Not published; worth a direct conversation given the stated diaspora/regional focus | Own-branded apps plus syndication to third-party FAST platforms; also publishes some of the clearest public writing available on how Samsung/Pluto/Roku carriage deals actually work — useful vendor to talk to even before deciding to build with them |
| **Muvi Playout** | Broader OTT platform (not FAST-only) with playout as one module — relevant if Asiko TV ever wants VOD/subscription tiers alongside the FAST channels rather than a pure ad-supported play | Not published; positioned as a global, self-serve-configurable platform | Distribution framed as "global reach, no geographical boundaries" — verify specific platform connector list directly, as it's less FAST-specialist than Zype or Revidd |
| **View TV Play / Kapang** | Smallest and most explicitly anti-"middleman" of the group — markets itself directly against the revenue cut taken by larger vendors, with human monitoring of ad revenue and platform metadata rather than a pure self-serve dashboard | Not published; UK/US-focused, positions channel launch as days-to-weeks | Distributes to its own Kapang platform plus Pluto TV and Redbox, with more added over time — smaller footprint than the others here, best treated as a low-commitment way to test the model before scaling up |
| **Phenix (Real-Time Solutions)** | Not a full FAST aggregator — a **delivery/latency layer** that Amagi itself partners with for sub-second-latency streaming and real-time ad insertion. Worth knowing about for a different reason: it shows how even the "big name" vendors are themselves assembled from smaller specialist infrastructure companies, which is the same buy-don't-build logic one level down the stack | N/A — not a direct content-owner product | Reaches the recognized platforms only indirectly, through partners like Amagi — flagged here as a technical reference point, not a vendor to contract with directly |

**The practical read:** Zype and Revidd are the two most worth an actual conversation. Zype fits if there's appetite to keep some in-house technical control over scheduling and ad ops (matches the existing Hercules/Docker instinct, just aimed at a proven playout API instead of a from-scratch build). Revidd fits better if the priority is staying closest to "own your bag" — branded apps across every major Smart TV OS, with FAST syndication as an add-on rather than the whole model — and its explicit diaspora/regional-broadcaster client base is a meaningful signal that it already understands this audience.

---

## 8. Protecting yourself at 100+ channel scale

Everything above was written channel-by-channel. At 100+ channels, the relationship with any vendor or platform stops being a single deal and becomes a structural dependency — which is exactly where operators get quietly exploited if the contract isn't built for scale from day one. The protections below matter more, not less, as the channel count climbs.

**1. Never grant exclusivity across the whole portfolio.** Non-exclusive FAST licensing is standard and most platforms accept it — the same channel can sit on Pluto TV, Samsung TV Plus, and Roku simultaneously in the same territory. Signing an exclusivity clause with one vendor or platform, especially across all 100+ channels at once, hands them leverage over the entire business rather than one channel.

**2. Push for a hybrid deal structure, not pure revenue share.** Pure rev-share puts all downside risk on the content owner while the platform/vendor risks nothing. Larger operators negotiate a minimum guarantee (MG) or floor CPM on top of the revenue share — a base payment regardless of how ad sales perform, with the rev-share as upside above that floor. At 100+ channels, this is a real negotiating position, not a favor being asked.

**3. Demand transparent reporting with audit rights, in writing.** Rev-share splits are rarely published and often not standard even within one vendor's client base — the only real protection is a contractual right to see impression counts, fill rates, and CPMs per channel, not just a monthly summary check. Without audit rights, there's no way to verify a 60/40 split is actually being honored across 100+ channels' worth of ad inventory.

**4. Keep contract terms short and reversion triggers explicit.** One to three years is standard; multi-year flat-fee lock-ins favor the vendor, not the content owner, unless performance is genuinely uncertain and a guaranteed floor is worth trading upside for. Build in automatic reversion (rights/channel back under Media Icons Africa's control) if the vendor misses agreed milestones or payment dates — this is standard licensing practice, not an aggressive ask.

**5. Get all-in pricing before signing anything — the real cost hides in the line items, not the headline number.** A published "$250/month" figure is playout only. On top of that: CDN delivery ($0.005–$0.08 per GB, scales with viewership), SSAI fees ($0.25–$1.50 CPM, charged on gross before any revenue share is calculated), and per-platform connector fees some vendors bill separately. At 100+ channels, an unbudgeted per-GB or per-CPM fee compounds fast. Ask explicitly: "what is the fully loaded monthly cost per channel, including delivery and ad-insertion fees, at our expected viewership?"

**6. Understand exit costs before entering — not after.** Contract termination fees, the cost of re-transcoding a library to a different vendor's spec if switching, and platform de-listing timelines (30–90 days during which content stays live but under reduced control) are the parts of a vendor relationship nobody thinks to ask about until they want out. At 100+ channels, being unable to leave a vendor cleanly is a portfolio-wide risk, not a one-channel inconvenience.

**7. Don't put all 100+ channels with a single vendor.** Splitting the portfolio across two vendors (for example, a majors-scale partner like Amagi or Wurl for the bulk of the lineup, plus a smaller specialist like Revidd for the diaspora-specific channels where their audience expertise adds value) removes a single point of failure and — just as importantly — gives real pricing leverage in renewal conversations, since either vendor knows the business isn't fully dependent on them.

**8. Retain ownership of metadata, scheduling data, and viewer analytics — not just the content.** The content library is the obvious asset to protect; the schedule data, audience data, and performance history built up across 100+ channels over time is a second asset that's easy to let a vendor quietly own by default. Confirm in the contract that this data is Media Icons Africa's property and exportable on request.

**9. Use the channel count as negotiating leverage from the first vendor conversation, not after signing.** This is the single biggest lever available. Every published price in the next section is a small-operator, 1–10 channel rate. Nobody launches 100+ channels at a published SMB rate — that pricing exists to get a foothold with independent creators, not with a media company already planning a continent-wide rollout. Walking into the first vendor call already framing this as "we're evaluating partners for a 100+ channel, pan-African rollout" changes which pricing tier, which account team, and which contract terms get offered.

---

## 9. Published prices, compared

Most vendors in this category don't publish pricing publicly — deals are quote-based and negotiated per client, which is itself worth noting (it's a sign the number moves with leverage, which is exactly why point 9 above matters). Here's what's actually publicly published, alongside the industry-wide cost ranges that apply regardless of vendor:

| Source | Published figure | What it covers | Notes |
|---|---|---|---|
| **FASTChannels.tv** | **$250/month** flat, per channel | Standard Playout (scheduling, SSAI, delivery) | Two structures offered: revenue-share (the $250 acts as a minimum guarantee against their cut) or flat technology-licensing fee with no revenue share at all |
| **Veset (Nimbus)** | **$499/month** starting, per channel | Cloud FAST playout with SCTE-35 and third-party ad insertion included | 7-day free trial available; positioned as a straightforward published-price alternative to quote-based majors |
| **Industry-wide playout range** (OTTclouds cost analysis) | **$250–$3,000/month** per channel | Scheduling, encoding, delivery — the core playout layer, before add-ons | Amagi, Wurl, and similar cloud vendors sit across this range depending on rev-share vs. flat-license structure; this is the range to sanity-check any vendor quote against |
| **CDN / delivery** | **$0.005–$0.08 per GB** delivered | Actual video delivery to viewers | Scales directly with audience size — the cost that grows fastest with success, and the one most first-time operators under-budget |
| **SSAI (ad insertion) fee** | **$0.25–$1.50 CPM** | Server-side ad stitching | Charged on top of gross ad revenue, before the platform's revenue share is calculated — this comes out before you see a dollar, not after |
| **Platform revenue share (industry standard)** | Platform typically retains **30–50%** of ad revenue; channel keeps the remainder | Applies to carriage on Pluto TV, Samsung TV Plus, Roku, LG Channels | Splits are negotiated per deal and not published by any platform — the "30–50%" figure is an industry-reported range, not a quoted rate; a commonly cited favorable benchmark is 60/40 in the channel owner's favor, but that's a target to negotiate toward, not a guarantee |
| **Amagi, Wurl, Frequency, Cineverse, Zype, Simplestream, Muvi, Revidd, View TV Play** | Not published | — | All quote-based; every one of these vendors will want a conversation about content, channel count, and territory before naming a number. At 100+ channels, this works in Media Icons Africa's favor — see point 9 above |

**What 100+ channels would actually cost, at published small-operator rates — and why that math is the wrong way to think about it:**

- At FASTChannels.tv's $250/month rate: 108 channels × $250 = **$27,000/month** (~$324,000/year) in playout fees alone, before CDN and SSAI.
- At Veset's $499/month rate: 108 channels × $499 = **~$53,900/month** (~$647,000/year).

Neither of those numbers should be treated as the real forecast. Both are single-operator pricing built for someone launching one or two channels, not a 108-channel structural relationship — and no serious vendor holds a small-operator rate at that volume in either direction. It moves down (volume discount) if Media Icons Africa negotiates well, or it moves into a completely different, more expensive enterprise-contract structure if the vendor senses no leverage was brought to the table. The real number only exists after that conversation happens — which is the strongest argument yet for treating the channel count as the opening move, not a detail to mention later.

---

## 10. Recommended path

1. **Pick one lean vendor for the POC, not the biggest name.** FASTChannels.tv's $250/month flat entry (or Veset's $499/month published rate as the fallback) fits inside the existing $2,000 bootstrap ceiling for a 1–3 channel proof of concept, without a long enterprise sales cycle. Save the Amagi/Wurl-scale conversation for after there's a channel with real viewership data to show.
2. **Reuse Asiko TV's own content and branding, retire the SSAI/playout ambitions of the current Hostinger/Hercules/Bunny Stream build.** Bunny Stream remains fine as a CDN/asset layer if needed, but the scheduling, ad-stitching, and platform-certification work moves to the vendor. This is a scope cut, not a restart — the brand identity, channel concepts, and 7-channel POC lineup already built stay exactly as they are.
3. **Open a direct conversation with Cineverse/Matchpoint alongside the tech-vendor search.** They are not just a vendor option — they already operate a Nollywood-facing FAST channel (Nolly Africa HD) distributed via Wurl onto Roku, Fire TV, Vizio, Samsung, and Google TV, for an African-diaspora audience in the same US/UK/Canada markets Asiko TV is targeting. A partnership or carriage conversation with them is worth having before assuming Media Icons Africa needs to build a from-scratch relationship with each platform.
4. **Sequence platform reach through the vendor first, direct deals second.** Let the chosen channel-in-a-box vendor's existing pipes into Pluto TV, Samsung TV Plus, LG Channels, and Roku do the initial distribution work. Once a channel has viewership numbers, that data becomes the leverage for direct carriage conversations (better rev-share terms, premium placement) with the platforms themselves.
5. **Reframe the 108-channel, 2-per-country target as a distribution-scaling question, not an engineering-scaling question.** Under a bought-distribution model, going from 7 to 20 to 108 channels is mostly a content-licensing and programming exercise plus incremental per-channel vendor fees — not a new engineering hire every time reach expands to another country.

This doesn't abandon "own your bag." It relocates where ownership matters — content, brand, audience relationships, ad-sales — and rents the plumbing, which is exactly the trade every FAST operator in this space, from single-channel creators to Cineverse itself, already makes.
