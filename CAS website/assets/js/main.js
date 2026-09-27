/* Scroll choreography for the three pages.
   The whole site is one pinned viewport (.stage__sticky). Scroll position is
   turned into a progress value P (0 → 1) and every scene is drawn from it:

     P 0.00–0.03  cover
     P 0.03–0.23  title flies to the top · camera flies into the galaxy ·
                  the white fades away and "What is CAS?" appears among the stars
     P 0.23–0.38  "What is CAS?"
     P 0.38–0.58  a portal opens out of the CAS centre and becomes "About me"
     P 0.58–0.66  "About me" intro
     P 0.66–0.92  slides sideways to the About me info
     P 0.92–1.00  end                                                          */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var SEG = { t1: [0.03, 0.23], t2: [0.38, 0.58], t3: [0.66, 0.92] };
  var STOPS = { home: 0, cas: 0.30, about: 0.62, info: 0.96 };

  var stage = $('#stage'), sticky = $('.stage__sticky');
  var bgHome = $('.bg--home'), home = $('.scene--home'), cas = $('.scene--cas'), casInner = $('.cas__inner');
  var about = $('.scene--about'), portal = $('.portal');
  var track = $('.about__track'), bgText = $('.about__bgtext'), thread = $('.about__thread');
  var hint = $('.about__hint'), cue = $('.home__cue'), dots = $$('.about__dots i');
  var brand = $('#brand'), bar = $('.brand__bar');
  var words = $$('.brand__title .bw'), dockWords = $$('.brand__dock span');
  var photos12 = $$('.photo--1, .photo--2'), photo3 = $('.photo--3');
  var venn = $('[data-venn]'), rig = $('.venn__rig'), orbs = $$('.orb');

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, r) { return clamp((p - r[0]) / (r[1] - r[0]), 0, 1); }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var cache = new Map();
  function css(el, prop, val) {                                  // write only when changed
    if (!el) return;
    var m = cache.get(el);
    if (!m) { m = {}; cache.set(el, m); }
    if (m[prop] === val) return;
    m[prop] = val;
    if (prop.charAt(0) === '-') el.style.setProperty(prop, val); else el.style[prop] = val;
  }
  function forget(el, prop) { var m = cache.get(el); if (m) delete m[prop]; }
  function toggle(el, cls, on) { if (el && el.classList.contains(cls) !== on) el.classList.toggle(cls, on); }

  /* ---------- split titles into letters (for the drop-in animations) ---------- */
  $$('[data-chars]').forEach(function (el) {
    var text = el.textContent, i = 0;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    Array.prototype.forEach.call(text, function (c) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i++);
      s.textContent = c;
      el.appendChild(s);
    });
  });

  /* ---------- scroll geometry ---------- */
  var range = 1, top0 = 0;
  function layout() {
    top0 = stage.offsetTop;
    range = Math.max(1, stage.offsetHeight - sticky.offsetHeight);
  }
  function rawP() { return clamp((window.scrollY - top0) / range, 0, 1); }
  function scrollToP(p) { window.scrollTo({ top: top0 + p * range, behavior: reduce ? 'auto' : 'smooth' }); }

  /* ---------- measurements ---------- */
  var flight = [], core = { x: 0, y: 0 }, rMax = 1, headDist = 0;
  function measure() {
    // 1. where each title word starts (cover) and ends (docked bar)
    words.forEach(function (w) { w.style.transform = 'none'; forget(w, 'transform'); });
    flight = words.map(function (w, i) {
      var a = w.getBoundingClientRect(), b = dockWords[i].getBoundingClientRect();
      return { dx: b.left - a.left, dy: b.top - a.top, s: b.width / Math.max(1, a.width) };
    });

    // 2. the CAS centre of the diagram: the About me portal opens from here
    var prev = casInner.style.transform;
    casInner.style.transform = 'none';
    var v = venn.getBoundingClientRect(), s = sticky.getBoundingClientRect();
    casInner.style.transform = prev;
    core.x = v.left - s.left + v.width * 0.5;
    core.y = v.top - s.top + v.height * 0.47;
    css(casInner, '--core-x', core.x.toFixed(1) + 'px');
    css(casInner, '--core-y', core.y.toFixed(1) + 'px');
    var w = sticky.clientWidth, h = sticky.clientHeight;
    rMax = Math.max(Math.hypot(core.x, core.y), Math.hypot(w - core.x, core.y), Math.hypot(core.x, h - core.y), Math.hypot(w - core.x, h - core.y)) + 40;
    headDist = Math.hypot(core.x - w / 2, core.y - 30) + 40;          // radius at which the portal covers the title bar
  }

  /* ---------- the frame loop ---------- */
  var Ps = rawP(), last = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    var P = rawP();
    Ps = reduce ? P : Ps + (P - Ps) * (1 - Math.exp(-dt * 9));
    if (Math.abs(P - Ps) < 0.00005) Ps = P;
    render(Ps);
    requestAnimationFrame(frame);
  }

  function render(p) {
    var t1 = seg(p, SEG.t1), t2 = seg(p, SEG.t2), t3 = seg(p, SEG.t3);

    /* 1 · title flies to the top bar, one word after another */
    flight.forEach(function (f, i) {
      var q = inOut(clamp((t1 - i * 0.025) / 0.8, 0, 1));
      var s = 1 + (f.s - 1) * q;
      css(words[i], 'transform', q === 0 ? 'none' :
        'translate3d(' + (f.dx * q).toFixed(2) + 'px,' + (f.dy * q).toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')');
    });
    toggle(brand, 'is-docked', t1 > 0.97);
    css(bar, 'opacity', smooth(0.75, 1, t1).toFixed(3));
    css(cue, 'opacity', (1 - smooth(0, 0.18, t1)).toFixed(3));
    css(cue, 'visibility', t1 > 0.2 ? 'hidden' : 'visible');

    /* 1 · fly into the galaxy: the white cover fades, the dots turn into stars.
          Only opacity and the WebGL camera move, so nothing gets upscaled or pixelated. */
    css(bgHome, 'opacity', (1 - smooth(0.18, 0.8, t1)).toFixed(3));
    css(bgHome, 'visibility', t1 >= 1 ? 'hidden' : 'visible');
    css(home, 'opacity', (1 - smooth(0, 0.4, t1)).toFixed(3));
    css(home, 'visibility', t1 > 0.45 ? 'hidden' : 'visible');
    if (window.Galaxy) {
      window.Galaxy.setWarp(smooth(0, 1, t1));
      window.Galaxy.setNight(smooth(0.12, 0.75, t1));
      window.Galaxy.setVisible(t2 < 1);
    }

    var casIn = smooth(0.55, 1, t1);
    var e2 = inOut(t2);
    css(cas, 'opacity', (casIn * (1 - smooth(0.6, 0.95, t2))).toFixed(3));
    css(cas, 'visibility', casIn > 0 && t2 < 1 ? 'visible' : 'hidden');
    var lift = (1 - casIn) * 36, zoom = 1 + 0.22 * e2;
    css(casInner, 'transform', lift === 0 && e2 === 0 ? 'none' : 'translate3d(0,' + lift.toFixed(2) + 'px,0) scale(' + zoom.toFixed(4) + ')');
    toggle(cas, 'is-active', t1 > 0.8 && t2 < 0.5);
    css(cas, 'pointerEvents', t1 > 0.9 && t2 < 0.25 ? 'auto' : 'none');
    if (t2 > 0.15 && openKey) openOrb(null);

    /* 2 · a portal opens out of the CAS centre and becomes About me */
    var R = e2 * rMax;
    css(about, 'visibility', t2 > 0 ? 'visible' : 'hidden');
    css(about, 'clipPath', t2 >= 1 ? 'none' : 'circle(' + R.toFixed(1) + 'px at ' + core.x.toFixed(1) + 'px ' + core.y.toFixed(1) + 'px)');
    var ring = t2 > 0 && t2 < 1 ? Math.sin(Math.PI * Math.min(1, e2 * 1.15)) : 0;
    css(portal, 'opacity', ring.toFixed(3));
    if (ring > 0) {
      css(portal, 'width', (2 * R).toFixed(1) + 'px');
      css(portal, 'height', (2 * R).toFixed(1) + 'px');
      css(portal, 'transform', 'translate3d(' + (core.x - R).toFixed(1) + 'px,' + (core.y - R).toFixed(1) + 'px,0)');
    }
    toggle(about, 'about-in', t2 > 0.55);

    /* 3 · slide sideways from the intro panel to the info panel */
    var e3 = smooth(0, 1, t3);
    css(track, 'transform', 'translate3d(' + (-e3 * 100).toFixed(3) + 'vw,0,0)');
    css(bgText, 'transform', 'translate3d(' + (40 - e3 * 60).toFixed(2) + 'vw,0,0)');
    photos12.forEach(function (ph, i) { css(ph, '--px', (-e3 * (10 + i * 8)).toFixed(2) + 'vw'); });
    css(photo3, '--px', ((1 - e3) * 12).toFixed(2) + 'vw');
    css(thread, '--draw', (1 - (0.42 * smooth(0.4, 1, t2) + 0.58 * e3)).toFixed(4));
    css(hint, 'opacity', (1 - smooth(0, 0.2, t3)).toFixed(3));
    css(hint, 'visibility', t3 > 0.25 ? 'hidden' : 'visible');
    toggle(about, 'info-in', t3 > 0.3);
    dots.forEach(function (d, i) { toggle(d, 'is-on', (e3 > 0.5 ? 1 : 0) === i); });

    /* the title bar's colour follows whatever page is under it */
    var theme = t1 < 0.55 ? 'home' : (R > headDist || t2 >= 1 ? 'about' : 'cas');
    ['home', 'cas', 'about'].forEach(function (n) { toggle(root, 'theme-' + n, n === theme); });
  }

  /* ---------- the diagram: hover (or tap) a circle to bring it to the centre ---------- */
  var openKey = null;
  function openOrb(k) {
    if (k === openKey) return;
    openKey = k;
    if (k) venn.setAttribute('data-open', k); else venn.removeAttribute('data-open');
    orbs.forEach(function (o) {
      var on = o.getAttribute('data-strand') === k;
      toggle(o, 'is-open', on);
      o.setAttribute('aria-expanded', String(on));
    });
  }
  // while the circles are swapping places, the one shrinking away briefly passes under the cursor;
  // ignore hover during that time or the two would flip back and forth
  var hoverLock = 0;
  orbs.forEach(function (o) {
    var k = o.getAttribute('data-strand');
    if (fine) o.addEventListener('pointerenter', function () {
      var now = performance.now();
      if (now < hoverLock || k === openKey) return;
      if (openKey) hoverLock = now + 750;
      openOrb(k);
    });
    o.addEventListener('click', function () { openOrb(!fine && openKey === k ? null : k); });
    o.addEventListener('focus', function () {                     // keyboard focus only; a tap is handled by click
      var kb = true;
      try { kb = o.matches(':focus-visible'); } catch (err) { /* old browser: treat as keyboard */ }
      if (kb) openOrb(k);
    });
  });
  if (fine) venn.addEventListener('pointerleave', function () { openOrb(null); });
  venn.addEventListener('focusout', function (e) { if (!venn.contains(e.relatedTarget)) openOrb(null); });
  document.addEventListener('pointerdown', function (e) { if (openKey && !venn.contains(e.target)) openOrb(null); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openOrb(null); });

  /* ---------- navigation helpers ---------- */
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { scrollToP(STOPS[b.getAttribute('data-goto')]); });
  });
  words.forEach(function (w) {
    w.addEventListener('click', function () { if (brand.classList.contains('is-docked')) scrollToP(0); });
  });

  /* horizontal wheel / trackpad swipe inside About me moves the panels */
  function horizFactor() { return (range * (SEG.t3[1] - SEG.t3[0])) / window.innerWidth; }
  window.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || rawP() < SEG.t2[1] - 0.02) return;
    e.preventDefault();
    window.scrollBy(0, e.deltaX * horizFactor());
  }, { passive: false });

  /* sideways swipe on touch screens does the same */
  var tx = 0, ty = 0, horiz = null;
  sticky.addEventListener('touchstart', function (e) {
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; horiz = null;
  }, { passive: true });
  sticky.addEventListener('touchmove', function (e) {
    if (rawP() < SEG.t2[1] - 0.02) return;
    var x = e.touches[0].clientX, y = e.touches[0].clientY;
    if (horiz === null) {
      if (Math.abs(x - tx) + Math.abs(y - ty) < 10) return;
      horiz = Math.abs(x - tx) > Math.abs(y - ty);
    }
    if (!horiz) return;
    e.preventDefault();
    window.scrollBy(0, (tx - x) * horizFactor());
    tx = x;
  }, { passive: false });

  /* arrow keys left / right inside About me */
  document.addEventListener('keydown', function (e) {
    if (rawP() < SEG.t2[1] - 0.02) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollToP(STOPS.info); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToP(STOPS.about); }
  });

  /* ---------- pointer interactions ---------- */
  if (fine && !reduce) {
    cas.addEventListener('pointermove', function (e) {
      var k = openKey ? 0.35 : 1;                                   // hold the diagram steadier while reading
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      css(rig, '--vy', (x * 20 * k).toFixed(2) + 'deg');
      css(rig, '--vx', (-y * 16 * k).toFixed(2) + 'deg');
    });
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', (px * 18).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * 14).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---------- start ---------- */
  function relayout() { layout(); measure(); }
  relayout();
  window.addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  window.addEventListener('load', relayout);
  render(Ps);
  requestAnimationFrame(frame);

  window.CASSite = { progress: function () { return { P: rawP(), Ps: Ps }; }, stops: STOPS, go: scrollToP, open: openOrb };
})();
