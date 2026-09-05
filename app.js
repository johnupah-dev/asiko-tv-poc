/* LOOP7 — FAST network POC
   - 7 linear channels, each a looping VOD source seeked to wall-clock ("live" feel)
   - EPG schedule is a metadata layer, decoupled from the underlying playout
   - Client-side ad-break simulation: avails -> creative -> impression -> revenue
   This is a front-end prototype. Production playout/SSAI/ad-decisioning is
   described in README.md (Eyevinn OSC pipeline). */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const fmt2 = (n) => String(n).padStart(2, '0');
  const K = 'loop7.';
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const video = $('#video');
  const railEl = $('#rail');
  const loadingEl = $('#loading');
  const clockEl = $('#clock');
  const adEl = $('#adbreak');
  const guideEl = $('#guide');

  let CFG = null, MON = null, CH = [];
  let current = 0;
  let hls = null;
  let dur = 0;                 // playback loop length (seconds)
  let inAd = false;
  let watchAccum = 0;
  let lastTick = performance.now();
  let lastResync = 0;
  let compIdx = 0;

  const store = {
    imps:    +lsGet(K + 'imps', 0),
    rev:     +lsGet(K + 'rev', 0),
    cDirect: +lsGet(K + 'cDirect', 0),
    cProg:   +lsGet(K + 'cProg', 0),
    cHouse:  +lsGet(K + 'cHouse', 0),
    fill:    +lsGet(K + 'fill', 0.88) || 0.88,
  };
  function persist() {
    lsSet(K + 'imps', store.imps);
    lsSet(K + 'rev', store.rev);
    lsSet(K + 'cDirect', store.cDirect);
    lsSet(K + 'cProg', store.cProg);
    lsSet(K + 'cHouse', store.cHouse);
    lsSet(K + 'fill', store.fill.toFixed(4));
  }

  /* ---------- linear playout ----------
     Each channel is a looping VOD. We start it at now % loopLength so every
     viewer is at the same point ("live"). hls.js gets the offset via
     startPosition (seeking after load races the initial buffer and can stall);
     native HLS seeks on loadedmetadata. */
  const NATIVE_HLS = !(window.Hls && window.Hls.isSupported());
  let durHint = 0;

  function nowSec() { return Math.floor(Date.now() / 1000); }
  function loopLen() {
    return (dur && isFinite(dur) && dur > 5) ? dur : durHint;
  }
  function syncLive() {
    const base = loopLen();
    if (!base) return;
    try { video.currentTime = nowSec() % Math.floor(base); } catch (e) {}
  }

  function loadSource(ch) {
    durHint = ch.durationSec || 0;
    dur = 0;
    if (hls) { hls.destroy(); hls = null; }
    if (!NATIVE_HLS) {
      const cfg = { enableWorker: true, lowLatencyMode: false };
      if (durHint) cfg.startPosition = nowSec() % durHint;
      hls = new window.Hls(cfg);
      hls.loadSource(ch.src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        dur = video.duration || durHint;
        if (!inAd) video.play().catch(() => {});
      });
      hls.on(window.Hls.Events.ERROR, (evt, data) => {
        if (!data || !data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      });
    } else {
      video.src = ch.src;
      if (!inAd) video.play().catch(() => {});
    }
  }

  video.loop = true;
  video.addEventListener('loadedmetadata', () => {
    dur = video.duration || durHint;
    if (NATIVE_HLS) syncLive();
  });
  video.addEventListener('canplay', () => { if (!inAd) video.play().catch(() => {}); });
  video.addEventListener('playing', () => { if (!inAd) loadingEl.classList.add('is-hidden'); });

  /* ---------- schedule / EPG ---------- */
  function scheduleAt(ch, date) {
    const mins = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    const progs = ch.programs;
    const total = progs.reduce((a, p) => a + p.duration, 0);
    let t = ((mins % total) + total) % total;
    let i = 0;
    while (t >= progs[i].duration) { t -= progs[i].duration; i++; }
    const startMin = mins - t;
    const next = progs[(i + 1) % progs.length];
    return {
      title: progs[i].title,
      startMin,
      endMin: startMin + progs[i].duration,
      elapsed: t,
      duration: progs[i].duration,
      nextTitle: next.title,
      nextAtMin: startMin + progs[i].duration,
    };
  }
  function minToClock(m) {
    m = ((Math.floor(m) % 1440) + 1440) % 1440;
    return `${fmt2(Math.floor(m / 60))}:${fmt2(m % 60)}`;
  }
  function minToDate(base, mins) {
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(mins);
    return d;
  }

  /* ---------- channel rail ---------- */
  function buildRail() {
    railEl.innerHTML = '';
    CH.forEach((ch, idx) => {
      const b = document.createElement('button');
      b.className = 'ch';
      b.type = 'button';
      b.style.setProperty('--ch', ch.accent);
      b.innerHTML =
        `<span class="ch-top"><span class="ch-num">${fmt2(ch.num)}</span>` +
        `<span class="ch-name">${ch.name}</span></span>` +
        `<span class="ch-now" data-now>—</span>` +
        `<span class="ch-genre">${ch.genre}</span>`;
      b.addEventListener('click', () => tune(idx));
      railEl.appendChild(b);
    });
  }

  function tune(i) {
    current = ((i % CH.length) + CH.length) % CH.length;
    const ch = CH[current];
    lsSet(K + 'ch', current);
    document.documentElement.style.setProperty('--ch', ch.accent);
    $('.bug-num').textContent = fmt2(ch.num);
    $('.bug-name').textContent = ch.name;
    loadingEl.classList.remove('is-hidden');
    watchAccum = 0;
    inAd = false;
    adEl.hidden = true;
    [...railEl.children].forEach((el, idx) => el.classList.toggle('is-active', idx === current));
    loadSource(ch);
    updateLowerThird();
  }

  /* ---------- lower third ---------- */
  function updateLowerThird() {
    if (!CH.length) return;
    const now = new Date();
    const s = scheduleAt(CH[current], now);
    $('#nowTitle').textContent = s.title;
    $('#nextTitle').textContent = s.nextTitle;
    $('#nextTime').textContent = 'at ' + minToClock(s.nextAtMin);
    const pct = Math.round((s.elapsed / s.duration) * 100);
    $('#nowProgress').textContent = `${minToClock(s.startMin)}–${minToClock(s.endMin)} · ${pct}%`;
    [...railEl.children].forEach((el, idx) => {
      el.querySelector('[data-now]').textContent = scheduleAt(CH[idx], now).title;
    });
  }

  /* ---------- monetization ---------- */
  function weightedSSP() {
    const pool = MON.ssps;
    const total = pool.reduce((a, s) => a + s.weight, 0);
    let r = Math.random() * total;
    for (const s of pool) { if ((r -= s.weight) <= 0) return s; }
    return pool[pool.length - 1];
  }
  const ROUTE = { direct: 'Direct sold', prog: 'Programmatic auction', house: 'House promo' };

  function logImpression(ssp) {
    store.imps++;
    store.rev += ssp.cpm / 1000;
    if (ssp.type === 'direct') store.cDirect++;
    else if (ssp.type === 'prog') store.cProg++;
    else store.cHouse++;
    store.fill = Math.min(0.97, Math.max(0.72, store.fill + (Math.random() - 0.42) * 0.05));
    persist();
    renderRev();
  }

  function renderRev() {
    $('#mImps').textContent = store.imps.toLocaleString();
    $('#mFill').textContent = Math.round(store.fill * 100) + '%';
    const ecpm = store.imps ? (store.rev / store.imps) * 1000 : 0;
    $('#mCpm').textContent = '$' + ecpm.toFixed(2);
    $('#mRev').textContent = '$' + store.rev.toFixed(4);
    const tot = store.cDirect + store.cProg + store.cHouse || 1;
    const segs = $('#mSplitBar').children;
    segs[0].style.width = (store.cDirect / tot * 100) + '%';
    segs[1].style.width = (store.cProg / tot * 100) + '%';
    segs[2].style.width = (store.cHouse / tot * 100) + '%';
  }

  function rotateCompanion(silent) {
    const c = MON.companion[compIdx % MON.companion.length];
    compIdx++;
    $('#cBrand').textContent = c.brand;
    $('#cText').textContent = c.text;
    if (silent) return;
    store.imps++;
    const cpm = c.type === 'direct' ? 8 : c.type === 'prog' ? 4.5 : 0;
    store.rev += cpm / 1000;
    if (c.type === 'direct') store.cDirect++;
    else if (c.type === 'prog') store.cProg++;
    else store.cHouse++;
    persist();
    renderRev();
  }

  /* ---------- ad break ---------- */
  function countdown(sec) {
    return new Promise((resolve) => {
      const ring = $('#adRingFill');
      const countEl = $('#adCount');
      const C = 2 * Math.PI * 52;
      const start = performance.now();
      function step(t) {
        const left = Math.max(0, sec - (t - start) / 1000);
        countEl.textContent = Math.ceil(left);
        ring.style.strokeDashoffset = String(C * (1 - left / sec));
        if (left <= 0) { resolve(); return; }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  async function startAdBreak() {
    inAd = true;
    video.pause();
    loadingEl.classList.add('is-hidden');
    adEl.hidden = false;
    const slots = 2;
    for (let n = 1; n <= slots; n++) {
      const cr = MON.creatives[Math.floor(Math.random() * MON.creatives.length)];
      const ssp = weightedSSP();
      adEl.style.setProperty('--ad-bg', cr.bg);
      adEl.style.setProperty('--ad-fg', cr.fg);
      $('#adBrand').textContent = cr.brand;
      $('#adLine').textContent = cr.line;
      $('#adSub').textContent = cr.sub;
      $('#adSeq').textContent = `${n} of ${slots}`;
      $('#adRoute').textContent = 'via ' + ROUTE[ssp.type];
      logImpression(ssp);
      await countdown(MON.adSlotSec);
    }
    adEl.hidden = true;
    inAd = false;
    lastTick = performance.now();
    syncLive();
    video.play().catch(() => {});
  }

  /* ---------- program guide ---------- */
  function renderGuide() {
    if (guideEl.hidden || !CH.length) return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const winStart = Math.floor((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
    const WIN = 180;
    $('#guideWindow').textContent =
      `${minToClock(winStart)} – ${minToClock(winStart + WIN)}  ·  network time`;
    const grid = $('#guideGrid');
    grid.innerHTML = '';
    CH.forEach((ch) => {
      const row = document.createElement('div');
      row.className = 'guide-row';

      const label = document.createElement('div');
      label.className = 'guide-label';
      label.style.setProperty('--ch', ch.accent);
      label.innerHTML = `<b>${ch.name}</b><span>${fmt2(ch.num)} · ${ch.genre}</span>`;

      const track = document.createElement('div');
      track.className = 'guide-track';
      let cursor = winStart;
      let guard = 0;
      while (cursor < winStart + WIN && guard++ < 48) {
        const s = scheduleAt(ch, minToDate(now, cursor));
        const segEnd = Math.min(winStart + WIN, s.endMin);
        const on = cursor <= nowMin && s.endMin > nowMin;
        const cell = document.createElement('div');
        cell.className = 'guide-prog' + (on ? ' is-on' : '');
        cell.style.flexGrow = String(Math.max(1, segEnd - cursor));
        cell.style.setProperty('--ch', ch.accent);
        cell.innerHTML = `<b>${s.title}</b><span>${minToClock(s.startMin)}</span>`;
        track.appendChild(cell);
        cursor = s.endMin;
      }
      const nl = document.createElement('div');
      nl.className = 'guide-now';
      nl.style.left = (((nowMin - winStart) / WIN) * 100) + '%';
      track.appendChild(nl);

      row.appendChild(label);
      row.appendChild(track);
      grid.appendChild(row);
    });
  }
  function openGuide() {
    guideEl.hidden = false;
    $('#guideBtn').setAttribute('aria-expanded', 'true');
    renderGuide();
  }
  function closeGuide() {
    guideEl.hidden = true;
    $('#guideBtn').setAttribute('aria-expanded', 'false');
  }

  /* ---------- main loop ---------- */
  function frame(t) {
    const dt = Math.min(0.1, (t - lastTick) / 1000);
    lastTick = t;
    if (!inAd && !video.paused && !document.hidden) {
      watchAccum += dt;
      if (watchAccum >= MON.breakIntervalSec) { watchAccum = 0; startAdBreak(); }
    }
    if (!inAd && !video.seeking && video.readyState >= 3 && t - lastResync > 30000) {
      lastResync = t;
      const base = loopLen();
      if (base && Math.abs(video.currentTime - (nowSec() % Math.floor(base))) > 15) syncLive();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- wire up ---------- */
  $('#soundBtn').addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
    const b = $('#soundBtn');
    b.textContent = video.muted ? 'Unmute' : 'Mute';
    b.classList.toggle('is-live', !video.muted);
    video.play().catch(() => {});
  });
  $('#guideBtn').addEventListener('click', () => (guideEl.hidden ? openGuide() : closeGuide()));
  $('#guideClose').addEventListener('click', closeGuide);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeGuide();
    else if (e.key >= '1' && e.key <= '7') tune(Number(e.key) - 1);
    else if (e.key.toLowerCase() === 'm') $('#soundBtn').click();
    else if (e.key.toLowerCase() === 'g') (guideEl.hidden ? openGuide() : closeGuide());
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !inAd) syncLive(); });

  async function boot() {
    try {
      const res = await fetch('data/channels.json', { cache: 'no-store' });
      CFG = await res.json();
    } catch (e) {
      loadingEl.textContent = 'Could not load channel config';
      return;
    }
    MON = CFG.monetization;
    CH = CFG.channels;
    buildRail();
    renderRev();
    rotateCompanion(true);
    tune(Number(lsGet(K + 'ch', 0)) || 0);
    setInterval(() => {
      const d = new Date();
      clockEl.textContent = `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}:${fmt2(d.getSeconds())}`;
    }, 250);
    setInterval(updateLowerThird, 1000);
    setInterval(() => rotateCompanion(false), 30000);
    setInterval(renderGuide, 15000);
    requestAnimationFrame(frame);
  }

  boot();
})();
