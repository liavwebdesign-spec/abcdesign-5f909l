/* snap-icons: every inline SVG icon on a whole device pixel. Paste into the site script (design-dna/tools/icons, 1.10.2026).
   An icon that lands on y=826.42 is drawn across two pixel rows and looks soft at 100% zoom. Page coordinates, so a
   fraction of the scroll position never leaks in; the translate property, so hover transforms stay free. Re-runs on
   load, fonts, resize, any layout change (lazy images, tabs, text scaled by the a11y toolbar) and every finished entrance. */
(function () {
  var SEL = "svg.ic, svg.arr", t = 0;
  function snap(scope) {
    var dpr = window.devicePixelRatio || 1;
    (scope || document).querySelectorAll(SEL).forEach(function (el) {
      el.style.translate = "";
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var fixed = false; for (var q = el; q && q !== document.body; q = q.parentElement) if (getComputedStyle(q).position === "fixed") { fixed = true; break; }
      var x = r.left + (fixed ? 0 : scrollX), y = r.top + (fixed ? 0 : scrollY);
      var dx = Math.round(x * dpr) / dpr - x, dy = Math.round(y * dpr) / dpr - y;
      if (Math.abs(dx) > .01 || Math.abs(dy) > .01) el.style.translate = dx.toFixed(3) + "px " + dy.toFixed(3) + "px";
    });
  }
  function soon() { clearTimeout(t); t = setTimeout(function () { snap(); }, 120); }
  window.snapIcons = snap;
  addEventListener("load", soon); addEventListener("resize", soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  if (window.ResizeObserver) new ResizeObserver(soon).observe(document.body);
  document.addEventListener("load", function (e) { if (e.target.tagName === "IMG") soon(); }, true);
  document.addEventListener("animationend", function (e) { if (e.target.querySelector) snap(e.target); });
  document.addEventListener("transitionend", function (e) { if (/translate|transform/.test(e.propertyName) && e.target.querySelector) snap(e.target); });
})();
