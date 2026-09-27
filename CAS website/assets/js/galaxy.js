/* Spiral galaxy drawn with raw WebGL (no libraries).
   Sits behind the cover title and follows the mouse. During the first scroll
   transition main.js calls Galaxy.setWarp(0..1) (the camera flies into the
   galaxy) and Galaxy.setNight(0..1) (ink-blue dots on white turn into glowing
   stars on the blue "What is CAS?" page). */
(function () {
  'use strict';

  var canvas = document.getElementById('galaxy');
  if (!canvas) return;
  var root = document.documentElement;
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true }) ||
         canvas.getContext('experimental-webgl');
  } catch (e) { gl = null; }
  if (!gl) { root.classList.add('no-webgl'); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  var COUNT = small ? 10000 : 20000;
  var STARS = small ? 500 : 1100;
  var TOTAL = COUNT + STARS;

  var VS = [
    'attribute vec3 aPos; attribute vec4 aRnd;',
    'uniform mat4 uProj; uniform mat4 uView;',
    'uniform float uTime; uniform float uPR; uniform float uSize; uniform float uMotion; uniform float uWarp; uniform float uNight;',
    'uniform vec2 uMouse; uniform float uMouseOn;',
    'uniform vec3 uCore; uniform vec3 uMid; uniform vec3 uOuter; uniform vec3 uEdge; uniform vec3 uStar;',
    'varying vec3 vColor; varying float vAlpha;',
    'vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }',
    'vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }',
    'vec3 rotZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }',
    'void main(){',
    '  vec3 p; vec3 col; float size;',
    '  float tw = 0.7 + 0.3 * sin(uTime * (1.1 + aRnd.y) + aRnd.x * 37.0);',
    '  if (aRnd.w < 0.0) {',
    '    p = aPos;',
    '    col = uStar;',
    '    size = 0.55 + 0.5 * abs(aRnd.z);',
    '    vAlpha = tw * 0.55;',
    '  } else {',
    '    float r = length(aPos.xz);',
    '    p = rotY(aPos, uTime * 0.055 * uMotion + uWarp * 1.4);',
    '    p = rotZ(rotX(p, 1.08), 0.32);',
    '    p += aRnd.xyz * uWarp * uWarp * (1.2 + 2.4 * aRnd.w);',
    '    p += 0.03 * uMotion * vec3(sin(uTime*0.7 + aRnd.x*6.28), cos(uTime*0.6 + aRnd.y*6.28), sin(uTime*0.5 + aRnd.z*6.28));',
    '    vec2 d = p.xy - uMouse;',
    '    float dist = length(d);',
    '    float push = uMouseOn * (1.0 - smoothstep(0.0, 1.4, dist));',
    '    p.xy += (d / (dist + 0.0001)) * push * 0.5;',
    '    p.z += push * 0.7;',
    '    col = mix(uCore, uMid, smoothstep(0.0, 1.0, r));',
    '    col = mix(col, uOuter, smoothstep(0.9, 2.3, r));',
    '    col = mix(col, uEdge, smoothstep(2.1, 3.6, r) * (0.55 + 0.45 * aRnd.x));',
    '    col = mix(col, uStar, step(0.93, aRnd.y) * 0.6);',
    '    size = 0.45 + aRnd.w * 1.15;',
    '    vAlpha = mix(0.9, tw, 0.5);',
    '    float thr = mix(1.05, 0.22, uNight);',
    '    vAlpha *= max(1.0 - smoothstep(thr - 0.06, thr, aRnd.w), step(0.985, aRnd.w) * uNight);',
    '  }',
    '  vec4 mv = uView * vec4(p, 1.0);',
    '  gl_Position = uProj * mv;',
    '  float px = uSize * size * uPR / max(0.4, -mv.z);',
    '  gl_PointSize = min(px, 40.0 * uPR);',
    '  vAlpha *= 1.0 - 0.8 * smoothstep(7.0 * uPR, 34.0 * uPR, px);',
    '  vColor = col;',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'varying vec3 vColor; varying float vAlpha;',
    'uniform float uOpacity; uniform float uAdd;',
    'void main(){',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = 1.0 - smoothstep(0.0, 0.5, d);',
    '  a = a * a * 0.7 + 0.75 * (1.0 - smoothstep(0.12, 0.26, d));',
    '  a = clamp(a * vAlpha * uOpacity, 0.0, 1.0);',
    '  gl_FragColor = vec4(vColor * a, a * (1.0 - uAdd));',
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
    if (window.console) console.warn('[galaxy] WebGL disabled:', err);
    root.classList.add('no-webgl');
    return;
  }
  gl.useProgram(prog);

  /* ---------- geometry ---------- */
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  var pos = new Float32Array(TOTAL * 3);
  var rnd = new Float32Array(TOTAL * 4);
  for (var i = 0; i < COUNT; i++) {
    var o = i * 3, x, y, z;
    if (Math.random() < 0.12) {                                   // core
      var rc = Math.abs(gauss()) * 0.3, ac = Math.random() * Math.PI * 2;
      x = Math.cos(ac) * rc; z = Math.sin(ac) * rc; y = gauss() * 0.1;
    } else {                                                      // three spiral arms
      var r = Math.pow(Math.random(), 1.25) * 3.6 + 0.15;
      var branch = (i % 3) / 3 * Math.PI * 2;
      var spin = r * 1.35;
      var spread = 0.06 + r * 0.075;
      x = Math.cos(branch + spin) * r + gauss() * spread;
      z = Math.sin(branch + spin) * r + gauss() * spread;
      y = gauss() * 0.08 * (1.6 - r / 3.6);
    }
    pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
  }
  for (var k = 0; k < TOTAL; k++) {
    var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), q = k * 4;
    rnd[q] = Math.sin(ph) * Math.cos(th);
    rnd[q + 1] = Math.sin(ph) * Math.sin(th);
    rnd[q + 2] = Math.cos(ph);
    rnd[q + 3] = k < COUNT ? Math.random() : -1;
    if (k >= COUNT) {                                              // scattered background dust
      pos[k * 3] = (Math.random() * 2 - 1) * 16;
      pos[k * 3 + 1] = (Math.random() * 2 - 1) * 10;
      pos[k * 3 + 2] = -6 - Math.random() * 8;
    }
  }
  function attr(name, arr, size) {
    var loc = gl.getAttribLocation(prog, name);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  attr('aPos', pos, 3);
  attr('aRnd', rnd, 4);

  /* ---------- uniforms & colours ---------- */
  var U = {};
  ['uProj', 'uView', 'uTime', 'uPR', 'uSize', 'uMotion', 'uWarp', 'uNight', 'uMouse', 'uMouseOn', 'uCore', 'uMid', 'uOuter', 'uEdge', 'uStar', 'uOpacity', 'uAdd'].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  var KEYS = ['core', 'mid', 'outer', 'edge', 'star'];
  var UNI = { core: 'uCore', mid: 'uMid', outer: 'uOuter', edge: 'uEdge', star: 'uStar' };
  // day: ink blues on the white cover · night: glowing stars on the blue page
  var DAY = { core: '#1e3a8a', mid: '#2563eb', outer: '#3b82f6', edge: '#60a5fa', star: '#93c5fd' };
  var NIGHT = { core: '#ffffff', mid: '#e3eeff', outer: '#b4cfff', edge: '#d6e6ff', star: '#e6f0ff' };
  KEYS.forEach(function (k) { DAY[k] = rgb(DAY[k]); NIGHT[k] = rgb(NIGHT[k]); });
  var lastNight = -1;
  function applyNight(n) {
    if (Math.abs(n - lastNight) < 0.001) return;
    lastNight = n;
    KEYS.forEach(function (k) {
      var a = DAY[k], b = NIGHT[k];
      gl.uniform3f(U[UNI[k]], a[0] + (b[0] - a[0]) * n, a[1] + (b[1] - a[1]) * n, a[2] + (b[2] - a[2]) * n);
    });
    gl.uniform1f(U.uOpacity, 1.5 - 0.8 * n);
    gl.uniform1f(U.uAdd, 0.85 * n);
    gl.uniform1f(U.uNight, n);
  }
  gl.uniform1f(U.uSize, small ? 36 : 42);
  gl.uniform1f(U.uMotion, reduce ? 0 : 1);
  applyNight(0);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);                 // premultiplied; uAdd makes it glow additively
  gl.clearColor(0, 0, 0, 0);

  var FOV = 50 * Math.PI / 180, DIST = 7.2;
  var pr = 1, vw = 1, vh = 1, halfH = 1, halfW = 1;
  function resize() {
    pr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(vw * pr);
    canvas.height = Math.round(vh * pr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    var aspect = vw / vh, f = 1 / Math.tan(FOV / 2), near = 0.05, far = 100;
    halfH = DIST * Math.tan(FOV / 2); halfW = halfH * aspect;
    gl.uniformMatrix4fv(U.uProj, false, new Float32Array([
      f / aspect, 0, 0, 0, 0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ]));
    gl.uniform1f(U.uPR, pr);
  }

  /* ---------- pointer ---------- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 };
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    mouse.ton = 1;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.ton = 0; });

  /* ---------- loop ---------- */
  var warp = 0, warpTarget = 0, night = 0, nightTarget = 0, visible = true, running = !document.hidden, raf = 0, last = 0, t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (!running || !visible) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    var time = (now - t0) / 1000;
    warp += (warpTarget - warp) * (reduce ? 1 : 1 - Math.exp(-dt * 8));
    night += (nightTarget - night) * (reduce ? 1 : 1 - Math.exp(-dt * 8));
    applyNight(night);
    var me = 1 - Math.exp(-dt * 4);
    mouse.x += (mouse.tx - mouse.x) * me;
    mouse.y += (mouse.ty - mouse.y) * me;
    mouse.on += (mouse.ton - mouse.on) * me;

    var s = vw < 760 ? 0.78 : 1;
    var dist = DIST - 5.4 * Math.pow(warp, 1.6);                  // camera flies into the galaxy
    var ay = mouse.x * 0.22 + (reduce ? 0 : Math.sin(time * 0.2) * 0.08);
    var ax = -mouse.y * 0.14;
    var ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay);
    gl.uniformMatrix4fv(U.uView, false, new Float32Array([
      s * cb, s * sa * sb, -s * ca * sb, 0,
      0, s * ca, s * sa, 0,
      s * sb, -s * sa * cb, s * ca * cb, 0,
      0, 0, -dist, 1
    ]));
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uWarp, warp);
    gl.uniform2f(U.uMouse, (mouse.x * halfW) / s, (mouse.y * halfH) / s);
    gl.uniform1f(U.uMouseOn, reduce ? 0 : mouse.on * (1 - warp));
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, TOTAL);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && running && visible) { last = 0; raf = requestAnimationFrame(frame); } }

  document.addEventListener('visibilitychange', function () { running = !document.hidden; start(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; root.classList.add('no-webgl'); });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });

  resize();
  root.classList.add('galaxy-ready');
  start();

  window.Galaxy = {
    setWarp: function (v) { warpTarget = v; },
    setNight: function (v) { nightTarget = v; },
    setVisible: function (v) { if (v !== visible) { visible = v; start(); } }
  };
})();
