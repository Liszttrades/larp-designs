import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { CONTACT } from "./config";
import { initServices } from "./demos";
import { initTheme } from "./theme";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- smooth scroll + anchor links ---------------- */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) Object.assign(window, { __lenis: lenis });
}
$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href")!;
    if (id === "#") return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    if (a.dataset.package) ($<HTMLSelectElement>("#f-pkg")).value = a.dataset.package;
    if (a.dataset.slot) {
      const msg = $<HTMLTextAreaElement>("#f-msg");
      if (!msg.value.trim()) msg.value = `I'd like to claim ${a.dataset.slot}.`;
    }
    lenis ? lenis.scrollTo(id, { duration: 1.3, offset: -20 }) : el.scrollIntoView();
  }),
);

/* ---------------- hero: wireframe → design → live, scrubbed by scroll ----------------
   Claude's card reports progress; the cursor picks a colour in the style panel (the design paints in),
   then presses Publish (the site goes live and the phone version slides in). */
const showcase = $("[data-showcase]");
const browser = $("[data-browser]");
const parts = $$("[data-m]");
const redlines = $("[data-redlines]");
const mgrid = $("[data-mgrid]");
const phone = $("[data-phone]");
const insp = $("[data-hp-insp]");
const swatch = $("[data-hp-sw]");
const ring = $("[data-hp-ring]");
const pub = $("[data-hp-pub]");
const cur = $<SVGElement>("[data-hp-cur]");
const stages = $$(".stages li");
const said = $$("[data-hp-s]");

let stageNow = -1;
function setStage(n: number) {
  if (n === stageNow) return;
  stageNow = n;
  stages.forEach((s, i) => s.classList.toggle("is-on", i === n));
  said.forEach((s, i) => s.classList.toggle("is-on", i === n));
  browser.classList.toggle("is-live", n === 2);
}

/** a point inside `el`, in showcase coordinates, adjusted so the cursor's tip lands on it */
function tip(el: Element, ax = 0.5, ay = 0.5) {
  const s = showcase.getBoundingClientRect(), r = el.getBoundingClientRect();
  const k = parseFloat(getComputedStyle(cur).width) / 20 || 1;
  return { x: r.left - s.left + r.width * ax - 3 * k, y: r.top - s.top + r.height * ay - 2 * k };
}

if (reduce) {
  setStage(2);
} else {
  setStage(0);
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  tl.set(cur, { x: () => tip(browser, 0.62, 0.62).x, y: () => tip(browser, 0.62, 0.62).y }, 0);
  // 0–0.14: the wireframe holds, with its grid and spacing
  tl.to({}, { duration: 0.14 });
  tl.to(redlines, { opacity: 0, duration: 0.1 }, 0.12);
  // 0.14: the style panel arrives, the cursor goes to the first colour and picks it
  tl.fromTo(insp, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.08, ease: "power3.out" }, 0.14);
  tl.to(cur, { opacity: 1, duration: 0.03 }, 0.16);
  tl.to(cur, { x: () => tip(swatch).x, y: () => tip(swatch).y, duration: 0.07 }, 0.18);
  tl.to(cur, { scale: 0.84, duration: 0.012, ease: "power2.out" }, 0.255).to(cur, { scale: 1, duration: 0.02, ease: "power2.out" }, 0.267);
  tl.to(ring, { opacity: 1, duration: 0.02 }, 0.26);
  // 0.27–0.71: each block paints from wireframe into design, top to bottom
  parts.forEach((m, i) => {
    tl.to(m.querySelector(".d"), { clipPath: "inset(0 0% 0 0)", duration: 0.2 }, 0.27 + i * 0.12);
    // its blue frame would otherwise show at the edges of the finished block
    tl.to(m.querySelector(".w"), { opacity: 0, duration: 0.04 }, 0.27 + i * 0.12 + 0.18);
  });
  tl.to(mgrid, { opacity: 0, duration: 0.12 }, 0.3);
  tl.to(cur, { x: () => tip(browser, 0.7, 0.86).x, y: () => tip(browser, 0.7, 0.86).y, duration: 0.12 }, 0.34);
  // 0.6–0.75: the cursor presses Publish; the panel steps away and the site goes live
  tl.to(cur, { x: () => tip(pub).x, y: () => tip(pub).y, duration: 0.09 }, 0.6);
  tl.to(cur, { scale: 0.84, duration: 0.012, ease: "power2.out" }, 0.705).to(cur, { scale: 1, duration: 0.02, ease: "power2.out" }, 0.717);
  tl.to(pub, { scale: 0.95, duration: 0.012 }, 0.705).to(pub, { scale: 1, duration: 0.02 }, 0.717);
  tl.to(insp, { opacity: 0, x: 16, duration: 0.06, ease: "power2.in" }, 0.745);
  tl.to(cur, { opacity: 0, duration: 0.04 }, 0.75);
  tl.to(phone, { opacity: 1, y: 0, duration: 0.14, ease: "power3.out" }, 0.76);
  tl.to({}, { duration: 0.1 });

  ScrollTrigger.create({
    trigger: "[data-hero]",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.5,
    animation: tl,
    invalidateOnRefresh: true,
    onUpdate: (self) => setStage(self.progress < 0.27 ? 0 : self.progress < 0.73 ? 1 : 2),
  });
  if (import.meta.env.DEV) Object.assign(window, { __hero: { tl, setStage } });
}

/* ---------------- theme toggle ---------------- */
initTheme();

/* ---------------- services: one sticky card, six demos ---------------- */
initServices(lenis);

/* ---------------- nav: hide on scroll down, show on scroll up ---------------- */
const nav = $("[data-nav]");
let lastY = scrollY;
addEventListener("scroll", () => {
  const y = scrollY;
  if ($("[data-menu]").hidden) nav.classList.toggle("is-hidden", y > lastY && y > 200);
  lastY = y;
}, { passive: true });

/* ---------------- mobile menu ---------------- */
const toggle = $<HTMLButtonElement>("[data-menu-toggle]");
const menu = $("[data-menu]");
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.querySelector(".sr-only")!.textContent = "Open menu";
  lenis?.start();
}
toggle.addEventListener("click", () => {
  const open = menu.hidden;
  menu.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector(".sr-only")!.textContent = open ? "Close menu" : "Open menu";
  if (open) { lenis?.stop(); menu.querySelector("a")?.focus(); } else lenis?.start();
});
addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

/* ---------------- FAQ: one answer open at a time ---------------- */
const faqs = $$<HTMLDetailsElement>(".faq details");
faqs.forEach((d) => d.addEventListener("toggle", () => { if (d.open) faqs.forEach((o) => o !== d && (o.open = false)); }));

/* ---------------- toast ---------------- */
const toast = $("[data-toast]");
let toastTimer = 0;
function say(msg: string) {
  toast.textContent = msg;
  toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 3200);
}

/* ---------------- contact links ---------------- */
const waNumber = CONTACT.whatsapp.replace(/\D/g, "");
const links: Record<string, string> = {
  email: `mailto:${CONTACT.email}?subject=${encodeURIComponent("Website project")}`,
  whatsapp: waNumber ? `https://wa.me/${waNumber}` : "",
  messenger: CONTACT.messengerPage ? `https://m.me/${CONTACT.messengerPage}` : "",
};
$$<HTMLAnchorElement>("[data-contact]").forEach((a) => {
  const href = links[a.dataset.contact!];
  if (href) a.href = href;
  else a.addEventListener("click", (e) => { e.preventDefault(); say("This contact link isn't set up yet."); });
});

/* ---------------- form: validate, then compose by email or WhatsApp ---------------- */
const form = $<HTMLFormElement>("[data-form]");
const fields = [
  { el: $<HTMLInputElement>("#f-name"), err: $("#e-name"), ok: (v: string) => v.trim().length > 1 },
  { el: $<HTMLInputElement>("#f-email"), err: $("#e-email"), ok: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  { el: $<HTMLTextAreaElement>("#f-msg"), err: $("#e-msg"), ok: (v: string) => v.trim().length > 5 },
];
fields.forEach(({ el, err }) => el.addEventListener("input", () => { err.hidden = true; el.removeAttribute("aria-invalid"); }));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const channel = ((e as SubmitEvent).submitter as HTMLButtonElement | null)?.dataset.channel ?? "email";
  let first: HTMLElement | null = null;
  for (const f of fields) {
    const bad = !f.ok(f.el.value);
    f.err.hidden = !bad;
    if (bad) { f.el.setAttribute("aria-invalid", "true"); f.el.setAttribute("aria-describedby", f.err.id); first ??= f.el; }
  }
  if (first) { first.focus(); return; }

  const data = new FormData(form);
  const body = [
    `Name: ${data.get("name")}`,
    `Business: ${data.get("business") || "-"}`,
    `Email: ${data.get("email")}`,
    `Package: ${data.get("package")}`,
    "",
    String(data.get("message")),
  ].join("\n");

  if (channel === "whatsapp") {
    if (!waNumber) { say("WhatsApp isn't set up yet. Send by email instead."); return; }
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
  } else {
    location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Website project – ${data.get("business") || data.get("name")}`)}&body=${encodeURIComponent(body)}`;
  }
  say("Your message is ready to send.");
});
