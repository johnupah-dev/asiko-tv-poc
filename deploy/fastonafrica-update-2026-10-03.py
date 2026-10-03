def rep(s, old, new):
    assert s.count(old) == 1, ("not found once", old[:80], s.count(old))
    return s.replace(old, new)

def between(s, start, end, new):
    i = s.index(start); j = s.index(end, i)
    return s[:i] + new + s[j:]

MAIN = '''<main id="top">
<section class="hero" aria-labelledby="h1">
  <div class="wrap">
    <div class="status"><span class="led" aria-hidden="true"></span>Now onboarding channels from libraries, hard drives and live streams</div>
    <h1 id="h1">Your library, earning twice.</h1>
    <p class="sub">Films and shows sitting on hard drives earn nothing. We turn them into a 24/7 TV channel on Asiko.africa and in front of the diaspora, sell sponsors for it, and pay you every month. No exclusivity. Keep YouTube.</p>
    <div class="ctas">
      <a class="btn btn-red" href="#onboard">Put your library back to work</a>
      <a class="btn btn-ghost" href="#pricing">See the plans</a>
    </div>
    <figure class="router" aria-label="Diagram: your content goes into the FOA engine and out to five destinations">
      <div id="routerSvg"></div>
      <figcaption class="router-cap"><span>Launch</span><span>Distribute</span><span>Monetize</span></figcaption>
    </figure>
  </div>
</section>

<section aria-labelledby="h-pain">
  <div class="wrap grid2">
    <div>
      <h2 id="h-pain">Built for how African content actually earns.</h2>
      <p class="lede">African producers have been burned before: platforms that promised revenue share and never paid, libraries locked away in exclusive deals, and CPMs a fraction of what the same viewer is worth in London or Houston. FOA starts from those facts.</p>
    </div>
    <div class="pain">
      <div><b>The old way</b><span>Hard drives full of films and shows that earn nothing after their first run.</span></div>
      <div><b>FOA</b><span>Your back catalogue becomes a 24/7 channel that earns every month.</span></div>
      <div><b>The old way</b><span>Revenue share promised, never paid, numbers never shown.</span></div>
      <div><b>FOA</b><span>Monthly statements and payment within 30 days of month end. Pay late and your next month is free.</span></div>
      <div><b>The old way</b><span>Exclusive deals that lock your library up for years.</span></div>
      <div><b>FOA</b><span>Non-exclusive. Keep YouTube and your other deals, and leave with 30 days' notice.</span></div>
    </div>
  </div>
</section>

<section class="band" id="money" aria-labelledby="h-money">
  <div class="wrap">
    <h2 id="h-money">Low CPMs are real. We don't build your channel on them alone.</h2>
    <p class="lede">A channel that only waits for programmatic ads in Africa will starve. FOA channels earn from four directions at once.</p>
    <div class="money">
      <article><span class="k">Sponsors</span><h3>Sponsorship that grows with your audience</h3><p>Media Icons Digital sells sponsorship priced by audience size. As your viewing grows, sponsors pay more, and your share grows with it.</p></article>
      <article><span class="k">Diaspora</span><h3>Diaspora ad breaks</h3><p>Your audience in the UK, US and Canada watches on big screens and is worth more to advertisers. Our international sales partners sell those breaks in those markets.</p></article>
      <article><span class="k">100%</span><h3>Your sponsors come first</h3><p>Sponsors and advertisers you bring yourself always take priority on your channel, and you keep all of it. Network deals we sell never block a sponsor you bring.</p></article>
      <article><span class="k">On time</span><h3>Paid on time, or next month is free</h3><p>Every month: viewing hours, ad impressions, fill rate and revenue for your channel. Paid within 30 days of month end. If we're late, your next monthly fee is waived and you can leave at once.</p></article>
    </div>
  </div>
</section>

<section aria-labelledby="h-how">
  <div class="wrap">
    <h2 id="h-how">From hard drive to 24/7 channel.</h2>
    <p class="lede">Nollywood classics, series that finished their run, recorded events, sermons, music shows. If you own it or have cleared it, it can earn again.</p>
    <ol class="steps">
      <li><h3>Apply</h3><p>Fill the onboarding form below. It takes about five minutes.</p></li>
      <li><h3>Send it in</h3><p>A hard drive, files or a live HLS stream, plus logo and artwork. We check format and rights.</p></li>
      <li><h3>We build</h3><p>We encode, schedule a 24/7 playlist, set ad breaks and create your programme guide.</p></li>
      <li><h3>Live in 14 days</h3><p>On Asiko.africa, mobile-first in Africa and on big screens for the diaspora.</p></li>
      <li><h3>Earn and grow</h3><p>Monthly statements, sponsor sales, and more destinations as your audience grows.</p></li>
    </ol>
  </div>
</section>

<section class="band" id="where" aria-labelledby="h-where">
  <div class="wrap">
    <h2 id="h-where">You upload once. Here's where it goes.</h2>
    <p class="lede">Every FOA channel lands on Asiko.africa first, alongside the 29 channels live there today. Then we push it further, depending on your plan.</p>
    <div class="dest">
      <article><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg></span><h3>Asiko.africa</h3><p>Africa's community TV for the continent and the diaspora. Mobile-first in Africa, with a data-saving default so viewers watch longer. Web and mobile today, smart-TV apps rolling out.</p><span class="tag all">Every plan</span></article>
      <article><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="12" rx="1"/><path d="M7 21h10M9 9l3 2-3 2z"/></svg></span><h3>Smart TVs and FAST platforms</h3><p>The diaspora watches on big screens, where ad rates are highest. We package your channel the way global FAST platforms ask for it and pitch it to them. Each platform picks its own lineup, so carriage is pitched, not promised.</p><span class="tag">Owner and Broadcaster</span></article>
      <article><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg></span><h3>Your own website and app</h3><p>A player you can embed, or a stream link your own developer can plug into your app. Same channel, same ads, your domain.</p><span class="tag">Relay, Owner and Broadcaster</span></article>
      <article><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a8 8 0 0 0 8 8M4 14l6-6 6 6-6 6zM14 4a6 6 0 0 1 6 6M14 8a2 2 0 0 1 2 2"/></svg></span><h3>Satellite (DTH)</h3><p>Direct-to-home carriage for broadcasters who need set-top-box reach, quoted after a technical check. Includes a free streaming twin on Asiko.africa.</p><span class="tag">Broadcaster</span></article>
      <article><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg></span><h3>Social live</h3><p>Simulcast premieres and live events to YouTube Live and Facebook Live to pull new viewers back to the channel.</p><span class="tag">Owner and Broadcaster</span></article>
    </div>
  </div>
</section>

<section class="sat" id="satellite" aria-labelledby="h-sat">
  <div class="wrap grid2">
    <div>
      <h2 id="h-sat">Already on air? Bring your stream.</h2>
      <p class="lede">TV stations, satellite channels and churches already running a 24/7 stream don't need to rebuild anything. We take your HLS stream, add ad insertion and a programme guide, and put you in front of new viewers.</p>
      <ul>
        <li>Relay plan for live HLS streams, from $79 a month</li>
        <li>Your stream stays yours: we add reach and ad revenue, not control</li>
        <li>Free streaming twin on Asiko.africa for satellite channels</li>
        <li>DTH carriage for broadcasters, on request</li>
      </ul>
    </div>
    <div class="dish">
      <h3>Satellite, quoted after a technical check</h3>
      <p>Satellite cost depends on bandwidth, coverage beam and transponder. Tell us your needs in the onboarding form and we come back with a written quote within 5 working days.</p>
      <p style="margin-top:20px"><a class="btn btn-red" href="#onboard" data-type="satellite">Request a satellite quote</a></p>
    </div>
  </div>
</section>

<section id="pricing" aria-labelledby="h-price">
  <div class="wrap">
    <h2 id="h-price">Priced for African content owners.</h2>
    <p class="lede">No hidden costs and no lock-in. Nigerian clients pay in naira at prices fixed for 12 months; everyone else pays in US dollars.</p>

    <div class="trial">
      <div class="big">14<br>days</div>
      <div><h3 style="color:var(--onSteel)">From application to live channel</h3><p>Most channels go live within 14 days of us receiving the files or the stream. Apply in five minutes, no card needed. We reply within two working days.</p></div>
      <a class="btn btn-red" href="#onboard">Apply now</a>
    </div>

    <div class="plans">
      <article class="plan">
        <h3>Partner</h3><p class="who">For strong libraries with no budget.</p>
        <div class="price">$0<small> /month</small></div><div class="naira">By selection, limited slots</div>
        <div class="setup">Setup $150 (₦225,000), or recovered from your first earnings</div>
        <ul><li>1 channel on Asiko.africa</li><li>We run and sell the channel</li><li>50/50 split of ads we sell</li><li>Sponsors you bring: 100% yours</li><li>12-month non-exclusive term</li></ul>
        <a class="btn btn-ghost" href="#onboard" data-plan="Partner">Apply as partner</a>
      </article>
      <article class="plan">
        <h3>Relay</h3><p class="who">For channels already running a live stream.</p>
        <div class="price">$79<small> /month</small></div><div class="naira">≈ ₦120,000 a month</div>
        <div class="setup">Setup $150 once (₦225,000)</div>
        <ul><li>Bring your HLS stream</li><li>Asiko.africa plus a player for your site</li><li>Ad insertion in reserved breaks</li><li>You keep 85% of ads we sell</li><li>Monthly statement</li></ul>
        <a class="btn btn-ghost" href="#onboard" data-plan="Relay">Choose Relay</a>
      </article>
      <article class="plan hl">
        <h3>Owner</h3><p class="who">For owners who want control and the bigger share.</p>
        <div class="price">$99<small> /month</small></div><div class="naira">≈ ₦150,000 a month</div>
        <div class="setup">Setup $150 once (₦225,000)</div>
        <ul><li>Your library built into a 24/7 channel</li><li>Asiko.africa, your website and social live</li><li>Pitched to FAST platforms for the diaspora</li><li>You keep 85% of ads we sell</li><li>Included in sponsor sales</li><li>Monthly statement</li></ul>
        <a class="btn btn-red" href="#onboard" data-plan="Owner">Choose Owner</a>
      </article>
      <article class="plan">
        <h3>Broadcaster</h3><p class="who">For TV stations and multi-channel networks.</p>
        <div class="price">Custom</div><div class="naira">Quoted per network</div>
        <div class="setup">Setup quoted</div>
        <ul><li>Several channels, one account</li><li>Satellite simulcast on request</li><li>Dedicated account manager</li><li>Priority encoding and scheduling</li><li>Channel and network reports</li></ul>
        <a class="btn btn-ghost" href="#onboard" data-plan="Broadcaster">Talk to us</a>
      </article>
    </div>
    <p class="founding"><strong>Founding 100.</strong> The first 100 channels that sign a 12-month Owner plan before 31 December 2026 pay no setup fee.</p>
    <p class="fine">Add-ons: Full HD 1080p (+$30 a month), live events (from $50 per event), DRM and forensic watermarking for premium channels (quoted). Prices exclude VAT. Revenue shares apply to ads and sponsorships FOA and its partners sell on your channel, after ad-tech and delivery costs. Ads and sponsors you sell yourself are yours in full. Third-party platforms decide their own lineups; FOA prepares and submits your channel but cannot guarantee carriage. Content must be cleared for the territories you choose. See our <a href="terms.html">Terms of Service</a> and <a href="refund-policy.html">Refund Policy</a>.</p>
  </div>
</section>

<section class="sat" id="trust" aria-labelledby="h-trust">
  <div class="wrap grid2">
    <div>
      <h2 id="h-trust">Your content, protected. Your money, on time.</h2>
      <p class="lede">We've heard the stories about platforms that took the content and never paid. Here's what we commit to, in writing.</p>
      <ul>
        <li>Paid within 30 days of month end, or your next month is free and you can leave at once</li>
        <li>Protected streams: expiring signed links, HTTPS everywhere, geo-blocked to your territories</li>
        <li>Your master files stay with you. We keep encoded copies in access-controlled storage</li>
        <li>Leave any time: files deleted within 30 days, confirmed in writing</li>
        <li>Two-factor staff access, need-to-know only. Data handled under the Nigeria Data Protection Act</li>
        <li>99.5% uptime target for what we run, with credits if we miss it</li>
        <li>If someone re-streams your channel, we help take it down</li>
      </ul>
    </div>
    <div class="dish">
      <h3>What we ask of you</h3>
      <p>You own the content or have cleared it for the territories you choose, and you stand behind that. Live streams come to us over HTTPS with a secure key. Premium protection, DRM or forensic watermarking, is available on request and quoted separately.</p>
      <p style="margin-top:20px"><a class="btn btn-red" href="terms.html#security">Read the security terms</a></p>
    </div>
  </div>
</section>

'''

FAQ = '''<section id="faq" aria-labelledby="h-faq">
  <div class="wrap grid2">
    <h2 id="h-faq">Questions channel owners ask.</h2>
    <div>
      <details><summary>What is a FAST channel?</summary><p>Free Ad-Supported Streaming TV. A scheduled, always-on channel that viewers watch free on phones, laptops and smart TVs, paid for by ads and sponsors. It feels like TV, not a video library.</p></details>
      <details><summary>Why not just YouTube?</summary><p>Keep YouTube. A FAST channel is the same library earning a second time: on a TV-style channel, in front of the diaspora, with sponsors YouTube won't bring you. Our agreements are non-exclusive.</p></details>
      <details><summary>My films are on old hard drives. Can they earn?</summary><p>Yes. Send us the files, MP4, MOV, MXF or older formats, and we check them, re-encode them and build them into a schedule. If it's on tape or disc, tell us in the form and we'll quote digitisation.</p></details>
      <details><summary>We already run a live stream. Can we join?</summary><p>Yes, on the Relay plan. Send us your HLS stream over HTTPS with markers for ad breaks, or at least 6 minutes an hour reserved for ads we insert. If your ads are baked in, you can still join on the flat monthly fee.</p></details>
      <details><summary>Do I give up my rights?</summary><p>No. Every FOA agreement is non-exclusive. You keep ownership, you choose the territories, and you can sell the same content elsewhere.</p></details>
      <details><summary>What do I need to start?</summary><p>At least 100 hours of content you own or have cleared, or a 24/7 live stream, plus a logo and basic episode information.</p></details>
      <details><summary>How and when do I get paid?</summary><p>Monthly, within 30 days of month end, with a statement showing hours watched, impressions, fill rate and revenue. If we pay late, your next monthly fee is waived and you can leave immediately.</p></details>
      <details><summary>Why do partners pay a setup fee?</summary><p>Building a channel is real work: checking files, encoding, scheduling and the programme guide. Partners can pay a reduced fee upfront or have it recovered from their first earnings.</p></details>
      <details><summary>We're outside Africa. Can we join?</summary><p>Yes. African-diaspora channels join on the same plans in US dollars. Other channels can join Asiko.africa by invitation, or use the FOA engine on their own platforms.</p></details>
      <details><summary>What if I want to leave?</summary><p>Give 30 days' notice. Your channel comes down and your files are returned or deleted, your choice, confirmed in writing.</p></details>
      <details><summary>Is Asiko.africa part of FOA?</summary><p>Asiko is the viewer platform where FOA channels go live first. FOA is the engine behind it: playout, ads and distribution. Both are Media Icons Africa businesses.</p></details>
    </div>
  </div>
</section>
'''

SAVE_OLD = '''async function save(ref){
  try{
    if(!window.claude||!window.claude.use)return false;
    const db=await window.claude.use("db"); if(!db)return false;
    await db.collection("applications").add({ref,...S,formats:S.formats.join(", "),dest:S.dest.join(", "),submittedAt:new Date().toISOString()});
    return true;
  }catch(e){return false}
}'''
SAVE_NEW = '''async function save(ref){
  try{
    const r=await fetch("lead.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ref,...S,formats:S.formats.join(", "),dest:S.dest.join(", ")})});
    const j=await r.json(); return !!j.ok;
  }catch(e){return false}
}'''

def update_index(s):
    s = rep(s, "<title>Fast on Africa — Africa's FAST engine</title>", "<title>Fast on Africa — your library, earning twice</title>")
    s = rep(s, 'content="Fast on Africa (FOA) turns African content libraries into 24/7 FAST and satellite channels, runs playout and ad insertion, and distributes to Asiko.africa, smart TVs, your own site and DTH satellite. 30 days free."',
               'content="Fast on Africa turns film and TV libraries, even ones sitting on hard drives, and live streams into 24/7 channels on Asiko.africa and in front of the diaspora, sells sponsors and pays monthly. Non-exclusive."')
    s = rep(s, '<meta property="og:title" content="Fast on Africa — Africa\'s FAST engine">', '<meta property="og:title" content="Fast on Africa — your library, earning twice">')
    s = rep(s, 'content="Upload your library. We build the channel, run it 24/7, insert the ads and send it to every screen. 30 days free."',
               'content="Films on hard drives earn nothing. We build them into a 24/7 channel, sell the sponsors and pay you monthly. No exclusivity."')
    s = between(s, '<main id="top">\n', '<section class="band" id="onboard"', MAIN)
    s = between(s, '<section id="faq"', '</main>', FAQ)
    s = rep(s, 'const SRC=["Films & series","Shows & events","Live feeds"];', 'const SRC=["Hard drives","Shows & events","Live streams"];')
    s = rep(s, 'plan:"30-day free trial"', 'plan:"Owner ($99/month)"')
    s = rep(s, 'notes:"",consent:false};', 'notes:"",consent:false,region:"Based in Africa",adbreaks:"",hp:""};')
    s = rep(s, 'const PLANS=["30-day free trial","Launch ($49/month)","Distribute ($149/month)","Network ($399/month)","Content partner (revenue share)","Satellite quote"];',
               'const PLANS=["Partner (no monthly fee)","Relay ($79/month)","Owner ($99/month)","Broadcaster (custom)","Satellite quote"];\nconst REGIONS=["Based in Africa","African diaspora outside Africa","Non-African content for Asiko","Engine only (our own platforms)"];')
    s = rep(s, '[["fast","FAST channel","A 24/7 streaming channel built from your library."],["satellite","Satellite channel","DTH carriage on Nigcomsat or Turksat, with a free streaming twin."],["both","Both","Satellite plus FAST distribution from one playout."]]',
               '[["library","Content library","Films and shows on hard drives or files, built into a 24/7 channel."],["stream","Live stream","You already run a 24/7 HLS stream. We add ads and distribution."],["satellite","Satellite channel","DTH carriage on request, with a free streaming twin."]]')
    s = rep(s, '${field("Your role",inp("role","text","Owner, producer, station manager…"),"",true)}\n',
               '${field("Your role",inp("role","text","Owner, producer, station manager…"),"",true)}\n    ${field("Where you fit",`<select name="region">${opt(REGIONS,S.region)}</select>`,"full")}\n    <input type="text" name="hp" value="" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">\n')
    s = rep(s, 'opt(["Under 50 hours","50 to 100 hours","100 to 300 hours","300 to 1,000 hours","Over 1,000 hours"],S.hours)',
               'opt(["Under 100 hours","100 to 300 hours","300 to 1,000 hours","Over 1,000 hours","Live 24/7 stream"],S.hours)')
    s = rep(s, '["MP4","MOV / ProRes","MXF / broadcast files","Tapes or discs","Already a live stream (HLS/RTMP)"]',
               '["MP4","MOV / ProRes","MXF / broadcast files","Old hard drives (not sure)","Tapes or discs","Live stream (HLS)"]')
    s = rep(s, '"Yes, on another streaming platform"],S.live)}</select>`)}\n',
               '"Yes, on another streaming platform"],S.live)}</select>`)}\n    ${S.type==="stream"?field("Ad breaks in your stream",`<select name="adbreaks">${opt(["SCTE-35 markers","We can reserve ad minutes","Our ads are baked in","Not sure"],S.adbreaks)}</select>`,"full"):""}\n')
    s = rep(s, 'const sat=S.type!=="fast";', 'const sat=S.type==="satellite";')
    s = rep(s, '["Onboarding",({fast:"FAST channel",satellite:"Satellite channel",both:"Satellite + FAST"})[S.type]]',
               '["Onboarding",({library:"Content library",stream:"Live stream",satellite:"Satellite channel"})[S.type]],["Where you fit",S.region],["Ad breaks",S.adbreaks]')
    s = rep(s, '"satNotes","notes"].forEach', '"satNotes","notes","region","adbreaks","hp"].forEach')
    s = rep(s, '`FOA onboarding application ${ref}\\n`+[["Type",S.type],', '`FOA onboarding application ${ref}\\n`+[["Type",S.type],["Where you fit",S.region],["Ad breaks",S.adbreaks],')
    s = rep(s, SAVE_OLD, SAVE_NEW)
    s = rep(s, 'function done(ref){', 'function done(ref,saved){')
    s = rep(s, '<h3 style="margin-top:8px">One last tap to send it to us.</h3><p class="hint" style="margin-top:8px">Send your application on WhatsApp or by email so it reaches the onboarding team directly. Keep your reference number. We reply within two working days.</p>',
               '${saved?\'<h3 style="margin-top:8px">Application received.</h3><p class="hint" style="margin-top:8px">Your application is with our onboarding team. Keep your reference number. We reply within two working days. Want a faster answer? Send it on WhatsApp too.</p>\':\'<h3 style="margin-top:8px">One last tap to send it to us.</h3><p class="hint" style="margin-top:8px">Send your application on WhatsApp or by email so it reaches the onboarding team directly. Keep your reference number. We reply within two working days.</p>\'}')
    s = rep(s, '  save(ref); done(ref);\n', '  const btn=form.querySelector("[type=submit]");if(btn){btn.disabled=true;btn.textContent="Sending…"}\n  const saved=await save(ref); done(ref,saved);\n')
    return s

def update_terms(s):
    s = rep(s, '<p class="meta">Effective 2 October 2026', '<p class="meta">Effective 3 October 2026')
    s = rep(s, '<li><a href="#trial">Free trial</a></li>', '<li><a href="#trial">Plans and setup</a></li>')
    s = rep(s, '<li><a href="#distribution">Third-party platforms</a></li>', '<li><a href="#distribution">Third-party platforms</a></li><li><a href="#relay">Live stream (Relay) channels</a></li><li><a href="#security">Security</a></li><li><a href="#outside-africa">Channels outside Africa</a></li>')
    s = rep(s, '<h2 id="trial">Free trial</h2>\n<p>New FAST channels get a 30-day free trial: one channel on Asiko.africa, up to 100 hours of content, with viewing and ad reports. No card is needed. At the end of the trial you choose a plan, or we pause the channel. Your content is not deleted when a channel is paused unless you ask us to delete it.</p>',
               '<h2 id="trial">Plans and setup</h2>\n<p>There is no free trial. FOA offers four plans: <strong>Partner</strong> (no monthly fee, revenue share), <strong>Relay</strong> (for channels that already run a live HLS stream), <strong>Owner</strong> (monthly fee, larger revenue share) and <strong>Broadcaster</strong> (custom). Plan features are as described on fastonafrica.com when you sign up.</p>\n<p>Every channel has a one-time setup fee that covers checking files or streams, encoding, scheduling and the programme guide. Partner channels may pay a reduced setup fee upfront or have it recovered from their first earnings. If a Partner leaves before the setup fee is recovered, the remaining balance becomes payable. We may waive setup fees under a published offer, such as the Founding 100, or for channels we invite.</p>')
    s = rep(s, '<li>One-time onboarding fees are charged before we start building your channel.</li>',
               '<li>Setup fees are charged before we start building your channel, unless they are being recovered from Partner earnings.</li>\n<li>Prices exclude VAT. Nigerian clients pay in naira at the price on their invoice, fixed for 12 months from signing; other clients pay in US dollars.</li>\n<li>Add-ons such as Full HD 1080p, live events and premium content protection are charged separately as quoted.</li>')
    s = rep(s, '<li><strong>Ads and sponsors you sell yourself</strong> run in your breaks and you keep 100% of that money.</li>',
               '<li><strong>Ads and sponsors you sell yourself</strong> run in your breaks and you keep 100% of that money. Your own sponsors take priority on your channel; category-exclusive deals FOA sells across the network never block a sponsor you bring.</li>')
    s = rep(s, 'on paid plans you receive 70% and FOA 30%; on the Content Partner plan you receive 30% and FOA 70%. Shares are calculated on net revenue, after third-party ad-tech, payment and platform costs.',
               'on the Owner and Relay plans you receive 85% and FOA 15%; on the Partner plan the split is 50/50. Shares are calculated on net revenue: after third-party ad-tech, payment and platform costs, and after the cost of delivering your channel to viewers (streaming bandwidth). Broadcaster terms are set in your contract.')
    s = rep(s, '<li>Your share is paid within 30 days of the end of each month to the bank account you give us. Amounts under USD 20 roll over to the next month.</li>',
               '<li>Your share is paid within 30 days of the end of each month to the bank account you give us. Amounts under USD 20 roll over to the next month.</li>\n<li><strong>Paid-on-time guarantee:</strong> if we pay your share late, your next monthly fee is waived and you may end the agreement immediately.</li>')
    s = rep(s, '<h2 id="satellite">Satellite services</h2>',
               '<h2 id="relay">Live stream (Relay) channels</h2>\n<ul>\n<li>Your stream must reach us over HTTPS with a secure access key, run 24/7 and be cleared for the territories you choose.</li>\n<li>You must give us addressable ad breaks: SCTE-35 markers, or at least 6 minutes per hour reserved for ads we insert. If your ads are baked in and no breaks are available, the channel runs on the flat monthly fee only, with no revenue share.</li>\n<li>You provide a programme guide feed or a weekly schedule.</li>\n<li>If your stream fails, we show a holding screen. Downtime caused by your stream is not covered by our service credits.</li>\n</ul>\n'
               '<h2 id="security">Security</h2>\n<ul>\n<li>Streams are delivered over HTTPS with expiring signed links, and geo-blocked to the territories you have cleared.</li>\n<li>You keep your master files. We keep encoded copies in access-controlled storage and delete them within 30 days of your channel ending, with written confirmation.</li>\n<li>Staff access uses two-factor login and is limited to people who need it.</li>\n<li>We aim for 99.5% availability of the systems we run. Service credits are set out in the <a href="refund-policy.html">Refund and Cancellation Policy</a>.</li>\n<li>If your channel is re-streamed without permission, we help with takedown notices.</li>\n<li>DRM and forensic watermarking are not included as standard. They are available for premium channels on request and quoted separately.</li>\n</ul>\n'
               '<h2 id="outside-africa">Channels outside Africa</h2>\n<p>African-diaspora channels outside Africa join on the same plans, priced in US dollars. Other channels may join Asiko.africa by invitation, or use the FOA engine on their own platforms. The Partner plan is not available to non-African content. Before signing, clients outside Nigeria provide company registration, director identification and payout details in the company\'s name, and are checked against international sanctions lists. Disputes with clients outside Nigeria are settled by arbitration under the rules of the Lagos Court of Arbitration.</p>\n'
               '<h2 id="satellite">Satellite services</h2>')
    s = rep(s, '<li>Content Partner plans run for a 12-month non-exclusive term, which you can end early by upgrading to a paid plan.</li>',
               '<li>Partner plans run for a 12-month non-exclusive term, which you can end early by upgrading to a paid plan. Any setup fee not yet recovered becomes payable if a Partner leaves early.</li>')
    return s

def update_refund(s):
    s = rep(s, '<p class="meta">Effective 2 October 2026', '<p class="meta">Effective 3 October 2026')
    s = rep(s, 'trials are free, onboarding fees are refundable until we start building your channel,', 'setup fees are refundable until we start building your channel,')
    s = rep(s, '<li><a href="#free-trial">Free trial</a></li>', '<li><a href="#free-trial">Partner setup</a></li>')
    s = rep(s, '<h2 id="free-trial">Free trial</h2>\n<p>The 30-day free trial costs nothing and needs no card, so there is nothing to refund. If you don\'t choose a plan by the end of the trial, your Channel is paused.</p>',
               '<h2 id="free-trial">Partner setup</h2>\n<p>Partner channels pay a reduced setup fee upfront or have it recovered from their first earnings. Upfront setup fees follow the onboarding-fee rules below. Fees being recovered from earnings are not refundable, and any balance not yet recovered becomes payable if a Partner leaves early.</p>')
    s = rep(s, '<p>Payments we make to you from advertising revenue are covered by the <a href="terms.html">Terms of Service</a>, not this policy.</p>',
               '<p>Payments we make to you from advertising revenue are covered by the <a href="terms.html">Terms of Service</a>, including our paid-on-time guarantee: if we pay your share late, your next monthly fee is waived.</p>')
    return s

def update_privacy(s):
    return rep(s, '<td>You, in the onboarding form or by email</td>', '<td>You, in the onboarding form (stored with our hosting provider and emailed to our team) or by email</td>')

LEAD_PHP = r'''<?php
// Fast on Africa onboarding form: saves each application and emails the team.
header('Content-Type: application/json');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }
$raw = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode($raw, true);
if (!is_array($d) || !empty($d['hp']) || empty($d['email']) || empty($d['name'])) { echo '{"ok":false}'; exit; }
$cut = function_exists('mb_substr') ? 'mb_substr' : 'substr';
$clean = [];
foreach ($d as $k => $v) {
  $k = preg_replace('/[^a-zA-Z]/', '', (string)$k);
  if ($k === '' || strlen($k) > 40 || $k === 'hp') continue;
  $clean[$k] = is_scalar($v) ? $cut(trim((string)$v), 0, 2000) : '';
}
$clean['receivedAt'] = gmdate('c');
$clean['ip'] = $_SERVER['REMOTE_ADDR'] ?? '';
$dir = __DIR__ . '/leads';
if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
$ok = @file_put_contents($dir . '/applications.jsonl', json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX) !== false;
$ref = preg_replace('/[^A-Z0-9-]/', '', strtoupper($clean['ref'] ?? ''));
$body = '';
foreach ($clean as $k => $v) { if ($v !== '') $body .= $k . ': ' . str_replace(["\r", "\n"], ' ', $v) . "\n"; }
$from = 'no-reply@fastonafrica.com';
$reply = filter_var($clean['email'] ?? '', FILTER_VALIDATE_EMAIL) ?: $from;
@mail('john.upah@mediaiconsltd.com', 'FOA onboarding ' . $ref, $body, "From: Fast on Africa <$from>\r\nReply-To: $reply\r\nContent-Type: text/plain; charset=UTF-8");
echo json_encode(['ok' => $ok]);
'''

LEADS_HTACCESS = '''# Applications are private: never served over the web
Require all denied
<IfModule !mod_authz_core.c>
  Deny from all
</IfModule>
'''

if __name__ == '__main__':
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    for name, fn in [('index.html', update_index), ('terms.html', update_terms), ('refund-policy.html', update_refund), ('privacy-policy.html', update_privacy)]:
        s = open(name, encoding='utf-8').read()
        open(name, 'w', encoding='utf-8').write(fn(s))
    open('lead.php', 'w').write(LEAD_PHP)
    os.makedirs('leads', exist_ok=True)
    open('leads/.htaccess', 'w').write(LEADS_HTACCESS)
    print('updated')
