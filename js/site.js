(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Reveal once on entry; never leaves content hidden */
  const reveal = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    // A fully clipped picture reports no intersection, so its section is watched instead.
    reveal.forEach((el) => {
      if (!el.classList.contains("shutter-scroll")) { io.observe(el); return; }
      const watch = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { el.classList.add("is-in"); watch.disconnect(); }
      }, { rootMargin: "0px 0px -25% 0px" });
      watch.observe(el.parentElement);
    });
    window.addEventListener("load", () => setTimeout(() => {
      reveal.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("is-in"); });
    }, 2500));
  } else reveal.forEach((el) => el.classList.add("is-in"));

  /* Bar takes the light ink over red fields */
  const bar = $(".bar");
  const fields = $$(".case-red, .ticker, .contact, .foot");
  if (bar && "IntersectionObserver" in window) {
    const over = new Set();
    const fo = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? over.add(e.target) : over.delete(e.target)));
      bar.classList.toggle("on-field", over.size > 0);
    }, { rootMargin: "0px 0px -94% 0px" });
    fields.forEach((f) => fo.observe(f));
  }

  /* Work index: hover or focus moves the active name and swaps the frame */
  const index = $("[data-index]");
  const frame = $("[data-frame]");
  if (index && frame) {
    const links = $$("a", index);
    const set = (a) => {
      links.forEach((l) => l.setAttribute("aria-current", String(l === a)));
      $$("figure", frame).forEach((f) => f.classList.toggle("on", f.dataset.for === a.dataset.key));
    };
    links.forEach((a) => { a.addEventListener("mouseenter", () => set(a)); a.addEventListener("focus", () => set(a)); });
  }

  const peso = (v) => v >= 1e6 ? "₱" + (v / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M" : "₱" + Math.round(v / 1000) + "K";
  const press = (btns, on) => btns.forEach((b) => b.setAttribute("aria-pressed", String(b === on)));

  /* SupplyAI sample */
  const inv = $("[data-inventory]");
  if (inv) {
    const ITEMS = [
      ["Mono solar panel", "550 W", "pcs", 128, 46, 40],
      ["Hybrid inverter", "5 kW", "pcs", 7, 6, 8],
      ["Lithium battery", "5 kWh", "pcs", 9, 11, 6],
      ["PV wire", "4 mm², 100 m a roll", "wire", 1850, 420, 500],
      ["PV wire", "6 mm², 100 m a roll", "wire", 600, 900, 500],
      ["MC4 connectors", "pairs", "pairs", 340, 85, 100],
      ["Mounting rail", "2.4 m", "pcs", 210, 140, 120]
    ];
    const st = { b: "manila", u: "m" };
    const rows = $("[data-rows]", inv), foot = $("[data-foot]", inv);
    const bb = $$("[data-branch]", inv), ub = $$("[data-unit]", inv);
    const q = (unit, n) => unit === "wire"
      ? (st.u === "roll" ? (n / 100 % 1 ? (n / 100).toFixed(1) : n / 100) + " rolls" : n.toLocaleString("en-PH") + " m")
      : n.toLocaleString("en-PH") + (unit === "pairs" ? " pairs" : " pcs");
    const draw = () => {
      let low = 0;
      rows.innerHTML = ITEMS.map(([name, spec, unit, m, c, min]) => {
        const n = st.b === "manila" ? m : st.b === "cebu" ? c : m + c;
        const mn = st.b === "all" ? min * 2 : min;
        const isLow = n < mn; if (isLow) low++;
        const w = Math.min(1, n / (mn * 4)).toFixed(3);
        return `<tr class="${isLow ? "low" : ""}"><td>${name}${isLow ? '<span class="flag">Reorder</span>' : ""}<small>${spec}</small></td><td class="num">${q(unit, n)}</td><td class="lvc"><div class="lvl"><i style="transform:scaleX(${w})"></i><b></b></div></td></tr>`;
      }).join("");
      const where = st.b === "manila" ? "Manila" : st.b === "cebu" ? "Cebu" : "both branches";
      foot.textContent = low ? `${low} ${low === 1 ? "item needs" : "items need"} a reorder in ${where}. The line marks the reorder point.` : `Nothing needs a reorder in ${where}.`;
    };
    bb.forEach((b) => b.addEventListener("click", () => { st.b = b.dataset.branch; press(bb, b); draw(); }));
    ub.forEach((b) => b.addEventListener("click", () => { st.u = b.dataset.unit; press(ub, b); draw(); }));
    draw();
  }

  /* Order desk */
  const desk = $("[data-desk]");
  if (desk) {
    const st = { c: "returning", o: 450000, d: 4 };
    const cb = $$("[data-client]", desk), order = $("[data-order]", desk), disc = $("[data-disc]", desk), stamp = $("[data-stamp]", desk);
    let last = "";
    const run = () => {
      let dp = st.c === "new" ? 50 : st.c === "returning" ? 40 : 30;
      if (st.o >= 1200000) dp += 20; else if (st.o >= 600000) dp += 10;
      const cap = st.c === "recurring" ? 8 : st.c === "returning" ? 5 : 3;
      let call, tone, note, verdict;
      if (st.d > cap) {
        call = "Refer"; tone = "refer"; verdict = "Goes to management";
        note = `${st.d}% is above the ${cap}% I can approve for this buyer, so I write it up for management. The order can still move once ${dp}% is paid.`;
      } else if (dp >= 60) {
        call = "Hold"; tone = "hold"; verdict = st.d ? `I approve ${st.d}%` : "None asked";
        note = `This is a big order, so I hold it until the ${dp}% down payment comes in.`;
      } else {
        call = "Approve"; tone = "ok"; verdict = st.d ? `I approve ${st.d}%` : "None asked";
        note = `I release it to sales once the ${dp}% down payment is confirmed.`;
      }
      $("[data-o-out]", desk).textContent = peso(st.o);
      $("[data-d-out]", desk).textContent = st.d ? st.d + "%" : "None";
      stamp.textContent = call; stamp.dataset.tone = tone;
      if (last && call !== last && !calm) { stamp.classList.remove("again"); void stamp.offsetWidth; stamp.classList.add("again"); }
      last = call;
      $("[data-note]", desk).textContent = note;
      $("[data-dp]", desk).textContent = dp + "%";
      $("[data-cash]", desk).textContent = peso(st.o * dp / 100);
      $("[data-verdict]", desk).textContent = verdict;
    };
    const sync = () => { order.value = st.o; disc.value = st.d; press(cb, cb.find((b) => b.dataset.client === st.c)); run(); };
    cb.forEach((b) => b.addEventListener("click", () => { st.c = b.dataset.client; sync(); }));
    order.addEventListener("input", () => { st.o = +order.value; run(); });
    disc.addEventListener("input", () => { st.d = +disc.value; run(); });
    const P = { clean: { c: "recurring", o: 250000, d: 3 }, big: { c: "new", o: 1400000, d: 0 }, deep: { c: "returning", o: 700000, d: 12 } };
    $$("[data-preset]", desk).forEach((b) => b.addEventListener("click", () => { Object.assign(st, P[b.dataset.preset]); sync(); }));
    sync();
  }
})();
