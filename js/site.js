/* ABC Design Israel · site behaviour. Header from MV:hd8 (capsule + headroom), hero entrance from MV:h3 (inView, not an observer),
   the reveal from engine/motion.md 2, and the four approved moves: the balloon string (MV:g25 + a drawn stroke, the signature),
   MV:g152 (images open inside the statement), MV:g05 (the Flash photo changes with its points), MV:g12 (the family floats). */
(function () {
  "use strict";
  var WA = "https://wa.me/972524312213";   // TODO(Kobi): confirm this is ABC's number (it is Baby Boss's and the old ABC site's)

  /* ---------- WhatsApp: every link carries its own message (copy, shared components) ---------- */
  function waHref(msg) { return WA + "?text=" + encodeURIComponent(msg); }
  document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = waHref(a.getAttribute("data-wa")); });

  /* ---------- year in the footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- headroom: hides on the way down, comes back on the first move up (library/headers.md) ---------- */
  function headroom(el) {
    var tol = 6, last = 0, raf = 0;
    function upd() {
      raf = 0;
      var y = window.scrollY, d = y - last, top = el.offsetHeight + 24;
      el.classList.toggle("is-scrolled", y > 8);
      // hold: an open menu, or keyboard focus inside the header, keeps it on screen
      var hold = el.classList.contains("menu-open") || !!el.querySelector(":focus-visible");
      if (y <= top || hold) { el.classList.remove("is-hidden"); last = y; return; }
      if (Math.abs(d) < tol) return;
      el.classList.toggle("is-hidden", d > 0);
      last = y;
    }
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    el.addEventListener("focusin", upd);
    last = window.scrollY; upd();
  }

  /* ---------- MV:hd8: the capsule opens into the menu (copied from the vault) ---------- */
  var hd = document.getElementById("hd");
  if (hd) {
    var t = hd.querySelector(".h8-toggle"), label = t.querySelector("span"), panel = document.getElementById("h8p");
    var links = [].slice.call(panel.querySelectorAll("a"));
    panel.querySelectorAll(".h8-links a").forEach(function (a, i) { a.style.setProperty("--i", i); });
    headroom(hd);
    var set = function (open, kb) {
      hd.classList.toggle("menu-open", open); t.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "סגירה" : "תפריט"; panel.inert = !open;
      // focus moves into the card only when it was opened from the keyboard; a mouse user keeps their place
      if (open && kb) setTimeout(function () { links[0].focus({ preventScroll: true }); }, 120);
    };
    set(false);
    t.addEventListener("click", function (e) { set(!hd.classList.contains("menu-open"), e.detail === 0); });
    links.forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
    document.addEventListener("click", function (e) { if (!hd.contains(e.target)) set(false); });
    hd.addEventListener("keydown", function (e) { if (e.key === "Escape" && hd.classList.contains("menu-open")) { set(false); t.focus(); } });
    // Tab past the last link: the card closes instead of staying open over the page
    var tab = false;
    hd.addEventListener("keydown", function (e) { if (e.key === "Tab") { tab = true; setTimeout(function () { tab = false; }, 0); } });
    hd.addEventListener("focusout", function (e) {
      if (!hd.classList.contains("menu-open")) return;
      var to = e.relatedTarget;
      if (to ? !hd.contains(to) && !to.contains(hd) : tab) set(false);
    });
  }

  /* ---------- in view = fire, measured directly (an observer does not update in a throttled tab) ---------- */
  function inView(el, f, at) {
    var ro;
    function chk() { var r = el.getBoundingClientRect(); if (r.top < innerHeight * (at || .9) && r.bottom > 0) { off(); f(); } }
    function off() { removeEventListener("scroll", chk); removeEventListener("resize", chk); if (ro) ro.disconnect(); }
    addEventListener("scroll", chk, { passive: true }); addEventListener("resize", chk);
    if (window.ResizeObserver) { ro = new ResizeObserver(chk); ro.observe(document.body); }
    requestAnimationFrame(chk); setTimeout(chk, 300);
  }

  var hero = document.getElementById("hero");
  if (hero) inView(hero, function () { hero.classList.add("is-in"); });
  var ft = document.getElementById("ft");
  if (ft) inView(ft, function () { ft.classList.add("is-in"); }, .85);

  /* ---------- the reveal, exactly as engine/motion.md 2 ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- floating WhatsApp: after the hero, and away again where the page already offers it ---------- */
  // on a phone the whole bar steps aside (its accessibility button lives in the header meanwhile); wider, only WhatsApp does
  var fab = document.querySelector(".fab-wa"), fabs = document.getElementById("fabs");
  if (fab && fabs && hero && "IntersectionObserver" in window) {
    // a hero with no buttons of its own (the About page) does not hide it: WhatsApp is the way to talk there too
    var blockers = [hero.querySelector(".cta") ? hero : null, document.getElementById("closing"), ft].filter(Boolean);
    var shown = new Set();
    var setOff = function (off) { fab.classList.toggle("is-off", off); fabs.classList.toggle("is-off", off); fabs.inert = off && innerWidth < 768; };
    setOff(true);
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) shown.add(en.target); else shown.delete(en.target); });
      setOff(shown.size > 0);
    }, { threshold: 0 });
    blockers.forEach(function (el) { fo.observe(el); });
  }

  /* ---------- the wipe: the chosen photo wipes in over the last one (the Flash colours, and the Ping page) ---------- */
  var wipeZ = 1;
  function wipe(figs, key, attr) {
    figs.forEach(function (fig) {
      var on = fig.getAttribute(attr) === key;
      if (on) { if (fig.classList.contains("is-on")) return; fig.style.zIndex = ++wipeZ; fig.classList.remove("is-going"); fig.classList.add("is-on"); }
      // the one being covered stays whole under the wipe, and lets go when the wipe has passed it
      else if (fig.classList.contains("is-on")) { fig.classList.remove("is-on"); fig.classList.add("is-going"); setTimeout(function () { if (!fig.classList.contains("is-on")) fig.classList.remove("is-going"); }, 950); }
    });
  }
  if (document.querySelector(".co-img") && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("co-anim");

  /* ---------- Flash and high-chair pages · colours: the chosen colour wipes in, and WhatsApp carries it.
     A page names its own message in data-wa-tpl, {c} standing for the colour; the Flash keeps its own ---------- */
  var coImgs = [].slice.call(document.querySelectorAll(".co-img"));
  var coBtn = document.getElementById("co-btn"), coName = document.getElementById("co-name");
  if (coImgs.length && coBtn) {
    var coTpl = coBtn.getAttribute("data-wa-tpl");
    document.querySelectorAll('.co-pick input[name="color"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        var name = inp.getAttribute("data-name");
        wipe(coImgs, inp.value, "data-color");
        coName.textContent = name;
        coBtn.href = waHref(coTpl ? coTpl.replace("{c}", name) : "היי, אשמח לשמוע על הפלאש בצבע " + name);
      });
    });
  }

  /* ---------- Ping page · one choice for the whole page: the version, and then its colour ----------
     Every switch (the stage, the compare cards, the colours) sets the same state, and the state drives the stage photo,
     the cards, the colour photo and its swatches, every WhatsApp message and every "לרכישה" link */
  if (document.querySelector("[data-ping]")) {
    // TODO(Kobi): confirm "לרכישה" leads to these product pages on babyboss.co.il
    var BUY = { "p2-black": 6359702, "p2-green": 9069285, "tr-black": 9131089, "tr-green": 9131091, "tr-brown": 9131092 };
    var VN = { p2: "Ping 2", tr: "Ping 2 Trekking" }, CN = { black: "שחור", green: "ירוק", brown: "חום-אפור" };
    var P = { ver: "p2", color: "black", touched: false, picked: false };
    var heroFigs = [].slice.call(document.querySelectorAll(".p-hero .co-img")), colFigs = [].slice.call(document.querySelectorAll(".colors .co-img"));
    var pLabel = document.getElementById("pco-label"), pBtn = document.getElementById("pco-btn");
    var lat = function (txt) { var e = document.createElement("span"); e.className = "lat"; e.textContent = txt; return e; };
    var render = function () {
      var v = P.ver, c = P.color, name = VN[v];
      document.querySelectorAll("[data-ver]").forEach(function (i) { i.checked = i.value === v; });
      document.querySelectorAll("[data-card]").forEach(function (card) {
        var on = card.getAttribute("data-card") === v;
        card.classList.toggle("is-sel", on);
        card.querySelector("[data-ver-btn]").setAttribute("aria-pressed", String(on));
      });
      document.querySelectorAll("[data-ver-name]").forEach(function (e) { e.textContent = name; });
      document.querySelectorAll(".co-pick [data-only]").forEach(function (l) { l.hidden = l.getAttribute("data-only") !== v; });
      document.querySelectorAll('.co-pick input[name="pcolor"]').forEach(function (i) { i.checked = i.value === c; });
      wipe(heroFigs, v, "data-key");
      wipe(colFigs, v + "-" + c, "data-key");
      pLabel.textContent = "";
      pLabel.append("אני רוצה את ה-", lat(name), " ב" + CN[c]);
      pBtn.href = waHref("היי, אשמח לשמוע על ה-" + name + " בצבע " + CN[c]);
      var msg = P.picked ? "היי, אשמח לשמוע על ה-" + name + " בצבע " + CN[c] : P.touched ? "היי, אשמח לשמוע על ה-" + name : "היי, אשמח לשמוע על טיולון ה-Ping 2";
      document.querySelectorAll("[data-wa-ping]").forEach(function (a) { a.href = waHref(msg); });
      var buy = "https://www.babyboss.co.il/items/" + BUY[v + "-" + (P.picked ? c : "black")];
      document.querySelectorAll("[data-buy]").forEach(function (a) { a.href = buy; });
    };
    var setVer = function (v) {
      P.ver = v; P.touched = true;
      if (v === "p2" && P.color === "brown") P.color = "black";   // brown-grey is made only for the Trekking
      render();
    };
    document.querySelectorAll("[data-ver]").forEach(function (i) { i.addEventListener("change", function () { setVer(i.value); }); });
    document.querySelectorAll("[data-ver-btn]").forEach(function (b) { b.addEventListener("click", function () { setVer(b.getAttribute("data-ver-btn")); }); });
    document.querySelectorAll('.co-pick input[name="pcolor"]').forEach(function (i) {
      i.addEventListener("change", function () { P.color = i.value; P.touched = P.picked = true; render(); });
    });
  }

  /* ---------- Flash page · adapter finder: a brand, an answer, and a WhatsApp message that names it ---------- */
  var fAns = document.getElementById("finder-ans"), fBtn = document.getElementById("finder-btn");
  if (fAns && fBtn) {
    document.querySelectorAll('.finder input[name="seat"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        var v = inp.value;
        // TODO(Kobi): the adapter's name and the models it fits, per brand
        if (v === "other") {
          fAns.textContent = "כתבו לנו איזה סלקל יש לכם, ונבדוק בשבילכם.";
          fBtn.href = waHref("היי, יש לי סלקל של מותג אחר. איזה מתאם מתאים לפלאש?");
        } else {
          fAns.innerHTML = "";
          fAns.appendChild(document.createTextNode("יש מתאם ל-"));
          var b = document.createElement("b"); b.className = "lat"; b.textContent = v; fAns.appendChild(b);
          fAns.appendChild(document.createTextNode("."));
          fBtn.href = waHref("היי, יש לי סלקל " + v + ". איזה מתאם מתאים לפלאש?");
        }
      });
    });
  }

  /* ---------- GSAP layer: the approved moves ---------- */
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;   // without GSAP: every photo shows, the heading is whole, all text reads
  gsap.registerPlugin(ScrollTrigger);
  if (typeof MotionPathPlugin !== "undefined") gsap.registerPlugin(MotionPathPlugin);
  if (typeof Flip !== "undefined") gsap.registerPlugin(Flip);

  /* ---------- the signature: the balloon's string (MV:g25 + a drawn stroke) ----------
     The string is tied to the Flash's handle in the hero. Scrolling draws it down the empty side of the page, it curls once
     beside the statement like the string of the mark, and the balloon at its tip lands on the Flash's bassinet.
     Wide screens only: the path is measured from the page, so it is rebuilt on every refresh. A phone gets the mark that
     draws its own string beside the kicker (CSS). Reduced motion: the string is whole and the balloon sits at the end. */
  var thread = document.querySelector(".thread"), mainEl = document.getElementById("main");
  var tPath = thread && thread.querySelector(".thread-path"), tBall = thread && thread.querySelector(".thread-balloon");
  var hImg = document.querySelector(".hero-media img"), stEl = document.querySelector(".statement"), mbt = document.querySelector(".mbt");
  var syncEl = document.querySelector(".sync"), mediaEl = document.querySelector(".sync-media");
  if (thread && tPath && tBall && hImg && stEl && mbt && syncEl && mediaEl && typeof MotionPathPlugin !== "undefined") {
    var tLen = 1;
    var rel = function (el) { var r = el.getBoundingClientRect(), m = mainEl.getBoundingClientRect(); return { x: r.left - m.left, y: r.top - m.top, w: r.width, h: r.height }; };
    var f = function (n) { return Math.round(n * 10) / 10; };
    var build = function () {
      if (!thread.classList.contains("is-on")) return;
      // the handle: the top of the push bar, read from the photo itself (contain, anchored to the bottom)
      var b = rel(hImg), nr = (hImg.naturalWidth || 1068) / (hImg.naturalHeight || 1344);
      var cw = Math.min(b.w, b.h * nr), ch = cw / nr, cx = b.x + (b.w - cw) / 2, cy = b.y + (b.h - ch);
      var S = { x: cx + cw * .035, y: cy + ch * .028 };
      // the curl: in the middle of the empty margin beside the statement (the heading is kept narrow for it)
      var st = rel(stEl), mb = rel(mbt);
      var L = { x: Math.max(32, mb.x / 2), y: st.y + st.h * .5 }, r = Math.max(26, Math.min(44, mb.x * .14));
      // the end: the top of the canopy in the first Flash panel (the sticky panel's own place in the page)
      var sy = rel(syncEl), md = rel(mediaEl);
      var E = { x: md.x + md.w * .58, y: sy.y + md.h * .1 };
      var d1 = L.y - S.y, d2 = E.y - L.y;
      var d = "M" + f(S.x) + "," + f(S.y) +
        // the string falls from the handle with a slow sway
        " C" + f(S.x + 70) + "," + f(S.y + d1 * .38) + " " + f(L.x) + "," + f(L.y - d1 * .5) + " " + f(L.x) + "," + f(L.y) +
        // one curl, as in the mark: down, round, over its own line
        " C" + f(L.x) + "," + f(L.y + r * 1.3) + " " + f(L.x + 2 * r) + "," + f(L.y + r * 1.3) + " " + f(L.x + 2 * r) + "," + f(L.y) +
        " C" + f(L.x + 2 * r) + "," + f(L.y - r * 1.35) + " " + f(L.x - r * .7) + "," + f(L.y - r * 1.35) + " " + f(L.x - r * .6) + "," + f(L.y + r * .3) +
        // and on, down to the bassinet
        " C" + f(L.x - r * .55) + "," + f(L.y + d2 * .45) + " " + f(E.x) + "," + f(E.y - d2 * .45) + " " + f(E.x) + "," + f(E.y);
      tPath.setAttribute("d", d);
      tLen = tPath.getTotalLength();
      tPath.style.strokeDasharray = tLen;
    };
    // the knot (60% across, 97% down the mark) rides the tip of the string. No "align": the balloon sits at 0,0 of the
    // same box as the path, so the path's numbers are its translate, and align would cancel the percent offset.
    var MP = { path: tPath };
    gsap.set(tBall, { xPercent: -60, yPercent: -97 });
    var tmm = gsap.matchMedia();
    tmm.add({ wide: "(min-width: 1024px)", rm: "(prefers-reduced-motion: reduce)" }, function (ctx) {
      if (!ctx.conditions.wide) return;
      thread.classList.add("is-on");
      build();
      ScrollTrigger.addEventListener("refreshInit", build);
      if (ctx.conditions.rm) {   // reduced motion: the string is whole and the balloon has arrived
        var put = function () { build(); tPath.style.strokeDashoffset = 0; gsap.set(tBall, { motionPath: Object.assign({ start: 1, end: 1 }, MP) }); };
        put(); addEventListener("resize", put);
        return function () { removeEventListener("resize", put); ScrollTrigger.removeEventListener("refreshInit", build); thread.classList.remove("is-on"); };
      }
      var tl = gsap.timeline({ scrollTrigger: { trigger: document.body, start: 0,
        end: function () { return syncEl.getBoundingClientRect().top + window.scrollY - innerHeight * .15; },
        scrub: .6, invalidateOnRefresh: true } });
      tl.fromTo(tPath, { strokeDashoffset: function () { return tLen; } }, { strokeDashoffset: 0, ease: "none" }, 0)
        .to(tBall, { motionPath: MP, ease: "none", immediateRender: true }, 0);
      // the panel stays while the page moves on, so the string lets go of it softly instead of sliding off the photo
      var tOut = gsap.fromTo(thread, { autoAlpha: 1 }, { autoAlpha: 0, ease: "none", immediateRender: false,
        scrollTrigger: { trigger: syncEl, start: "top 15%", end: "top -10%", scrub: .6 } });
      // the hero photo settles after its entrance: measure again once it is still
      var late = setTimeout(function () { ScrollTrigger.refresh(); }, 1700);
      return function () { clearTimeout(late); tOut.scrollTrigger && tOut.scrollTrigger.kill(); gsap.set(thread, { clearProps: "opacity,visibility" }); ScrollTrigger.removeEventListener("refreshInit", build); thread.classList.remove("is-on"); };
    });
    addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* ---------- MV:g152: the images open inside the statement (copied from the vault) ---------- */
  var root = document.querySelector(".mbt");
  if (root) {
    var slots = [].slice.call(root.querySelectorAll(".mbt-slot"));
    var pills = slots.map(function (s) { return s.querySelector(".mbt-pill"); }), imgs = slots.map(function (s) { return s.querySelector("img"); });
    var CLOSED = "inset(0% 50% 0% 50% round 999px)", OPEN = "inset(0% 0% 0% 0% round 999px)";
    var fine = matchMedia("(hover: hover) and (pointer: fine)");
    // under reduced motion the function does not run at all: the heading stays open
    gsap.matchMedia().add({
      desk: "(min-width:768px) and (prefers-reduced-motion: no-preference)",
      mob: "(max-width:767px) and (prefers-reduced-motion: no-preference)"
    }, function (ctx) {
      // Flip on desktop only: there every line is nowrap, so a word never jumps lines. On a phone the gap is kept and the pill only reveals
      var flip = ctx.conditions.desk && typeof Flip !== "undefined";
      var opened = false;
      if (flip) root.classList.add("mbt-flip");
      gsap.set(pills, { clipPath: CLOSED });
      gsap.set(imgs, { scale: 1.35 });
      function openSlot(i) {
        var slot = slots[i], delay = i * .14;
        if (flip) {
          var state = Flip.getState(slot.parentElement.querySelectorAll(".mbt-w"));
          slot.classList.add("is-open");
          Flip.from(state, { duration: .65, delay: delay, ease: "power3.out" });
        }
        gsap.fromTo(pills[i], { clipPath: CLOSED }, { clipPath: OPEN, duration: .65, delay: delay, ease: "power3.out" });
        gsap.to(imgs[i], { scale: 1, duration: .9, delay: delay, ease: "power3.out", onComplete: function () { gsap.set(imgs[i], { clearProps: "transform" }); } });
      }
      var open = function () { if (opened) return; opened = true; slots.forEach(function (_, i) { openSlot(i); }); ScrollTrigger.refresh(); };
      // not "once": a trigger that kills itself shifts every later one in the list, and open() already runs a single time
      ScrollTrigger.create({ trigger: root, start: "top 75%", onEnter: open });
      var hov = function () { if (fine.matches) open(); };
      root.addEventListener("pointerenter", hov);
      return function () {
        root.removeEventListener("pointerenter", hov);
        root.classList.remove("mbt-flip");
        slots.forEach(function (s) { s.classList.remove("is-open"); });
        gsap.set(imgs, { clearProps: "transform" });
      };
    });
  }

  /* ---------- MV:g05: the Flash photo changes as each point arrives ---------- */
  var texts = gsap.utils.toArray(".sync-t");
  if (texts.length) {
    gsap.matchMedia().add({ desk: "(min-width: 768px)", mob: "(max-width: 767px)", rm: "(prefers-reduced-motion: reduce)" }, function (ctx) {
      var c = ctx.conditions;
      // a short window: two photos half-blended read as a mistake, so the change is quick
      var start = c.mob ? "top 78%" : "top 54%", end = c.mob ? "top 64%" : "top 40%", mid = c.mob ? "top 70%" : "top 47%";
      texts.forEach(function (txt, i) {
        if (!i) return;
        var img = ".si-" + (i + 1);
        if (c.rm) {   // reduced motion: the picture changes at once, no fade
          gsap.set(img, { autoAlpha: 0 });
          ScrollTrigger.create({ trigger: txt, start: mid, end: "max", onToggle: function (s) { gsap.set(img, { autoAlpha: s.isActive ? 1 : 0 }); } });
          return;
        }
        gsap.from(img, { autoAlpha: 0, ease: "none", scrollTrigger: { trigger: txt, start: start, end: end, scrub: 1 } });
      });
    });
  }

  /* ---------- MV:g12: the family floats at its own depth (copied from the vault) ---------- */
  var fam = document.querySelector(".family");
  if (fam) {
    gsap.matchMedia().add({ mob: "(max-width: 767px)", ok: "(prefers-reduced-motion: no-preference)" }, function (ctx) {
      var mob = ctx.conditions.mob, ok = ctx.conditions.ok;
      if (!ok) return;                       // reduced motion: the layers stay where they were designed
      var RANGE = mob ? 130 : 260;           // the full distance of the deepest layer. Half on a phone
      gsap.utils.toArray(".family .layer").forEach(function (el) {
        var dpt = parseFloat(el.dataset.depth);
        // symmetric fromTo around the CSS position: low on entry, high on exit, exactly in place in the middle
        gsap.fromTo(el, { y: dpt * RANGE }, { y: -dpt * RANGE, ease: "none",
          scrollTrigger: { trigger: fam, start: "top bottom", end: "bottom top", scrub: .4 } });
      });
      // the heading moves a little the other way, which sharpens the sense of distance
      gsap.fromTo(".family .sec-head h2", { y: -40 }, { y: 40, ease: "none",
        scrollTrigger: { trigger: fam, start: "top bottom", end: "bottom top", scrub: .4 } });
    });
  }

  /* ---------- MV:g12 on the Flash page: the stage and the fabric close-ups, each layer at its own depth ----------
     The stage starts at rest (it is already on screen), so it only moves on the way out; the mosaic is symmetric
     around its designed place, like the family. The close-ups are taller than their frames, so they never show an edge */
  var pRoots = gsap.utils.toArray("[data-parallax]");
  if (pRoots.length) {
    gsap.matchMedia().add({ mob: "(max-width: 767px)", ok: "(prefers-reduced-motion: no-preference)" }, function (ctx) {
      if (!ctx.conditions.ok) return;
      pRoots.forEach(function (rootEl) {
        var stage = rootEl.classList.contains("p-hero");
        var RANGE = stage ? (ctx.conditions.mob ? 160 : 320) : (ctx.conditions.mob ? 0 : 90);
        if (!RANGE) return;                  // on a phone the mosaic is a plain grid: the tiles are too small to float
        rootEl.querySelectorAll(".layer").forEach(function (el) {
          var dpt = parseFloat(el.dataset.depth) || 0;
          var st = { trigger: rootEl, start: stage ? "top top" : "top bottom", end: "bottom top", scrub: .4 };
          if (stage) gsap.fromTo(el, { y: 0 }, { y: -dpt * RANGE, ease: "none", scrollTrigger: st });
          else gsap.fromTo(el, { y: dpt * RANGE }, { y: -dpt * RANGE, ease: "none", scrollTrigger: st });
        });
      });
    });
  }

  /* ---------- About page · the signature: the balloon's string runs down the story and draws itself as you read ----------
     The drawn end follows the 70% line of the screen, and each chapter's knot fills as the string reaches it.
     Under reduced motion the function does not run: the string is whole and every knot is full (the CSS default). */
  var spPath = document.querySelector(".sp-path"), story = document.querySelector(".story");
  if (spPath && story) {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", function () {
      story.classList.add("sp-anim");
      gsap.fromTo(spPath, { strokeDashoffset: 1000 }, { strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: ".sp-string", start: "top 70%", end: "bottom 70%", scrub: .6 } });
      gsap.utils.toArray(".ch-year").forEach(function (y) {
        ScrollTrigger.create({ trigger: y, start: "center 70%", onEnter: function () { y.classList.add("is-on"); }, onLeaveBack: function () { y.classList.remove("is-on"); } });
      });
      // the opening lifts away as you leave it: the year rises a little faster than the page, and the family photo eases out
      if (document.querySelector(".a-hero")) {
        var aHero = { trigger: ".a-hero", start: "top top", end: "bottom top", scrub: .6 };
        gsap.to(".a-top", { y: -90, ease: "none", scrollTrigger: aHero });
        gsap.fromTo(".a-band picture", { scale: 1.14, transformOrigin: "50% 22%" }, { scale: 1, ease: "none", scrollTrigger: aHero });
      }
      return function () { story.classList.remove("sp-anim"); };
    });
  }

  /* contact: on the way out the balloon floats up off the opening (the hero's exit scene) */
  var cSign = document.querySelector(".c-sign");
  if (cSign && window.gsap && window.ScrollTrigger) {
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", function () {
      gsap.to(cSign, { y: -140, ease: "none", scrollTrigger: { trigger: ".c-hero", start: "top top", end: "bottom top", scrub: .6 } });
    });
  }
})();
