/* Asiko TV — viewer app.
   - Every channel is a continuous live HLS stream (Eyevinn Channel Engine).
     A channel without its own `src` carries the network feed.
   - The TV guide is a schedule layer computed against the wall clock.
   - Config comes from window.__ASIKO_CFG__ (single-file build) or
     data/channels.json (dev server). */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const fmt2 = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const K = 'asiko.';
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const video = $('#video');
  const railEl = $('#rail');
  const loadingEl = $('#loading');
  const loadingText = $('#loadingText');
  const loadingLogo = $('#loadingLogo');
  const clockEl = $('#clock');
  const guideEl = $('#guide');
  const browseEl = $('#browse');

  let CFG = null, CH = [];
  let current = 0;
  let hls = null;
  let loadedSrc = '';
  let retryTimer = 0;
  let retries = 0;

  /* ---------- playback ---------- */
  const HLS_JS = !!(window.Hls && window.Hls.isSupported());
  const srcOf = (ch) => ch.src || CFG.networkFeed;

  function setLoading(msg, ch) {
    loadingText.textContent = msg;
    if (ch && ch.logo) { loadingLogo.src = ch.logo; loadingLogo.hidden = false; }
    else loadingLogo.hidden = true;
    loadingEl.classList.remove('is-hidden');
  }
  function play() { video.play().catch(() => {}); }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    retries++;
    setLoading('Reconnecting…', CH[current]);
    // 2s, 4s, 8s … capped at 30s
    retryTimer = setTimeout(() => loadSource(CH[current], true), Math.min(30000, 1000 * Math.pow(2, retries)));
  }

  function loadSource(ch, force) {
    const src = srcOf(ch);
    // channels sharing a feed switch instantly — no reload, no black frame
    if (!force && src === loadedSrc && (hls || !HLS_JS)) { play(); return; }
    clearTimeout(retryTimer);
    loadedSrc = src;
    if (hls) { hls.destroy(); hls = null; }
    if (HLS_JS) {
      hls = new window.Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, play);
      hls.on(window.Hls.Events.ERROR, (evt, data) => {
        if (!data || !data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); return; }
        loadedSrc = '';
        scheduleRetry();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      play();
    } else if (!window.Hls) {
      setLoading('Could not start the player — check your connection and refresh');
    } else {
      setLoading('This browser cannot play Asiko TV — try Chrome, Safari, Edge or Firefox');
    }
  }

  video.addEventListener('canplay', play);
  video.addEventListener('playing', () => { retries = 0; loadingEl.classList.add('is-hidden'); });
  video.addEventListener('error', () => { if (!HLS_JS) { loadedSrc = ''; scheduleRetry(); } });

  /* ---------- schedule / guide ---------- */
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
  const nowLabel = (ch, date) => (ch.live ? '● LIVE · ' + (ch.liveTitle || ch.name) : scheduleAt(ch, date).title);

  /* ---------- logos ---------- */
  function initials(name) {
    const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !/^(the|tv|and|en)$/i.test(w));
    return (words.slice(0, 2).map((w) => w[0]).join('') || name[0]).toUpperCase();
  }
  function logoHTML(ch, extra) {
    const art = ch.logo
      ? `<img src="${esc(ch.logo)}" alt="" decoding="async" />`
      : `<span class="mono">${esc(initials(ch.name))}</span>`;
    return `<span class="logo">${art}${extra || ''}</span>`;
  }

  /* ---------- channel rail ---------- */
  function buildRail() {
    railEl.innerHTML = '';
    CH.forEach((ch, idx) => {
      const b = document.createElement('button');
      b.className = 'ch' + (ch.live ? ' is-live-ch' : '');
      b.type = 'button';
      b.setAttribute('aria-label', `Channel ${ch.num}: ${ch.name}`);
      if (ch.accent) b.style.setProperty('--ch', ch.accent);
      b.innerHTML =
        logoHTML(ch) +
        `<span class="ch-top"><span class="ch-num">${fmt2(ch.num)}</span>` +
        `<span class="ch-name">${esc(ch.name)}</span></span>` +
        `<span class="ch-now" data-now>—</span>` +
        `<span class="ch-genre">${esc(ch.genre)}</span>`;
      b.addEventListener('click', () => tune(idx));
      railEl.appendChild(b);
    });
  }

  function tune(i) {
    current = ((i % CH.length) + CH.length) % CH.length;
    const ch = CH[current];
    lsSet(K + 'ch', ch.id);
    try { history.replaceState(null, '', '#' + ch.num); } catch (e) {}
    document.title = `${ch.name} — Asiko TV`;
    document.documentElement.style.setProperty('--ch', ch.accent || '#d8a94b');
    $('.bug-num').textContent = fmt2(ch.num);
    $('.bug-name').textContent = ch.name;
    [...railEl.children].forEach((el, idx) => {
      const on = idx === current;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-current', on ? 'true' : 'false');
      if (on) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    if (srcOf(ch) !== loadedSrc) setLoading('Tuning…', ch);
    loadSource(ch);
    updateLowerThird();
  }

  /* ---------- lower third ---------- */
  function updateLowerThird() {
    if (!CH.length) return;
    const now = new Date();
    const cur = CH[current];
    const tag = $('#nowTag');
    if (cur.live) {
      tag.textContent = 'LIVE';
      tag.classList.add('is-live');
      $('#nowTitle').textContent = cur.liveTitle || cur.name;
      $('#nowProgress').textContent = '';
      $('#nextRow').hidden = true;
    } else {
      const s = scheduleAt(cur, now);
      tag.textContent = 'NOW';
      tag.classList.remove('is-live');
      $('#nextRow').hidden = false;
      $('#nowTitle').textContent = s.title;
      $('#nextTitle').textContent = s.nextTitle;
      $('#nextTime').textContent = 'at ' + minToClock(s.nextAtMin);
      $('#nowProgress').textContent = `${minToClock(s.startMin)}–${minToClock(s.endMin)}`;
    }
    [...railEl.children].forEach((el, idx) => {
      el.querySelector('[data-now]').textContent = nowLabel(CH[idx], now);
    });
  }

  /* ---------- TV guide ---------- */
  function renderGuide() {
    if (guideEl.hidden || !CH.length) return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const winStart = Math.floor((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
    const WIN = 180;
    $('#guideWindow').textContent = `${minToClock(winStart)} – ${minToClock(winStart + WIN)}`;
    const grid = $('#guideGrid');
    grid.innerHTML = '';
    CH.forEach((ch, idx) => {
      const row = document.createElement('div');
      row.className = 'guide-row';

      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'guide-label';
      if (ch.accent) label.style.setProperty('--ch', ch.accent);
      label.innerHTML = `<b>${esc(ch.name)}</b><span>${fmt2(ch.num)} · ${esc(ch.genre)}</span>`;
      label.addEventListener('click', () => { tune(idx); closeGuide(); });

      const track = document.createElement('div');
      track.className = 'guide-track';
      if (ch.live) {
        const cell = document.createElement('div');
        cell.className = 'guide-prog is-on is-live';
        cell.innerHTML = `<b>● LIVE · ${esc(ch.liveTitle || ch.name)}</b><span>Live event coverage</span>`;
        track.appendChild(cell);
      } else {
        let cursor = winStart;
        let guard = 0;
        while (cursor < winStart + WIN && guard++ < 48) {
          const s = scheduleAt(ch, minToDate(now, cursor));
          const segEnd = Math.min(winStart + WIN, s.endMin);
          const on = cursor <= nowMin && s.endMin > nowMin;
          const cell = document.createElement('div');
          cell.className = 'guide-prog' + (on ? ' is-on' : '');
          cell.style.flexGrow = String(Math.max(1, segEnd - cursor));
          if (ch.accent) cell.style.setProperty('--ch', ch.accent);
          cell.innerHTML = `<b>${esc(s.title)}</b><span>${minToClock(s.startMin)}</span>`;
          track.appendChild(cell);
          cursor = s.endMin;
        }
        const nl = document.createElement('div');
        nl.className = 'guide-now';
        nl.style.left = (((nowMin - winStart) / WIN) * 100) + '%';
        track.appendChild(nl);
      }

      row.appendChild(label);
      row.appendChild(track);
      grid.appendChild(row);
    });
  }
  function openGuide() {
    closeBrowse();
    guideEl.hidden = false;
    $('#guideBtn').setAttribute('aria-expanded', 'true');
    renderGuide();
  }
  function closeGuide() {
    guideEl.hidden = true;
    $('#guideBtn').setAttribute('aria-expanded', 'false');
  }

  /* ---------- channels overlay ---------- */
  function chTile(ch, now) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tile' + (CH[current] === ch ? ' is-active' : '');
    el.innerHTML =
      logoHTML(ch, `<span class="n">${fmt2(ch.num)}</span>` + (ch.live ? '<span class="live-flag">LIVE</span>' : '')) +
      `<span class="tile-meta"><span class="tile-name">${esc(ch.name)}</span>` +
      `<span class="tile-genre">${esc(ch.genre)}</span>` +
      `<span class="tile-now">${esc(nowLabel(ch, now))}</span></span>`;
    el.addEventListener('click', () => { tune(CH.indexOf(ch)); closeBrowse(); });
    return el;
  }
  function renderBrowse() {
    const body = $('#browseBody');
    const now = new Date();
    body.innerHTML = '';
    (CFG.sections || []).forEach((sec) => {
      const inSec = CH.filter((c) => c.category === sec.id);
      if (!inSec.length) return;
      const row = document.createElement('section');
      row.className = 'brow-row';
      row.innerHTML = `<div class="brow-label"><span>${esc(sec.label)}</span>` +
        `<span class="count">${inSec.length} channel${inSec.length === 1 ? '' : 's'}</span></div>`;
      const strip = document.createElement('div');
      strip.className = 'brow-strip';
      inSec.forEach((c) => strip.appendChild(chTile(c, now)));
      row.appendChild(strip);
      body.appendChild(row);
    });
  }
  function openBrowse() {
    closeGuide();
    browseEl.hidden = false;
    $('#browseBtn').setAttribute('aria-expanded', 'true');
    renderBrowse();
  }
  function closeBrowse() {
    browseEl.hidden = true;
    $('#browseBtn').setAttribute('aria-expanded', 'false');
  }

  /* ---------- remote-style keys ---------- */
  let digits = '';
  let digitTimer = 0;
  function enterDigit(d) {
    digits = (digits + d).slice(-2);
    $('.bug-num').textContent = digits.padEnd(2, '-');
    clearTimeout(digitTimer);
    const commit = () => {
      const idx = CH.findIndex((c) => c.num === Number(digits));
      digits = '';
      if (idx >= 0) tune(idx); else $('.bug-num').textContent = fmt2(CH[current].num);
    };
    // a second digit can't extend past the line-up, so commit right away
    if (digits.length === 2 || Number(digits) * 10 > CH.length) commit();
    else digitTimer = setTimeout(commit, 1200);
  }

  function channelFromHash() {
    const h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (!h) return -1;
    if (/^\d+$/.test(h)) return CH.findIndex((c) => c.num === Number(h));
    return CH.findIndex((c) => c.id === h);
  }

  /* ---------- wire up ---------- */
  $('#soundBtn').addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
    const b = $('#soundBtn');
    b.textContent = video.muted ? 'Unmute' : 'Mute';
    b.classList.toggle('is-live', !video.muted);
    play();
  });
  $('#guideBtn').addEventListener('click', () => (guideEl.hidden ? openGuide() : closeGuide()));
  $('#guideClose').addEventListener('click', closeGuide);
  $('#browseBtn').addEventListener('click', () => (browseEl.hidden ? openBrowse() : closeBrowse()));
  $('#browseClose').addEventListener('click', closeBrowse);
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const k = e.key;
    if (k === 'Escape') { closeGuide(); closeBrowse(); return; }
    if (k.length === 1 && k >= '0' && k <= '9') { enterDigit(k); return; }
    const lk = k.toLowerCase();
    if (lk === 'm') $('#soundBtn').click();
    else if (lk === 'g') (guideEl.hidden ? openGuide() : closeGuide());
    else if (lk === 'c') (browseEl.hidden ? openBrowse() : closeBrowse());
    else if (guideEl.hidden && browseEl.hidden && (k === 'PageUp' || k === 'ArrowUp')) { e.preventDefault(); tune(current - 1); }
    else if (guideEl.hidden && browseEl.hidden && (k === 'PageDown' || k === 'ArrowDown')) { e.preventDefault(); tune(current + 1); }
  });
  window.addEventListener('hashchange', () => {
    const idx = channelFromHash();
    if (idx >= 0 && idx !== current) tune(idx);
  });
  document.addEventListener('visibilitychange', () => {
    // jump back to the live edge when the viewer returns
    if (!document.hidden && video.paused) {
      if (hls && hls.liveSyncPosition) video.currentTime = hls.liveSyncPosition;
      play();
    }
  });
  // nudge a player that stalls paused while visible (autoplay quirks)
  setInterval(() => {
    if (!document.hidden && video.paused && video.readyState >= 2 && !video.seeking) play();
  }, 3000);

  async function loadConfig() {
    if (window.__ASIKO_CFG__) return window.__ASIKO_CFG__;
    const res = await fetch('data/channels.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config ' + res.status);
    return res.json();
  }

  async function boot() {
    try { CFG = await loadConfig(); } catch (e) { setLoading('We are having trouble reaching Asiko TV — please refresh'); return; }
    CH = CFG.channels;
    $('#tagline').textContent = `${CH.length} channels · free to watch`;
    $('#browseSub').textContent = `All ${CH.length} channels`;
    $('#year').textContent = String(new Date().getFullYear());
    buildRail();
    let start = channelFromHash();
    if (start < 0) start = CH.findIndex((c) => c.id === lsGet(K + 'ch', ''));
    tune(start < 0 ? 0 : start);
    const tick = () => {
      const d = new Date();
      clockEl.textContent = `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}:${fmt2(d.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
    setInterval(updateLowerThird, 5000);
    setInterval(renderGuide, 30000);
  }

  boot();
})();
