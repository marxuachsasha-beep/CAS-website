/* Scroll choreography for the three pages.
   The whole site is one pinned viewport (.stage__sticky). Scroll position is
   turned into a progress value P (0 → 1) and every scene is drawn from it:

     P 0.00–0.03  cover
     P 0.03–0.23  title flies to the top · cover blurs into "What is CAS?"
     P 0.23–0.38  "What is CAS?"
     P 0.38–0.58  "About me" rises up over it
     P 0.58–0.66  "About me" intro
     P 0.66–0.92  slides sideways to the About me info
     P 0.92–1.00  end                                                     */
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
  var home = $('.scene--home'), cas = $('.scene--cas'), about = $('.scene--about');
  var track = $('.about__track'), bgText = $('.about__bgtext'), thread = $('.about__thread');
  var hint = $('.about__hint'), cue = $('.home__cue'), dots = $$('.about__dots i');
  var brand = $('#brand'), bar = $('.brand__bar');
  var words = $$('.brand__title .bw'), dockWords = $$('.brand__dock span');
  var photos12 = $$('.photo--1, .photo--2'), photo3 = $('.photo--3');

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, r) { return clamp((p - r[0]) / (r[1] - r[0]), 0, 1); }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
  var cache = new Map();
  function css(el, prop, val) {                                  // write only when changed
    if (!el) return;
    var key = el, m = cache.get(key);
    if (!m) { m = {}; cache.set(key, m); }
    if (m[prop] === val) return;
    m[prop] = val;
    if (prop.charAt(0) === '-') el.style.setProperty(prop, val); else el.style[prop] = val;
  }
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

  /* ---------- title flight: measure the cover layout and the docked layout ---------- */
  var flight = [];
  function measure() {
    words.forEach(function (w) { w.style.transform = 'none'; });
    flight = words.map(function (w, i) {
      var a = w.getBoundingClientRect(), b = dockWords[i].getBoundingClientRect();
      return { dx: b.left - a.left, dy: b.top - a.top, s: b.width / Math.max(1, a.width) };
    });
    cache.forEach(function (m, el) { if (words.indexOf(el) > -1) delete m.transform; });
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

    /* 1 · cover dissolves (blur + zoom) into "What is CAS?" */
    var homeOut = smooth(0.3, 1, t1);
    css(home, 'opacity', (1 - homeOut).toFixed(3));
    css(home, 'visibility', t1 >= 1 ? 'hidden' : 'visible');
    css(home, 'transform', t1 > 0 ? 'scale(' + (1 + 0.14 * outCubic(t1)).toFixed(4) + ')' : 'none');
    css(home, 'filter', !reduce && t1 > 0.01 && t1 < 1 ? 'blur(' + (t1 * 16).toFixed(1) + 'px)' : 'none');
    if (window.Galaxy) { window.Galaxy.setWarp(t1); window.Galaxy.setVisible(t1 < 1); }

    var casIn = smooth(0.3, 0.95, t1);
    css(cas, 'opacity', casIn.toFixed(3));
    css(cas, 'visibility', casIn > 0 ? 'visible' : 'hidden');
    var casBlur = reduce ? 0 : (1 - casIn) * 18 + t2 * 5;
    var casScale = (1.08 - 0.08 * casIn) * (1 - 0.07 * inOut(t2));
    css(cas, 'transform', casScale === 1 ? 'none' : 'scale(' + casScale.toFixed(4) + ')');
    css(cas, 'filter', casBlur > 0.05 || t2 > 0 ? 'blur(' + casBlur.toFixed(1) + 'px) brightness(' + (1 - 0.3 * t2).toFixed(3) + ')' : 'none');
    css(cas, 'borderRadius', t2 > 0 ? (inOut(t2) * 36).toFixed(1) + 'px' : '0px');
    toggle(cas, 'is-active', t1 > 0.75 && t2 < 0.6);
    if (fine) css(cas, 'pointerEvents', t1 > 0.9 && t2 < 0.5 ? 'auto' : 'none');

    /* 2 · "About me" rises as a sheet with a domed top edge */
    var e2 = inOut(t2);
    css(about, 'transform', e2 >= 1 ? 'none' : 'translate3d(0,' + ((1 - e2) * 101).toFixed(3) + '%,0)');
    var dome = (1 - e2);
    css(about, 'borderRadius', dome > 0.001 ? (dome * 50).toFixed(2) + 'vw ' + (dome * 50).toFixed(2) + 'vw 0 0 / ' + (dome * 18).toFixed(2) + 'vh ' + (dome * 18).toFixed(2) + 'vh 0 0' : '0');
    css(about, 'visibility', t2 > 0 ? 'visible' : 'hidden');
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

    /* header colour follows whatever page is under it */
    var theme = t1 < 0.55 ? 'home' : (e2 < 0.94 ? 'cas' : 'about');
    ['home', 'cas', 'about'].forEach(function (n) { toggle(root, 'theme-' + n, n === theme); });
  }

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
    var venn = $('[data-venn]'), rig = venn && $('.venn__rig', venn);
    cas.addEventListener('pointermove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      css(rig, '--vy', (x * 22).toFixed(2) + 'deg');
      css(rig, '--vx', (-y * 18).toFixed(2) + 'deg');
      css(venn, '--mx', (x * 2).toFixed(3));
      css(venn, '--my', (y * 2).toFixed(3));
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

  window.CASSite = { progress: function () { return { P: rawP(), Ps: Ps }; }, stops: STOPS, go: scrollToP };
})();
