(() => {
  "use strict";
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) return; // page still reads fine without motion
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll, driven by GSAP's clock so the field and the text move together */
  if (Lenis && !calm) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { duration: 1.4 }); }
    }));
  }

  /* Split text into words that rise from a mask */
  $$("[data-split]").forEach((el) => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((line) => line.trim().split(/\s+/).map((w) => `<span class="w-mask"><span class="w">${w}</span></span>`).join(" ")).join("<br>");
  });
  const style = document.createElement("style");
  style.textContent = ".w-mask{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em}.w{display:inline-block}";
  document.head.appendChild(style);

  if (calm) { if (window.WBField) window.WBField.set(0, 0); return; }

  /* Field: name to chart to stars, tied to scroll */
  const field = { t1: 0, t2: 0 };
  const push = () => window.WBField && window.WBField.set(field.t1, field.t2);
  gsap.to(field, { t1: 1, ease: "none", onUpdate: push, scrollTrigger: { trigger: "[data-chart-scene]", start: "top 85%", end: "top -20%", scrub: 0.6 } });
  gsap.to(field, { t2: 1, ease: "none", onUpdate: push, scrollTrigger: { trigger: "[data-chart-scene]", start: "bottom 95%", end: "bottom 15%", scrub: 0.6 } });

  /* Hero line arrives after the particles gather */
  gsap.from(".hero-foot .w", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.04, delay: 1.6 });
  gsap.from(".scroll-hint", { opacity: 0, duration: 1, delay: 2.2 });
  gsap.from(".bar > *", { y: -14, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, delay: 1.3 });
  gsap.to(".hero-foot", { opacity: 0, y: -30, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 40%", scrub: true } });

  /* Words rise as each heading arrives */
  $$("[data-split]").forEach((el) => {
    if (el.closest(".hero")) return;
    gsap.from($$(".w", el), { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.035, scrollTrigger: { trigger: el, start: "top 82%" } });
  });

  /* Chart scene: stats arrive once the chart has formed, numbers count up */
  gsap.from(".stats li", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: "[data-chart-scene]", start: "top -10%" } });
  $$("[data-count]").forEach((b) => {
    const to = +b.dataset.count, from = +(b.dataset.from || 0), pre = b.dataset.prefix || "", suf = b.dataset.suffix || "";
    const o = { v: from };
    b.textContent = pre + from + suf;
    gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: () => (b.textContent = pre + Math.round(o.v) + suf), scrollTrigger: { trigger: "[data-chart-scene]", start: "top -10%" } });
  });

  /* Pictures open from a mask, then drift inside their frame */
  $$("[data-pic]").forEach((fig) => {
    const img = fig.querySelector("img");
    gsap.fromTo(fig, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: fig, start: "top 85%" } });
    gsap.fromTo(img, { yPercent: -8, scale: 1.15 }, { yPercent: 0, scale: 1, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$(".item-text .when, .item-text .one, .who-text .one, .contact-kicker, .links li").forEach((el) => {
    gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });
  gsap.from(".talk", { scale: 0.85, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 70%" } });

  /* Magnetic buttons */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".magnetic").forEach((el) => {
      const inner = el.querySelector("span") || el;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.3); yTo(dy * 0.35);
        if (inner !== el) gsap.to(inner, { x: dx * 0.12, y: dy * 0.12, duration: 0.4 });
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); if (inner !== el) gsap.to(inner, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }); });
    });
  }
})();
