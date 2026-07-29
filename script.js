// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Header shadow + scroll progress bar + parallax layers (rAF-batched)
const header = document.getElementById("header");
const progressBar = document.getElementById("progressBar");
const backToTop = document.getElementById("backToTop");
const parallaxLayers = Array.from(document.querySelectorAll(".parallax-layer"));

let scrollTicking = false;

function updateOnScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  header.classList.toggle("scrolled", scrollTop > 8);
  progressBar.style.width = progress + "%";
  backToTop.classList.toggle("visible", scrollTop > 500);

  if (!prefersReducedMotion) {
    for (const layer of parallaxLayers) {
      // move relative to the layer's own section, not total page scroll,
      // so the effect stays contained near each section instead of
      // drifting off-screen the further down the page you are
      const speed = parseFloat(layer.dataset.parallax || "0.3");
      const sectionTop = layer.parentElement.offsetTop;
      const relativeScroll = scrollTop - sectionTop;
      layer.style.transform = `translateY(${relativeScroll * (speed - 1)}px)`;
    }
  }

  scrollTicking = false;
}

function onScroll() {
  if (!scrollTicking) {
    requestAnimationFrame(updateOnScroll);
    scrollTicking = true;
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
updateOnScroll();

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// Scroll-spy: highlight active nav link
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav a");

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);
sections.forEach((section) => spyObserver.observe(section));

// Reveal-on-scroll animation
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 40, 300)}ms`;
  revealObserver.observe(el);
});

// 3D tilt + cursor-tracked glass highlight, skipped entirely for
// prefers-reduced-motion (not just visually dampened — no work attempted)
if (!prefersReducedMotion) {
  const TILT_MAX_DEG = 8;

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1

      const rotateY = (px - 0.5) * TILT_MAX_DEG * 2;
      const rotateX = (0.5 - py) * TILT_MAX_DEG * 2;

      card.classList.add("tilting");
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);

      // shadow shifts opposite the tilt so it reads as one light source
      const shadowX = -rotateY * 1.5;
      const shadowY = rotateX * 1.5;
      card.style.boxShadow = `${shadowX}px ${12 + shadowY}px 32px rgba(15, 41, 66, 0.2)`;
    });

    card.addEventListener("mouseleave", () => {
      card.classList.remove("tilting");
      card.style.transform = "";
      card.style.boxShadow = "";
    });
  });
}

// Stat count-up, triggered once when each stat scrolls into view
function animateCount(el, target, duration = 1200) {
  const startTime = performance.now();
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const numberEl = el.querySelector(".stat-number");

  function tick(now) {
    const elapsed = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
    const value = Math.round(target * eased);
    numberEl.textContent = prefix + value.toLocaleString("en-US") + suffix;
    if (elapsed < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count, 10) || 0;
        if (prefersReducedMotion) {
          const numberEl = entry.target.querySelector(".stat-number");
          numberEl.textContent =
            (entry.target.dataset.prefix || "") +
            target.toLocaleString("en-US") +
            (entry.target.dataset.suffix || "");
        } else {
          animateCount(entry.target, target);
        }
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);
document.querySelectorAll(".stat-card[data-count]").forEach((el) => {
  statObserver.observe(el);
});
