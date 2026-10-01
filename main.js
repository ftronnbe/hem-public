// Husfrid — scroll effects. Everything degrades to a plain page without JavaScript or with
// reduced motion.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Dish photos for the strip, twice over so the loop has no seam.
for (const row of document.querySelectorAll("[data-dishes]")) {
  const names = row.dataset.dishes.split(" ");
  for (const name of [...names, ...names]) {
    const picture = document.createElement("picture");
    picture.innerHTML = `<source srcset="img/dishes/${name}.avif" type="image/avif">` +
      `<img src="img/dishes/${name}.jpg" alt="" loading="lazy" decoding="async" width="220" height="160">`;
    row.append(picture);
  }
}

// Fade things in as they arrive.
const reveal = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); }
}, { rootMargin: "0px 0px -10% 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

// The statement: one span per word; *word* is a highlight.
const statement = document.querySelector("[data-words]");
const words = [];
if (statement) {
  statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => {
    const hl = w.startsWith("*");
    return `<span class="w${hl ? " hl" : ""}">${w.replaceAll("*", "")}</span>`;
  }).join(" ");
  words.push(...statement.querySelectorAll(".w"));
}

// The story: the step in the middle of the screen picks the phone's screen and the light.
const steps = [...document.querySelectorAll(".step")];
const screens = [...document.querySelectorAll(".story-phone .screens > *")];
const toneObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const i = steps.indexOf(e.target);
    steps.forEach((s, j) => s.classList.toggle("active", j === i));
    screens.forEach((s, j) => s.classList.toggle("active", j === i));
    document.body.dataset.tone = e.target.dataset.tone;
  }
}, { rootMargin: "-45% 0px -45% 0px" });
steps.forEach((s) => toneObserver.observe(s));
// Back to warm above and below the story.
const warm = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) document.body.dataset.tone = "warm";
}, { rootMargin: "-45% 0px -45% 0px" });
document.querySelectorAll(".hero, .split, .values, .closing").forEach((s) => warm.observe(s));

// The hero's three phones fan out, then fold together as you scroll; the pointer tilts them.
const left = document.querySelector(".stage .left");
const right = document.querySelector(".stage .right");
const center = document.querySelector(".stage .center");
const bar = document.querySelector(".nav .progress");
let tiltX = 0, tiltY = 0;

function frame() {
  const y = scrollY;
  const vh = innerHeight;
  const p = Math.min(1, Math.max(0, y / (vh * 0.9)));
  const spread = innerWidth < 900 ? 0.62 : innerWidth < 1240 ? 0.72 : 1;
  if (center) {
    const lift = reduced ? 0 : p;
    center.style.transform = `translate(-50%, -50%) translateY(${-lift * 40}px) rotateX(${tiltY * 6}deg) rotateY(${tiltX * 8}deg)`;
    left.style.transform = `translate(-50%, -50%) translateX(${(-58 + lift * 30) * spread}%) translateY(${4 + lift * 10}%) rotate(${-9 + lift * 6}deg) scale(.86) rotateY(${tiltX * 8}deg)`;
    right.style.transform = `translate(-50%, -50%) translateX(${(58 - lift * 30) * spread}%) translateY(${4 + lift * 10}%) rotate(${9 - lift * 6}deg) scale(.86) rotateY(${tiltX * 8}deg)`;
  }
  if (bar) {
    const max = document.documentElement.scrollHeight - vh;
    bar.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
  }
  // Words light up once they pass 60% of the screen height.
  for (const w of words) w.classList.toggle("on", reduced || w.getBoundingClientRect().top < vh * 0.6);
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; frame(); });
}
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule);
if (!reduced && matchMedia("(pointer: fine)").matches) {
  addEventListener("pointermove", (e) => {
    tiltX = (e.clientX / innerWidth - 0.5) * 2;
    tiltY = -(e.clientY / innerHeight - 0.5) * 2;
    schedule();
  }, { passive: true });
}
frame();
