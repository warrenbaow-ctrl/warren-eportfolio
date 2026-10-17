(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Manila clock */
  const clock = $("[data-clock]");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => (clock.textContent = fmt.format(new Date()));
    tick(); setInterval(tick, 1000);
  }

  /* Copy email */
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Copied"; b.classList.add("done"); }
    catch (e) { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; }
    setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1800);
  }));


  /* Story sheets: the corner button opens the story behind each card */
  $$("[data-story]").forEach((btn) => {
    const panel = btn.closest(".panel");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !panel.classList.contains("open");
      $$(".panel.open").forEach((p) => { if (p !== panel) { p.classList.remove("open"); const b = $("[data-story]", p); b.setAttribute("aria-expanded", "false"); $("span", b).textContent = "Story"; } });
      panel.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      $("span", btn).textContent = open ? "Close" : "Story";
    });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".panel.open [data-story]").forEach((b) => b.click()); });

  /* Rail and nav follow the screen in view */
  const ids = ["boot", "overview", "work", "lead", "skills", "gallery", "contact"];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      $$("[data-rail]").forEach((li) => li.classList.toggle("on", li.dataset.rail === e.target.id));
      $$(".top nav a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
      const map = { boot: "boot", overview: "overview", work: "work", lead: "lead", skills: "lead", gallery: "contact", contact: "contact" };
      $$("[data-dock]").forEach((a) => a.classList.toggle("on", a.dataset.dock === map[e.target.id]));
    }), { rootMargin: "-45% 0px -50% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* Text decode: letters cycle through glyphs before settling */
  const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>";
  const decode = (el, dur = 900) => {
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    if (calm) { el.textContent = final; return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = final.split("").map((c, i) => (c === " " || p > i / final.length + 0.25 ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    };
    requestAnimationFrame(step);
  };

  /* Boot line types itself, then the name decodes */
  const boot = $("[data-boot]");
  const lines = ["> loading profile_", "> verifying records_", "> ready. welcome."];
  if (boot && !calm) {
    let li = 0;
    const type = () => {
      const txt = lines[li]; let i = 0;
      const t = setInterval(() => { boot.textContent = txt.slice(0, ++i); if (i >= txt.length) { clearInterval(t); if (++li < lines.length) setTimeout(type, 260); } }, 28);
    };
    type();
  } else if (boot) boot.textContent = lines[2];
  $$("[data-scramble]").forEach((el, i) => setTimeout(() => decode(el, 1100), 250 + i * 220));

  /* Cursor ring */
  const cur = $("[data-cursor]");
  if (cur && fine && !calm) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; cur.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("on"));
    $$("a, button, .panel, .track img").forEach((el) => {
      el.addEventListener("pointerenter", () => cur.classList.toggle("big", el.matches("a, button")));
      el.addEventListener("pointerleave", () => cur.classList.remove("big"));
    });
    const loop = () => { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
  }

  /* Glass panes tilt toward the pointer and catch a glare */
  if (fine && !calm) {
    $$(".tilt").forEach((el) => {
      el.style.transition = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateZ(0)`;
        el.style.setProperty("--gx", px * 100 + "%"); el.style.setProperty("--gy", py * 100 + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }


  /* Hanging ID badge: a rope with a weight. It drops in, swings, follows a drag and flips on click. */
  const lan = $("[data-lanyard]");
  if (lan) {
    const card = $("[data-badge]", lan), path = $("[data-strap-path]", lan), edge = $("[data-strap-edge]", lan);
    // a tiny QR-like pattern for the back
    const qr = $("[data-qr]", lan);
    if (qr) { let s = 2027; qr.innerHTML = Array.from({ length: 144 }, (_, i) => { s = (s * 9301 + 49297) % 233280; const r = i % 12, c = (i / 12) | 0; const finder = (r < 3 && c < 3) || (r > 8 && c < 3) || (r < 3 && c > 8); return `<i class="${finder || s / 233280 > 0.5 ? "" : "o"}"></i>`; }).join(""); }

    let A = { x: 0, y: 0 }, L = 300, W = 300;
    const p = { x: 0, y: 0 }, prev = { x: 0, y: 0 };
    let drag = null, ang = 0, angV = 0, moved = 0;
    const layout = () => {
      const r = lan.getBoundingClientRect();
      W = card.offsetWidth;
      A = { x: r.width * (innerWidth < 860 ? 0.5 : 0.56), y: innerWidth < 860 ? -8 : -40 };
      L = innerWidth < 860 ? 90 : Math.max(200, Math.min(r.height * 0.36, 300));
    };
    layout();
    // start above the screen with a little sideways push so it lands with a swing
    p.x = A.x + 60; p.y = A.y - 260; prev.x = p.x - 6; prev.y = p.y;
    if (calm) { p.x = A.x; p.y = A.y + L; prev.x = p.x; prev.y = p.y; }
    addEventListener("resize", () => { layout(); });

    const local = (e) => { const r = lan.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    card.addEventListener("pointerdown", (e) => {
      const q = local(e); drag = { dx: p.x - q.x, dy: p.y - q.y, x: q.x, y: q.y }; moved = 0;
      card.setPointerCapture(e.pointerId);
    });
    card.addEventListener("pointermove", (e) => { if (!drag) return; const q = local(e); moved += Math.abs(q.x - drag.x) + Math.abs(q.y - drag.y); drag.x = q.x; drag.y = q.y; });
    const release = () => { if (drag && moved < 6) card.classList.toggle("flipped"); drag = null; };
    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", () => (drag = null));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("flipped"); } });

    let last = performance.now();
    const step = (now) => {
      requestAnimationFrame(step);
      const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
      if (drag) {
        const tx = drag.x + drag.dx, ty = drag.y + drag.dy;
        prev.x = p.x; prev.y = p.y;
        p.x += (tx - p.x) * 0.35; p.y += (ty - p.y) * 0.35;
      } else if (!calm) {
        const vx = (p.x - prev.x) * 0.975, vy = (p.y - prev.y) * 0.975;
        prev.x = p.x; prev.y = p.y;
        p.x += vx; p.y += vy + 2400 * dt * dt;
      }
      // the strap does not stretch past its length
      let dx = p.x - A.x, dy = p.y - A.y, d = Math.hypot(dx, dy);
      if (d > L) { const k = L / d; p.x = A.x + dx * k; p.y = A.y + dy * k; dx = p.x - A.x; dy = p.y - A.y; d = L; }
      // card leans along the strap, with a little lag so it swings
      const target = -Math.atan2(dx, Math.max(1, dy));
      angV += (target - ang) * 0.18; angV *= 0.78; ang += angV;
      const vx = p.x - prev.x;
      card.style.transform = `translate(${p.x - W / 2}px, ${p.y}px) rotate(${ang}rad) rotateY(${Math.max(-25, Math.min(25, vx * 1.6))}deg)`;
      // strap: straight when taut, sags when slack
      const slack = Math.max(0, L - d);
      const mx = (A.x + p.x) / 2 + slack * 0.25, my = (A.y + p.y) / 2 + slack * 0.6;
      const dpath = `M${A.x},${A.y} Q${mx},${my} ${p.x},${p.y - 10}`;
      path.setAttribute("d", dpath); edge.setAttribute("d", dpath);
    };
    requestAnimationFrame(step);
  }

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || calm) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Hero */
  gsap.from(".lede, .cta-row", { y: 24, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1, delay: 0.9 });
  gsap.from(".top", { y: -30, opacity: 0, duration: 1, ease: "expo.out", delay: 0.2 });

  /* Section headings decode as they arrive */
  $$("[data-scramble-h]").forEach((h) => ScrollTrigger.create({ trigger: h, start: "top 85%", once: true, onEnter: () => decode(h, 800) }));

  /* Panels assemble: rise, unblur, stagger per dashboard */
  $$(".dash, .console").forEach((d) => {
    const items = d.classList.contains("console") ? [d] : $$(".panel", d);
    gsap.from(items, { y: 50, opacity: 0, filter: "blur(10px)", duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: d, start: "top 80%" }, clearProps: "filter" });
  });

  /* Counters */
  $$("[data-count]").forEach((b) => {
    const to = parseFloat(b.dataset.count), dec = +(b.dataset.dec || 0), pre = b.dataset.prefix || "", suf = b.dataset.suffix || "";
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: b, start: "top 88%" },
      onUpdate: () => (b.textContent = pre + o.v.toFixed(dec) + suf), onStart: () => (b.textContent = pre + (0).toFixed(dec) + suf) });
  });

  /* Gauge, bars, gantt and funnel draw in */
  $$("[data-gauge]").forEach((g) => gsap.fromTo(g, { strokeDashoffset: 100 }, { strokeDashoffset: 100 - +g.dataset.gauge, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: g, start: "top 85%" } }));
  gsap.from(".g-bar, .g-dot", { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: "[data-gantt]", start: "top 80%" } });
  gsap.from(".g-now", { scaleY: 0, transformOrigin: "top", duration: 1, ease: "expo.out", delay: 0.6, scrollTrigger: { trigger: "[data-gantt]", start: "top 80%" } });
  gsap.from(".cm-bar i", { scaleX: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".case-meter", start: "top 90%" } });
  gsap.from(".f-bar", { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".funnel", start: "top 85%" } });
  $$(".bars i, .lang i").forEach((i) => gsap.from(i, { "--k": 0, clipPath: "inset(0 100% 0 0)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: i, start: "top 90%" } }));

  /* Photo reels: endless side-to-side slide that speeds up with scrolling */
  $$("[data-reel]").forEach((reel) => {
    const track = $(".track", reel);
    track.innerHTML += track.innerHTML; // duplicate for a seamless loop
    const dir = reel.classList.contains("reverse") ? 1 : -1;
    const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: reel.classList.contains("slow") ? 70 : dir < 0 ? 55 : 62, ease: "none", repeat: -1 });
    track.querySelectorAll("img").forEach((im, i) => { if (i >= track.children.length / 2) { im.alt = ""; im.setAttribute("aria-hidden", "true"); } im.loading = "eager"; });
    ScrollTrigger.create({ trigger: reel, start: "top bottom", end: "bottom top", onUpdate: (s) => {
      const v = Math.min(4, 1 + Math.abs(s.getVelocity()) / 600);
      gsap.to(tween, { timeScale: v, duration: 0.2, overwrite: true, onComplete: () => gsap.to(tween, { timeScale: 1, duration: 1.2 }) });
    } });
    reel.addEventListener("pointerenter", () => gsap.to(tween, { timeScale: 0.2, duration: 0.6 }));
    reel.addEventListener("pointerleave", () => gsap.to(tween, { timeScale: 1, duration: 0.6 }));
  });

  /* Magnetic buttons */
  if (fine) {
    $$(".magnetic").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.35); yTo((e.clientY - r.top - r.height / 2) * 0.45); });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* The name drifts apart slightly as the hero scrolls away */
  gsap.to(".name span:first-child", { xPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".name span:last-child", { xPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
})();
