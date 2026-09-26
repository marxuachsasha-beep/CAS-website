/* Builds every page from window.CAS (content.js). No framework, no build step. */
(function () {
  'use strict';

  var C = window.CAS || {};
  var S = C.student || {};
  var J = C.journey || {};
  var page = document.body.getAttribute('data-page');
  var main = document.getElementById('main');

  var STRANDS = {
    C: { key: 'C', name: 'Creativity', cls: 'c', def: 'Exploring and extending ideas, leading to an original or interpretive product or performance.' },
    A: { key: 'A', name: 'Activity', cls: 'a', def: 'Physical exertion contributing to a healthy lifestyle.' },
    S: { key: 'S', name: 'Service', cls: 's', def: 'Collaborative and reciprocal engagement with the community in response to an authentic need.' }
  };
  var LO = C.learningOutcomes || {};
  var REFS = (C.reflections || []).filter(Boolean);
  var REQUIRED = J.reflectionsRequired || 7;

  var SECTIONS = [
    ['experience', 'The experience'],
    ['outcomes', 'Learning outcomes'],
    ['challenges', 'Challenges I faced'],
    ['obstacles', 'Handling obstacles'],
    ['skills', 'Skills I developed'],
    ['collaboration', 'Collaboration'],
    ['impact', 'Impact & responsibility'],
    ['examples', 'Specific examples'],
    ['evidence', 'Evidence']
  ];

  /* ---------- text helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isTodo(s) { return typeof s === 'string' && /^\s*✎/.test(s); }
  function strip(s) { return String(s == null ? '' : s).replace(/^\s*✎\s*/, ''); }
  function filled(v) {
    if (Array.isArray(v)) return v.length > 0 && v.every(function (x) { return x && !isTodo(typeof x === 'string' ? x : (x.how || x.caption || x.label || '')); });
    return !!v && !isTodo(v);
  }
  function inline(s) {
    return esc(strip(s))
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
        return /^\s*javascript:/i.test(url) ? label : '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>';
      });
  }
  /* Inline text; placeholders get the dashed "to do" treatment. */
  function t(s) {
    if (s == null || s === '') return '';
    return isTodo(s) ? '<span class="todo">' + inline(s) + '</span>' : inline(s);
  }
  function paras(v, cls) {
    var list = Array.isArray(v) ? v : (v ? [v] : []);
    return list.map(function (p) {
      return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + t(p) + '</p>';
    }).join('');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function plain(s) { return strip(s).replace(/\*\*?|\[|\]\([^)]*\)/g, ''); }
  function safeSrc(s) { return s && !/^\s*javascript:/i.test(s) ? esc(s) : ''; }

  var first = S.firstName || '';
  var last = S.lastName || '';
  var fullName = (first + ' ' + last).trim() || 'CAS Portfolio';
  var initials = ((first[0] || '') + (last[0] || '')).toUpperCase() || 'CAS';

  var ARROW = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  var ARROW_UP = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  var LOCK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function strandChips(list, small) {
    return (list || []).map(function (k) {
      var s = STRANDS[k]; if (!s) return '';
      return '<span class="chip chip--' + s.cls + (small ? ' chip--sm' : '') + '"><b>' + s.key + '</b>' + s.name + '</span>';
    }).join('');
  }
  function loChips(outcomes) {
    return (outcomes || []).map(function (o) {
      return '<span class="lo-chip" title="' + esc(LO[o.lo] || '') + '">LO' + esc(o.lo) + '</span>';
    }).join('');
  }
  function sectionHead(num, label) {
    return '<div class="shead wrap" data-reveal><span class="shead__num">(' + num + ')</span>' +
      '<span class="shead__label">' + label + '</span><span class="shead__line"></span></div>';
  }
  function cover(r, idx) {
    var k = (r.strands && r.strands[0]) || 'C';
    var s = STRANDS[k] || STRANDS.C;
    if (r.cover) return '<img src="' + safeSrc(r.cover) + '" alt="" loading="lazy">';
    return '<div class="gencover gencover--' + s.cls + '" style="--seed:' + ((idx * 47) % 360) + 'deg"><span>' + s.key + '</span><i></i></div>';
  }
  function refIndex(id) {
    for (var i = 0; i < REFS.length; i++) if (REFS[i].id === id) return i;
    return -1;
  }
  function profileButton(cls) {
    if (S.profileFile) {
      return '<a class="btn ' + (cls || '') + '" href="' + safeSrc(S.profileFile) + '" target="_blank" rel="noopener" data-magnetic data-cursor="Open">CAS Personal Profile ' + ARROW_UP + '</a>';
    }
    return '<span class="btn btn--todo ' + (cls || '') + '" title="Upload your profile to assets/files and set profileFile in content.js"><span class="todo">Add your CAS Personal Profile</span></span>';
  }

  /* ---------- shared chrome ---------- */
  function nav() {
    var onHome = page === 'home';
    var h = onHome ? '' : 'index.html';
    var links = [
      [h + '#about', 'About'],
      [h + '#strands', 'Strands'],
      [h + '#journey', 'Journey'],
      ['reflections.html', 'Reflections', page === 'reflections' || page === 'reflection']
    ];
    var el = document.getElementById('nav');
    el.innerHTML =
      '<nav class="nav" aria-label="Main">' +
        '<a class="nav__brand" href="index.html" data-cursor="Home"><span class="nav__mono">' + esc(initials) + '</span>' +
          '<span class="nav__name">' + esc(fullName) + '<small>CAS Portfolio</small></span></a>' +
        '<div class="nav__links">' + links.map(function (l) {
          return '<a href="' + l[0] + '"' + (l[2] ? ' aria-current="page"' : '') + '>' + l[1] + '</a>';
        }).join('') + '</div>' +
        '<button class="nav__burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span></button>' +
      '</nav>' +
      '<div class="menu" id="menu" hidden><ol>' + [['index.html', 'Home']].concat(links).map(function (l, i) {
        return '<li><a href="' + l[0] + '"><span>' + pad(i + 1) + '</span>' + l[1] + '</a></li>';
      }).join('') + '</ol></div>';
  }

  function footer() {
    var el = document.getElementById('footer');
    el.innerHTML =
      '<div class="footer wrap">' +
        '<div class="footer__big" aria-hidden="true">' + esc(first) + ' <em>' + esc(last) + '</em></div>' +
        '<div class="footer__row">' +
          '<span>© ' + new Date().getFullYear() + ' ' + esc(fullName) + ' · IB CAS Portfolio</span>' +
          '<span>Hosted on GitHub Pages</span>' +
          '<a href="#top" class="footer__top" data-cursor="Up">Back to top ↑</a>' +
        '</div>' +
      '</div>';
  }

  /* ---------- home ---------- */
  function home() {
    var A = C.about || {};
    var done = REFS.length;
    var ribbonWords = ['Creativity', 'Activity', 'Service', 'Reflection', 'Growth', 'Collaboration', 'Perseverance', 'Impact'];
    function ribbon(words) {
      var seq = words.map(function (w) { return '<span>' + w + '</span><i>✦</i>'; }).join('');
      return '<div class="ribbon__track">' + seq + seq + seq + '</div>';
    }

    var portrait = S.photo
      ? '<img src="' + safeSrc(S.photo) + '" alt="Portrait of ' + esc(fullName) + '">'
      : '<div class="monogram"><span>' + esc(initials) + '</span><i></i><i></i></div>';

    var interests = (C.interests || []).map(function (it, i) {
      return '<article class="ring__item"><div class="ring__card"><span class="idx">' + pad(i + 1) + '</span>' +
        '<h3>' + t(it.title) + '</h3><p>' + t(it.text) + '</p></div></article>';
    }).join('');

    var strengths = (C.strengths || []).map(function (it, i) {
      return tiltCard('<span class="idx">' + pad(i + 1) + '</span><h3>' + t(it.title) + '</h3><p>' + t(it.text) + '</p>');
    }).join('');

    var meaning = plain(C.casMeaning || '');
    var words = meaning.split(/\s+/).filter(Boolean).map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');

    var strands = ['C', 'A', 'S'].map(function (k, i) {
      var s = STRANDS[k];
      var mine = (C.strands && C.strands[k]) || {};
      var count = REFS.filter(function (r) { return (r.strands || []).indexOf(k) > -1; }).length;
      var flip = i % 2 === 1;
      return '<article class="strand strand--' + s.cls + (flip ? ' strand--flip' : '') + '" id="strand-' + k + '" data-morph="' + (i + 1) + '" data-x="' + (flip ? -0.48 : 0.48) + '" data-dim="1">' +
        '<div class="wrap strand__wrap"><div class="strand__col">' +
          '<div class="strand__top" data-reveal><span class="strand__letter">' + k + '</span><span class="mono">Strand ' + pad(i + 1) + ' / 03</span></div>' +
          '<h2 class="display" data-split>' + s.name + '</h2>' +
          '<p class="strand__def" data-reveal>“' + s.def + '” <span>IB definition</span></p>' +
          '<div class="strand__mine" data-reveal><span class="k">What it means to me</span>' + paras(mine.meaning) + '</div>' +
          (mine.examples && mine.examples.length ? '<ul class="strand__ex" data-reveal>' + mine.examples.map(function (e) { return '<li>' + t(e) + '</li>'; }).join('') + '</ul>' : '') +
          '<a class="link-arrow" href="reflections.html?strand=' + k + '" data-reveal data-cursor="View">' + count + ' ' + s.name + ' reflection' + (count === 1 ? '' : 's') + ' ' + ARROW + '</a>' +
        '</div></div>' +
      '</article>';
    }).join('');

    var goals = (C.goals || []).map(function (g, i) {
      var s = STRANDS[g.strand];
      return '<li class="goal" data-reveal><span class="goal__n">' + pad(i + 1) + '</span>' +
        '<div class="goal__body"><h3>' + t(g.title) + '</h3><p>' + t(g.text) + '</p></div>' +
        (s ? '<span class="chip chip--' + s.cls + '"><b>' + s.key + '</b>' + s.name + '</span>' : '<span></span>') +
      '</li>';
    }).join('');

    var challenges = (C.challenges || []).map(function (c, i) {
      return tiltCard('<span class="idx">' + pad(i + 1) + '</span><h3>' + t(c.title) + '</h3><p>' + t(c.text) + '</p>');
    }).join('');

    var slots = '';
    for (var i = 0; i < Math.max(REQUIRED, REFS.length); i++) {
      var r = REFS[i];
      var side = i % 2 ? 'r' : 'l';
      if (r) {
        slots += '<li class="tl tl--' + side + ' tl--done" data-reveal><span class="tl__dot"></span>' +
          '<a class="tl__card" href="reflection.html?id=' + encodeURIComponent(r.id) + '" data-tilt data-cursor="Read">' +
            '<span class="tl__glass"></span><span class="tl__body">' +
            '<span class="mono">Reflection ' + pad(i + 1) + ' · ' + esc(plain(r.quarter)) + '</span>' +
            '<span class="tl__title">' + t(r.title) + '</span>' +
            '<span class="tl__chips">' + strandChips(r.strands, true) + '</span></span></a></li>';
      } else {
        slots += '<li class="tl tl--' + side + ' tl--locked" data-reveal><span class="tl__dot"></span>' +
          '<div class="tl__card"><span class="tl__glass"></span><span class="tl__body">' +
          '<span class="mono">Reflection ' + pad(i + 1) + '</span><span class="tl__title">' + LOCK + ' Upcoming quarter</span></span></div></li>';
      }
    }
    var P = J.project || {}, F = J.final || {};
    slots += '<li class="tl tl--' + (i % 2 ? 'r' : 'l') + ' tl--milestone" data-reveal><span class="tl__dot"></span>' +
      '<div class="tl__card tl__card--big"><span class="tl__glass"></span><span class="tl__body">' +
      '<span class="mono">Milestone · ' + esc(plain(P.when || 'Senior year')) + '</span>' +
      '<span class="tl__title">' + esc(P.title || 'CAS Project') + '</span><span class="tl__text">' + t(P.text) + '</span>' +
      '<span class="pulse-tag"><i></i>' + esc(plain(P.when || 'Coming soon')) + '</span></span></div></li>';
    slots += '<li class="tl tl--' + ((i + 1) % 2 ? 'r' : 'l') + ' tl--milestone tl--final" data-reveal><span class="tl__dot"></span>' +
      '<div class="tl__card tl__card--big"><span class="tl__glass"></span><span class="tl__body">' +
      '<span class="mono">Finale · ' + esc(plain(F.when || '')) + '</span>' +
      '<span class="tl__title">' + esc(F.title || 'Final CAS reflection') + '</span><span class="tl__text">' + t(F.text) + '</span>' +
      (F.date ? '<span class="countdown" data-countdown="' + esc(F.date) + '">' +
        ['days', 'hrs', 'min', 'sec'].map(function (u) { return '<span><b data-u="' + u + '">--</b><small>' + u + '</small></span>'; }).join('') +
      '</span>' : '') +
      '</span></div></li>';

    var pct = Math.min(1, done / REQUIRED);

    main.innerHTML =
      '<section class="hero" id="top" data-morph="0" data-x="0.44" data-dim="1">' +
        '<div class="hero__inner wrap">' +
          '<p class="eyebrow" data-reveal><span class="pulse"></span>' + esc(S.programme || 'IB Diploma Programme') + ' · CAS Portfolio</p>' +
          '<h1 class="hero__name" aria-label="' + esc(fullName) + '">' +
            '<span class="line"><span data-split>' + esc(first) + '</span></span>' +
            '<span class="line"><em class="iri" data-split>' + esc(last) + '</em></span>' +
          '</h1>' +
          '<p class="hero__tag" data-reveal>' + t(S.tagline) + '</p>' +
          '<div class="hero__cta" data-reveal>' +
            '<a class="btn btn--primary" href="reflections.html" data-magnetic data-cursor="Enter"><span>Enter the reflections</span>' + ARROW + '</a>' +
            profileButton() +
          '</div>' +
        '</div>' +
        '<div class="hero__meta wrap" data-reveal>' +
          '<div><span class="k">Class of</span><span class="v">' + t(S.classOf) + '</span></div>' +
          '<div><span class="k">School</span><span class="v">' + t(S.school) + '</span></div>' +
          '<div><span class="k">Reflections</span><span class="v">' + pad(done) + ' / ' + pad(REQUIRED) + '</span></div>' +
          '<a class="scrollcue" href="#about" aria-label="Scroll to About"><span>Scroll</span><i></i></a>' +
        '</div>' +
        '<div class="spinner" aria-hidden="true"><svg viewBox="0 0 200 200"><defs><path id="spin-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs>' +
          '<text><textPath href="#spin-path">CREATIVITY ✦ ACTIVITY ✦ SERVICE ✦ CLASS OF ' + esc(plain(S.classOf)) + ' ✦ </textPath></text></svg><span>✦</span></div>' +
      '</section>' +

      '<div class="ribbons" aria-hidden="true">' +
        '<div class="ribbon ribbon--a">' + ribbon(ribbonWords) + '</div>' +
        '<div class="ribbon ribbon--b">' + ribbon(ribbonWords.slice().reverse()) + '</div>' +
      '</div>' +

      '<section class="section about" id="about" data-morph="4" data-dim="0.55">' +
        sectionHead('01', 'Who I am') +
        '<div class="about__grid wrap">' +
          '<div class="about__portrait" data-reveal><div class="portrait" data-tilt data-cursor="Hi!"><div class="portrait__inner">' + portrait + '</div><span class="portrait__tag">' + esc(fullName) + '</span></div></div>' +
          '<div class="about__text">' +
            '<h2 class="display display--md" data-reveal>' + t(A.headline) + '</h2>' +
            '<div class="about__paras" data-reveal>' + paras(A.paragraphs) + '</div>' +
            ((A.facts || []).length ? '<dl class="facts" data-reveal>' + A.facts.map(function (f) {
              return '<div><dt>' + esc(f.label) + '</dt><dd>' + t(f.value) + '</dd></div>';
            }).join('') + '</dl>' : '') +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section interests" id="interests" data-morph="4" data-dim="0.45">' +
        sectionHead('02', 'Interests & strengths') +
        '<div class="wrap split-head"><h2 class="display" data-split>Things that <em>light me up</em></h2>' +
          '<p class="hint" data-reveal><span class="hint__ico">⟲</span> Drag to spin</p></div>' +
        '<div class="ring-stage" data-ring aria-label="Interests"><div class="ring">' + interests + '</div></div>' +
        '<div class="wrap"><h3 class="subhead" data-reveal>What I bring</h3><div class="cards">' + strengths + '</div></div>' +
      '</section>' +

      '<section class="meaning" id="meaning" data-morph="4" data-dim="0.35">' +
        '<div class="meaning__sticky">' +
          sectionHead('03', 'What CAS means to me') +
          '<div class="wrap"><blockquote class="meaning__quote' + (isTodo(C.casMeaning) ? ' is-todo' : '') + (meaning.split(/\s+/).length > 55 ? ' is-long' : '') + '" data-scrub>' + words + '</blockquote></div>' +
        '</div>' +
      '</section>' +

      '<section class="strands" id="strands">' +
        '<div class="strands__head" data-morph="0" data-x="0" data-dim="0.5">' + sectionHead('04', 'The three strands') +
          '<div class="wrap"><h2 class="display" data-split>Creativity. Activity. <em>Service.</em></h2></div></div>' +
        strands +
      '</section>' +

      '<section class="section goals" id="goals" data-morph="4" data-dim="0.5">' +
        sectionHead('05', 'Goals & challenges') +
        '<div class="wrap"><h2 class="display" data-split>Where I’m <em>headed</em></h2>' +
          '<ol class="goal-list">' + goals + '</ol>' +
          '<h3 class="subhead" data-reveal>Where I want to push myself</h3><div class="cards cards--3">' + challenges + '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section journey" id="journey" data-morph="4" data-dim="0.45">' +
        sectionHead('06', 'The journey') +
        '<div class="wrap journey__top">' +
          '<h2 class="display" data-split>Seven reflections. One project. <em>One look back.</em></h2>' +
          '<div class="progress-ring" data-reveal style="--p:' + pct + '"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52"/><circle class="fg" cx="60" cy="60" r="52" pathLength="1"/></svg>' +
            '<div><b>' + done + '</b><span>/' + REQUIRED + '</span><small>reflections</small></div></div>' +
        '</div>' +
        '<ol class="timeline wrap" data-timeline><li class="timeline__line" aria-hidden="true"><i></i></li>' + slots + '</ol>' +
      '</section>' +

      '<section class="outro" data-morph="0" data-x="0" data-dim="1">' +
        '<a class="outro__link" href="reflections.html" data-cursor="Enter"><span class="mono">Next chapter</span>' +
          '<span class="outro__big">Read the <em>reflections</em></span><span class="outro__arrow">' + ARROW + '</span></a>' +
      '</section>';

    function tiltCard(inner) {
      return '<article class="card" data-tilt data-reveal><span class="card__glass"></span><div class="card__body">' + inner + '</div></article>';
    }
  }

  /* ---------- reflections archive ---------- */
  function reflectionsPage() {
    var done = REFS.length;
    var counts = { C: 0, A: 0, S: 0 };
    REFS.forEach(function (r) { (r.strands || []).forEach(function (k) { if (counts[k] != null) counts[k]++; }); });

    var cards = REFS.map(function (r, i) {
      return '<a class="rcard" href="reflection.html?id=' + encodeURIComponent(r.id) + '" data-tilt data-cursor="Read" data-strands="' + esc((r.strands || []).join(' ')) + '">' +
        '<span class="rcard__glass"></span>' +
        '<span class="rcard__body">' +
          '<span class="rcard__cover">' + cover(r, i) + '<span class="rcard__num">' + pad(i + 1) + '</span></span>' +
          '<span class="rcard__meta"><span>' + t(r.quarter) + '</span><span>' + t(r.date) + '</span></span>' +
          '<span class="rcard__title">' + t(r.title) + '</span>' +
          '<span class="rcard__sum">' + t(r.summary) + '</span>' +
          '<span class="rcard__foot">' + strandChips(r.strands, true) + loChips(r.outcomes) + '</span>' +
        '</span></a>';
    }).join('');
    for (var i = done; i < REQUIRED; i++) {
      cards += '<div class="rcard rcard--locked" data-locked><span class="rcard__glass"></span><span class="rcard__body">' +
        '<span class="rcard__num rcard__num--ghost">' + pad(i + 1) + '</span>' +
        '<span class="rcard__title">' + LOCK + ' Reflection ' + pad(i + 1) + '</span>' +
        '<span class="rcard__sum">Unlocks next quarter.</span></span></div>';
    }

    var filterBtn = function (k, label, n) {
      return '<button type="button" class="filter' + (k ? ' filter--' + STRANDS[k].cls : '') + '" data-filter="' + k + '" aria-pressed="false">' + label + ' <sup>' + n + '</sup></button>';
    };

    main.innerHTML =
      '<section class="page-hero" data-morph="0" data-x="0.5" data-dim="0.85">' +
        '<div class="wrap">' +
          '<p class="eyebrow" data-reveal><span class="pulse"></span>Quarterly deep reflections</p>' +
          '<h1 class="page-title"><span class="line"><span data-split>Reflec</span><em class="iri" data-split>tions</em></span></h1>' +
          '<p class="lead" data-reveal>Once a quarter I pick one experience and go deep: what it asked of me, what went wrong, what I learned and who it affected. <span class="lead__count">' + done + ' of ' + REQUIRED + ' complete.</span></p>' +
          '<div class="filters" role="group" aria-label="Filter by strand" data-reveal>' +
            filterBtn('', 'All', done) + filterBtn('C', 'Creativity', counts.C) + filterBtn('A', 'Activity', counts.A) + filterBtn('S', 'Service', counts.S) +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="section section--tight" data-morph="4" data-dim="0.45">' +
        '<div class="wrap rgrid" data-grid>' + cards + '</div>' +
        '<p class="wrap empty" data-empty hidden>No reflections in this strand yet.</p>' +
      '</section>' +
      '<section class="section" data-morph="4" data-dim="0.4">' +
        sectionHead('LO', 'Learning outcomes') +
        '<div class="wrap"><h2 class="display display--md" data-split>The seven things <em>every</em> reflection is measured against</h2>' +
          '<ol class="lo-legend">' + Object.keys(LO).map(function (k) {
            var n = REFS.filter(function (r) { return (r.outcomes || []).some(function (o) { return String(o.lo) === String(k); }); }).length;
            return '<li data-reveal><span class="lo-legend__n">LO' + esc(k) + '</span><span class="lo-legend__t">' + esc(LO[k]) + '</span>' +
              '<span class="lo-legend__c' + (n ? ' is-hit' : '') + '">' + (n ? 'shown in ' + n : 'not yet') + '</span></li>';
          }).join('') + '</ol></div>' +
      '</section>';
  }

  /* ---------- single reflection ---------- */
  function reflectionPage() {
    var id = new URLSearchParams(location.search).get('id');
    var i = refIndex(id);
    if (i < 0 && !id && REFS.length) i = 0;
    var r = REFS[i];
    if (!r) {
      main.innerHTML = '<section class="page-hero notfound" data-morph="0" data-x="0" data-dim="0.8"><div class="wrap">' +
        '<p class="eyebrow">404 · lost in space</p><h1 class="page-title"><span class="line"><span>Not <em class="iri">found</em></span></span></h1>' +
        '<p class="lead">That reflection doesn’t exist (yet).</p><a class="btn btn--primary" href="reflections.html" data-magnetic>All reflections ' + ARROW + '</a></div></section>';
      return;
    }
    var n = i + 1;
    var k = (r.strands && r.strands[0]) || 'C';
    var morph = { C: 1, A: 2, S: 3 }[k] || 0;
    document.title = plain(r.title) + ' | ' + fullName + ' · CAS';
    document.body.classList.add('strand-' + (STRANDS[k] || STRANDS.C).cls);

    var toc = SECTIONS.filter(function (s) { return has(s[0]); }).map(function (s, j) {
      return '<li><a href="#' + s[0] + '" data-toc="' + s[0] + '"><span>' + pad(j + 1) + '</span>' + s[1] +
        '<i class="' + (filled(r[s[0]]) ? 'ok' : 'todo-dot') + '" title="' + (filled(r[s[0]]) ? 'Complete' : 'Still has placeholder text') + '"></i></a></li>';
    }).join('');

    var num = 0;
    function sec(key, title, body) {
      num++;
      return '<section class="rsec" id="' + key + '"><header class="rsec__head" data-reveal><span class="rsec__n">' + pad(num) + '</span><h2>' + title + '</h2></header>' + body + '</section>';
    }
    function has(key) {
      var v = r[key];
      return Array.isArray(v) ? v.length > 0 : !!v;
    }

    var body = '';
    SECTIONS.forEach(function (s) {
      var key = s[0];
      if (!has(key)) return;
      if (key === 'outcomes') {
        body += sec(key, s[1], '<div class="los">' + r.outcomes.map(function (o) {
          return '<div class="lo" data-reveal><span class="lo__n">LO' + esc(o.lo) + '</span><div><h3>' + esc(LO[o.lo] || '') + '</h3><p>' + t(o.how) + '</p></div></div>';
        }).join('') + '</div>');
      } else if (key === 'evidence') {
        body += sec(key, s[1], '<div class="evidence">' + r.evidence.map(evidenceItem).join('') + '</div>');
      } else {
        body += sec(key, s[1], '<div class="prose" data-reveal>' + paras(r[key]) + '</div>');
        if (key === 'obstacles' && r.quote) {
          body += '<figure class="pull" data-reveal><blockquote>' + t(r.quote) + '</blockquote><figcaption>Reflection ' + pad(n) + '</figcaption></figure>';
        }
      }
    });

    var prev = REFS[i - 1], next = REFS[i + 1];
    function pager(ref, j, dir) {
      if (!ref) return '<span class="pager__item pager__item--empty"></span>';
      return '<a class="pager__item pager__item--' + dir + '" href="reflection.html?id=' + encodeURIComponent(ref.id) + '" data-cursor="' + (dir === 'prev' ? 'Prev' : 'Next') + '">' +
        '<span class="mono">' + (dir === 'prev' ? '← Previous' : 'Next →') + ' · ' + pad(j + 1) + '</span><span class="pager__title">' + t(ref.title) + '</span></a>';
    }

    main.innerHTML =
      '<article class="reflection">' +
        '<header class="rhero" data-morph="' + morph + '" data-x="0.55" data-dim="0.9">' +
          '<div class="wrap rhero__grid">' +
            '<div class="rhero__text">' +
              '<a class="back" href="reflections.html" data-cursor="Back">← All reflections</a>' +
              '<p class="eyebrow" data-reveal><span class="pulse"></span>Reflection ' + pad(n) + ' of ' + pad(Math.max(REQUIRED, REFS.length)) + ' · ' + t(r.quarter) + '</p>' +
              '<h1 class="rtitle" data-reveal>' + t(r.title) + '</h1>' +
              '<p class="lead" data-reveal>' + t(r.summary) + '</p>' +
            '</div>' +
            '<span class="rhero__num" aria-hidden="true">' + pad(n) + '</span>' +
          '</div>' +
          '<div class="wrap"><dl class="rmeta" data-reveal>' +
            '<div><dt>Strand</dt><dd>' + strandChips(r.strands) + '</dd></div>' +
            '<div><dt>When</dt><dd>' + t(r.date) + '</dd></div>' +
            (r.role ? '<div><dt>My role</dt><dd>' + t(r.role) + '</dd></div>' : '') +
            '<div><dt>Learning outcomes</dt><dd>' + loChips(r.outcomes) + '</dd></div>' +
          '</dl></div>' +
          '<div class="wrap"><div class="rcover" data-tilt data-reveal>' + cover(r, i) + '</div></div>' +
        '</header>' +
        '<div class="rbody wrap" data-morph="4" data-dim="0.3">' +
          '<aside class="toc"><p class="mono">Contents</p><ol>' + toc + '</ol></aside>' +
          '<div class="rcontent">' + body + '</div>' +
        '</div>' +
        '<nav class="pager wrap" aria-label="More reflections">' + pager(prev, i - 1, 'prev') + pager(next, i + 1, 'next') + '</nav>' +
      '</article>' +
      '<div class="lightbox" hidden><button type="button" class="lightbox__close" aria-label="Close">✕</button><figure><img alt=""><figcaption></figcaption></figure></div>';
  }

  function evidenceItem(e) {
    var cap = e.caption || e.label || '';
    if (e.type === 'link') {
      var href = safeSrc(e.url);
      return '<a class="ev ev--link"' + (href ? ' href="' + href + '" target="_blank" rel="noopener"' : '') + ' data-reveal data-cursor="Open">' +
        '<span class="ev__ico">' + ARROW_UP + '</span><span>' + t(cap || e.url) + '</span></a>';
    }
    if (e.type === 'video') {
      var yt = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(e.src || '');
      var media = yt
        ? '<iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '" title="' + esc(plain(cap) || 'Video') + '" loading="lazy" allowfullscreen></iframe>'
        : (e.src ? '<video src="' + safeSrc(e.src) + '" controls playsinline preload="metadata"></video>' : '<span class="ev__empty">Video</span>');
      return '<figure class="ev ev--video" data-reveal><div class="ev__media">' + media + '</div><figcaption>' + t(cap) + '</figcaption></figure>';
    }
    return '<figure class="ev ev--img" data-reveal>' +
      (e.src
        ? '<button type="button" class="ev__media" data-lightbox="' + safeSrc(e.src) + '" data-caption="' + esc(plain(cap)) + '" data-cursor="View"><img src="' + safeSrc(e.src) + '" alt="' + esc(plain(cap)) + '" loading="lazy"></button>'
        : '<div class="ev__media ev__empty"><span>+</span>Add a photo</div>') +
      '<figcaption>' + t(cap) + '</figcaption></figure>';
  }

  /* ---------- go ---------- */
  function contentError(detail) {
    main.innerHTML = '<section class="content-error"><p class="eyebrow">Content error</p>' +
      '<h1>Something in <em class="iri">content.js</em> needs fixing.</h1>' +
      '<p>The site couldn’t read your content. This almost always means a missing comma, quote mark or bracket near your last edit. ' +
      'Open the browser console (right-click → Inspect → Console) to see the line number.</p>' +
      (detail ? '<p><code>' + esc(detail) + '</code></p>' : '') + '</section>';
  }

  document.title = page === 'reflections' ? 'Reflections | ' + fullName + ' · CAS' : fullName + ' · CAS Portfolio';
  if (!window.CAS) { contentError(); return; }
  try {
    nav();
    if (page === 'home') home();
    else if (page === 'reflections') reflectionsPage();
    else if (page === 'reflection') reflectionPage();
    footer();
  } catch (err) {
    if (window.console) console.error(err);
    contentError(err && err.message);
  }
})();
