/* The particle field: scattered dust gathers into the name, turns into a candlestick chart
   as you scroll, then loosens into a quiet starfield behind the rest of the page. */
(() => {
  "use strict";
  const canvas = document.querySelector("[data-field]");
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = () => window.innerWidth < 760;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; }
  if (!renderer.getContext()) return;
  document.documentElement.classList.add("has-field");

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 10;

  const state = { intro: calm ? 0 : 1, t1: 0, t2: 0, mouse: new T.Vector2(99, 99), mouseTarget: new T.Vector2(99, 99) };
  let points, material, geometry, viewW = 1, viewH = 1;

  // Seeded random so the layout is the same on every visit
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const viewSize = () => {
    viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    viewW = viewH * camera.aspect;
  };

  // Target A: the name, sampled from text drawn on a hidden canvas
  const sampleName = (n) => {
    const c = document.createElement("canvas");
    const twoLines = small();
    const W = 1400, H = twoLines ? 900 : 360;
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.textAlign = "center"; g.textBaseline = "middle";
    const fit = (txt, y, maxW) => {
      let size = 400;
      g.font = `800 ${size}px Unbounded, "Arial Black", sans-serif`;
      const w = g.measureText(txt).width;
      size = Math.floor(size * maxW / w);
      g.font = `800 ${size}px Unbounded, "Arial Black", sans-serif`;
      g.fillText(txt, W / 2, y);
    };
    if (twoLines) { fit("WARREN", H * 0.3, W * 0.96); fit("BAO", H * 0.72, W * 0.6); }
    else fit("WARREN BAO", H / 2, W * 0.98);
    const data = g.getImageData(0, 0, W, H).data;
    const pts = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    const spanW = viewW * (twoLines ? 0.9 : 0.88);
    const scale = spanW / W;
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = pts[Math.floor(rnd() * pts.length)] || [W / 2, H / 2];
      out[i * 3] = (p[0] - W / 2) * scale + (rnd() - 0.5) * scale * 3;
      out[i * 3 + 1] = -(p[1] - H / 2) * scale + (rnd() - 0.5) * scale * 3 + (twoLines ? 0.2 : 0.3);
      out[i * 3 + 2] = (rnd() - 0.5) * 0.25;
    }
    return out;
  };

  // Target B: a candlestick chart drifting upward, with a moving-average line
  const sampleChart = (n, colors) => {
    const count = small() ? 16 : 28;
    const left = small() ? -viewW * 0.42 : -viewW * 0.1, right = viewW * 0.44;
    const bottom = small() ? -viewH * 0.1 : -viewH * 0.22, top = small() ? viewH * 0.24 : viewH * 0.3;
    let level = 0.3; const candles = [];
    for (let i = 0; i < count; i++) {
      const o = level, c = Math.min(0.95, Math.max(0.05, level + (rnd() - 0.42) * 0.16));
      const hi = Math.max(o, c) + rnd() * 0.06, lo = Math.min(o, c) - rnd() * 0.06;
      candles.push({ o, c, hi, lo }); level = c + 0.012;
    }
    const step = (right - left) / count, bw = step * 0.56;
    const y = (v) => bottom + v * (top - bottom);
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = rnd();
      const k = Math.floor(rnd() * count), cd = candles[k];
      const cx = left + step * (k + 0.5);
      let px, py, up = cd.c >= cd.o;
      if (r < 0.72) { // body
        px = cx + (rnd() - 0.5) * bw;
        py = y(Math.min(cd.o, cd.c)) + rnd() * Math.max(0.03, Math.abs(y(cd.c) - y(cd.o)));
      } else if (r < 0.86) { // wick
        px = cx + (rnd() - 0.5) * 0.02;
        py = y(cd.lo) + rnd() * (y(cd.hi) - y(cd.lo));
      } else { // trend line through the closes
        const t = rnd() * (count - 1), a = Math.floor(t), f = t - a;
        const v = candles[a].c * (1 - f) + candles[Math.min(count - 1, a + 1)].c * f;
        px = left + step * (t + 0.5); py = y(v) + 0.25 + (rnd() - 0.5) * 0.03; up = null;
      }
      out[i * 3] = px; out[i * 3 + 1] = py; out[i * 3 + 2] = (rnd() - 0.5) * 0.2;
      colors[i] = up === null ? 1 : up ? 0.75 : 0.0; // 1 = gold line, 0.75 = light, 0 = dim
    }
    return out;
  };

  // Target C: a loose starfield that sits behind the rest of the page
  const sampleStars = (n) => {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      out[i * 3] = (rnd() - 0.5) * viewW * 1.4;
      out[i * 3 + 1] = (rnd() - 0.5) * viewH * 1.4;
      out[i * 3 + 2] = (rnd() - 0.5) * 6 - 1;
    }
    return out;
  };

  const vert = `
    attribute vec3 aA; attribute vec3 aB; attribute vec3 aC;
    attribute float aRand; attribute float aTone;
    uniform float uIntro, uT1, uT2, uTime, uPix;
    uniform vec2 uMouse;
    varying float vTone; varying float vAlpha; varying float vMix;
    float ease(float x) { return x * x * (3.0 - 2.0 * x); }
    void main() {
      float d = aRand * 0.45;
      float i0 = ease(clamp(uIntro * 1.45 - d, 0.0, 1.0));
      float e1 = ease(clamp(uT1 * 1.45 - d, 0.0, 1.0));
      float e2 = ease(clamp(uT2 * 1.45 - d, 0.0, 1.0));
      vec3 p = mix(aA, aC, i0);
      p = mix(p, aB, e1);
      p = mix(p, aC, e2);
      float swirl = 4.0 * e1 * (1.0 - e1) + 4.0 * e2 * (1.0 - e2) + 3.0 * i0 * (1.0 - i0);
      p.x += sin(uTime * 0.7 + aRand * 40.0) * (0.015 + swirl * 0.35);
      p.y += cos(uTime * 0.6 + aRand * 31.0) * (0.015 + swirl * 0.35);
      p.z += sin(uTime * 0.4 + aRand * 17.0) * (0.05 + e2 * 0.4);
      vec2 dm = p.xy - uMouse;
      float f = exp(-dot(dm, dm) * 1.6);
      p.xy += normalize(dm + 0.0001) * f * 0.55 * (1.0 - e2 * 0.6);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uPix * (1.1 + aRand * 1.6) * (10.0 / -mv.z);
      vTone = mix(step(0.9, aRand) * 1.0, aTone, e1 * (1.0 - e2));
      vMix = e2;
      vAlpha = mix(1.0, 0.32, e2) * (1.0 - i0 * 0.55);
    }`;
  const frag = `
    precision mediump float;
    varying float vTone; varying float vAlpha; varying float vMix;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float r = length(c);
      if (r > 0.5) discard;
      float soft = smoothstep(0.5, 0.0, r);
      vec3 paper = vec3(0.925, 0.933, 0.957);
      vec3 gold = vec3(0.949, 0.757, 0.306);
      vec3 dim = vec3(0.36, 0.39, 0.47);
      vec3 col = vTone > 0.9 ? gold : (vTone > 0.5 ? paper : dim);
      gl_FragColor = vec4(col, soft * vAlpha);
    }`;

  const build = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    viewSize();
    seed = 7;
    const n = small() ? 6000 : 14000;
    const tones = new Float32Array(n);
    const A = sampleName(n), B = sampleChart(n, tones), C = sampleStars(n);
    const rand = new Float32Array(n);
    for (let i = 0; i < n; i++) rand[i] = rnd();
    if (geometry) geometry.dispose();
    geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(A, 3));
    geometry.setAttribute("aA", new T.BufferAttribute(A, 3));
    geometry.setAttribute("aB", new T.BufferAttribute(B, 3));
    geometry.setAttribute("aC", new T.BufferAttribute(C, 3));
    geometry.setAttribute("aRand", new T.BufferAttribute(rand, 1));
    geometry.setAttribute("aTone", new T.BufferAttribute(tones, 1));
    if (!material) {
      material = new T.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uIntro: { value: state.intro }, uT1: { value: 0 }, uT2: { value: 0 }, uTime: { value: 0 }, uPix: { value: 2 }, uMouse: { value: state.mouse } }
      });
    }
    material.uniforms.uPix.value = (small() ? 2.4 : 2.1) * renderer.getPixelRatio();
    if (points) scene.remove(points);
    points = new T.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
  };

  const start = () => {
    build();
    let last = performance.now(), visible = true, t = 0;
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; });
    const loop = (now) => {
      requestAnimationFrame(loop);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!calm) t += dt;
      if (state.intro > 0) state.intro = Math.max(0, state.intro - dt / 2.4);
      state.mouse.lerp(state.mouseTarget, 0.12);
      const u = material.uniforms;
      u.uIntro.value = state.intro; u.uT1.value = state.t1; u.uT2.value = state.t2; u.uTime.value = t;
      points.rotation.y = Math.sin(t * 0.15) * 0.06 * (1 - state.t1) + state.t2 * Math.sin(t * 0.05) * 0.25;
      renderer.render(scene, camera);
    };
    requestAnimationFrame(loop);
  };

  window.addEventListener("pointermove", (e) => {
    state.mouseTarget.set((e.clientX / window.innerWidth - 0.5) * viewW, -(e.clientY / window.innerHeight - 0.5) * viewH);
  }, { passive: true });
  window.addEventListener("pointerleave", () => state.mouseTarget.set(99, 99));
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 200); });

  window.WBField = { set(t1, t2) { state.t1 = t1; state.t2 = t2; } };

  const ready = document.fonts && document.fonts.load ? document.fonts.load('800 100px "Unbounded"') : Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(start);
})();
