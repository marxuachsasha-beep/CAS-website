/* Interactions: loader, page transitions, cursor, 3D tilt, magnetic buttons,
   text reveals, 3D interest ring, scroll-lit quote, timeline, filters, lightbox. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  root.classList.add('js');
  if (fine && !reduce) root.classList.add('has-cursor');

  /* ---------- loader (first visit per session) / page-enter curtain ---------- */
  var loader = $('.loader');
  function reveal() {
    root.classList.remove('first-visit', 'from-nav');
    root.classList.add('is-in');
    store('cas-visited', '1');
  }
  if (root.classList.contains('first-visit') && loader && !reduce) {
    var countEl = $('.loader__count', loader);
    var t0 = performance.now(), dur = 1500;
    (function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      if (countEl) countEl.textContent = String(Math.round(e * 100)).padStart(3, '0');
      loader.style.setProperty('--p', e);
      if (p < 1) requestAnimationFrame(tick);
      else {
        loader.classList.add('is-done');
        setTimeout(reveal, 250);
        setTimeout(function () { loader.remove(); }, 1400);
      }
    })(t0);
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(reveal); });
  }

  /* ---------- page transitions ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) return;
    var samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage && url.hash) {
      var el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (el) {
        e.preventDefault();
        closeMenu();
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', url.hash);
      }
      return;
    }
    if (reduce) return;
    e.preventDefault();
    store('cas-nav', '1');
    root.classList.add('is-leaving');
    setTimeout(function () { location.href = url.href; }, 520);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { root.classList.remove('is-leaving'); reveal(); }
  });

  /* ---------- nav ---------- */
  var burger = $('.nav__burger'), menu = $('#menu');
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    root.classList.remove('menu-open');
    burger && burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open;
      root.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- split headings into words ---------- */
  $$('[data-split]').forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'sw';
            var inner = document.createElement('span'); inner.className = 'sw__i';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    })(el);
  });

  /* ---------- reveal on scroll ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  $$('[data-reveal], [data-split]').forEach(function (el, i) {
    if (!io || reduce) { el.classList.add('in'); return; }
    io.observe(el);
  });

  /* ---------- custom cursor ---------- */
  var cursor = $('.cursor');
  if (cursor && fine && !reduce) {
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__ring span', cursor);
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('a, button, [data-cursor], [data-ring]');
      cursor.classList.toggle('is-hover', !!t);
      var txt = t && t.getAttribute('data-cursor');
      if (t && t.hasAttribute('data-ring')) txt = 'Drag';
      label.textContent = txt || '';
      cursor.classList.toggle('has-label', !!txt);
    });
    document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { cursor.classList.add('is-gone'); });
    document.addEventListener('mouseenter', function () { cursor.classList.remove('is-gone'); });
  }

  /* ---------- 3D tilt + glare ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      var raf = 0, px = 0.5, py = 0.5;
      function apply() {
        raf = 0;
        el.style.setProperty('--rx', ((0.5 - py) * 14).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * 18).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        px = 0.5; py = 0.5;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    });

    /* magnetic buttons */
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * 0.25).toFixed(1) + 'px,' + (y * 0.35).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 3D interest ring ---------- */
  var stage = $('[data-ring]');
  if (stage) {
    var ringEl = $('.ring', stage);
    var items = $$('.ring__item', stage);
    var n = items.length;
    if (n < 3) stage.classList.add('ring-stage--flat');
    else {
      var step = 360 / n, angle = 0, vel = reduce ? 0 : 0.06, dragging = false, lastX = 0, hover = false, radius = 0;
      var layout = function () {
        var w = items[0].offsetWidth || 280;
        radius = Math.round((w / 2) / Math.tan(Math.PI / n) + Math.max(40, w * 0.18));
        stage.style.setProperty('--radius', radius + 'px');
        items.forEach(function (it, i) { it.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)'; });
      };
      layout();
      window.addEventListener('resize', layout);
      stage.addEventListener('pointerdown', function (e) {
        dragging = true; lastX = e.clientX; stage.classList.add('is-drag');
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      stage.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX; lastX = e.clientX;
        vel = dx * 0.25; angle += dx * 0.25;
      });
      var end = function () { dragging = false; stage.classList.remove('is-drag'); };
      stage.addEventListener('pointerup', end);
      stage.addEventListener('pointercancel', end);
      stage.addEventListener('pointerenter', function () { hover = true; });
      stage.addEventListener('pointerleave', function () { hover = false; });
      var visible = true;
      if (io) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(stage);
      (function spin() {
        if (visible) {
          if (!dragging) {
            var idle = reduce ? 0 : (hover ? 0.015 : 0.07);
            vel += (idle - vel) * 0.04;
            angle += vel;
          }
          ringEl.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + angle.toFixed(2) + 'deg)';
          items.forEach(function (it, i) {
            var a = ((i * step + angle) % 360 + 360) % 360;
            var facing = Math.cos(a * Math.PI / 180);             // 1 = front, -1 = back
            it.style.opacity = (0.18 + 0.82 * Math.max(0, (facing + 0.35) / 1.35)).toFixed(3);
            it.style.filter = facing < 0.2 ? 'blur(' + ((0.2 - facing) * 3).toFixed(1) + 'px)' : 'none';
            it.style.zIndex = Math.round(facing * 100) + 100;
          });
        }
        requestAnimationFrame(spin);
      })();
    }
  }

  /* ---------- scroll-linked effects ---------- */
  var bar = $('.progress');
  var scrub = $('[data-scrub]');
  var scrubWords = scrub ? $$('.w', scrub) : [];
  var scrubSection = scrub ? scrub.closest('.meaning') : null;
  var tl = $('[data-timeline]');
  var nav = $('.nav');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0).toFixed(4) + ')';
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
    var vh = window.innerHeight;
    if (scrubSection && scrubWords.length) {
      var r = scrubSection.getBoundingClientRect();
      var p = clamp((vh * 0.35 - r.top) / Math.max(1, vh * 0.35 + (r.height - vh) * 0.9), 0, 1);
      var lit = reduce ? scrubWords.length : Math.round(p * scrubWords.length);
      scrubWords.forEach(function (w, i) { w.classList.toggle('lit', i < lit); });
    }
    if (tl) {
      var tr = tl.getBoundingClientRect();
      tl.style.setProperty('--fill', clamp((vh * 0.6 - tr.top) / tr.height, 0, 1).toFixed(4));
    }
  }
  function requestScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ---------- countdown ---------- */
  $$('[data-countdown]').forEach(function (el) {
    var parts = el.getAttribute('data-countdown').split('-').map(Number);
    var end = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1).getTime();
    var cells = {};
    $$('[data-u]', el).forEach(function (b) { cells[b.getAttribute('data-u')] = b; });
    function tick() {
      var d = Math.max(0, end - Date.now());
      var v = { days: Math.floor(d / 864e5), hrs: Math.floor(d / 36e5) % 24, min: Math.floor(d / 6e4) % 60, sec: Math.floor(d / 1e3) % 60 };
      Object.keys(v).forEach(function (k) {
        var s = String(v[k]).padStart(2, '0');
        if (cells[k] && cells[k].textContent !== s) {
          cells[k].textContent = s;
          if (k === 'sec' && !reduce) { cells[k].classList.remove('flip'); void cells[k].offsetWidth; cells[k].classList.add('flip'); }
        }
      });
    }
    tick(); setInterval(tick, 1000);
  });

  /* ---------- reflections filter ---------- */
  var grid = $('[data-grid]');
  if (grid) {
    var btns = $$('[data-filter]'), empty = $('[data-empty]');
    var apply = function (k) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === k)); });
      var shown = 0;
      $$('.rcard', grid).forEach(function (c, i) {
        var match = c.hasAttribute('data-locked') ? !k : (!k || (c.getAttribute('data-strands') || '').split(' ').indexOf(k) > -1);
        if (match && !c.hasAttribute('data-locked')) shown++;
        c.classList.toggle('is-hidden', !match);
        c.style.setProperty('--d', (i * 0.05) + 's');
      });
      if (empty) empty.hidden = !(k && shown === 0);
      var u = new URL(location.href);
      if (k) u.searchParams.set('strand', k); else u.searchParams.delete('strand');
      history.replaceState(null, '', u);
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); }); });
    var initial = new URLSearchParams(location.search).get('strand');
    apply(/^[CAS]$/.test(initial || '') ? initial : '');
  }

  /* ---------- reflection table of contents ---------- */
  var tocLinks = $$('[data-toc]');
  if (tocLinks.length && io) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('data-toc')] = a; });
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
          var a = map[en.target.id]; if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.rsec').forEach(function (s) { secObs.observe(s); });
  }

  /* ---------- lightbox ---------- */
  var lb = $('.lightbox');
  if (lb) {
    var img = $('img', lb), cap = $('figcaption', lb), opener = null;
    var close = function () { lb.hidden = true; root.classList.remove('lb-open'); if (opener) opener.focus(); };
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-lightbox]');
      if (b) {
        opener = b;
        img.src = b.getAttribute('data-lightbox');
        img.alt = b.getAttribute('data-caption') || '';
        cap.textContent = b.getAttribute('data-caption') || '';
        lb.hidden = false; root.classList.add('lb-open');
        $('.lightbox__close', lb).focus();
      } else if (!lb.hidden && (e.target === lb || e.target.closest('.lightbox__close'))) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  }
})();
