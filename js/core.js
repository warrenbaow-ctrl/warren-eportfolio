/* The core: a slowly turning wireframe polyhedron with signal-orange nodes and two orbit rings.
   It sits behind the glass, follows the mouse a little and turns faster as you scroll. */
(() => {
  "use strict";
  const canvas = document.querySelector("[data-core]");
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  if (!renderer.getContext()) return;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 9;
  const rig = new T.Group(); scene.add(rig);

  const ink = new T.Color("#0e1525"), signal = new T.Color("#ff5b1f");

  // Outer shell: icosahedron edges
  const ico = new T.IcosahedronGeometry(2.2, 1);
  const shell = new T.LineSegments(new T.EdgesGeometry(ico), new T.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.22 }));
  rig.add(shell);
  // Inner core: denser, counter-rotating
  const inner = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(1.25, 0)), new T.LineBasicMaterial({ color: signal, transparent: true, opacity: 0.55 }));
  rig.add(inner);
  // Nodes on the shell vertices
  const pos = ico.attributes.position;
  const seen = new Set(), nodes = [];
  for (let i = 0; i < pos.count; i++) {
    const k = [pos.getX(i), pos.getY(i), pos.getZ(i)].map((v) => v.toFixed(3)).join(",");
    if (!seen.has(k)) { seen.add(k); nodes.push(pos.getX(i), pos.getY(i), pos.getZ(i)); }
  }
  const nodeGeo = new T.BufferGeometry();
  nodeGeo.setAttribute("position", new T.Float32BufferAttribute(nodes, 3));
  const dots = new T.Points(nodeGeo, new T.PointsMaterial({ color: signal, size: 0.09, sizeAttenuation: true }));
  rig.add(dots);
  // Orbit rings with a travelling marker
  const ring = (r, tilt) => {
    const pts = [];
    for (let i = 0; i <= 160; i++) { const a = (i / 160) * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    const line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: ink, transparent: true, opacity: 0.25, dashSize: 0.12, gapSize: 0.1 }));
    line.computeLineDistances();
    const g = new T.Group(); g.add(line); g.rotation.set(tilt[0], tilt[1], 0);
    const m = new T.Mesh(new T.SphereGeometry(0.07, 12, 12), new T.MeshBasicMaterial({ color: signal }));
    g.add(m); rig.add(g);
    return { g, m, r };
  };
  const rings = [ring(3.1, [1.2, 0.3]), ring(3.6, [-0.9, -0.5])];
  // Dust
  const dust = new Float32Array(600 * 3);
  for (let i = 0; i < dust.length; i++) dust[i] = (Math.random() - 0.5) * 16;
  const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(dust, 3));
  scene.add(new T.Points(dg, new T.PointsMaterial({ color: ink, size: 0.025, transparent: true, opacity: 0.35 })));

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollP = 0, speed = 0;
  window.addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  let lastY = scrollY;
  window.addEventListener("scroll", () => { speed += Math.abs(scrollY - lastY) * 0.002; lastY = scrollY; }, { passive: true });

  const size = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  };
  size(); addEventListener("resize", size);

  let t = 0, last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!calm) t += dt;
    speed *= 0.92;
    mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    scrollP += (scrollY / max - scrollP) * 0.08;
    const narrow = innerWidth < 860;
    // Sits right of the name in the hero, drifts to the centre and shrinks behind the dashboards
    const heroX = narrow ? 0.9 : 2.6;
    const k = Math.min(1, scrollP * 6);
    rig.position.x = heroX * (1 - k) + Math.sin(scrollP * 6.2) * 1.4 * k;
    rig.position.y = (narrow ? 1.6 : 0.2) * (1 - k) - 0.2 * k;
    rig.scale.setScalar((narrow ? 0.7 : 1) * (1 - k * 0.15));
    const spin = 0.12 + speed;
    shell.rotation.y += dt * spin; shell.rotation.x += dt * spin * 0.4;
    inner.rotation.y -= dt * spin * 1.6; inner.rotation.z += dt * spin * 0.8;
    dots.rotation.copy(shell.rotation);
    rings.forEach((o, i) => { const a = t * (0.6 + i * 0.3) * (i ? -1 : 1); o.m.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0); o.g.rotation.z += dt * 0.05; });
    rig.rotation.x = mouse.y * 0.5; rig.rotation.y = mouse.x * 0.7;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);
})();
