/* ============================================================
   OpenLumara site — interactions
   particles, reveals, counters, terminal, nav, tilt, copy
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- particles ---------- */

  function initParticles() {
    if (reduceMotion) return;
    var canvas = document.getElementById("particles");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dots = [];
    var COLORS = ["179,136,255", "255,110,199", "125,211,252"];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    var COUNT = Math.min(70, Math.floor(window.innerWidth / 22));
    for (var i = 0; i < COUNT; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18 - 0.05,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        a: Math.random() * 0.5 + 0.12,
        tw: Math.random() * Math.PI * 2
      });
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy; d.tw += 0.02;
        if (d.x < -10) d.x = canvas.width + 10;
        if (d.x > canvas.width + 10) d.x = -10;
        if (d.y < -10) d.y = canvas.height + 10;
        if (d.y > canvas.height + 10) d.y = -10;
        var alpha = d.a * (0.6 + 0.4 * Math.sin(d.tw));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + d.c + "," + alpha.toFixed(3) + ")";
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------- scroll reveals ---------- */

  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    // stagger siblings inside grids
    document.querySelectorAll(".feature-grid, .life-grid, .stats-grid, .why-grid, .reasons-list").forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (child, i) {
        var target = child.classList.contains("reveal") ? child : child.querySelector(".reveal");
        if (target) target.style.transitionDelay = Math.min(i * 70, 420) + "ms";
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- counters ---------- */

  function initCounters() {
    var counters = document.querySelectorAll(".counter");
    function animate(el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var format = el.getAttribute("data-format");
      var dur = 1600;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(target * eased);
        if (format === "k") {
          el.textContent = val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1).replace(/\.0$/, "") + "k" : val;
        } else {
          el.textContent = val;
        }
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window) || reduceMotion) {
      counters.forEach(function (el) {
        var t = parseInt(el.getAttribute("data-count"), 10) || 0;
        el.textContent = t >= 1000 ? (t / 1000) + "k" : t;
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- terminal typing ---------- */

  function initTerminal() {
    var body = document.getElementById("terminalText");
    var cursor = document.getElementById("tCursor");
    if (!body) return;

    var LINES = [
      { t: "$ ./run.sh", cls: "t-cmd", delay: 300 },
      { t: "[core] Starting OpenLumara", cls: "t-out" },
      { t: "[core] loaded channel : webui", cls: "t-out" },
      { t: "[core] loaded channel : telegram", cls: "t-out" },
      { t: "[core] loaded module : memory", cls: "t-out" },
      { t: "[core] loaded module : scheduler", cls: "t-out" },
      { t: "[core] loaded module : coder", cls: "t-out" },
      { t: "[API] connected to local model", cls: "t-out" },
      { t: "[core] startup completed in 0.42s", cls: "t-out" },
      { t: "user> lumara, what's on my plate today?", cls: "t-cmd" },
      { t: "Lumara: checking your calendar and lists...", cls: "t-ok" },
      { t: "Lumara: morning routine, 3 todos, one doctor call at 14:00. want me to walk you through it?", cls: "t-ok" }
    ];

    if (reduceMotion) {
      LINES.forEach(function (l) {
        var s = document.createElement("span");
        s.className = "t-line " + l.cls;
        s.textContent = l.t + "\n";
        body.appendChild(s);
      });
      if (cursor) cursor.style.display = "none";
      return;
    }

    var lineIdx = 0;
    function typeLine() {
      if (lineIdx >= LINES.length) {
        setTimeout(typeLine, 9000); // loop for good measure
        return;
      }
      var spec = LINES[lineIdx];
      var el = document.createElement("span");
      el.className = "t-line " + spec.cls;
      body.appendChild(el);
      var i = 0;
      (function typeChar() {
        el.textContent = spec.t.slice(0, i) + "\n";
        i++;
        if (i <= spec.t.length) {
          setTimeout(typeChar, spec.cls === "t-cmd" ? 34 : 12);
        } else {
          lineIdx++;
          setTimeout(typeLine, spec.delay || 140);
        }
      })();
    }
    setTimeout(typeLine, 700);
  }

  /* ---------- context bar ---------- */

  function initCtxBar() {
    var bar = document.getElementById("ctxBar");
    if (!bar) return;
    var segs = bar.querySelectorAll(".ctx-seg");
    function fill() {
      segs.forEach(function (s) { s.style.width = s.getAttribute("data-w") + "%"; });
    }
    if (reduceMotion || !("IntersectionObserver" in window)) { fill(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { fill(); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    io.observe(bar);
  }

  /* ---------- nav ---------- */

  function initNav() {
    var nav = document.getElementById("nav");
    var burger = document.getElementById("navBurger");
    var linksWrap = document.getElementById("navLinks");

    window.addEventListener("scroll", function () {
      if (window.scrollY > 30) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    }, { passive: true });

    if (burger && linksWrap) {
      burger.addEventListener("click", function () {
        linksWrap.classList.toggle("open");
        burger.classList.toggle("open");
      });
      linksWrap.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          linksWrap.classList.remove("open");
          burger.classList.remove("open");
        });
      });
    }

    // active link highlighting
    var sections = document.querySelectorAll("section[id], header[id]");
    var navAnchors = {};
    document.querySelectorAll(".nav-link").forEach(function (a) {
      var id = a.getAttribute("href").replace("#", "");
      navAnchors[id] = a;
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            Object.keys(navAnchors).forEach(function (k) { navAnchors[k].classList.remove("active"); });
            var a = navAnchors[e.target.id];
            if (a) a.classList.add("active");
          }
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      sections.forEach(function (s) { if (navAnchors[s.id]) io.observe(s); });
    }
  }

  /* ---------- card tilt ---------- */

  function initTilt() {
    if (reduceMotion || isTouch) return;
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "translateY(-6px) rotateX(" + (-py * 5).toFixed(2) + "deg) rotateY(" + (px * 5).toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- copy button ---------- */

  function initCopy() {
    var btn = document.getElementById("copyBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var code = btn.getAttribute("data-code").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&#10;/g, "\n").replace(/&amp;/g, "&");
      function done() {
        btn.textContent = "copied!";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = "copy"; btn.classList.remove("copied"); }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    initParticles();
    initReveals();
    initCounters();
    initTerminal();
    initCtxBar();
    initNav();
    initTilt();
    initCopy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
