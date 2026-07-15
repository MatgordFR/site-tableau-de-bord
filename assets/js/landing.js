/* Essor — présentation : thème, reveals au scroll, compteurs animés. Vanilla. */
(function () {
  "use strict";
  var byId = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Thème (partagé avec l'app via la même clé localStorage) */
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = byId("themeBtn"); if (b) b.textContent = t === "dark" ? "☀" : "☾";
    try { localStorage.setItem("crm-theme", t); } catch (e) {}
  }
  (function initTheme() {
    var saved = null; try { saved = localStorage.getItem("crm-theme"); } catch (e) {}
    var dark = saved ? saved === "dark" : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(dark ? "dark" : "light");
  })();

  function countUp(el) {
    var to = parseFloat(el.getAttribute("data-to")), suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = to + suffix; return; }
    var dur = 1100, t0 = null;
    function step(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suffix; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  function boot() {
    byId("themeBtn").addEventListener("click", function () {
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });

    var reveals = [].slice.call(document.querySelectorAll(".reveal"));
    var counters = [].slice.call(document.querySelectorAll("[data-to]"));

    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
      counters.forEach(countUp);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        if (en.target.hasAttribute("data-to")) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
