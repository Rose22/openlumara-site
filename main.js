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

  /* ---------- hero slideshow ---------- */

  function initSlideshow() {
    var root = document.getElementById("heroSlideshow");
    if (!root) return;
    var track = document.getElementById("slideTrack");
    var slides = track ? Array.prototype.slice.call(track.children) : [];
    if (slides.length === 0) return;

    var viewport = root.querySelector(".slideshow-viewport");
    var prevBtn = document.getElementById("slidePrev");
    var nextBtn = document.getElementById("slideNext");
    var dotsWrap = document.getElementById("slideDots");
    var counter = document.getElementById("slideCount");
    var titleEl = document.getElementById("slideTitle");
    var idx = 0;

    // build dots
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var d = document.createElement("button");
        d.type = "button";
        d.className = "slideshow-dot";
        d.setAttribute("aria-label", "Go to image " + (i + 1));
        d.addEventListener("click", function () { go(i); });
        dotsWrap.appendChild(d);
      });
    }
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];

    // title for a slide: data-title on the img, else derived from the filename
    function titleFor(i) {
      var img = slides[i].querySelector("img");
      if (!img) return "";
      var t = img.getAttribute("data-title");
      if (t) return t;
      return img.src.split("/").pop().replace(/\.[a-z0-9]+$/i, "").replace(/-/g, " ");
    }

    // size the viewport to the current image so short screenshots don't leave a gap
    function fitHeight(animate) {
      if (!viewport) return;
      var img = slides[idx].querySelector("img");
      if (!img || !img.naturalHeight) return;
      var h = img.getBoundingClientRect().height;
      if (!animate) viewport.classList.add("no-anim");
      viewport.style.height = h + "px";
      if (!animate) {
        void viewport.offsetWidth;
        viewport.classList.remove("no-anim");
      }
    }

    function render(animate) {
      if (!animate) track.classList.add("no-anim");
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      if (!animate) {
        // force reflow so the next transform animates again
        void track.offsetWidth;
        track.classList.remove("no-anim");
      }
      if (titleEl) titleEl.textContent = titleFor(idx);
      if (counter) counter.textContent = (idx + 1) + " / " + slides.length;
      dots.forEach(function (d, i) { d.classList.toggle("active", i === idx); });
      slides.forEach(function (s, i) {
        s.setAttribute("aria-hidden", i === idx ? "false" : "true");
      });
      fitHeight(animate);
    }

    function go(i) {
      idx = (i + slides.length) % slides.length;
      render(true);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { go(idx - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(idx + 1); });

    // keyboard support when the slideshow is focused
    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    });

    // swipe support
    var startX = null;
    root.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    root.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });

    // keep the height in sync when the window resizes
    window.addEventListener("resize", function () { fitHeight(false); });

    // re-measure once each image has actually loaded
    slides.forEach(function (s, i) {
      var img = s.querySelector("img");
      if (!img) return;
      img.addEventListener("load", function () {
        if (i === idx) fitHeight(false);
      });
    });

    render(false);
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
    initSlideshow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
