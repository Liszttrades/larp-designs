/* Six looping faux-UI demos for the services tiles.
   Each stage gets one GSAP timeline that plays only while the tile is on screen.
   Positions are measured from the live layout (function values), and re-measured on resize.
   Reduced motion: every timeline is parked on its "poster" label (the payoff frame). */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./demos.css";

type TL = gsap.core.Timeline;
type Pt = { x: number; y: number };

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const q = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector(s) as T;
const qa = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll(s)) as T[];

/** point inside `el`, in stage coordinates */
function at(stage: HTMLElement, el: Element, ax = 0.5, ay = 0.5): Pt {
  const s = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left - s.left + r.width * ax, y: r.top - s.top + r.height * ay };
}

/** cursor helpers bound to one stage */
function pointer(stage: HTMLElement) {
  const cur = q<SVGElement>(stage, ".dm-cur");
  const ring = document.createElement("span");
  ring.className = "dm-ring";
  stage.appendChild(ring);
  // the arrow's tip sits at (3, 2) of its 20-unit viewBox; the cursor is sized in em, so scale the offset
  const k = () => parseFloat(getComputedStyle(cur).width) / 20 || 1;
  const tip = (p: () => Pt) => ({ x: () => p().x - 3 * k(), y: () => p().y - 2 * k() });
  return {
    cur,
    place(tl: TL, p: () => Pt, t: number) { tl.set(cur, tip(p), t); },
    show(tl: TL, t: number, on = true) { tl.to(cur, { opacity: on ? 1 : 0, duration: 0.25 }, t); },
    move(tl: TL, p: () => Pt, t: number, d = 0.75) { tl.to(cur, { ...tip(p), duration: d, ease: "power2.inOut" }, t); },
    click(tl: TL, p: () => Pt, t: number) {
      tl.to(cur, { scale: 0.84, duration: 0.08, ease: "power2.out" }, t)
        .to(cur, { scale: 1, duration: 0.2, ease: "power2.out" }, t + 0.08)
        .fromTo(ring, { x: () => p().x, y: () => p().y, scale: 0.4, opacity: 0.85 }, { scale: 1.35, opacity: 0, duration: 0.45, ease: "power2.out" }, t);
    },
  };
}

/** type `text` into `el` at `cps` characters a second */
function typeIn(tl: TL, el: HTMLElement, text: string, t: number, cps = 22) {
  const o = { n: 0 };
  tl.set(o, { n: 0 }, t).to(o, { n: text.length, duration: text.length / cps, ease: "none", onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); } }, t);
  return t + text.length / cps;
}

/** stream `text` into `el` word by word */
function streamIn(tl: TL, el: HTMLElement, text: string, t: number, wps = 9) {
  const words = text.split(" ");
  const o = { n: 0 };
  tl.set(o, { n: 0 }, t).to(o, { n: words.length, duration: words.length / wps, ease: "none", onUpdate: () => { el.textContent = words.slice(0, Math.round(o.n)).join(" "); } }, t);
  return t + words.length / wps;
}

const setText = (tl: TL, el: HTMLElement, text: string, t: number) => tl.call(() => { el.textContent = text; }, [], t);
const toggle = (tl: TL, el: Element, cls: string, on: boolean, t: number) => tl.call(() => el.classList.toggle(cls, on), [], t);

/* ---------------- 01 design: a brief → Claude draws the page from a blank grid → content → colour → approval ---------------- */
function design(stage: HTMLElement): TL {
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { lazy: false } });
  const p = pointer(stage);
  const frames = qa(stage, "[data-f]");
  const outlines = frames.map((f) => q(f, ".dz-o"));
  const dims = frames.map((f) => q(f, ".dz-dim"));
  const contents = frames.map((f) => q(f, ".dz-c"));
  const rls = qa(stage, "[data-rl]"), grid = q(stage, "[data-grid]"), board = q(stage, "[data-board]");
  const draft = q(stage, "[data-draft]"), caret = q(stage, ".dz-input .dm-caret"), status = q(stage, "[data-status]");
  const send = q(stage, '[data-t="send"]'), newBtn = q(stage, '[data-t="new"]'), swatch = q(stage, '[data-t="swatch"]');
  const sws = qa(stage, ".dz-sw"), ok = q(stage, "[data-ok]");
  const prompt = "Bakery homepage with cake orders";
  const rest = () => at(stage, board, 0.8, 0.5);

  // reset (also the very first frame): a blank board with its column grid
  tl.set(frames, { clipPath: "inset(0% 100% 100% 0%)", opacity: 1, backgroundColor: "rgba(0, 113, 227, 0.05)" }, 0)
    .set([...outlines, ...dims], { opacity: 1 }, 0)
    .set(contents, { opacity: 0, y: 6 }, 0)
    .set(rls, { opacity: 0 }, 0)
    .set(grid, { opacity: 1 }, 0)
    .set(board, { "--site": "#0071e3" }, 0)
    .set(status, { opacity: 0 }, 0)
    .set(ok, { opacity: 0, y: -6, scale: 0.96 }, 0);
  setText(tl, draft, "", 0.01);
  setText(tl, status, "", 0.01);
  toggle(tl, caret, "is-on", true, 0.01);
  toggle(tl, status, "is-thinking", false, 0.01);
  tl.call(() => sws.forEach((s, i) => s.classList.toggle("is-on", i === 0)), [], 0.01);
  p.place(tl, () => at(stage, newBtn, 0.3, 0.9), 0);
  p.show(tl, 0.1);

  // 1. the brief goes to Claude
  const typed = typeIn(tl, draft, prompt, 0.5, 24);
  p.move(tl, () => at(stage, send), typed - 0.6, 0.7);
  p.click(tl, () => at(stage, send), typed + 0.2);
  setText(tl, draft, "", typed + 0.3);
  toggle(tl, caret, "is-on", false, typed + 0.3);
  setText(tl, status, "Building layout…", typed + 0.3);
  toggle(tl, status, "is-thinking", true, typed + 0.3);
  tl.to(status, { opacity: 1, duration: 0.25 }, typed + 0.3);

  // 2. the page is drawn from scratch, frame by frame, with its spacing
  const t2 = typed + 0.7;
  p.move(tl, rest, t2, 0.9);
  frames.forEach((f, i) => tl.to(f, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power3.out" }, t2 + i * 0.3));
  tl.to(rls, { opacity: 1, duration: 0.3, stagger: 0.3 }, t2 + 0.9);

  // 3. content fills the frames, the guides step back
  const t3 = t2 + frames.length * 0.3 + 0.7;
  tl.to(status, { opacity: 0, duration: 0.15 }, t3 - 0.15);
  toggle(tl, status, "is-thinking", false, t3);
  setText(tl, status, "Layout ready", t3);
  tl.to(status, { opacity: 1, duration: 0.25 }, t3 + 0.05)
    .to(contents, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }, t3)
    .to([...outlines, ...dims], { opacity: 0, duration: 0.35 }, t3 + 0.35)
    .to(frames, { backgroundColor: "rgba(0, 113, 227, 0)", duration: 0.4 }, t3 + 0.35)
    .to(rls, { opacity: 0, duration: 0.3 }, t3 + 0.35)
    .to(grid, { opacity: 0, duration: 0.5 }, t3 + 0.45);

  // 4. a colour is picked for the brand
  const t4 = t3 + 1.5;
  p.move(tl, () => at(stage, swatch), t4, 0.8);
  p.click(tl, () => at(stage, swatch), t4 + 0.85);
  tl.call(() => sws.forEach((s) => s.classList.toggle("is-on", s === swatch)), [], t4 + 0.9);
  tl.set(board, { "--site": "#e3640b" }, t4 + 0.9);
  p.move(tl, rest, t4 + 1.4, 0.9);

  // 5. the client approves it — before any code
  const t5 = t4 + 2.1;
  tl.to(ok, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, t5);
  tl.addLabel("poster", t5 + 0.8);

  // reset: "New page" clears the board back to its grid
  const t6 = t5 + 3.4;
  p.move(tl, () => at(stage, newBtn), t6, 0.8);
  p.click(tl, () => at(stage, newBtn), t6 + 0.85);
  tl.to([...frames, ok, status], { opacity: 0, duration: 0.35, ease: "power1.out" }, t6 + 0.95)
    .to(grid, { opacity: 1, duration: 0.4 }, t6 + 1.1)
    .to(p.cur, { x: () => at(stage, newBtn, 0.3, 0.9).x - 3, y: () => at(stage, newBtn, 0.3, 0.9).y - 2, duration: 0.3 }, t6 + 1.1)
    .to({}, { duration: 0.3 }, t6 + 1.6);
  return tl;
}

/* ---------------- 02 development: Claude suggests a line, Tab accepts, the phone reloads ---------------- */
function dev(stage: HTMLElement): TL {
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { lazy: false } });
  const line = q(stage, "[data-line]"), ghost = q(line, "span"), hint = q(stage, "[data-hint]"), key = q(stage, "[data-key]");
  const skel = q(stage, "[data-skel]"), page = q(stage, "[data-page]"), btn = q(stage, "[data-btn]");
  const speed = q(stage, "[data-speed]"), secs = q(stage, "[data-secs]");
  const scene = qa(stage, ".dm-win, .dc-phone");

  tl.set(ghost, { opacity: 0 }, 0)
    .set(hint, { opacity: 0, x: -4 }, 0)
    .set(skel, { opacity: 0 }, 0)
    .set(page, { opacity: 1 }, 0)
    .set(btn, { opacity: 0, scale: 0.9 }, 0)
    .set(speed, { opacity: 0, y: 6 }, 0);
  toggle(tl, line, "is-on", false, 0.01);
  setText(tl, secs, "0.0", 0.01);
  tl.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0);

  // 1. Claude suggests the next line in grey
  tl.to(ghost, { opacity: 0.38, duration: 0.5 }, 0.9)
    .to(hint, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, 1.1);
  // 2. Tab accepts it
  tl.to(key, { scale: 0.86, backgroundColor: "#0071e3", color: "#ffffff", duration: 0.1 }, 2.9)
    .to(key, { scale: 1, backgroundColor: "#f5f5f7", color: "#1d1d1f", duration: 0.25 }, 3.0)
    .to(ghost, { opacity: 1, duration: 0.3 }, 3.0)
    .to(hint, { opacity: 0, duration: 0.25 }, 3.1);
  toggle(tl, line, "is-on", true, 3.0);
  // 3. saved: the phone reloads with the new button
  tl.to(page, { opacity: 0, duration: 0.2 }, 3.8)
    .to(skel, { opacity: 1, duration: 0.2 }, 3.85)
    .to(skel, { opacity: 0, duration: 0.25 }, 4.55)
    .to(page, { opacity: 1, duration: 0.3 }, 4.6)
    .to(btn, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, 4.75)
    .to(speed, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 4.6);
  const n = { v: 0 };
  tl.set(n, { v: 0 }, 4.6).to(n, { v: 0.8, duration: 0.6, ease: "power2.out", onUpdate: () => { secs.textContent = n.v.toFixed(1); } }, 4.65);
  tl.addLabel("poster", 5.6);
  // next file: the scene dips out
  tl.to([...scene, speed], { opacity: 0, duration: 0.45, ease: "power1.in" }, 9.6).to({}, { duration: 0.2 }, 10.05);
  return tl;
}

/* ---------------- 03 booking: pick a slot, type a name, choose Messenger, send ---------------- */
function book(stage: HTMLElement): TL {
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { lazy: false } });
  const p = pointer(stage);
  const slot = q(stage, '[data-t="slot"]'), field = q(stage, '[data-t="name"]'), name = q(stage, "[data-name]");
  const caret = q(field, ".dm-caret"), thumb = q(stage, "[data-thumb]");
  const segs = qa(stage, ".db-seg > span:not(.db-thumb)"), email = segs[0], msgr = q(stage, '[data-t="msgr"]');
  const submit = q(stage, '[data-t="submit"]'), a = q(stage, ".db-btn-a"), b = q(stage, ".db-btn-b"), note = q(stage, "[data-note]");
  const form = q(stage, ".db-form");
  const rest = () => at(stage, form, 0.82, 0.9);
  const thumbTo = (el: HTMLElement) => ({ x: () => el.offsetLeft, width: () => el.offsetWidth });

  tl.set(thumb, thumbTo(email), 0)
    .set(a, { opacity: 1, y: 0 }, 0)
    .set(b, { opacity: 0, y: "120%" }, 0)
    .set(note, { opacity: 0, y: -12 }, 0)
    .set(name, { opacity: 1 }, 0);
  toggle(tl, slot, "is-on", false, 0.01);
  toggle(tl, field, "is-focus", false, 0.01);
  toggle(tl, caret, "is-on", false, 0.01);
  setText(tl, name, "", 0.01);
  tl.call(() => segs.forEach((s) => s.classList.toggle("is-on", s === email)), [], 0.01);
  p.place(tl, rest, 0);
  p.show(tl, 0.15);

  // 1. pickup slot
  p.move(tl, () => at(stage, slot), 0.5, 0.8);
  p.click(tl, () => at(stage, slot), 1.35);
  toggle(tl, slot, "is-on", true, 1.4);
  // 2. name
  p.move(tl, () => at(stage, field, 0.3), 1.9, 0.7);
  p.click(tl, () => at(stage, field, 0.3), 2.65);
  toggle(tl, field, "is-focus", true, 2.7);
  toggle(tl, caret, "is-on", true, 2.7);
  const typed = typeIn(tl, name, "Ana Reyes", 2.95, 13);
  // 3. where the order goes
  p.move(tl, () => at(stage, msgr), typed + 0.25, 0.7);
  toggle(tl, caret, "is-on", false, typed + 0.9);
  toggle(tl, field, "is-focus", false, typed + 0.9);
  p.click(tl, () => at(stage, msgr), typed + 0.95);
  tl.to(thumb, { ...thumbTo(msgr), duration: 0.4, ease: "power3.inOut" }, typed + 1);
  tl.call(() => segs.forEach((s) => s.classList.toggle("is-on", s === msgr)), [], typed + 1.1);
  // 4. send, and it lands in the owner's Messenger
  const t4 = typed + 1.6;
  p.move(tl, () => at(stage, submit), t4, 0.7);
  p.click(tl, () => at(stage, submit), t4 + 0.75);
  tl.to(a, { opacity: 0, y: "-120%", duration: 0.28, ease: "power2.in" }, t4 + 0.8)
    .to(b, { opacity: 1, y: "0%", duration: 0.32, ease: "power3.out" }, t4 + 0.95)
    .to(note, { opacity: 1, y: 0, duration: 0.55, ease: "back.out(1.4)" }, t4 + 1.35);
  p.move(tl, rest, t4 + 1.2, 0.9);
  tl.addLabel("poster", t4 + 2.1);

  // reset: the form clears itself after sending
  const t5 = t4 + 5.2;
  tl.to(note, { opacity: 0, y: -12, duration: 0.4, ease: "power2.in" }, t5)
    .to(b, { opacity: 0, y: "120%", duration: 0.3 }, t5 + 0.2)
    .to(a, { opacity: 1, y: "0%", duration: 0.3 }, t5 + 0.35)
    .to(name, { opacity: 0, duration: 0.3 }, t5 + 0.2)
    .to(thumb, { ...thumbTo(email), duration: 0.4, ease: "power3.inOut" }, t5 + 0.3);
  toggle(tl, slot, "is-on", false, t5 + 0.25);
  tl.call(() => segs.forEach((s) => s.classList.toggle("is-on", s === email)), [], t5 + 0.4);
  tl.to({}, { duration: 0.5 }, t5 + 0.7);
  return tl;
}

/* ---------------- 04 3D: scrolling opens the product layer by layer ---------------- */
function threeD(stage: HTMLElement): TL {
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { lazy: false } });
  const layers = [0, 1, 2, 3].map((i) => q<SVGGElement>(stage, `[data-layer="${i}"]`));
  const lbls = layers.map((l) => q<SVGGElement>(l, ".d3-lbl"));
  const thumb = q(stage, "[data-thumb]"), track = q(stage, ".d3-track"), copy = q(stage, "[data-copy]");
  const open = [-64, -22, 16, 48];
  const travel = () => (track.clientHeight - thumb.clientHeight) * 0.8;

  tl.set(layers, { y: 0 }, 0).set(lbls, { opacity: 0, x: -6 }, 0).set(thumb, { y: 0 }, 0).set(copy, { y: 0 }, 0);

  // scroll down: the page moves, the product opens
  tl.to(thumb, { y: travel, duration: 2.8, ease: "power1.inOut" }, 0.8)
    .to(copy, { y: -14, duration: 2.8, ease: "power1.inOut" }, 0.8);
  layers.forEach((l, i) => tl.to(l, { y: open[i], duration: 2.3, ease: "power2.inOut" }, 1 + Math.abs(i - 1.5) * 0.1));
  tl.to(lbls, { opacity: 1, x: 0, duration: 0.45, stagger: 0.12, ease: "power2.out" }, 3.1);
  tl.addLabel("poster", 4.2);

  // scroll back up: it closes again
  tl.to(lbls, { opacity: 0, duration: 0.3, stagger: 0.05 }, 7.2)
    .to(thumb, { y: 0, duration: 2.4, ease: "power1.inOut" }, 7.3)
    .to(copy, { y: 0, duration: 2.4, ease: "power1.inOut" }, 7.3);
  layers.forEach((l, i) => tl.to(l, { y: 0, duration: 2, ease: "power2.inOut" }, 7.4 + (1.5 - Math.abs(i - 1.5)) * 0.08));
  tl.to({}, { duration: 0.6 }, 9.7);
  return tl;
}

/* ---------------- 05 search: the page loads as a skeleton, resolves with the bakery first, the setup checklist ticks ---------------- */
function search(stage: HTMLElement): TL {
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { lazy: false } });
  const p = pointer(stage);
  const query = q(stage, "[data-query]"), caret = q(stage, ".ds-q .dm-caret"), ph = q(stage, "[data-ph]"), x = q(stage, '[data-t="clear"]');
  const swaps = qa(stage, "[data-swap]");
  const sks = swaps.map((s) => q(s, ".ds-sk")), ins = swaps.map((s) => q(s, ".ds-in"));
  const cks = qa(stage, "[data-ck]"), ring = q(stage, "[data-ring]"), score = q(stage, "[data-score]"), box = q(stage, ".ds-box");

  tl.set(sks, { opacity: 1, filter: "blur(0px)" }, 0)
    .set(ins, { opacity: 0, filter: "blur(2px)" }, 0)
    .set(x, { opacity: 0 }, 0)
    .set(ph, { opacity: 1 }, 0)
    .set(ring, { strokeDashoffset: 100.5 }, 0);
  setText(tl, query, "", 0.01);
  setText(tl, score, "0", 0.01);
  toggle(tl, caret, "is-on", true, 0.01);
  tl.call(() => cks.forEach((c) => c.classList.remove("is-on")), [], 0.01);
  p.place(tl, () => at(stage, x), 0);
  p.show(tl, 0, false);

  // 1. a customer searches
  tl.to(ph, { opacity: 0, duration: 0.15 }, 0.45);
  const typed = typeIn(tl, query, "cake shop imus", 0.5, 11);
  tl.to(x, { opacity: 1, duration: 0.25 }, 0.7);
  toggle(tl, caret, "is-on", false, typed + 0.2);

  // 2. the skeleton resolves: the bakery first, its business card, its setup
  const t2 = typed + 0.35;
  swaps.forEach((_, i) => {
    tl.to(sks[i], { opacity: 0, filter: "blur(2px)", duration: 0.4, ease: "power1.inOut" }, t2 + i * 0.15)
      .to(ins[i], { opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power1.inOut" }, t2 + i * 0.15);
  });

  // 3. page titles, sitemap, Google Business: ticked; then the speed score
  const t3 = t2 + 0.9;
  cks.forEach((c, i) => toggle(tl, c, "is-on", true, t3 + i * 0.3));
  const t4 = t3 + cks.length * 0.3 + 0.2;
  tl.to(ring, { strokeDashoffset: 100.5 * 0.02, duration: 1.3, ease: "power2.out" }, t4);
  const n = { v: 0 };
  tl.set(n, { v: 0 }, t4).to(n, { v: 98, duration: 1.3, ease: "power2.out", onUpdate: () => { score.textContent = String(Math.round(n.v)); } }, t4);
  tl.addLabel("poster", t4 + 1.6);

  // reset: the search is cleared and the page goes back to its skeleton
  const t5 = t4 + 5;
  p.place(tl, () => at(stage, box, 0.6, 1.8), t5 - 0.01);
  p.show(tl, t5);
  p.move(tl, () => at(stage, x), t5 + 0.1, 0.8);
  p.click(tl, () => at(stage, x), t5 + 0.95);
  tl.to(ins, { opacity: 0, filter: "blur(2px)", duration: 0.3, ease: "power1.in" }, t5 + 1.05)
    .to(sks, { opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power1.out" }, t5 + 1.15)
    .to(x, { opacity: 0, duration: 0.2 }, t5 + 1.05)
    .to(ph, { opacity: 1, duration: 0.2 }, t5 + 1.15);
  setText(tl, query, "", t5 + 1.05);
  toggle(tl, caret, "is-on", true, t5 + 1.05);
  tl.to({}, { duration: 0.5 }, t5 + 1.5);
  return tl;
}

/* ---------------- 06 care: a request comes in, becomes a task, gets done; the month is reported ---------------- */
function care(stage: HTMLElement): TL {
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { lazy: false } });
  const fresh = q(stage, "[data-new]"), pill = q(stage, "[data-pill]"), pa = q(pill, ".dk-pa"), pb = q(pill, ".dk-pb");
  const ico = q(fresh, ".dk-ico"), msg = q(stage, "[data-msg]"), toast = q(stage, "[data-dk-toast]");
  const scene = qa(stage, ".dm-win");

  tl.set(fresh, { height: 0 }, 0)
    .set(pa, { opacity: 1, y: 0 }, 0)
    .set(pb, { opacity: 0, y: "110%" }, 0)
    .set(pill, { backgroundColor: "rgba(0, 113, 227, 0.1)", color: "#0071e3" }, 0)
    .set(msg, { opacity: 0, y: -8, scale: 0.97 }, 0)
    .set(toast, { opacity: 0, y: 10 }, 0);
  tl.call(() => { ico.classList.add("is-edit"); ico.classList.remove("is-ok"); }, [], 0.01);
  tl.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0);

  // 1. the owner asks for a change
  tl.to(msg, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, 0.8);
  // 2. it becomes a task at the top of this month's list
  tl.to(msg, { opacity: 0, y: 26, scale: 0.94, duration: 0.45, ease: "power2.in" }, 2.8)
    .to(fresh, { height: () => (q(fresh, ".dk-row") as HTMLElement).offsetHeight, duration: 0.5, ease: "power3.out" }, 3.0);
  // 3. done
  tl.to(pa, { opacity: 0, y: "-110%", duration: 0.28, ease: "power2.in" }, 5.0)
    .to(pb, { opacity: 1, y: "0%", duration: 0.32, ease: "power3.out" }, 5.15)
    .to(pill, { backgroundColor: "#f2f2f7", color: "#6e6e73", duration: 0.35 }, 5.05);
  tl.call(() => { ico.classList.remove("is-edit"); ico.classList.add("is-ok"); }, [], 5.1);
  tl.addLabel("poster", 5.8);
  // 4. end of the month: the report goes out, and a new month starts
  tl.to(toast, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }, 8.4)
    .to([...scene, toast], { opacity: 0, duration: 0.45, ease: "power1.in" }, 10.4)
    .to({}, { duration: 0.2 }, 10.85);
  return tl;
}

const builders: Record<string, (s: HTMLElement) => TL> = { design, dev, book, "3d": threeD, search, care };

type Scroller = { scrollTo: (target: number, opts?: { duration?: number }) => void } | null;

/** The services card: scroll position picks the service, the demo on the right follows. */
export function initServices(lenis: Scroller) {
  const scroller = document.querySelector<HTMLElement>("[data-svc-scroll]");
  if (!scroller) return;
  const items = qa(scroller, ".svc-item");
  const btns = qa<HTMLButtonElement>(scroller, ".svc-btn");
  const bars = qa(scroller, ".svc-bars i");
  const demos = qa(scroller, ".svc-stage .demo");
  const tls = demos.map((d) => builders[d.dataset.demo!](d));
  const n = demos.length;
  let active = -1;
  let inView = false;

  // every demo starts parked: on its first frame, or on its payoff frame when motion is reduced
  tls.forEach((tl) => { tl.seek(0, false); if (reduce) tl.seek("poster", false); });

  function show(i: number, dir: number, instant = false) {
    if (i === active) return;
    const prev = active;
    active = i;
    items.forEach((it, k) => it.classList.toggle("is-on", k === i));
    btns.forEach((b, k) => (k === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));

    if (prev >= 0) {
      const out = demos[prev], tl = tls[prev];
      tl.pause();
      gsap.killTweensOf(out);
      if (instant || reduce) gsap.set(out, { autoAlpha: 0, y: 0 });
      // leaves the way the list is moving, so it comes back from where it went
      else gsap.to(out, { autoAlpha: 0, y: -28 * dir, duration: 0.35, ease: "power2.in", onComplete: () => { gsap.set(out, { y: 0 }); if (active !== prev) tl.seek(reduce ? "poster" : 0, false); } });
    }
    const inn = demos[i];
    gsap.killTweensOf(inn);
    inn.classList.add("is-on");
    demos.forEach((d, k) => k !== i && k !== prev && d.classList.remove("is-on"));
    if (instant || reduce) gsap.set(inn, { autoAlpha: 1, y: 0 });
    else gsap.fromTo(inn, { autoAlpha: 0, y: 36 * dir }, { autoAlpha: 1, y: 0, duration: 0.7, delay: prev >= 0 ? 0.12 : 0, ease: "expo.out" });
    if (!reduce) { tls[i].seek(0, false); if (inView) tls[i].play(); }
  }

  demos.forEach((d) => gsap.set(d, { autoAlpha: 0 }));
  show(0, 1, true);

  // which service, and how far through it
  ScrollTrigger.create({
    trigger: scroller, start: "top top", end: "bottom bottom",
    onUpdate: (self) => {
      const p = self.progress * n;
      const i = Math.min(n - 1, Math.floor(p));
      const local = i === n - 1 ? Math.min(1, (p - i) * 1.25) : p - i;
      items[i].style.setProperty("--p", local.toFixed(3));
      bars.forEach((b, k) => b.style.setProperty("--p", k < i ? "1" : k === i ? local.toFixed(3) : "0"));
      show(i, self.direction >= 0 ? 1 : -1);
    },
  });
  // play only while the card is on screen
  ScrollTrigger.create({
    trigger: scroller, start: "top bottom", end: "bottom top",
    onToggle: (self) => { inView = self.isActive; if (reduce) return; inView ? tls[active].play() : tls[active].pause(); },
  });

  // clicking a name scrolls to the middle of its stretch, so the list and the page stay in step
  btns.forEach((b, k) => b.addEventListener("click", () => {
    const top = scroller.getBoundingClientRect().top + scrollY;
    const run = scroller.offsetHeight - innerHeight;
    const y = top + run * ((k + 0.35) / n);
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }));

  // re-measure cursor targets when the layout changes, then restart the visible demo from its first frame
  let timer = 0;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => tls.forEach((tl, k) => {
      tl.pause();
      tl.invalidate();
      tl.seek(0, false).seek(0.001, false);
      // a jump straight to the poster right after invalidate() skips staggered tweens, so make one full pass first
      if (reduce) tl.seek("poster", false).seek(tl.duration() - 0.05, false).seek(0.001, false).seek("poster", false);
      else if (k === active && inView) tl.play();
    }), 200);
  });
  if (import.meta.env.DEV) Object.assign(window, { __demos: tls, __svc: { show: (i: number) => show(i, 1, true) } });
}
