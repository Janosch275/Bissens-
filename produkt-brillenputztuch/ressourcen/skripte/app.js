/* Klarsicht – Animationen & Interaktionen
   Reines JavaScript, keine Bibliotheken, keine externen Dienste. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add(reduce ? "no-motion" : "motion");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Vorhang nach dem Einstieg entfernen ---------- */
  var curtain = $(".curtain");
  if (curtain && !reduce) setTimeout(function () { curtain.remove(); }, 2000);

  /* ---------- Überschriften in Zeilen zerlegen ---------- */
  function splitLines(el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.setAttribute("aria-label", text);
    el.innerHTML = "";
    var spans = words.map(function (w, i) {
      var s = document.createElement("span");
      s.textContent = w + (i < words.length - 1 ? " " : "");
      s.style.display = "inline";
      el.appendChild(s);
      return s;
    });
    // Zeilen über die Position der Wörter ermitteln
    var lines = [], top = null;
    spans.forEach(function (s) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(s.textContent);
    });
    el.innerHTML = "";
    lines.forEach(function (line, i) {
      var ln = document.createElement("span");
      ln.className = "ln";
      ln.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.style.setProperty("--l", i);
      inner.textContent = line.join("").trim();
      ln.appendChild(inner);
      el.appendChild(ln);
    });
  }
  var splitEls = $$(".split");
  function doSplit() { if (!reduce) splitEls.forEach(splitLines); }

  /* ---------- Einblenden ---------- */
  var revealEls = $$(".reveal, .reveal-clip, .split");
  var io = null;
  if ("IntersectionObserver" in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
        if (e.target.id === "compare") demoCompare();
      });
    }, { threshold: .18, rootMargin: "0px 0px -50px 0px" });
  }
  function observeAll() {
    revealEls.forEach(function (el) { io ? io.observe(el) : el.classList.add("is-visible"); });
  }
  if (document.fonts && document.fonts.ready && !reduce) {
    document.fonts.ready.then(function () { doSplit(); observeAll(); });
  } else { doSplit(); observeAll(); }

  /* ---------- Navigation ---------- */
  var nav = $("#nav"), toggle = $("#nav-toggle"), links = $("#nav-links");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    links.classList.toggle("is-open", open);
    nav.classList.toggle("menu-open", open);
    if (open) nav.classList.remove("is-hidden");
  }
  toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
  links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  nav.addEventListener("focusin", function () { nav.classList.remove("is-hidden"); });

  var navAnchors = $$('.nav__links a[href^="#"]:not(.btn)');
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navAnchors.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navAnchors.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* ---------- Mikrofasern erzeugen ---------- */
  var fibers = $("#micro-fibers");
  if (fibers) {
    var seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var NS = "http://www.w3.org/2000/svg", out = "";
    var tones = ["#B8CCE0", "#9FB7CD", "#D3E1EE", "#6F8FAE", "#E3ECF4"];
    for (var i = 0; i < 70; i++) {
      var y0 = rnd() * 800, y1 = rnd() * 800, a = rnd() * 800, b = rnd() * 800;
      var w = 1.2 + rnd() * 6;
      out += '<path d="M-60 ' + y0.toFixed(0) + 'C' + (200 + rnd() * 100).toFixed(0) + ' ' + a.toFixed(0) + ' ' + (500 + rnd() * 100).toFixed(0) + ' ' + b.toFixed(0) + ' 860 ' + y1.toFixed(0) +
        '" stroke="' + tones[i % tones.length] + '" stroke-width="' + w.toFixed(1) + '" opacity="' + (.25 + rnd() * .55).toFixed(2) + '"/>';
    }
    for (var k = 0; k < 26; k++) {
      out += '<circle class="dirt" cx="' + (rnd() * 800).toFixed(0) + '" cy="' + (rnd() * 800).toFixed(0) + '" r="' + (2 + rnd() * 5).toFixed(1) + '" fill="#D9B98C" opacity=".8"/>';
    }
    fibers.innerHTML = out;
    fibers.setAttribute("xmlns", NS);
  }

  /* ---------- Scroll-Logik ---------- */
  var progress = $("#progress");
  var hero = $(".hero"), heroSticky = $("#hero-sticky"), heroCopy = $("#hero-copy");
  var wipeEdge = $("#wipe-edge"), cloth = $("#cloth"), stage = $("#hero-stage");
  var lensL = $("#lens-l"), lensR = $("#lens-r"), clipL = $("#clip-l"), clipR = $("#clip-r");
  var cleanValue = $("#clean-value");
  var microPin = $("#micro-pin"), microScope = $("#micro-scope"), microItems = $$(".micro__item"), microDots = $$(".micro__dots i");
  var dirt = fibers ? $$(".dirt", fibers) : [];
  var scrollEls = $$("[data-scroll]");
  var parallaxEls = $$("[data-parallax]");
  var vh = window.innerHeight, lastY = window.scrollY, ticking = false, lastMicro = -1;

  function sectionProgress(el) {
    var r = el.getBoundingClientRect();
    var len = el.offsetHeight - vh;
    return len > 0 ? clamp(-r.top / len, 0, 1) : (r.top < 0 ? 1 : 0);
  }

  function setLensClip(rect, lens, host) {
    var r = lens.getBoundingClientRect();
    rect.setAttribute("x", (r.left - host.left).toFixed(1));
    rect.setAttribute("y", (r.top - host.top).toFixed(1));
    rect.setAttribute("width", r.width.toFixed(1));
    rect.setAttribute("height", r.height.toFixed(1));
    var rx = r.width * (74 / 328);
    rect.setAttribute("rx", rx.toFixed(1));
  }

  function update() {
    ticking = false;
    var y = window.scrollY;
    var docH = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.transform = "scaleX(" + (docH > 0 ? y / docH : 0) + ")";

    if (nav) {
      nav.classList.toggle("is-scrolled", y > 30);
      if (!nav.classList.contains("menu-open")) {
        if (y > lastY + 3 && y > 600) nav.classList.add("is-hidden");
        else if (y < lastY - 3) nav.classList.remove("is-hidden");
      }
    }
    lastY = y;

    /* Hero: Putzen, Text, Zoom durchs Glas */
    if (hero && stage) {
      var p = reduce ? 1 : sectionProgress(hero);
      var w = reduce ? 1 : ease(clamp((p - .04) / .46, 0, 1));
      var c = reduce ? 1 : ease(clamp((p - .52) / .2, 0, 1));
      var z = reduce ? 0 : Math.pow(clamp((p - .8) / .2, 0, 1), 2);
      heroSticky.style.setProperty("--w", w.toFixed(4));
      heroSticky.style.setProperty("--c", c.toFixed(4));
      heroSticky.style.setProperty("--z", z.toFixed(4));
      heroCopy.classList.toggle("is-on", c > .5 && z < .3);
      if (!reduce) {
        var edge = -80 + w * 1180;            // Wischkante in SVG-Einheiten
        wipeEdge.setAttribute("transform", "translate(" + edge.toFixed(1) + " 0)");
        var sw = stage.offsetWidth;
        var cx = (edge / 1000) * sw;           // Tuchmitte folgt der Kante
        var bob = Math.sin(w * Math.PI * 6) * 14;
        var vis = w > 0 && w < 1 ? 1 : 0;
        cloth.style.opacity = vis;
        cloth.style.transform = "translate(" + (cx - sw * .15).toFixed(1) + "px," + bob.toFixed(1) + "px) rotate(" + (-10 + w * 20).toFixed(1) + "deg)";
        if (cleanValue) cleanValue.textContent = Math.round(w * 100);
      }
      var host = heroSticky.getBoundingClientRect();
      if (host.bottom > 0 && host.top < vh) {
        setLensClip(clipL, lensL, host);
        setLensClip(clipR, lensR, host);
      }
    }

    if (reduce) return;

    /* Mikrofaser-Zoom */
    if (microPin) {
      var mr = microPin.getBoundingClientRect();
      if (mr.bottom > 0 && mr.top < vh) {
        var mp = sectionProgress(microPin);
        var open = clamp((vh - mr.top) / (vh * .8), 0, 1);
        microScope.style.setProperty("--p", mp.toFixed(4));
        microScope.style.setProperty("--o", ease(open).toFixed(4));
        var idx = clamp(Math.floor(mp * 3), 0, 2);
        if (idx !== lastMicro) {
          microItems.forEach(function (it, i) { it.classList.toggle("is-active", i === idx); it.classList.toggle("is-past", i < idx); });
          microDots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
          lastMicro = idx;
        }
        dirt.forEach(function (d, i) {
          var t = clamp(mp * 3 - 1 - (i % 5) * .12, 0, 1);  // Schmutz wird aufgenommen
          d.style.opacity = (.8 * (1 - t)).toFixed(3);
        });
      }
    }

    /* Allgemeiner Fortschritt --p */
    scrollEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      el.style.setProperty("--p", clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(4));
    });
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      el.style.setProperty("--p", clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(4));
    });
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; request(); });
  window.addEventListener("load", request);
  update();

  /* Glas-Ausschnitt muss auch während der Einstiegs-Animation mitlaufen */
  if (!reduce) {
    var until = performance.now() + 3200;
    (function follow(t) { update(); if (t < until) requestAnimationFrame(follow); })(performance.now());
  }

  /* ---------- Eigener Cursor ---------- */
  var cursor = $(".cursor");
  if (cursor && fine && !reduce) {
    var mx = -100, my = -100, cxp = -100, cyp = -100;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      cxp += (mx - cxp) * .2; cyp += (my - cyp) * .2;
      cursor.style.transform = "translate(" + cxp.toFixed(1) + "px," + cyp.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, summary, input, .compare"));
    });
  }

  /* ---------- Magnetische Buttons ---------- */
  if (fine && !reduce) {
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .2).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- Karten: Neigung & Lichtpunkt ---------- */
  if (fine && !reduce) {
    $$("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((x - .5) * 8).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((.5 - y) * 8).toFixed(2) + "deg");
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseleave", function () { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------- Vorher/Nachher ---------- */
  var compare = $("#compare"), range = $("#compare-range"), demoDone = false;
  function setPos(v) { compare.style.setProperty("--pos", v + "%"); }
  if (compare && range) {
    range.addEventListener("input", function () { demoDone = true; setPos(range.value); });
  }
  function demoCompare() {
    if (!compare || reduce || demoDone) return;
    var keys = [[0, 50], [700, 18], [1600, 84], [2300, 50]], start = null;
    function step(t) {
      if (demoDone) return;
      if (!start) start = t;
      var e = t - start, v = 50;
      for (var i = 0; i < keys.length - 1; i++) {
        if (e >= keys[i][0] && e <= keys[i + 1][0]) {
          var k = ease((e - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
          v = keys[i][1] + (keys[i + 1][1] - keys[i][1]) * k;
        }
      }
      setPos(v.toFixed(2)); range.value = Math.round(v);
      if (e < keys[keys.length - 1][0]) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 500);
  }

  /* ---------- Farbwahl ---------- */
  var colors = $("#farben"), halo = $(".colors__halo"), colorName = $("#color-name");
  $$(".swatch").forEach(function (sw) {
    sw.addEventListener("click", function () {
      $$(".swatch").forEach(function (o) { o.classList.remove("is-active"); o.setAttribute("aria-checked", "false"); });
      sw.classList.add("is-active");
      sw.setAttribute("aria-checked", "true");
      colors.style.setProperty("--cloth", sw.getAttribute("data-color"));
      colors.style.setProperty("--cloth-dark", sw.getAttribute("data-dark"));
      colorName.textContent = sw.getAttribute("data-name");
      halo.classList.remove("is-pulse"); void halo.offsetWidth; halo.classList.add("is-pulse");
    });
  });

  /* ---------- Preise zählen hoch ---------- */
  var counters = $$("[data-count]");
  function fmt(cents) { return (cents / 100).toFixed(2).replace(".", ","); }
  function count(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce) { el.textContent = fmt(target); return; }
    var s = null;
    (function step(t) {
      if (!s) s = t;
      var k = clamp((t - s) / 1300, 0, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { count(e.target); co.unobserve(e.target); } });
    }, { threshold: .7 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- FAQ: eine Antwort zur Zeit ---------- */
  var faq = $$(".faq details");
  faq.forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) faq.forEach(function (o) { if (o !== d) o.open = false; }); });
  });
})();
