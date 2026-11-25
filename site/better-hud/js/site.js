/* Better HUD site: animated recreations of the mod's real UI.
   Every .stage[data-demo] gets a Demo. Its markup is rebuilt from a template on each loop, a scripted cursor acts the
   scene out, and the numbered steps beside it light up in sync. Demos run only while on screen, the Pause button stops
   them (WCAG 2.2.2), and with reduced motion each one shows its final frame, with Play to step through it once.
   Texts, defaults and toasts come from the mod's source (src/lightweight); names and numbers are made up. */
(() => {
  "use strict";

  const BH = (window.BH = { demos: [], version: "6.7.1" });
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const ABORT = Symbol("abort");
  const VER = BH.version;

  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const r2 = n => Math.round(n * 100) / 100;
  const rng = seed => () => { // mulberry32: the same "random" numbers on every loop
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ───────── Icons (the MODS sidebar's own, 13a-settings-pages) ───────── */
  const I = {
    hud: "<path d='M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3'/><path d='M9 12h6'/>",
    chat: "<path d='M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.8A8.4 8.4 0 1 1 21 11.5z'/>",
    fps: "<path d='M4.5 18a8.5 8.5 0 1 1 15 0'/><path d='M12 14.5l3.5-4.5'/><circle cx='12' cy='14.5' r='1.3'/>",
    menus: "<path d='M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01'/>",
    stats: "<path d='M4 20h16'/><path d='M7 16v-5M12 16V6M17 16v-8'/>",
    manage: "<path d='M4 7h9M17 7h3M4 17h3M11 17h9'/><circle cx='15' cy='7' r='2'/><circle cx='9' cy='17' r='2'/>",
    search: "<circle cx='11' cy='11' r='6.5'/><path d='M20 20l-4.3-4.3'/>",
    kbm: "<rect x='2' y='7' width='13' height='10' rx='2'/><path d='M5 10.5h1M8 10.5h1M11 10.5h1M5 13.5h7'/><rect x='17.5' y='6' width='5' height='9' rx='2.5'/>",
    pad: "<path d='M7 8h10a5 5 0 0 1 4.8 6.3l-.6 2.2a2.3 2.3 0 0 1-4 .8L15.5 15h-7l-1.7 2.3a2.3 2.3 0 0 1-4-.8l-.6-2.2A5 5 0 0 1 7 8z'/>",
    monitor: "<rect x='2' y='4' width='14' height='10' rx='1.5'/><path d='M6 18h6M9 14v4'/><rect x='18' y='6' width='4.5' height='12' rx='1'/>",
    chart: "<path d='M4 19h16'/><path d='M5 15l4.5-4.5 3.5 3.5L19 7.5'/>",
    list: "<path d='M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01'/>",
    dl: "<path d='M12 4v11M7 10l5 5 5-5M5 20h14'/>",
    ul: "<path d='M12 16V5M7 10l5-5 5 5M5 20h14'/>",
    trash: "<path d='M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'/>",
    x: "<path d='M6 6l12 12M18 6L6 18'/>",
    copytext: "<rect x='8' y='8' width='12' height='12' rx='2'/><path d='M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3'/><path d='M11 12h6M11 16h4'/>",
    image: "<rect x='3.5' y='5' width='17' height='14' rx='2'/><circle cx='9' cy='10' r='1.6'/><path d='M20.5 16l-5-5-8 8'/>",
    save: "<path d='M5 4h11l3 3v13H5z'/><path d='M8 4v5h7V4M8 20v-6h8v6'/>",
    dup: "<rect x='8' y='8' width='12' height='12' rx='2'/><path d='M4 16V5a1 1 0 0 1 1-1h11'/><path d='M14 11v6M11 14h6'/>",
    cal: "<rect x='3.5' y='5' width='17' height='15' rx='2'/><path d='M3.5 10h17M8 3v4M16 3v4'/>",
    chev: "<path d='M6 9l6 6 6-6'/>",
    grid: "<rect x='4' y='4' width='6.5' height='6.5' rx='1.3'/><rect x='13.5' y='4' width='6.5' height='6.5' rx='1.3'/><rect x='4' y='13.5' width='6.5' height='6.5' rx='1.3'/><rect x='13.5' y='13.5' width='6.5' height='6.5' rx='1.3'/>",
    speaker: "<path d='M4 9.5h3.5L12 6v12l-4.5-3.5H4z'/><path d='M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11'/>",
    gear: "<circle cx='12' cy='12' r='3.2'/><path d='M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9'/>",
    pause: "<rect x='6.5' y='5' width='3.6' height='14' rx='1' fill='currentColor' stroke='none'/><rect x='13.9' y='5' width='3.6' height='14' rx='1' fill='currentColor' stroke='none'/>",
    play: "<path d='M8 5.5v13l10.5-6.5z' fill='currentColor'/>",
    replay: "<path d='M4 12a8 8 0 1 0 2.3-5.6L4 8.7'/><path d='M4 3.5v5.2h5.2'/>",
    discord: "<path d='M8.5 6.5a14 14 0 0 1 7 0M7.5 17.5a14 14 0 0 0 9 0'/><path d='M8.5 6.5 7 5.5C5.3 5.9 4.2 6.6 3.5 7.3 2.1 10 1.6 13.2 2 16.6c1.5 1.2 3.2 2 4.6 2.4l1.1-2M15.5 6.5l1.5-1c1.7.4 2.8 1.1 3.5 1.8 1.4 2.7 1.9 5.9 1.5 9.3-1.5 1.2-3.2 2-4.6 2.4l-1.1-2'/><circle cx='9' cy='12.5' r='1.4'/><circle cx='15' cy='12.5' r='1.4'/>",
    youtube: "<rect x='2.5' y='5.5' width='19' height='13' rx='4'/><path d='M10 9.5v5l4.5-2.5z' fill='currentColor'/>",
    github: "<path d='M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21'/>",
  };
  const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
  const CURSOR = '<div class="cursor"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M3 3l0 21 5.6-5.4 3.7 8.4 3.6-1.6-3.6-8.2 7.9-.2z" fill="#fff" stroke="#0c2f3b" stroke-width="1.8" stroke-linejoin="round"/></svg></div>';

  /* ───────── The demo engine ───────── */
  class Demo {
    constructor(stage, def) {
      this.stage = stage;
      this.def = def;
      this.inner = stage.querySelector(".stage-inner");
      this.w = parseFloat(stage.style.getPropertyValue("--w")) || 800;
      this.h = parseFloat(stage.style.getPropertyValue("--h")) || 500;
      this.inner.innerHTML = def.html() + CURSOR + '<div class="toasts"></div>';
      this.tpl = this.inner.innerHTML;
      this.steps = [...document.querySelectorAll(`ol.steps[data-for="${stage.id}"] > li`)];
      this.capEl = document.querySelector(`[data-cap-for="${stage.id}"]`);
      this.capTpl = this.capEl ? this.capEl.innerHTML : "";
      const bar = stage.nextElementSibling;
      this.bar = bar && bar.classList.contains("stage-bar") ? bar : null;
      this.btn = this.bar && this.bar.querySelector(".replay");
      this.live = this.bar && this.bar.querySelector(".live > span");
      this.ctl = null;
      this.mode = "";
      this.state = "";
      this.visible = false;
      this.userPaused = false;
      this.shownStatic = false;
      if (this.btn) this.btn.addEventListener("click", () => this.toggle());
      this.fit();
      if ("ResizeObserver" in window) new ResizeObserver(() => this.fit()).observe(stage);
      else addEventListener("resize", () => this.fit());
      this.setState(reduce.matches ? "static" : "playing");
      stage._demo = this;
    }

    fit() {
      const k = this.stage.clientWidth / this.w;
      if (k > 0) this.inner.style.setProperty("--k", k);
    }

    reset() {
      this.inner.innerHTML = this.tpl;
      this.stage.classList.remove("fading");
      this.steps.forEach(li => li.classList.remove("on", "done"));
      if (this.capEl) this.capEl.innerHTML = this.capTpl;
      this.cur = this.inner.querySelector(".cursor");
      this.toastBox = this.inner.querySelector(".toasts");
      const [x, y] = this.def.rest || [this.w * 0.62, this.h * 0.82];
      this.cx = x;
      this.cy = y;
      this.cur.style.setProperty("--x", x - 3 + "px");
      this.cur.style.setProperty("--y", y - 3 + "px");
    }

    async run(mode) {
      if (this.ctl) this.ctl.abort();
      const ctl = (this.ctl = new AbortController());
      this.mode = mode;
      this.setState(mode === "instant" ? "static" : "playing");
      try {
        for (;;) {
          this.reset();
          const c = this.ctx(ctl.signal, mode === "instant");
          await this.def.run(c);
          if (mode !== "loop") break;
          this.steps.forEach(li => { li.classList.remove("on"); li.classList.add("done"); });
          await c.wait(this.def.hold || 2600);
          this.stage.classList.add("fading");
          await c.wait(420);
        }
        if (this.ctl !== ctl) return;
        this.ctl = null;
        this.steps.forEach(li => li.classList.remove("on", "done"));
        if (this.cur) this.cur.classList.remove("show");
        this.shownStatic = true;
        this.setState("static");
      } catch (e) {
        if (e === ABORT) return;
        console.error(e);
        if (this.ctl === ctl) this.ctl = null;
      }
    }

    start() {
      if (this.ctl || this.userPaused || !this.visible || document.hidden) return;
      if (reduce.matches) {
        if (!this.shownStatic) this.run("instant");
        return;
      }
      this.run("loop");
    }

    stop() {
      if (!this.ctl) return;
      const once = this.mode === "once";
      this.ctl.abort();
      this.ctl = null;
      if (once) this.run("instant");
    }

    toggle() {
      if (this.state === "playing") {
        if (this.mode === "once" || reduce.matches) return this.stop();
        this.userPaused = true;
        if (this.ctl) { this.ctl.abort(); this.ctl = null; }
        this.stage.classList.remove("fading");
        this.setState("paused");
      } else if (this.state === "paused") {
        this.userPaused = false;
        if (this.visible && !document.hidden) this.run("loop");
        else this.setState("playing");
      } else {
        this.userPaused = false;
        this.run("once");
      }
    }

    setState(s) {
      this.state = s;
      if (!this.btn) return;
      const [icon, label, live] =
        s === "playing" ? ["pause", "Pause", "Animated demo"] :
        s === "paused" ? ["replay", "Replay", "Paused"] : ["play", "Play", "Final step shown"];
      this.btn.innerHTML = ico(icon) + `<span>${label}</span>`;
      this.btn.setAttribute("aria-label", `${label} the ${this.def.name} demo`);
      this.bar.classList.toggle("paused", s !== "playing");
      if (this.live) this.live.textContent = live;
    }

    /* What a scene script gets. Every helper checks for an abort first, so a paused or hidden demo stops at once. */
    ctx(signal, instant) {
      const D = this;
      const inner = this.inner;
      const chk = () => { if (signal.aborted) throw ABORT; };
      const wait = ms => {
        chk();
        if (instant) return Promise.resolve();
        return new Promise((res, rej) => {
          const ab = () => { clearTimeout(t); rej(ABORT); };
          const t = setTimeout(() => { signal.removeEventListener("abort", ab); res(); }, ms);
          signal.addEventListener("abort", ab, { once: true });
        });
      };
      const $ = s => inner.querySelector(s);
      const $$ = s => [...inner.querySelectorAll(s)];
      const pos = (el, fx = 0.5, fy = 0.5) => { // a point of el, in the stage's own unscaled pixels
        const ir = inner.getBoundingClientRect();
        const k = ir.width / D.w || 1;
        const r = el.getBoundingClientRect();
        return [(r.left - ir.left + r.width * fx) / k, (r.top - ir.top + r.height * fy) / k];
      };
      const hoverOff = () => $$(".mi.hover,.chip.hover,.hr.hover,.gbtn.hover").forEach(e => e.classList.remove("hover"));
      const place = (x, y, dur) => {
        D.cur.style.setProperty("--dur", dur + "ms");
        D.cur.style.setProperty("--x", x - 3 + "px");
        D.cur.style.setProperty("--y", y - 3 + "px");
        D.cx = x;
        D.cy = y;
      };
      const move = async (t, o = {}) => {
        chk();
        const el = Array.isArray(t) ? null : t;
        const [x, y] = el ? pos(el, o.fx ?? 0.5, o.fy ?? 0.5) : t;
        hoverOff();
        const dur = instant ? 0 : o.dur ?? clamp(Math.hypot(x - D.cx, y - D.cy) * 1.1 + 260, 320, 900);
        D.cur.classList.add("show");
        place(x, y, dur);
        await wait(dur);
        if (el && o.hover !== false) {
          const h = el.closest(".mi,.chip,.hr,.gbtn");
          if (h) h.classList.add("hover");
        }
      };
      const click = async (el, o = {}) => {
        const [x, y] = pos(el, o.fx ?? 0.5, o.fy ?? 0.5);
        if (Math.hypot(x - D.cx, y - D.cy) > 4 || !D.cur.classList.contains("show")) await move(el, o);
        else chk();
        if (!instant) {
          D.cur.classList.add("press");
          const ring = document.createElement("i");
          ring.className = "ring";
          ring.style.left = x + "px";
          ring.style.top = y + "px";
          inner.appendChild(ring);
          setTimeout(() => ring.remove(), 560);
          const hb = el.closest(".mbtn,.sb2,.ib,.gbtn");
          if (hb) { hb.classList.add("hit"); setTimeout(() => hb.classList.remove("hit"), 180); }
          await wait(130);
          D.cur.classList.remove("press");
        }
        if (o.then) o.then();
        await wait(o.after ?? 220);
      };
      const type = async (el, text, o = {}) => {
        const q = el.matches(".q") ? el : el.querySelector(".q") || el;
        if (instant) {
          chk();
          q.textContent += text;
          if (o.each) o.each(q.textContent);
          return;
        }
        for (const ch of text) {
          chk();
          q.textContent += ch;
          if (o.each) o.each(q.textContent);
          await wait((o.speed ?? 95) + Math.random() * (o.jitter ?? 60));
        }
      };
      const key = async (label, at, o = {}) => { // a key badge over the field it's pressed in
        chk();
        if (instant) return;
        const [x, y] = Array.isArray(at) ? at : pos(at, o.fx ?? 0.5, 0);
        const k = document.createElement("div");
        k.className = "keycap";
        k.textContent = label;
        k.style.left = x + "px";
        k.style.top = y - (o.dy ?? 44) + "px";
        inner.appendChild(k);
        setTimeout(() => k.remove(), 1050);
        await wait(o.after ?? 420);
      };
      const drag = async (sl, to, o) => {
        const { min, max, from = min, num, fmt = v => v.toFixed(2), onv, dur = 900 } = o;
        const p = v => clamp((v - min) / (max - min), 0, 1);
        const set = v => {
          sl.style.setProperty("--p", r2(p(v) * 1000) / 1000);
          if (num) num.textContent = fmt(v);
          if (onv) onv(v);
        };
        if (instant) { chk(); set(to); return; }
        await move(sl.querySelector(".sl-knob"));
        D.cur.classList.add("press");
        await wait(140);
        const track = sl.querySelector(".sl-track");
        const [tx, ty] = pos(track, 0, 0.5);
        const tw = track.getBoundingClientRect().width / (inner.getBoundingClientRect().width / D.w || 1);
        D.cur.classList.add("drag");
        sl.classList.add("drag");
        const N = 24;
        const dt = dur / N;
        for (let i = 1; i <= N; i++) {
          const v = from + (to - from) * easeIO(i / N);
          set(v);
          place(tx + tw * p(v), ty, dt);
          await wait(dt);
        }
        set(to);
        D.cur.classList.remove("drag", "press");
        sl.classList.remove("drag");
        await wait(160);
      };
      const step = i => {
        chk();
        D.steps.forEach((li, j) => { li.classList.toggle("on", j === i); li.classList.toggle("done", j < i); });
      };
      const cap = (label, text) => {
        chk();
        if (D.capEl) D.capEl.innerHTML = `<b>${esc(label)}</b><span class="t swap">${esc(text)}</span>`;
      };
      const toast = (text, o = {}) => {
        chk();
        const box = D.toastBox;
        if (instant) box.textContent = "";
        const t = document.createElement("div");
        t.className = "toast" + (o.ok ? " ok" : "");
        t.textContent = text;
        box.appendChild(t);
        if (!instant) setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, o.ms ?? 2800);
      };
      const toastsOut = () => [...D.toastBox.children].forEach(t => {
        if (instant) return t.remove();
        t.classList.add("out");
        setTimeout(() => t.remove(), 320);
      });
      const cursorOff = () => { hoverOff(); D.cur.classList.remove("show"); };
      return { $, $$, wait, pos, move, click, type, key, drag, step, cap, toast, toastsOut, cursorOff, hoverOff, chk, instant, w: D.w, h: D.h };
    }
  }

  /* ───────── Shared pieces of the game's UI ───────── */
  const tabsHTML = on =>
    `<div class="gtabs"><span class="gtab kb">${ico("kbm")}</span><span class="gtab">${ico("pad")}</span><span class="gtab">${ico("monitor")}</span>` +
    `<span class="gtab${on === "mods" ? " on" : ""}">Mods</span><span class="gtab${on === "xh" ? " on" : ""}">Crosshair</span></div>`;

  const footHTML =
    `<div class="gfoot"><span class="gf-dot"></span><span>Better HUD v${VER}</span><span class="gf-st">Up to date</span>` +
    `<span class="gf-ico"><i>${ico("discord")}</i><i>${ico("youtube")}</i><i>${ico("github")}</i></span><span class="gf-by">Created by Virojet</span></div>` +
    `<div class="gbtns"><span class="gbtn red">Cancel</span><span class="gbtn yolk">Reset to Defaults</span><span class="gbtn">Confirm</span></div>`;

  /* The mod's text dialog (01-dialogs): title, text, one field, blue Cancel and a green OK. */
  const dlg = (id, title, text, ph, ok, o = {}) =>
    `<div class="dlg-ov" data-dlg="${id}" hidden><div class="dlg"><p class="dlg-t">${title}</p><p class="dlg-p">${text}</p>` +
    `<div class="dlg-in${o.code ? " code" : ""}"><span class="q" data-ph="${esc(ph)}">${o.value ? esc(o.value) : ""}</span><i class="caret"></i></div>` +
    `<div class="dlg-foot"><span class="gbtn blue">Cancel</span><span class="gbtn ok">${ok}</span></div></div></div>`;

  /* A crosshair: four arms at a gap, an optional center dot, a black outline under the fill. */
  const xhSVG = p => {
    const { c = "#fff", L = 19.5, W = 3.6, G = 8, dot = 0, ol = true, op = 1, arms = true } = p;
    const R = arms && L > 0 && W > 0 ? [[-G - L, -W / 2, L, W], [G, -W / 2, L, W], [-W / 2, -G - L, W, L], [-W / 2, G, W, L]] : [];
    if (dot) R.push([-dot / 2, -dot / 2, dot, dot]);
    const rect = ([x, y, w, h], e, fill) => `<rect x="${r2(x - e)}" y="${r2(y - e)}" width="${r2(w + 2 * e)}" height="${r2(h + 2 * e)}" fill="${fill}"/>`;
    return `<g opacity="${op}">${ol ? R.map(q => rect(q, 1.6, "#000")).join("") : ""}${R.map(q => rect(q, 0, c)).join("")}</g>`;
  };
  const GAME_XH = { c: "#fff", L: 9, W: 2.4, G: 5, ol: true };
  const WORLD =
    '<div class="gs-world"><i class="gs-sky"></i><i class="gs-hill gs-h1"></i><i class="gs-hill gs-h2"></i><i class="gs-tower"></i>' +
    '<i class="gs-tower2"></i><i class="gs-ground"></i><i class="gs-crate"></i></div><i class="gs-vig"></i>' +
    `<svg class="gs-xh" viewBox="-30 -30 60 60" aria-hidden="true">${xhSVG(GAME_XH)}</svg>`;

  /* ───────── 1. Tour: the MODS tab ───────── */
  // [label, tip, search keywords, flags]. Tips and keywords are the mod's own; flags: on (its default), gear, sld, btn:<label>.
  const PAGES = [
    ["hud", "HUD", "Choose which parts of the in-game HUD you see.", [
      ["Hide HP", "Hides the green health bar at the bottom center.", "health bar"],
      ["Hide Ammo & Grenades", "Hides the bullet ammo counter and the grenade inventory.", "hide ammo grenade count"],
      ["Hide Egg Count", "Hides your current egg count in the main account display.", ""],
      ["Hide Best Streak", "Hides the shell streak notifications/counters.", "shell streak"],
      ["Hide Game Stats", "Hides match versus headers, team scores, and spatula/capture status widgets.", "team scores spatula capture"],
      ["Hide Scoreboard", "Hides the players list (scoreboard) in the top-left corner.", "hide player readouts player list leaderboard"],
      ["Hide Kill Feed", "Hides the kill feed (who cracked who) in the top-right corner.", "killfeed kills ticker"],
      ["Hide Challenges", "Hides the Challenges list on the respawn screen, and the Challenge Complete pop-up and its sound during a match. The home screen keeps its Challenges tab, so you can still claim rewards there.", "daily challenge rewards complete popup respawn"],
      ["Hide Scope Lines", "Hides black overlay crosshair/lines when aiming down sniper scopes.", "sniper"],
    ]],
    ["chat", "Chat", "Hide the chat, keep its whole history, show when each message arrived, or copy it.", [
      ["Hide Chat", "Completely hides the in-game chat, including the chat box in the bottom-left corner.", "messages"],
      ["Infinite Chat History", "Stops the game deleting old chat messages, so the whole match's chat is kept. Pause or open chat and scroll up to read it back.", "chat log scroll back messages", "on"],
      ["Chat Timestamps", "When you pause, each chat message shows the time it arrived. The chat you see while playing doesn't change.", "chat time times timestamp timestamps clock when sent arrived hour minute"],
      ["Join From Chat", "Underlines a game code said in chat (like cask-zips-vent). Click it, confirm, and you leave the match and join that game.", "chat code join game private link click friend invite", "on"],
      ["Crosshair Codes in Chat", "Underlines a crosshair code said in chat (one that starts with X- or SSB-, or a Valorant code). Hover it to see the crosshair; click it to save it as a profile.", "chat crosshair code detect preview hover import save profile share valorant", "on"],
      ["Chat Countdown", "When the game makes you wait before your next chat message, the chat box shows how many seconds are left.", ""],
      ["Chat Mentions", "Type @ in chat to pick a player's name from a list that narrows as you type (Up and Down to choose, Tab or Enter to put it in). When another player says your name in chat, your name in their message is highlighted in blue and you hear a short ping.", "", "on"],
      ["Copy Chat", "", "chat copy export save text log history messages clipboard", "btn:Copy"],
    ]],
    ["fps", "FPS & Ping", "Raise your frame rate, and set up the FPS and ping readout.", [
      ["Uncap FPS", "Runs the game's frames back to back while you're spawned in, never on the home screen or in menus. May increase CPU/GPU usage. A higher FPS counter does not guarantee smoother displayed frames. The gear opens Controlled Uncap and Target FPS. If your mouse feels delayed, turn on Controlled Uncap there.", "frame rate refresh hz gear options", "gear"],
      ["Disable Anti-Aliasing", "Turns off the game's edge smoothing. Edges look more jagged, but your graphics card does less work, which can raise your FPS. Requires a page reload (F5) to take effect.", ""],
      ["Smart Auto Detail", "Takes over from the game's Auto Detail, which needs to stay on. When your FPS drops under 40, it lowers the resolution, keeps it lower only if that helps, and raises it again when your FPS recovers. Changes wait until you die or pause, so the game doesn't stall mid-fight (unless you've been under 25 FPS for a whole minute).", "", "on"],
      ["Render Scale", "", "resolution quality pixels hardware scaling blurry sharp lag low fps performance", "sld"],
      ["Hide FPS", "Completely hides the FPS display from the in-game HUD.", ""],
      ["Hide Ping", "Completely hides the ping display from the in-game HUD.", ""],
      ["Show Frametime (ms)", "Swaps standard FPS into milliseconds per frame (frametime) readout.", "milliseconds"],
      ["Show Session Time", "Displays a real-time count of how long you've been playing in this session.", "timer clock"],
      ["Hide Box Background", "Removes the dark backdrop behind the in-game FPS / ping box.", "hide box fps box backdrop"],
      ["FPS Check", "", "fps check slow lag graphics card gpu performance test", "btn:Run Check"],
    ]],
    ["menus", "Menus", "Extras for the home screen, pause menu and inventory.", [
      ["Server Picker", "Adds a server region picker with live ping readouts to the home screen, beside Game Mode.", ""],
      ["Auto-pick Best Server", "When the region list shows ping times, waits for them all (up to 5 seconds) and switches to the lowest, if it beats your region by at least 15 ms or 20%, whichever is more. A region you pick yourself stays until you turn this off and on again.", "", "on"],
      ["Pause-Menu Volume Slider", "Adds an extra master volume slider directly under the pause weapon selection.", ""],
      ["Show Changed Tab", "Shows the Changed tab in the MODS sidebar, listing settings that differ from their defaults with a Reset for each. Off by default.", "changed settings modified defaults reset sidebar tab optional"],
      ["Advanced Settings", "Shows the Effects and Gameplay tabs in the MODS sidebar, and what each Manage button does under it. Off by default. The settings on the hidden tabs keep working, and searching still finds them.", "advanced extra effects gameplay game fixes sidebar tabs pages explanations manage show hide more options"],
    ]],
    ["stats", "Stats", "Track your kills, deaths and KDR in every match.", [
      ["Stats Tracker", "Tracks kills, deaths, KDR and local match history.", "enable stats kdr kills deaths", "on"],
      ["King of the Coop Stats", "Adds each player's time on the coop, captures and takeovers to the King of the Coop scoreboard and match history. Needs Stats Tracker on.", ""],
      ["Kill Bars", "Adds a team-colored bar behind each player in the stats window and its pictures. The team's top kill count fills the row; the other bars are proportional. Off by default.", "scoreboard row fill kills team bar graph"],
      ["Highlight Your Name", "Highlights your own row in live stats, saved matches and their pictures.", "", "on"],
      ["Show Guns", "Shows each player's gun by their name in the stats window, Match History and the pictures (Copy Image, Download, every Stats Style): the primary they got the most kills with. Pistol, grenade and melee kills don't count. Before their first kill with a primary, it's the primary they last held; a dash when that isn't known (matches saved by older versions).", "stats weapon gun icon primary class kills league picture"],
      ["Pin Stats on Pause Menu", "Shows a pinned compact kills/deaths/KDR overlay above the in-game pause menu's weapon select.", "keep stats pinned"],
      ["Show Match FPS", "Match History shows each match's average and lowest FPS, from what Smart Auto Detail measured while you played, and the CSV export gets those columns. Matches are measured either way, so turning it on shows earlier ones too.", ""],
      ["Personal Records", "Keeps your most kills and best KDR (with at least 10 kills) for each mode and map. Match History shows them, and when a match beats one, a message at the end says so. Needs Stats Tracker.", "records best personal best pb high score most kills kdr record", "on"],
    ]],
  ];
  const CHIPS = [["hud", "HUD"], ["chat", "Chat"], ["fps", "FPS & Ping"], ["menus", "Menus"], ["stats", "Stats"], ["manage", "Manage"]];

  const card = ([k, tip, kw, fl = ""], sec) => {
    const s = esc([k, tip, kw, sec].join(" ").toLowerCase());
    const head = `data-k="${esc(k)}" data-s="${s}"><b>${esc(k)}</b>`;
    if (fl.startsWith("btn:")) return `<div class="mi" ${head}<span class="mbtn">${esc(fl.slice(4))}</span></div>`;
    if (fl === "sld") {
      return `<div class="mi sld" ${head}<span class="num">1.00</span><div class="sl" style="--p:.2"><span class="sl-min">0.25</span>` +
        '<span class="sl-track"><i class="sl-fill"></i><i class="sl-knob"></i></span><span class="sl-max">4</span></div></div>';
    }
    const ctl = fl === "gear" ? `<span class="mi-ctl"><i class="gearb">${ico("gear")}</i><i class="tg"></i></span>` : '<i class="tg"></i>';
    return `<div class="mi${fl === "on" ? " on" : ""}" ${head}<small>${esc(tip)}</small>${ctl}</div>`;
  };

  const TOUR = {
    name: "MODS tab",
    hold: 3000,
    rest: [560, 600],
    html() {
      const chips = CHIPS.map(([p, t], i) => `<span class="chip${i ? "" : " on"}" data-p="${p}">${ico(p)}${esc(t)}</span>`).join("");
      const pages = PAGES.map(([p, t, sub, items], i) =>
        `<div class="pg" data-p="${p}"${i ? " hidden" : ""}><div class="sec-h"><b>${esc(t)}</b><small>${esc(sub)}</small></div>` +
        `<div class="grid">${items.map(it => card(it, t)).join("")}</div></div>`).join("");
      return `<div class="gw"><i class="gw-x"></i><p class="gw-title">Settings</p>${tabsHTML("mods")}<div class="mods">` +
        `<div class="sb"><div class="sb-search">${ico("search")}<span class="q" data-ph="Search settings…"></span><i class="caret"></i></div>${chips}</div>` +
        `<div class="mods-main">${pages}</div></div>${footHTML}</div>`;
    },
    async run(c) {
      let page = "hud";
      const cardEl = k => c.$(`.mi[data-k="${k}"]`);
      const show = p => {
        page = p;
        c.$$(".pg").forEach(g => (g.hidden = g.dataset.p !== p));
        c.$$(".chip").forEach(ch => ch.classList.toggle("on", ch.dataset.p === p));
      };
      const filter = q => { // every word must be in the card's name, tip, keywords or section, like the mod's search
        const main = c.$(".mods-main");
        const words = q.toLowerCase().split(/\s+/).filter(Boolean);
        c.$$(".chip").forEach(ch => ch.classList.remove("dis"));
        if (!words.length) {
          main.classList.remove("searching");
          c.$$(".mi").forEach(m => (m.hidden = false));
          return show(page);
        }
        main.classList.add("searching");
        c.$$(".chip").forEach(ch => ch.classList.remove("on"));
        CHIPS.forEach(([p]) => {
          const g = c.$(`.pg[data-p="${p}"]`);
          let hits = 0;
          if (g) g.querySelectorAll(".mi").forEach(m => { const ok = words.every(w => m.dataset.s.includes(w)); m.hidden = !ok; hits += ok; });
          if (g) g.hidden = !hits;
          if (!hits) c.$(`.chip[data-p="${p}"]`).classList.add("dis");
        });
      };
      const flip = k => {
        const m = cardEl(k);
        return c.click(m.querySelector(".tg"), { then: () => m.classList.add("on"), after: 300 });
      };

      await c.wait(700);
      c.cap("HUD", "Hide the kill feed and other HUD elements.");
      await c.wait(500);
      await flip("Hide Kill Feed");
      await c.wait(900);

      c.cap("Chat", "See when chat messages arrived.");
      await c.click(c.$('.chip[data-p="chat"]'), { then: () => show("chat") });
      await c.wait(500);
      await flip("Chat Timestamps");
      await c.wait(900);

      c.cap("FPS & Ping", "Adjust resolution for smoother play.");
      await c.click(c.$('.chip[data-p="fps"]'), { then: () => show("fps") });
      await c.wait(400);
      await c.move(cardEl("Smart Auto Detail").querySelector(".tg"));
      await c.wait(900);
      const rs = cardEl("Render Scale");
      await c.drag(rs.querySelector(".sl"), 1.5, { from: 1, min: 0.25, max: 4, num: rs.querySelector(".num"), fmt: v => (Math.round(v * 20) / 20).toFixed(2), dur: 1000 });
      await c.wait(800);

      c.cap("Search", "Find any setting by name.");
      const sb = c.$(".sb-search");
      await c.click(sb, { then: () => sb.classList.add("focus") });
      await c.type(sb, "kill", { speed: 160, each: filter });
      await c.wait(400);
      await c.move([96, 540]);
      await c.wait(1200);
    },
  };

  /* ───────── 2. Crosshair tab ───────── */
  const PF = [ // the profiles a player might have saved
    { c: "#ffffff", L: 19.5, W: 3.6, G: 8, ol: true },
    { c: "#ff3b30", arms: false, dot: 9, ol: true },
    { c: "#13ff7a", L: 16, W: 5, G: 0, ol: true },
    { c: "#00e5ff", L: 30, W: 2.5, G: 12, ol: false },
    { c: "#ffe100", L: 14, W: 4, G: 5, dot: 4, ol: true },
  ];
  const PAL = ["#ffffff", "#000000", "#ff3b30", "#ff9a22", "#ffe100", "#13ff7a", "#00e5ff", "#ff00ff"];
  const VALO_CODE = "0;P;c;6;h;0;d;1;z;3;0l;8;0o;3;0a;1;1b;0";
  const VALO = { c: "#ff00ff", L: 20, W: 5, G: 7.5, dot: 7.5, ol: false };
  const thumb = p => `<svg viewBox="-48 -48 96 96" aria-hidden="true">${xhSVG(p)}</svg>`;

  const CROSSHAIR = {
    name: "Crosshair tab",
    hold: 3000,
    rest: [600, 470],
    html() {
      const sw = ["sky", "gray", "black", "white"].map(b => `<i class="sw${b === "white" ? " on" : ""}" data-bg="${b}"></i>`).join("");
      const pfs = PF.map((p, i) => `<span class="pf${i ? "" : " on"}">${thumb(p)}</span>`).join("");
      const xr = (k, min, max, v) =>
        `<div class="xr" data-k="${k}"><b>${k}</b><div class="sl" style="--p:${r2((v - min) / (max - min))}"><span class="sl-min">${min}</span>` +
        `<span class="sl-track"><i class="sl-fill"></i><i class="sl-knob"></i></span><span class="sl-max">${max}</span><span class="num">${v.toFixed(2)}</span></div></div>`;
      return `<div class="gw xhw"><i class="gw-x"></i><p class="gw-title">Settings</p>${tabsHTML("xh")}<div class="xh">` +
        `<div class="xh-l"><span class="xh-lbl">Preview</span><div class="xh-prev" data-bg="white"><svg class="xh-svg" viewBox="-60 -60 120 120" aria-hidden="true">${xhSVG(PF[0])}</svg></div>` +
        `<div class="xh-row"><b>Background</b><span class="sw-pill">${sw}<span class="xh-hex">#ffffff</span></span></div>` +
        `<div class="xh-ph"><span class="xh-lbl">Profiles</span><span class="gal">${ico("grid")}Gallery<i>5</i></span></div>` +
        `<div class="xh-pfs">${pfs}</div>` +
        `<div class="xh-bar"><span class="xh-sel"><span>Default</span>${ico("chev")}</span><i class="ib">${ico("save")}</i><i class="ib">${ico("dup")}</i>` +
        `<i class="ib">${ico("ul")}</i><i class="ib imp">${ico("dl")}</i><i class="ib del">${ico("trash")}</i></div>` +
        '<div class="xh-undo"><span>Undo</span><span>Redo</span><span>Revert</span></div></div>' +
        '<div class="xh-r"><div class="mi on"><b>Enable Crosshair Customizer</b><small>Replace the game\'s crosshair with your own design.</small><i class="tg"></i></div>' +
        '<div class="sec-h"><b>Arms</b><small>Color, size and angle of the four arms.</small></div>' +
        '<div class="xh-list"><div class="xr"><b>Hide Arms</b><i class="tg"></i></div>' +
        `<div class="xr"><b>Color</b><span class="clr"><i style="background:#ffffff"></i><span>#ffffff</span></span>` +
        `<div class="pal" hidden>${PAL.map(h => `<i data-c="${h}" style="background:${h}"></i>`).join("")}</div></div>` +
        '<div class="xr on" data-k="Outline"><b>Outline</b><i class="tg"></i></div>' +
        `${xr("Length", 0, 3, 0.75)}${xr("Width", 0.05, 2, 0.3)}${xr("Opacity", 0, 1, 1)}</div></div></div></div>` +
        dlg("imp", "Import Crosshair", "Paste a crosshair code. It starts with X- or SSB-. A crosshair code from Valorant works too (it starts with 0;).", "X-…", "Next", { code: true }) +
        dlg("name", "Name Profile", "Give this crosshair profile a name.", "Profile name", "Save", { value: "Valorant_482" });
    },
    async run(c) {
      const P = { ...PF[0] };
      const svg = c.$(".xh-svg");
      const draw = () => (svg.innerHTML = xhSVG(P));
      const row = k => c.$(`.xr[data-k="${k}"]`);
      const clr = c.$(".clr");
      const pal = c.$(".pal");
      const setColor = hex => {
        clr.querySelector("i").style.background = hex;
        clr.querySelector("span").textContent = hex;
        P.c = hex;
        draw();
      };
      const setSlider = (k, v, min, max) => {
        const r = row(k);
        r.querySelector(".sl").style.setProperty("--p", r2((v - min) / (max - min)));
        r.querySelector(".num").textContent = v.toFixed(2);
      };

      c.step(0);
      await c.wait(700);
      const sky = c.$('.sw[data-bg="sky"]');
      await c.click(sky, {
        then: () => {
          c.$(".xh-prev").dataset.bg = "sky";
          c.$$(".sw").forEach(s => s.classList.toggle("on", s === sky));
          c.$(".xh-hex").textContent = "#8fd3ea";
        },
      });
      await c.wait(1000);

      c.step(1);
      const len = row("Length");
      const wid = row("Width");
      await c.drag(len.querySelector(".sl"), 1.45, { from: 0.75, min: 0, max: 3, num: len.querySelector(".num"), onv: v => { P.L = v * 26; draw(); } });
      await c.wait(350);
      await c.drag(wid.querySelector(".sl"), 0.6, { from: 0.3, min: 0.05, max: 2, num: wid.querySelector(".num"), onv: v => { P.W = v * 12; draw(); } });
      await c.wait(900);

      c.step(2);
      await c.click(clr, { then: () => (pal.hidden = false) });
      await c.wait(450);
      const yel = c.$('.pal i[data-c="#ffe100"]');
      await c.click(yel, { then: () => { yel.classList.add("on"); setColor("#ffe100"); } });
      await c.wait(250);
      pal.hidden = true;
      await c.wait(1000);

      c.step(3);
      const imp = c.$('[data-dlg="imp"]');
      const nm = c.$('[data-dlg="name"]');
      await c.click(c.$(".ib.imp"), { then: () => (imp.hidden = false) });
      await c.wait(500);
      const inp = imp.querySelector(".dlg-in");
      await c.click(inp, { then: () => inp.classList.add("focus") });
      await c.key("Ctrl + V", inp);
      inp.querySelector(".q").textContent = VALO_CODE;
      await c.wait(900);
      await c.click(imp.querySelector(".gbtn.ok"), {
        then: () => { imp.hidden = true; nm.hidden = false; nm.querySelector(".dlg-in").classList.add("focus"); },
      });
      await c.wait(1100);
      await c.click(nm.querySelector(".gbtn.ok"), {
        then: () => {
          nm.hidden = true;
          Object.assign(P, VALO);
          setColor(VALO.c);
          c.$$(".pf").forEach(p => p.classList.remove("on"));
          c.$(".xh-pfs").insertAdjacentHTML("beforeend", `<span class="pf on new">${thumb(VALO)}</span>`);
          c.$(".gal i").textContent = "6";
          c.$(".xh-sel > span").textContent = "Valorant_482";
          yel.classList.remove("on");
          row("Outline").classList.remove("on");
          setSlider("Length", 0.77, 0, 3);
          setSlider("Width", 0.42, 0.05, 2);
          c.toast('Imported profile "Valorant_482".', { ok: true });
        },
      });
      await c.move([640, 492]);
    },
  };

  /* ───────── 3. Chat: mentions, timestamps, crosshair codes ───────── */
  const cm = (name, red, text, ts) => `<div class="cm"><span class="ts" hidden>${ts}</span><span class="cn${red ? " red" : ""}">${name}</span>: ${text}</div>`;
  const PLAYERS = ["EggPro64", "BirdNoob1", "ShellShock99", "MasterChick79", "SunnySide7", "HardBoiled", "PoachedPro"];
  const CHAT_XH = { c: "#00e5ff", L: 31.2, W: 5.4, G: 8, ol: true };

  const CHAT = {
    name: "chat",
    hold: 2600,
    rest: [520, 300],
    html() {
      return `<div class="gscene">${WORLD}<div class="chat"><div class="chat-log">` +
        cm("SunnySide7", true, "gg last round", "19:38") + cm("EggPro64", false, "they're camping the tower again", "19:39") + cm("HardBoiled", true, "lol", "19:40") +
        '</div><div class="sugg" hidden></div><div class="chat-in" hidden><span class="q"></span><i class="caret"></i></div></div></div>' +
        `<div class="xtip" hidden><div class="xtip-prev"><svg viewBox="-48 -48 96 96" aria-hidden="true">${xhSVG(CHAT_XH)}</svg></div><p>Click to save it as a profile</p></div>` +
        dlg("save", "Save Crosshair", "Save the crosshair from chat as a profile. You can pick it in the Crosshair tab afterwards.", "Profile name", "Save", { value: "Chat_1" });
    },
    async run(c) {
      const log = c.$(".chat-log");
      const chat = c.$(".chat");
      const inp = c.$(".chat-in");
      const q = inp.querySelector(".q");
      const sugg = c.$(".sugg");
      const KEY = [520, 412];
      const say = html => log.insertAdjacentHTML("beforeend", html);
      const list = pre => {
        const m = PLAYERS.filter(n => n.toLowerCase().startsWith(pre));
        sugg.innerHTML = m.map((n, i) => `<div class="sg${i ? "" : " on"}">${n}</div>`).join("");
        sugg.hidden = !m.length;
      };

      c.step(0);
      await c.wait(1100);
      say(cm("MasterChick79", true, '<span class="mn-me">YolkLord2</span> how are you hitting those shots', "19:41"));
      if (!c.instant) {
        chat.insertAdjacentHTML("beforeend", `<div class="pingfx">${ico("speaker")}Ping!</div>`);
        const fx = chat.querySelector(".pingfx");
        setTimeout(() => fx.remove(), 1700);
      }
      await c.wait(2000);

      c.step(1);
      await c.key("Enter", KEY);
      inp.hidden = false;
      inp.classList.add("focus");
      await c.wait(500);
      await c.type(q, "@", { speed: 220 });
      list("");
      await c.wait(900);
      await c.type(q, "m", { speed: 220 });
      list("m");
      await c.wait(800);
      await c.key("Tab", KEY);
      q.textContent = "@MasterChick79 ";
      sugg.hidden = true;
      await c.wait(300);
      await c.type(q, "try my crosshair", { speed: 70, jitter: 50 });
      await c.wait(400);
      await c.key("Enter", KEY);
      say(cm("YolkLord2", false, '<span class="mn-out">@MasterChick79</span> try my crosshair', "19:41"));
      q.textContent = "";
      inp.classList.remove("focus");
      inp.hidden = true;
      await c.wait(1400);
      say(cm("EggPro64", false, 'here\'s mine <span class="xcode">X-Sc19fjSl3cSw19</span>', "19:42"));
      await c.wait(1600);

      c.step(2);
      await c.key("Esc", KEY);
      c.$(".gscene").classList.add("paused");
      c.$$(".cm .ts").forEach(t => (t.hidden = false));
      await c.wait(1900);

      c.step(3);
      const code = c.$(".xcode");
      const tip = c.$(".xtip");
      await c.move(code);
      code.classList.add("hover");
      const [x, y] = c.pos(code, 0.5, 0);
      tip.style.left = x - 75 + "px";
      tip.style.top = y - 136 + "px";
      tip.hidden = false;
      await c.wait(1600);
      const sv = c.$('[data-dlg="save"]');
      await c.click(code, { then: () => { tip.hidden = true; code.classList.remove("hover"); sv.hidden = false; } });
      await c.wait(1100);
      await c.click(sv.querySelector(".gbtn.ok"), {
        then: () => { sv.hidden = true; c.toast('Saved the crosshair as "Chat_1". Pick it in Settings ▸ CROSSHAIR.', { ok: true }); },
      });
      await c.move([540, 250]);
    },
  };

  /* ───────── 4. Match History and Progress ───────── */
  // [name, map · mode · server, played, length, K, D, other players (search only)]
  const NEW_MATCH = ["plum-dock-wave", "Castle · Teams · US East", "Nov 21 · 19:42", "5m 5s", 14, 6, "masterchick79 eggpro64 birdnoob1 shellshock99 sunnyside7 hardboiled poachedpro"];
  const MATCHES = [
    ["Scrim vs Yolk Squad", "fern-gale-coin · Dirt · Capture the Spatula · US East", "Nov 21 · 18:57", "9m 12s", 9, 7, "masterchick79 sunnyside7 eggpro64"],
    ["lime-rust-hawk", "Shipyard · Free for All · US Central", "Nov 20 · 21:16", "6m 40s", 21, 11, "crackedjack sizzlepan omeletdu"],
    ["pine-sock-volt", "Castle · King of the Coop · US East", "Nov 20 · 20:31", "8m 2s", 6, 8, "henhouse scrambler eggward"],
    ["dawn-mint-grit", "Moonbase · Teams · Germany", "Nov 19 · 22:05", "5m 48s", 12, 5, "masterchick79 birdnoob1 yolkster"],
    ["reef-tusk-glow", "Castle · Teams · US East", "Nov 19 · 21:12", "5m 31s", 17, 9, "benedict shellby fryday"],
    ["jade-fork-loom", "Dirt · Free for All · US West", "Nov 18 · 19:03", "7m 15s", 10, 10, "frypan kluckers"],
  ];
  const hrow = (m, cls = "") =>
    `<div class="hr${cls}" data-s="${esc(`${m[0]} ${m[1]} ${m[6]}`.toLowerCase())}"><div><div class="hr-name">${esc(m[0])}</div><div class="hr-sub">${esc(m[1])}</div></div>` +
    `<div class="hr-when"><b>${m[2]}</b><small>${m[3]}</small></div><div class="hr-kd"><b>${m[4]} / ${m[5]}</b><small>KDR ${(m[4] / Math.max(1, m[5])).toFixed(2)}</small></div></div>`;

  const progressHTML = () => {
    const R = rng(57);
    const M = [];
    for (let i = 0; i < 49; i++) { // KDR climbing from about 1.4 to 2.5, with match-to-match noise
      const kdr = Math.max(0.35, 1.4 + 1.1 * (i / 48) + (R() - 0.5) * 1.5);
      const d = 3 + Math.floor(R() * 8);
      M.push({ k: Math.round(kdr * d), d });
    }
    M.push({ k: 14, d: 6 }); // the match just played
    const W = 660, H = 170, L = 40, RM = 14, T = 12, B = 26, pw = W - L - RM, ph = H - T - B;
    const kd = m => m.k / Math.max(1, m.d);
    const top = Math.max(4, Math.ceil(Math.max(...M.map(kd))));
    const X = i => r2(L + (i / (M.length - 1)) * pw);
    const Y = v => r2(T + ph - (Math.min(v, top) / top) * ph);
    let s = "";
    [0, top / 2, top].forEach(v => { s += `<line class="grid-l" x1="${L}" x2="${W - RM}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 9}" y="${Y(v) + 3.5}" text-anchor="end">${v}</text>`; });
    s += `<line class="even" x1="${L}" x2="${W - RM}" y1="${Y(1)}" y2="${Y(1)}"/><text x="${W - RM}" y="${Y(1) - 5}" text-anchor="end">Even</text>`;
    const avg = M.map((_, i) => {
      const w = M.slice(Math.max(0, i - 4), i + 1);
      return w.reduce((a, m) => a + m.k, 0) / Math.max(1, w.reduce((a, m) => a + m.d, 0));
    });
    s += M.slice(0, -1).map((m, i) => `<circle class="dot" cx="${X(i)}" cy="${Y(kd(m))}" r="4" style="--i:${i}"/>`).join("");
    s += `<path class="avg" pathLength="1" d="M${avg.map((v, i) => `${X(i)},${Y(v)}`).join("L")}"/>`;
    s += `<circle class="dot hi" cx="${X(M.length - 1)}" cy="${Y(kd(M[M.length - 1]))}" r="5.5" style="--i:${M.length - 1}"/>`;
    s += `<text x="${L}" y="${H - 6}">Older</text><text x="${W - RM}" y="${H - 6}" text-anchor="end">Latest</text>`;
    const sum = a => a.reduce((x, m) => [x[0] + m.k, x[1] + m.d], [0, 0]);
    const [k1, d1] = sum(M.slice(-10));
    const [k0, d0] = sum(M.slice(0, -10));
    const table = (title, col, rows) =>
      `<div class="pcard"><div class="team-hdr"><span class="team-name">${title}</span></div><table class="pt"><thead><tr><th>${col}</th><th>Matches</th><th>KDR</th></tr></thead>` +
      `<tbody>${rows.map(([n, g, k]) => `<tr><td>${n}</td><td>${g}</td><td>${k}</td></tr>`).join("")}</tbody></table></div>`;
    return '<div class="prog" hidden><div class="pcard"><div class="team-hdr"><span class="team-name">KDR by match</span><span class="team-info">last 50 of 57 matches</span>' +
      '<span class="seg"><span class="on">KDR</span><span>Kills</span></span></div>' +
      `<svg class="chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">${s}</svg>` +
      `<div class="prog-foot"><span>Dots: each match with 2+ kills or 3+ deaths · line: average of the last 5</span><span class="trend">Last 10: KDR ${(k1 / d1).toFixed(2)} · before them: ${(k0 / d0).toFixed(2)}</span></div></div>` +
      '<div class="ptbls">' +
      table("By map", "Map", [["Castle", 21, "2.31"], ["Shipyard", 11, "1.84"], ["Moonbase", 9, "2.12"], ["Dirt", 9, "1.62"]]) +
      table("By mode", "Mode", [["Teams", 27, "2.24"], ["Free for All", 12, "1.71"], ["Capture the Spatula", 7, "2.05"], ["King of the Coop", 4, "1.38"]]) +
      "</div></div>";
  };

  const HISTORY = {
    name: "Match History",
    hold: 2800,
    rest: [560, 470],
    html() {
      return `<div class="sp"><div class="sp-head"><span class="sp-name">Match History</span><span class="spc">` +
        '<span class="c strong" data-c="games">56 games · last 100 saved</span><span class="c" data-c="kd">598 / 295</span><span class="c strong">KDR 2.03</span></span>' +
        `<span class="sp-acts"><i class="sb2" data-a="prog">${ico("chart")}</i><i class="sb2">${ico("dl")}</i><i class="sb2 danger">${ico("trash")}</i><i class="sb2 danger">${ico("x")}</i></span></div>` +
        `<div class="hist"><div class="sp-filters"><span class="sp-search">${ico("search")}<span class="q" data-ph="Search matches, players, maps…"></span><i class="caret"></i></span>` +
        `<span class="dd">All modes${ico("chev")}</span><span class="dd">All maps${ico("chev")}</span><span class="dd">${ico("cal")}</span></div>` +
        '<div class="sp-colhd"><span>Match</span><span>Played</span><span>K / D</span></div>' +
        `<div class="sp-list">${MATCHES.map(m => hrow(m)).join("")}</div></div>${progressHTML()}</div>`;
    },
    async run(c) {
      const list = c.$(".sp-list");
      const games = c.$('[data-c="games"]');
      const ALL = "57 games · last 100 saved";
      const filter = q => {
        q = q.trim().toLowerCase();
        let n = 0;
        c.$$(".hr").forEach(r => { const ok = !q || r.dataset.s.includes(q); r.hidden = !ok; n += ok; });
        games.textContent = q ? `${n} of 57 games` : ALL;
      };

      c.step(0);
      await c.wait(1100);
      list.insertAdjacentHTML("afterbegin", hrow(NEW_MATCH, " new"));
      games.textContent = ALL;
      c.$('[data-c="kd"]').textContent = "612 / 301";
      await c.wait(1900);

      c.step(1);
      const sr = c.$(".sp-search");
      await c.click(sr, { fx: 0.3, then: () => sr.classList.add("focus") });
      await c.type(sr, "master", { speed: 120, each: filter });
      await c.wait(1900);

      c.step(2);
      await c.key("Esc", sr, { fx: 0.3 });
      sr.querySelector(".q").textContent = "";
      sr.classList.remove("focus");
      filter("");
      await c.wait(600);
      await c.click(c.$('[data-a="prog"]'), {
        then: () => {
          c.$(".sp-name").textContent = "Progress";
          c.$(".hist").hidden = true;
          c.$(".prog").hidden = false;
          c.$(".sp-acts").innerHTML = `<i class="sb2">${ico("list")}</i><i class="sb2 danger">${ico("x")}</i>`;
        },
      });
      await c.wait(700);
      c.cursorOff();
      await c.wait(3200);
    },
  };

  /* ───────── 5. Share: Copy as Text into a group chat ───────── */
  const TEAMS = [
    { name: "Blue Team", cls: "blue", p: [{ n: "YolkLord2", k: 14, d: 6, me: true }, { n: "EggPro64", k: 11, d: 7 }, { n: "BirdNoob1", k: 7, d: 9 }, { n: "ShellShock99", k: 4, d: 10 }] },
    { name: "Red Team", cls: "red", p: [{ n: "MasterChick79", k: 12, d: 8 }, { n: "SunnySide7", k: 9, d: 10 }, { n: "HardBoiled", k: 8, d: 9 }, { n: "PoachedPro", k: 3, d: 9 }] },
  ];
  const kdr = p => (p.k / Math.max(1, p.d)).toFixed(2);
  /* 09-stats-ui _stMatchText: per team a line, then #, Player, K, D, KDR in columns two spaces apart. */
  const matchText = () => TEAMS.map(t => {
    const rows = [...t.p].sort((a, b) => b.k - a.k || a.d - b.d)
      .map((p, i) => [String(i + 1), (p.n.length > 20 ? p.n.slice(0, 19) + "…" : p.n) + (p.me ? " (me)" : ""), String(p.k), String(p.d), kdr(p)]);
    const all = [["#", "Player", "K", "D", "KDR"], ...rows];
    const wd = all[0].map((_, j) => Math.max(...all.map(r => r[j].length)));
    const line = r => r.map((v, j) => (j === 1 ? v.padEnd(wd[j]) : v.padStart(wd[j]))).join("  ").trimEnd();
    return [`${t.name} · ${t.p.length} players`, ...all.map(line)].join("\n");
  }).join("\n\n");
  const teamHTML = t =>
    `<div class="team ${t.cls}"><div class="team-hdr"><span class="team-name">${t.name}</span><span class="team-info">${t.p.length} players</span></div>` +
    '<table><thead><tr><th>#</th><th>Player</th><th>K</th><th>D</th><th>KDR</th></tr></thead><tbody>' +
    t.p.map((p, i) => `<tr${p.me ? ' class="me"' : ""}><td class="rk">${i + 1}</td><td>${p.n}</td><td>${p.k}</td><td>${p.d}</td><td>${kdr(p)}</td></tr>`).join("") +
    "</tbody></table></div>";

  const SHARE = {
    name: "Copy as Text",
    hold: 3400,
    rest: [300, 420],
    html() {
      const chips = ["Castle", "US East", "Teams", "Nov 21 · 19:42", "5m 5s"].map(t => `<span class="c">${t}</span>`).join("");
      return `<div class="gscene paused">${WORLD}</div><div class="sp fit"><div class="sp-head"><span class="spc"><span class="c strong">plum-dock-wave</span>${chips}</span>` +
        `<span class="sp-acts"><i class="sb2" data-a="text">${ico("copytext")}</i><i class="sb2">${ico("image")}</i><i class="sb2">${ico("dl")}</i><i class="sb2 danger">${ico("x")}</i></span></div>` +
        `<div class="teams">${TEAMS.map(teamHTML).join("")}</div></div>` +
        '<div class="dc"><div class="dc-head"><span>#</span>scrim-results</div><div class="dc-msgs">' +
        '<div class="dc-msg"><span class="dc-av">E</span><div><div class="dc-name">EggPro64<small>Today at 19:46</small></div><div class="dc-text">who won the scrim?</div></div></div>' +
        '</div><div class="dc-input">Message #scrim-results</div></div>';
    },
    async run(c) {
      c.step(0);
      await c.wait(1600);

      c.step(1);
      await c.click(c.$('[data-a="text"]'), { then: () => c.toast("Match copied as text.", { ok: true }) });
      await c.wait(1300);

      c.step(2);
      c.toastsOut();
      c.$(".sp").classList.add("back");
      c.$(".dc").classList.add("in");
      await c.wait(800);
      const inp = c.$(".dc-input");
      await c.click(inp, { fx: 0.3, then: () => inp.classList.add("focus") });
      await c.key("Ctrl + V", inp, { fx: 0.3 });
      c.$(".dc-msgs").insertAdjacentHTML("beforeend",
        '<div class="dc-msg"><span class="dc-av egg"><svg aria-hidden="true"><use href="#egg"/></svg></span><div><div class="dc-name">YolkLord2<small>Today at 19:48</small></div>' +
        '<div class="dc-text"><b>plum-dock-wave</b> · Castle · US East · Teams · Nov 21 · 19:42 · 5m 5s</div>' +
        `<pre class="dc-code">${esc(matchText())}</pre></div></div>`);
      inp.classList.remove("focus");
      await c.wait(700);
      c.cursorOff();
      await c.wait(600);
    },
  };

  /* ───────── 6. FPS: Smart Auto Detail and FPS Check ───────── */
  const FC_DLG =
    '<div class="dlg-ov" data-dlg="fc" hidden><div class="dlg fc"><p class="dlg-t">FPS Check</p><p class="dlg-p">Found one thing holding your FPS back.</p><div class="fc-body">' +
    '<p class="fc-sub">Worth fixing</p><div class="fc-item"><b>Your faster graphics card isn\'t being used</b>The game runs on Intel UHD Graphics 620, but this PC also has an NVIDIA graphics card. ' +
    "In Windows Settings ▸ System ▸ Display ▸ Graphics, set your browser to High performance, then restart the browser.</div>" +
    '<p class="fc-sub">Might help</p><div class="fc-item"><b>Raise Render Scale</b>It\'s above, in FPS &amp; Ping. At 1.5 the game draws two-thirds of the width and height: a softer picture, but far fewer pixels to draw.</div>' +
    '<div class="fc-item act"><div><b>Turn on Disable Anti-Aliasing</b>It\'s above, in FPS &amp; Ping. Edges look a little more jagged, but weaker graphics can gain a lot of FPS. Press F5 after turning it on.</div>' +
    '<span class="gbtn blue fc-act">Turn it on</span></div>' +
    '<p class="fc-sub">Details</p><dl class="fc-facts"><dt>Graphics</dt><dd>Intel UHD Graphics 620</dd><dt>Frame rate in the menu</dt><dd>36 FPS</dd>' +
    "<dt>Last match</dt><dd>41 FPS on average, 28 at the lowest</dd><dt>Smart Auto Detail</dt><dd>On, at 85% now</dd><dt>Anti-aliasing</dt><dd>On</dd><dt>Power</dt><dd>Plugged in</dd></dl>" +
    '</div><div class="dlg-foot"><span class="gbtn yolk">Copy</span><span class="gbtn blue">Close</span></div></div></div>';
  const fy = v => r2(96 - (clamp(v, 0, 80) / 80) * 88 - 4); // the graph's 0-80 FPS scale

  const FPS = {
    name: "Smart Auto Detail",
    hold: 4200,
    rest: [600, 300],
    html() {
      return `<div class="gscene">${WORLD}<div class="ro box"><h5>FPS</h5><p class="fpsv">60</p><h5>Ping</h5><p>38</p></div>` +
        '<div class="banner" hidden>Cracked by MasterChick79</div>' +
        '<div class="fpsg"><div class="fpsg-top"><b>Your FPS</b><span class="pill state">Smart Auto Detail: watching</span><span class="pill res">Resolution <b>100%</b></span></div>' +
        `<svg viewBox="0 0 650 96" preserveAspectRatio="none" aria-hidden="true"><rect class="zone" x="0" y="${fy(40)}" width="650" height="${r2(96 - fy(40))}"/>` +
        `<line class="l40" x1="0" x2="650" y1="${fy(40)}" y2="${fy(40)}"/><text class="l40t" x="6" y="${r2(fy(40) - 5)}">40 FPS</text>` +
        '<path class="ar" d=""/><path class="ln" d=""/><g class="mks"></g></svg></div></div>' + FC_DLG;
    },
    async run(c) {
      const R = rng(7);
      const N = 60;
      const X = i => r2((i / (N - 1)) * 650);
      const buf = Array.from({ length: N }, () => 57 + R() * 5);
      const marks = [];
      const ln = c.$(".fpsg .ln");
      const ar = c.$(".fpsg .ar");
      const mks = c.$(".fpsg .mks");
      const fv = c.$(".fpsv");
      const st = c.$(".pill.state");
      const draw = () => {
        const pts = buf.map((v, i) => `${X(i)},${fy(v)}`).join("L");
        ln.setAttribute("d", "M" + pts);
        ar.setAttribute("d", `M0,96L${pts}L650,96Z`);
        mks.innerHTML = marks.filter(m => m.i >= 0)
          .map(m => `<line class="mk" x1="${X(m.i)}" x2="${X(m.i)}" y1="4" y2="94"/><text class="mkt" x="${r2(X(m.i) + 5)}" y="14">${m.t}</text>`).join("");
      };
      const tick = async (lo, hi, n) => { // one sample every 200 ms, the graph scrolling left
        for (let j = 0; j < n; j++) {
          const v = lo + R() * (hi - lo);
          buf.push(v);
          buf.shift();
          marks.forEach(m => m.i--);
          fv.textContent = Math.round(v);
          fv.classList.toggle("low", v < 40);
          draw();
          await c.wait(200);
        }
      };
      const state = (cls, text) => { st.className = "pill state" + (cls ? " " + cls : ""); st.textContent = text; };

      draw();
      c.step(0);
      await tick(57, 62, 11);

      c.step(1);
      await tick(41, 47, 2);
      state("warn", "Under 40 FPS: waiting for a safe moment");
      await tick(28, 36, 15);

      c.step(2);
      c.$(".banner").hidden = false;
      state("wait", "You're cracked: a safe moment to change");
      await tick(41, 46, 3);
      marks.push({ i: N - 1, t: "85%" });
      c.$(".pill.res b").textContent = "85%";
      c.$(".gscene").classList.add("lowres");
      c.toast("Smart Auto Detail lowered the resolution to 85% (FPS was 34).");
      await tick(43, 48, 6);
      c.$(".banner").hidden = true;
      state("", "85% helps: keeping it");
      await tick(50, 56, 13);

      c.step(3);
      c.toastsOut();
      c.$(".gscene").classList.add("paused");
      await c.wait(500);
      const fc = c.$('[data-dlg="fc"]');
      fc.hidden = false;
      await c.wait(2600);
      const body = fc.querySelector(".fc-body");
      await c.move(body, { fx: 0.62, fy: 0.55 });
      const end = body.scrollHeight - body.clientHeight;
      for (let i = 1; end > 0 && i <= 20; i++) { // scroll down to the details, like a mouse wheel
        body.scrollTop = Math.round(end * easeIO(i / 20));
        await c.wait(40);
      }
      body.classList.add("end");
      await c.wait(1300);
      await c.move(c.$(".fc-act"));
      await c.wait(1400);
    },
  };

  /* ───────── 7. Server Picker on the home screen ───────── */
  const REG = [["Singapore", 214], ["US West", 92], ["Sydney", 236], ["US Central", 61], ["US East", 38], ["Germany", 121], ["Chile", 158]];
  const CLOUDS = [[30, 96, 54], [120, 74, 62], [230, 92, 50], [330, 70, 66], [440, 94, 52], [540, 72, 60], [650, 92, 56]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");

  const SERVERS = {
    name: "Server Picker",
    hold: 2400,
    rest: [520, 150],
    html() {
      return `<div class="home"><svg class="clouds-mini" viewBox="0 0 700 120" preserveAspectRatio="none" aria-hidden="true"><g fill="#fff">${CLOUDS}<rect y="92" width="700" height="28"/></g></svg>` +
        '<div class="home-btns"><div class="gm"><b>Game Mode</b><span>Teams</span></div><div class="gm srv"><b>Server</b><span class="cur">Germany</span>' +
        `<div class="gm-list" hidden>${REG.map(([n]) => `<div class="gm-opt${n === "Germany" ? " sel" : ""}"><span class="ck">✓</span>${n}<span class="ping">-</span></div>`).join("")}</div>` +
        "</div></div></div>";
    },
    async run(c) {
      const srv = c.$(".gm.srv");
      const list = c.$(".gm-list");
      const opts = c.$$(".gm-opt");
      const R = rng(3);
      const setPing = (o, ms) => {
        const p = o.querySelector(".ping");
        p.textContent = ms + "ms";
        p.className = "ping " + (ms < 80 ? "g" : ms < 150 ? "y" : "r");
      };
      const jitter = () => opts.forEach((o, i) => setPing(o, REG[i][1] + Math.round((R() - 0.5) * 6)));

      c.step(0);
      await c.wait(800);
      await c.click(srv, { then: () => { srv.classList.add("open"); list.hidden = false; } });
      await c.move([c.w * 0.85, c.h * 0.42]);
      for (const i of [4, 3, 1, 5, 6, 0, 2]) { // the nearest regions answer first
        setPing(opts[i], REG[i][1]);
        await c.wait(170);
      }
      await c.wait(600);

      c.step(1);
      opts[5].classList.remove("sel");
      opts[4].classList.add("sel", "best");
      c.toast("Switched to US East (38 ms), the region with the lowest ping.");
      for (let k = 0; k < 3; k++) { await c.wait(500); jitter(); }
      srv.classList.remove("open");
      list.hidden = true;
      srv.querySelector(".cur").textContent = "US East";
      await c.wait(900);
    },
  };

  const DEFS = { tour: TOUR, crosshair: CROSSHAIR, chat: CHAT, history: HISTORY, share: SHARE, fps: FPS, servers: SERVERS };

  /* ───────── Start the demos: only while at least 30% on screen ───────── */
  document.querySelectorAll(".stage[data-demo]").forEach(stage => {
    const def = DEFS[stage.dataset.demo];
    if (!def) return;
    try { BH.demos.push(new Demo(stage, def)); } catch (e) { console.error(e); }
  });
  const sio = new IntersectionObserver(entries => {
    for (const e of entries) {
      const d = e.target._demo;
      if (!d) continue;
      if (e.intersectionRatio >= 0.3) { d.visible = true; d.start(); }
      else if (e.intersectionRatio < 0.08) { d.visible = false; d.stop(); }
    }
  }, { threshold: [0, 0.08, 0.3] });
  BH.demos.forEach(d => sio.observe(d.stage));
  document.addEventListener("visibilitychange", () => BH.demos.forEach(d => (document.hidden ? d.stop() : d.start())));
  const onReduce = () => BH.demos.forEach(d => {
    if (d.ctl) { d.ctl.abort(); d.ctl = null; }
    d.userPaused = false;
    d.shownStatic = false;
    d.mode = "";
    d.setState(reduce.matches ? "static" : "playing");
    d.start();
  });
  if (reduce.addEventListener) reduce.addEventListener("change", onReduce);

  /* ───────── Page: nav, active section, reveal on scroll, logo entrance ───────── */
  // Smooth the page's vertical wheel input. Touch, keyboard and anchor navigation stay native.
  const enableSmoothWheel = () => {
    const scroller = document.scrollingElement;
    if (!scroller) return;
    let frame = null;
    let target = 0;
    let position = 0;
    let lastScrollY = 0;
    let lastFrameTime = 0;

    const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };

    const draw = time => {
      if (reduce.matches || Math.abs(scrollY - lastScrollY) > 1) {
        stop();
        return;
      }

      target = clamp(target, 0, maxScroll());
      const distance = target - position;
      const settled = Math.abs(distance) <= .5;
      const elapsed = clamp(time - lastFrameTime, 0, 50);
      // Time-based easing keeps the same feel at different refresh rates.
      position = settled ? target : position + distance * (1 - Math.exp(-elapsed / 65));
      scrollTo({ top: position, behavior: "instant" });
      lastScrollY = scrollY;
      lastFrameTime = time;
      frame = settled ? null : requestAnimationFrame(draw);
    };

    const hasLocalScroll = event => {
      for (const el of event.composedPath()) {
        if (el === scroller || el === document.body) break;
        if (!(el instanceof Element)) continue;
        if (el.matches("input, select, textarea") || el.isContentEditable) return true;
        if (el.scrollHeight > el.clientHeight && /^(auto|scroll|overlay)$/.test(getComputedStyle(el).overflowY)) return true;
      }
      return false;
    };

    addEventListener("wheel", event => {
      // Read deltaMode first so line and page deltas stay in their original units.
      const mode = event.deltaMode;
      if (reduce.matches || event.defaultPrevented || !event.cancelable ||
          event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
          !event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || hasLocalScroll(event)) {
        stop();
        return;
      }

      const delta = event.deltaY * (mode === 1 ? 24 : mode === 2 ? innerHeight : 1);
      const current = scrollY;
      if (frame !== null && Math.abs(current - lastScrollY) > 1) stop();
      // Reverse from the current position so an earlier wheel burst cannot fight the new direction.
      const origin = frame !== null && delta * (target - current) > 0 ? target : current;
      const destination = clamp(origin + delta, 0, maxScroll());
      if (frame === null && destination === current) return;

      event.preventDefault();
      target = destination;
      if (frame !== null) return;
      scrollTo({ top: current, behavior: "instant" });
      position = lastScrollY = scrollY;
      lastFrameTime = performance.now();
      frame = requestAnimationFrame(draw);
    }, { passive: false });

    for (const type of ["pointerdown", "keydown", "hashchange", "popstate"]) {
      addEventListener(type, stop, { passive: true });
    }
    document.addEventListener("visibilitychange", stop);
    if (reduce.addEventListener) reduce.addEventListener("change", stop);
  };
  enableSmoothWheel();

  const nav = document.getElementById("nav");
  const onScroll = () => nav && nav.classList.toggle("solid", scrollY > 30);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll(".nav-links a")];
  const alias = { share: "stats" };
  const nio = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const id = alias[e.target.id] || e.target.id;
      links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + id));
    }
  }, { rootMargin: "-45% 0px -54% 0px" });
  document.querySelectorAll("main > section[id]").forEach(s => nio.observe(s));

  // Titles come in word by word: each word, with any tag or punctuation stuck to it, gets a .wd span and its place in
  // --w. Real spaces stay between the words, so the text reads the same to screen readers, find and copy.
  const splitWords = el => {
    const words = [];
    let cur = null;
    for (const node of [...el.childNodes]) {
      if (node.nodeType !== 3) { (cur = cur || []).push(node); continue; }
      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { if (cur) words.push(cur); cur = null; }
        else (cur = cur || []).push(document.createTextNode(part));
      }
    }
    if (cur) words.push(cur);
    el.textContent = "";
    words.forEach((nodes, i) => {
      if (i) el.append(" ");
      const w = document.createElement("span");
      w.className = "wd";
      w.style.setProperty("--w", i);
      w.append(...nodes);
      el.append(w);
    });
  };
  try {
    document.querySelectorAll(".hero-title, .scene-copy h2, h2.rvg").forEach(splitWords);
    // Steps and buttons come in one after another (--i).
    document.querySelectorAll(".steps, .ctas").forEach(list => [...list.children].forEach((el, i) => el.style.setProperty("--i", i)));
  } catch (e) { console.error(e); }

  // Reveal: what comes on screen together comes in together, top to bottom and left to right, one beat apart (--d);
  // a big batch is squeezed so its last item still starts within about 0.6 s.
  const rio = new IntersectionObserver(entries => {
    const batch = entries.filter(e => e.isIntersecting && !e.target.classList.contains("revisit")).map(e => {
      const r = e.target.getBoundingClientRect();
      return { el: e.target, row: Math.round(r.top / 12), left: r.left };
    });
    batch.sort((a, b) => a.row - b.row || a.left - b.left);
    const f = batch.length > 8 ? 7 / (batch.length - 1) : 1;
    batch.forEach(({ el }, k) => {
      el.style.setProperty("--d", r2(k * f));
      el.classList.add("in");
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  const rearmReveal = target => {
    if (reduce.matches || target.contains(document.activeElement)) return;
    target.classList.add("revisit");
    target.classList.remove("in");
  };

  // Re-entry uses the whole viewport. Wait out any entrance that temporarily moves its target offscreen.
  const xio = new IntersectionObserver(entries => {
    if (reduce.matches) return;
    for (const { target, isIntersecting } of entries) {
      const classes = target.classList;
      if (isIntersecting) {
        if (classes.contains("revisit")) classes.add("in");
      } else if (classes.contains("in") && !target.contains(document.activeElement)) {
        const entrance = target.getAnimations().find(
          animation => animation.animationName?.startsWith("rv-") && animation.playState === "running"
        );
        if (!entrance) {
          rearmReveal(target);
          continue;
        }
        entrance.finished.then(() => {
          const { top, bottom } = target.getBoundingClientRect();
          if (bottom <= 0 || top >= innerHeight) rearmReveal(target);
        }, () => {});
      }
    }
  }, { threshold: 0 });
  // Keyboard: whatever gets focus is shown at once, even before its reveal line.
  document.addEventListener("focusin", e => {
    const el = e.target.closest && e.target.closest(".rv, .rvg");
    if (el && !el.classList.contains("in")) { el.style.setProperty("--d", 0); el.classList.add("in"); }
  });
  // At the very end of the page nothing can scroll past the line 8% above the bottom: show whatever is left.
  addEventListener("scroll", () => {
    if (innerHeight + scrollY < document.documentElement.scrollHeight - 4) return;
    document.querySelectorAll(".rv:not(.in), .rvg:not(.in)").forEach(el => {
      if (el.getBoundingClientRect().bottom > 0) el.classList.add("in");
    });
  }, { passive: true });
  BH.page = true; // the head script keeps html.motion only once this is set
  if (reduce.addEventListener) reduce.addEventListener("change", () => root.classList.toggle("motion", !reduce.matches));

  /* ───────── "New in 6.7": one whole tag at a time ───────── */
  // Without the script the strip scrolls (CSS). Here it slides one tag to the left, so the next tag starts just past
  // the label, then rests. After the last tag it shows the first one again (from the second copy) and jumps home
  // unseen. It waits while the mouse is over the tags, off screen, in a hidden tab, with reduced motion, or paused.
  try {
    const ticker = document.querySelector(".ticker");
    const track = ticker && ticker.querySelector(".ticker-track");
    const win = ticker && ticker.querySelector(".ticker-win");
    if (track && win && track.children.length > 1) {
      const tags = [...track.querySelectorAll(".tk")];
      const n = track.children[0].children.length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tk-btn";
      ticker.append(btn);
      ticker.classList.add("step");
      let k = 0, timer = 0, over = false, seen = false, paused = false;
      const place = slide => {
        track.style.transition = slide ? "transform .65s cubic-bezier(.65, 0, .35, 1)" : "none";
        track.style.transform = `translateX(${-tags[k].offsetLeft}px)`;
      };
      const plan = () => {
        clearTimeout(timer);
        timer = seen && !over && !paused && !document.hidden && !reduce.matches ? setTimeout(next, 2700) : 0;
      };
      const next = () => {
        if (k >= n) { k -= n; place(false); void track.offsetWidth; }
        k++;
        place(true);
        plan();
      };
      const label = () => {
        btn.innerHTML = ico(paused ? "play" : "pause");
        btn.setAttribute("aria-label", `${paused ? "Play" : "Pause"} the new features`);
      };
      btn.addEventListener("click", () => { paused = !paused; label(); plan(); });
      win.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") { over = true; plan(); } });
      win.addEventListener("pointerleave", () => { over = false; plan(); });
      new IntersectionObserver(([e]) => { seen = e.isIntersecting; plan(); }).observe(ticker);
      document.addEventListener("visibilitychange", plan);
      if (reduce.addEventListener) reduce.addEventListener("change", () => { k = 0; place(false); plan(); });
      // Tag widths change when the fonts arrive and at the breakpoints: keep the resting tag in place.
      if ("ResizeObserver" in window) new ResizeObserver(() => place(false)).observe(track);
      else addEventListener("resize", () => place(false));
      label();
      place(false);
    }
  } catch (e) { console.error(e); }

  // The hero comes in once its fonts are in (at most 1.5 s), and the reveals start with it.
  const ready = () => {
    root.classList.add("ready");
    document.querySelectorAll(".rv, .rvg").forEach(el => { rio.observe(el); xio.observe(el); });
  };
  const fontLoad = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('400 100px "Luckiest Guy"', "BETTER HUD"), document.fonts.ready]) : Promise.resolve();
  Promise.race([fontLoad, new Promise(r => setTimeout(r, 1500))]).then(ready, ready);
})();
