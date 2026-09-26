/* Particle universe: raw WebGL, no libraries.
   Particles morph between a spiral galaxy, the letters C / A / S and a drifting
   starfield. Sections opt in with  data-morph="0-4"  data-x="-1..1"  data-dim="0..1".
     0 galaxy · 1 C · 2 A · 3 S · 4 starfield                                   */
(function () {
  'use strict';

  var canvas = document.getElementById('scene');
  if (!canvas) return;
  var root = document.documentElement;
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }) ||
         canvas.getContext('experimental-webgl');
  } catch (e) { gl = null; }
  if (!gl) { root.classList.add('no-webgl'); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  var COUNT = small ? 7000 : 15000;
  var STARS = small ? 700 : 1400;
  var TOTAL = COUNT + STARS;

  /* ---------- shaders ---------- */
  var VS = [
    'attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3; attribute vec3 aP4;',
    'attribute vec4 aRnd;',
    'uniform mat4 uProj; uniform mat4 uView;',
    'uniform float uTime; uniform float uMorph; uniform vec2 uMouse; uniform float uMouseOn;',
    'uniform float uPR; uniform float uSize; uniform float uMotion;',
    'uniform vec3 uC; uniform vec3 uA; uniform vec3 uS; uniform vec3 uV;',
    'varying vec3 vColor; varying float vAlpha;',
    'float wt(float t, float i){ return max(0.0, 1.0 - abs(t - i)); }',
    'vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }',
    'vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }',
    'vec3 rotZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }',
    'void main(){',
    '  vec3 p; vec3 col; float size;',
    '  float tw = 0.65 + 0.35 * sin(uTime * (1.2 + aRnd.y) + aRnd.x * 40.0);',
    '  if (aRnd.w < 0.0) {',                                   // background star: never morphs
    '    p = aP0 + 0.05 * uMotion * vec3(sin(uTime*0.2 + aRnd.x*9.0), cos(uTime*0.17 + aRnd.y*9.0), 0.0);',
    '    col = mix(vec3(0.75, 0.8, 1.0), uV, 0.3 + 0.3 * aRnd.z);',
    '    size = 0.6 + 0.6 * abs(aRnd.z);',
    '    vAlpha = tw * 0.8;',
    '  } else {',
    '    float base = floor(uMorph);',
    '    float tp = clamp((uMorph - base - aRnd.w * 0.3) / 0.7, 0.0, 1.0);',   // staggered start, shared finish
    '    tp = tp * tp * (3.0 - 2.0 * tp);',
    '    float t = clamp(base + tp, 0.0, 4.0);',
    '    float w0 = wt(t,0.0), w1 = wt(t,1.0), w2 = wt(t,2.0), w3 = wt(t,3.0), w4 = wt(t,4.0);',
    '    float r = length(aP0.xz);',
    '    vec3 g = rotY(aP0, uTime * 0.06 * uMotion + 0.4);',
    '    g = rotZ(rotX(g, 1.12), 0.38);',
    '    p = g*w0 + aP1*w1 + aP2*w2 + aP3*w3 + aP4*w4;',
    '    float burst = sin(3.14159 * tp);',
    '    p += aRnd.xyz * burst * (0.9 + 0.8 * aRnd.w);',
    '    p = rotZ(p, burst * 0.35 * (aRnd.w - 0.5));',
    '    p += 0.035 * uMotion * vec3(sin(uTime*0.7 + aRnd.x*6.28), cos(uTime*0.6 + aRnd.y*6.28), sin(uTime*0.5 + aRnd.z*6.28));',
    '    vec3 outer = mix(uV, uS, 0.5 + 0.5 * aRnd.x);',
    '    outer = mix(outer, uC, step(0.55, aRnd.y) * 0.75);',
    '    vec3 c0 = mix(vec3(1.0, 0.86, 0.96), outer, smoothstep(0.05, 1.9, r));',
    '    vec3 c4 = aRnd.z < -0.5 ? uC : (aRnd.z < 0.0 ? uS : (aRnd.z < 0.5 ? uV : uA));',
    '    c4 = mix(c4, vec3(1.0), 0.25);',
    '    vec3 hot = vec3(1.0);',
    '    col = c0*w0 + mix(uC, hot, 0.12*aRnd.y + 0.12)*w1 + mix(uA, hot, 0.12*aRnd.y + 0.1)*w2 + mix(uS, hot, 0.12*aRnd.y + 0.1)*w3 + c4*w4;',
    '    col = mix(col, vec3(1.0), pow(aRnd.w, 8.0) * 0.7);',
    '    size = 0.35 + aRnd.w * 1.15;',
    '    vAlpha = mix(0.85, tw, 0.6);',
    '    vec2 d = p.xy - uMouse;',
    '    float dist = length(d);',
    '    float push = uMouseOn * (1.0 - smoothstep(0.0, 1.5, dist));',
    '    p.xy += (d / (dist + 0.0001)) * push * 0.55;',
    '    p.z += push * 0.9;',
    '    col = mix(col, vec3(1.0), push * 0.35);',
    '  }',
    '  vec4 mv = uView * vec4(p, 1.0);',
    '  gl_Position = uProj * mv;',
    '  float px = uSize * size * uPR / max(0.5, -mv.z);',
    '  gl_PointSize = min(px, 48.0 * uPR);',
    '  vAlpha *= 1.0 - 0.75 * smoothstep(6.0 * uPR, 30.0 * uPR, px);',
    '  vColor = col;',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'varying vec3 vColor; varying float vAlpha;',
    'uniform float uOpacity;',
    'void main(){',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float d = length(c);',
    '  float a = 1.0 - smoothstep(0.0, 0.5, d);',
    '  a = a * a * 0.75 + 0.6 * (1.0 - smoothstep(0.0, 0.14, d));',
    '  a *= vAlpha * uOpacity;',
    '  gl_FragColor = vec4(vColor * a, a);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    if (window.console) console.warn('[scene] WebGL disabled:', err);
    root.classList.add('no-webgl');
    return;
  }
  gl.useProgram(prog);

  /* ---------- shapes ---------- */
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function galaxy(out) {
    for (var i = 0; i < COUNT; i++) {
      var o = i * 3, x, y, z;
      if (Math.random() < 0.12) {                      // bright core
        var rc = Math.abs(gauss()) * 0.3;
        var ac = Math.random() * Math.PI * 2;
        x = Math.cos(ac) * rc; z = Math.sin(ac) * rc; y = gauss() * 0.12;
      } else {
        var r = Math.pow(Math.random(), 1.25) * 3.6 + 0.15;
        var branch = (i % 3) / 3 * Math.PI * 2;
        var spin = r * 1.35;
        var spread = 0.06 + r * 0.075;
        x = Math.cos(branch + spin) * r + gauss() * spread;
        z = Math.sin(branch + spin) * r + gauss() * spread;
        y = gauss() * 0.08 * (1.6 - r / 3.6);
      }
      out[o] = x; out[o + 1] = y; out[o + 2] = z;
    }
  }

  function letter(ch, out) {
    var W = 240, H = 240;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var cx = cv.getContext('2d');
    cx.fillStyle = '#fff';
    cx.font = '700 200px "Space Grotesk", "Arial Black", Arial, sans-serif';
    cx.textBaseline = 'alphabetic';
    cx.textAlign = 'left';
    var m = cx.measureText(ch);
    var left = m.actualBoundingBoxLeft || 0, right = m.actualBoundingBoxRight || m.width;
    var asc = m.actualBoundingBoxAscent || 150, desc = m.actualBoundingBoxDescent || 0;
    var bw = left + right, bh = asc + desc;
    var ox = (W - bw) / 2 + left, oy = (H - bh) / 2 + asc;
    cx.fillText(ch, ox, oy);
    var data = cx.getImageData(0, 0, W, H).data;
    var pts = [];
    for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < W; xx++) {
      if (data[(yy * W + xx) * 4 + 3] > 140) pts.push(xx, yy);
    }
    var k = 3.7 / Math.max(bh, 1);
    var ringShare = 0.1;
    for (var i = 0; i < COUNT; i++) {
      var o = i * 3;
      if (Math.random() < ringShare || pts.length === 0) {     // orbit ring around the letter
        var a = Math.random() * Math.PI * 2;
        var R = 2.75 + gauss() * 0.07;
        var rx = Math.cos(a) * R, ry = gauss() * 0.03, rz = Math.sin(a) * R;
        var c1 = Math.cos(1.28), s1 = Math.sin(1.28);            // tilt about X
        var y1 = c1 * ry - s1 * rz, z1 = s1 * ry + c1 * rz;
        var c2 = Math.cos(-0.42), s2 = Math.sin(-0.42);          // then about Z
        out[o] = c2 * rx - s2 * y1; out[o + 1] = s2 * rx + c2 * y1; out[o + 2] = z1;
      } else {
        var j = (Math.random() * (pts.length / 2)) | 0;
        var px = pts[j * 2] + Math.random(), py = pts[j * 2 + 1] + Math.random();
        out[o] = (px - W / 2) * k;
        out[o + 1] = -(py - H / 2) * k;
        out[o + 2] = (Math.random() - 0.5) * 0.55 + gauss() * 0.06;
      }
    }
  }

  function field(out) {
    for (var i = 0; i < COUNT; i++) {
      var o = i * 3;
      out[o] = (Math.random() * 2 - 1) * 11;
      out[o + 1] = (Math.random() * 2 - 1) * 7;
      out[o + 2] = Math.random() * -9 + 3.2;
    }
  }

  function buffer(name, arr, size) {
    var loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  function build() {
    var shapes = [];
    for (var s = 0; s < 5; s++) shapes.push(new Float32Array(TOTAL * 3));
    var tmp = new Float32Array(COUNT * 3);
    galaxy(tmp); shapes[0].set(tmp);
    letter('C', tmp); shapes[1].set(tmp);
    letter('A', tmp); shapes[2].set(tmp);
    letter('S', tmp); shapes[3].set(tmp);
    field(tmp); shapes[4].set(tmp);

    var rnd = new Float32Array(TOTAL * 4);
    for (var i = 0; i < TOTAL; i++) {
      var o = i * 4;
      // random direction for the "burst" between shapes
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      rnd[o] = Math.sin(ph) * Math.cos(th);
      rnd[o + 1] = Math.sin(ph) * Math.sin(th);
      rnd[o + 2] = Math.cos(ph);
      rnd[o + 3] = Math.random();
    }
    for (var j = COUNT; j < TOTAL; j++) {                        // far background stars
      var sx = (Math.random() * 2 - 1) * 26, sy = (Math.random() * 2 - 1) * 15, sz = -14 - Math.random() * 10;
      for (var k = 0; k < 5; k++) { shapes[k][j * 3] = sx; shapes[k][j * 3 + 1] = sy; shapes[k][j * 3 + 2] = sz; }
      rnd[j * 4 + 3] = -1;
    }
    for (var n = 0; n < 5; n++) buffer('aP' + n, shapes[n], 3);
    buffer('aRnd', rnd, 4);
  }

  /* ---------- uniforms ---------- */
  var U = {};
  ['uProj', 'uView', 'uTime', 'uMorph', 'uMouse', 'uMouseOn', 'uPR', 'uSize', 'uMotion', 'uC', 'uA', 'uS', 'uV', 'uOpacity'].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });
  gl.uniform3f(U.uC, 1.0, 0.31, 0.85);
  gl.uniform3f(U.uA, 1.0, 0.71, 0.28);
  gl.uniform3f(U.uS, 0.24, 0.94, 1.0);
  gl.uniform3f(U.uV, 0.55, 0.42, 1.0);
  gl.uniform1f(U.uSize, small ? 30.0 : 34.0);
  gl.uniform1f(U.uMotion, reduce ? 0 : 1);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  var FOV = 50 * Math.PI / 180, DIST = 7;
  var pr = 1, vw = 1, vh = 1, halfH = DIST * Math.tan(FOV / 2), halfW = halfH;

  function resize() {
    pr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    vw = window.innerWidth; vh = window.innerHeight;
    canvas.width = Math.round(vw * pr);
    canvas.height = Math.round(vh * pr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    var aspect = vw / vh, f = 1 / Math.tan(FOV / 2), near = 0.1, far = 100;
    halfW = halfH * aspect;
    gl.uniformMatrix4fv(U.uProj, false, new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ]));
    gl.uniform1f(U.uPR, pr);
  }

  /* ---------- scroll choreography ---------- */
  var markers = [];
  function collect() { markers = Array.prototype.slice.call(document.querySelectorAll('[data-morph]')); }
  function num(el, attr, dflt) {
    var v = parseFloat(el.getAttribute(attr));
    return isNaN(v) ? dflt : v;
  }
  function stateOf(el) { return { m: num(el, 'data-morph', 0), x: num(el, 'data-x', 0), d: num(el, 'data-dim', 1) }; }
  function target() {
    var mid = vh / 2;
    if (!markers.length) return { m: 0, x: 0, d: 1 };
    var rects = markers.map(function (el) { return el.getBoundingClientRect(); });
    for (var i = 0; i < markers.length; i++) {
      var r = rects[i];
      if (r.top <= mid && r.bottom >= mid) return stateOf(markers[i]);
      if (r.top > mid) {
        if (i === 0) return stateOf(markers[0]);
        var a = stateOf(markers[i - 1]), b = stateOf(markers[i]);
        var gapStart = rects[i - 1].bottom, gap = Math.max(1, r.top - gapStart);
        var k = Math.min(1, Math.max(0, (mid - gapStart) / gap));
        return { m: a.m + (b.m - a.m) * k, x: a.x + (b.x - a.x) * k, d: a.d + (b.d - a.d) * k };
      }
    }
    return stateOf(markers[markers.length - 1]);
  }

  /* ---------- pointer ---------- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 };
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mouse.tx = (e.clientX / vw) * 2 - 1;
    mouse.ty = -((e.clientY / vh) * 2 - 1);
    mouse.ton = 1;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.ton = 0; });

  /* ---------- loop ---------- */
  var cur = null, last = 0, t0 = performance.now(), running = true, raf = 0;
  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    var time = (now - t0) / 1000;
    var tg = target();
    var mobile = vw < 820;
    if (mobile) { tg.x = 0; tg.d *= tg.m > 0.5 && tg.m < 3.5 ? 0.9 : 0.6; }
    if (!cur) cur = { m: tg.m, x: tg.x, d: tg.d };
    var ease = reduce ? 1 : 1 - Math.exp(-dt * 2.6);
    cur.m += (tg.m - cur.m) * ease;
    cur.x += (tg.x - cur.x) * (1 - Math.exp(-dt * 2.2));
    cur.d += (tg.d - cur.d) * (1 - Math.exp(-dt * 3));
    var me = 1 - Math.exp(-dt * 4);
    mouse.x += (mouse.tx - mouse.x) * me;
    mouse.y += (mouse.ty - mouse.y) * me;
    mouse.on += (mouse.ton - mouse.on) * me;

    var scale = mobile ? Math.min(0.72, (vw / vh) * 1.05 + 0.1) : 1;
    var ox = cur.x * halfW * 0.92, oy = 0;
    var ay = (reduce ? 0 : Math.sin(time * 0.25) * 0.12) + mouse.x * 0.28;
    var ax = -mouse.y * 0.16;
    var ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay), s = scale;
    gl.uniformMatrix4fv(U.uView, false, new Float32Array([
      s * cb, s * sa * sb, -s * ca * sb, 0,
      0, s * ca, s * sa, 0,
      s * sb, -s * sa * cb, s * ca * cb, 0,
      ox, oy, -DIST, 1
    ]));
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uMorph, cur.m);
    gl.uniform1f(U.uOpacity, cur.d);
    gl.uniform2f(U.uMouse, (mouse.x * halfW - ox) / s, (mouse.y * halfH - oy) / s);
    gl.uniform1f(U.uMouseOn, reduce ? 0 : mouse.on);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, TOTAL);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && running) { last = 0; raf = requestAnimationFrame(frame); } }

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) start();
  });
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); running = false; root.classList.add('no-webgl');
  });

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 120);
  });

  function go() {
    build();
    resize();
    collect();
    root.classList.add('scene-ready');
    start();
  }

  // Letters are sampled from the site font, so wait for it (but never longer than 1.5s).
  var fontReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('700 200px "Space Grotesk"'), new Promise(function (r) { setTimeout(r, 1500); })])
    : Promise.resolve();
  fontReady.then(go, go);

  window.CASScene = { refresh: collect, state: function () { return cur && { m: cur.m, x: cur.x, d: cur.d, target: target() }; } };
})();
