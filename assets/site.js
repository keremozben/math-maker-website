/**
 * site.js — behaviour shared by the inner pages (support, privacy, terms, 404).
 * The landing page runs assets/home.js instead.
 *
 *  - Language memory (same contract as before): the TR / EN switcher saves the
 *    choice in localStorage; on every load the links marked data-nav are
 *    rewritten to the remembered language. The page itself never redirects.
 *  - Scroll progress bar ("level bar"), reveal-on-scroll, decoding eyebrows.
 *  - Table of contents built from the document's own h2 headings.
 *  - Compass cursor (fine pointers), magnetic buttons, drifting math dust.
 */
(function () {
  "use strict";

  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var script = document.currentScript;
  // assets/site.js → site root
  var ROOT = new URL("../", script ? script.src : location.href);

  // ---------------------------------------------------------------
  // Language memory
  // ---------------------------------------------------------------
  var LANGS = { en: "", tr: "tr/" };
  var FILES = {
    home: "",
    support: "support.html",
    privacy: "privacy-policy.html",
    terms: "terms-of-service.html",
    play: "#play",
  };
  var KEY = "mathmakerLang";

  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  function save(code) {
    try {
      localStorage.setItem(KEY, code);
    } catch {
      /* storage disabled */
    }
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("[data-lang]");
      if (a && LANGS[a.getAttribute("data-lang")] !== undefined) save(a.getAttribute("data-lang"));
    },
    true,
  );

  var current =
    LANGS[document.documentElement.lang] !== undefined ? document.documentElement.lang : "en";
  var stored = read();
  if (stored && LANGS[stored] !== undefined && stored !== current) {
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      var file = FILES[link.getAttribute("data-nav")];
      if (file !== undefined) link.setAttribute("href", new URL(LANGS[stored] + file, ROOT).href);
    });
  }

  // ---------------------------------------------------------------
  // Table of contents (long documents)
  // ---------------------------------------------------------------
  var toc = document.querySelector("[data-toc]");
  var body = document.querySelector("[data-toc-source]");
  var tocLinks = [];
  var heads = [];
  if (toc && body) {
    heads = Array.prototype.slice.call(body.querySelectorAll("h2"));
    heads.forEach(function (h, i) {
      if (!h.id) h.id = "s" + (i + 1);
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "toc__link";
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
      tocLinks.push(a);
    });
  }
  var activeHead = -1;
  function updateToc() {
    if (!heads.length) return;
    var line = innerHeight * 0.3;
    var idx = 0;
    for (var i = 0; i < heads.length; i++)
      if (heads[i].getBoundingClientRect().top <= line) idx = i;
    if (idx === activeHead) return;
    activeHead = idx;
    tocLinks.forEach(function (a, i) {
      a.classList.toggle("toc__link--active", i === idx);
      if (i === idx) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }

  // ---------------------------------------------------------------
  // Scroll progress
  // ---------------------------------------------------------------
  var fill = document.querySelector(".progress__fill");
  function updateScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (fill)
      fill.style.setProperty(
        "--progress",
        String(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0),
      );
    updateToc();
  }
  var queued = false;
  addEventListener(
    "scroll",
    function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        updateScroll();
      });
    },
    { passive: true },
  );
  addEventListener("resize", updateScroll);
  updateScroll();

  // ---------------------------------------------------------------
  // Reveal + decoding eyebrows
  // ---------------------------------------------------------------
  function scramble(el) {
    if (REDUCED) return;
    var glyphs = "0123456789+−×÷=√π∑∞";
    var final = el.textContent;
    var start = performance.now();
    function frame() {
      var p = Math.min(1, (performance.now() - start) / 900);
      var shown = Math.floor(final.length * p);
      var rest = "";
      for (var i = shown; i < final.length; i++)
        rest += final[i] === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)];
      el.textContent = final.slice(0, shown) + rest;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        if (en.target.classList.contains("eyebrow")) scramble(en.target);
        io.unobserve(en.target);
      });
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll("[data-reveal], .eyebrow").forEach(function (el) {
    io.observe(el);
  });

  // ---------------------------------------------------------------
  // Pointer: compass cursor, magnetic buttons, tilt
  // ---------------------------------------------------------------
  var cursor = document.querySelector(".cursor");
  var finePointer = matchMedia("(pointer: fine)").matches && !REDUCED && !!cursor;
  if (finePointer) document.documentElement.classList.add("has-cursor");
  var pointer = { x: -9999, y: -9999 };
  var drawTimer = 0;

  function setVar(el, name, value) {
    el.style.setProperty(name, value);
  }

  document.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (finePointer) {
      setVar(cursor, "--dx", e.clientX + "px");
      setVar(cursor, "--dy", e.clientY + "px");
    }
    if (REDUCED || !e.target.closest) return;
    var mag = e.target.closest("[data-magnetic]");
    if (mag) {
      var r = mag.getBoundingClientRect();
      setVar(mag, "--mx", ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px");
      setVar(mag, "--my", ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px");
    }
    var tilt = e.target.closest("[data-tilt]");
    if (tilt) {
      var t = tilt.getBoundingClientRect();
      setVar(tilt, "--rx", (-((e.clientY - t.top) / t.height - 0.5) * 8).toFixed(2) + "deg");
      setVar(tilt, "--ry", (((e.clientX - t.left) / t.width - 0.5) * 10).toFixed(2) + "deg");
    }
  });
  document.addEventListener("pointerover", function (e) {
    if (finePointer && e.target.closest)
      cursor.classList.toggle(
        "cursor--hover",
        !!e.target.closest("a, button, input, summary, [data-hover]"),
      );
  });
  document.addEventListener("pointerout", function (e) {
    if (!e.target.closest) return;
    var leaving = function (sel) {
      var el = e.target.closest(sel);
      return el && !(e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) ? el : null;
    };
    var mag = leaving("[data-magnetic]");
    if (mag) {
      setVar(mag, "--mx", "0px");
      setVar(mag, "--my", "0px");
    }
    var tilt = leaving("[data-tilt]");
    if (tilt) {
      setVar(tilt, "--rx", "0deg");
      setVar(tilt, "--ry", "0deg");
    }
  });
  document.addEventListener("pointerdown", function () {
    if (!finePointer) return;
    // Click = the compass swings a full turn around its needle and draws a circle.
    cursor.classList.remove("cursor--draw");
    void cursor.offsetWidth;
    cursor.classList.add("cursor--draw");
    clearTimeout(drawTimer);
    drawTimer = setTimeout(function () {
      cursor.classList.remove("cursor--draw");
    }, 850);
  });
  document.addEventListener("pointerleave", function () {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  // ---------------------------------------------------------------
  // Math dust — a light 2D take on the landing page's particle field
  // ---------------------------------------------------------------
  var canvas = document.querySelector(".dust");
  var ctx = canvas && canvas.getContext("2d");
  if (!ctx) return;
  var GLYPHS = ["+", "−", "×", "÷", "=", "√", "π", "Σ", "ε", "∞", "%", "7", "3", "2", "9"];
  var dpr = 1;
  var w = 0;
  var h = 0;
  var motes = [];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var count = Math.round(Math.min(140, (w * h) / 14000));
    motes = [];
    for (var i = 0; i < count; i++) {
      var glyph = Math.random() < 0.22;
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 10,
        ox: 0,
        oy: 0,
        glyph: glyph ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : "",
        hot: Math.random() < 0.28,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  var last = performance.now();
  var lastScroll = scrollY;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var scrollDelta = scrollY - lastScroll;
    lastScroll = scrollY;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      if (!REDUCED) {
        m.x += m.vx * dt * m.z;
        m.y += m.vy * dt * m.z - scrollDelta * 0.25 * m.z;
        // pointer pushes the dust aside, then it eases back
        var dx = m.x + m.ox - pointer.x;
        var dy = m.y + m.oy - pointer.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 16000 && d2 > 1) {
          var f = (1 - d2 / 16000) * 3;
          var d = Math.sqrt(d2);
          m.ox += (dx / d) * f;
          m.oy += (dy / d) * f;
        }
        m.ox *= 0.94;
        m.oy *= 0.94;
        if (m.y < -30) {
          m.y = h + 30;
          m.x = Math.random() * w;
        }
        if (m.y > h + 30) {
          m.y = -30;
          m.x = Math.random() * w;
        }
        if (m.x < -30) m.x = w + 30;
        if (m.x > w + 30) m.x = -30;
      }
      var twinkle = REDUCED ? 1 : 0.65 + 0.35 * Math.sin(now / 900 + m.phase);
      var alpha = (m.glyph ? 0.16 : 0.5) * m.z * twinkle;
      ctx.fillStyle = m.hot
        ? "rgba(255, 128, 32, " + alpha.toFixed(3) + ")"
        : "rgba(210, 225, 245, " + (alpha * 0.8).toFixed(3) + ")";
      if (m.glyph) {
        ctx.font = "800 " + Math.round(12 + m.z * 20) + "px Exo, system-ui, sans-serif";
        ctx.fillText(m.glyph, m.x + m.ox, m.y + m.oy);
      } else {
        ctx.beginPath();
        ctx.arc(m.x + m.ox, m.y + m.oy, 0.6 + m.z * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (!REDUCED) requestAnimationFrame(frame);
  }
  resize();
  var resizeTimer = 0;
  addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (REDUCED) frame(performance.now());
    }, 200);
  });
  requestAnimationFrame(frame);
})();
