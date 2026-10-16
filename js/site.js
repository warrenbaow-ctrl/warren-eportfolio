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

  /* Rail and nav follow the screen in view */
  const ids = ["boot", "overview", "work", "lead", "skills", "gallery", "contact"];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      $$("[data-rail]").forEach((li) => li.classList.toggle("on", li.dataset.rail === e.target.id));
      $$(".top nav a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
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

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || calm) return;
  gsap.registerPlugin(ScrollTrigger);

  /* Hero */
  gsap.from(".lede, .cta-row", { y: 24, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1, delay: 0.9 });
  gsap.from(".id-card", { y: 60, rotateY: -18, opacity: 0, duration: 1.4, ease: "expo.out", delay: 0.4 });
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
  gsap.from(".f-bar", { scaleX: 0, duration: 1.2, ease: "expo.out", stagger: 0.15, scrollTrigger: { trigger: ".funnel", start: "top 85%" } });
  $$(".bars i, .lang i").forEach((i) => gsap.from(i, { "--k": 0, clipPath: "inset(0 100% 0 0)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: i, start: "top 90%" } }));

  /* Photo reels: endless side-to-side slide that speeds up with scrolling */
  $$("[data-reel]").forEach((reel) => {
    const track = $(".track", reel);
    track.innerHTML += track.innerHTML; // duplicate for a seamless loop
    const dir = reel.classList.contains("reverse") ? 1 : -1;
    const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: dir < 0 ? 40 : 46, ease: "none", repeat: -1 });
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
