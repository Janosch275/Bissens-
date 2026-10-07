/* Atelier Kante – Beispiel-Website
   Design & Umsetzung: Webdesign Janosch Krause */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Ortszeit ---------- */
  var clock = $("#clock");
  function tick() {
    if (!clock) return;
    var d = new Date();
    clock.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  tick(); setInterval(tick, 15000);

  /* ---------- Start-Animation ---------- */
  requestAnimationFrame(function () { setTimeout(function () { document.body.classList.add("is-in"); }, 80); });

  /* ---------- Text in Zeilen zerlegen ---------- */
  function splitLines(el) {
    var text = el.getAttribute("data-text") || el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("data-text", text);
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(" ").map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
    var lines = [], top = null;
    $$(".w", el).forEach(function (w) {
      if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map(function (l, i) {
      return '<span class="line" aria-hidden="true"><span style="--i:' + i + '">' + l.join(" ") + "</span></span>";
    }).join("");
  }
  var lineEls = reduce ? [] : $$("[data-lines]");
  function splitAll() { lineEls.forEach(splitLines); }
  if (lineEls.length) {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(splitAll);
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(splitAll, 200); });
  }

  /* ---------- Einblenden beim Scrollen ---------- */
  var targets = $$(".reveal, [data-lines], .contact__title .mask, .rule");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible", "is-in");
        io.unobserve(e.target);
      });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("is-visible", "is-in"); });
  }

  /* ---------- Zähler ---------- */
  $$("[data-count]").forEach(function (el) {
    var target = +el.getAttribute("data-count");
    if (reduce || !("IntersectionObserver" in window)) return;
    el.textContent = "0";
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1600, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: .6 });
    o.observe(el);
  });

  /* ---------- Scroll: Parallax, gestapelte Karten, Laufband ---------- */
  var heroImg = $(".hero__image img");
  var cards = $$(".card");
  cards.forEach(function (c, i) { c.style.setProperty("--i", i); });
  var track = $(".marquee__track");
  var mx = 0, lastY = window.scrollY, velocity = 0;

  function frame() {
    var y = window.scrollY, vh = window.innerHeight;
    velocity += ((y - lastY) - velocity) * .1;
    lastY = y;

    if (!reduce) {
      if (heroImg) heroImg.style.setProperty("--py", (y * .12).toFixed(1) + "px");

      cards.forEach(function (c, i) {
        var next = cards[i + 1];
        if (!next) return;
        var stickyTop = parseFloat(getComputedStyle(c).top) || 0;
        var nt = next.getBoundingClientRect().top;
        c.style.setProperty("--d", clamp((vh - nt) / (vh - stickyTop), 0, 1).toFixed(3));
      });

      if (track) {
        mx += .6 + Math.abs(velocity) * .25;
        var half = track.scrollWidth / 2;
        if (mx > half) mx -= half;
        track.style.transform = "translate3d(" + (-mx).toFixed(1) + "px,0,0) skewX(" + clamp(-velocity * .15, -8, 8).toFixed(2) + "deg)";
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Eigener Cursor & Bild, das der Maus folgt ---------- */
  if (fine && !reduce) {
    var cursor = $(".cursor"), hover = $(".hover-img"), hoverImg = hover && $("img", hover);
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy, hx = cx, hy = cy;
    root.classList.add("has-cursor");
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * .25; cy += (ty - cy) * .25;
      hx += (tx - hx) * .12; hy += (ty - hy) * .12;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
      if (hover) { hover.style.left = hx + "px"; hover.style.top = hy + "px"; }
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      var view = e.target.closest("[data-cursor]");
      var link = e.target.closest("a, button, input, textarea, select, .row");
      cursor.classList.toggle("is-view", !!view);
      cursor.classList.toggle("is-link", !view && !!link);
    });
    $$(".row").forEach(function (row) {
      row.addEventListener("mouseenter", function () { hoverImg.src = row.getAttribute("data-img"); hover.classList.add("is-on"); });
      row.addEventListener("mouseleave", function () { hover.classList.remove("is-on"); });
    });
  }

  /* ---------- Kontaktformular: E-Mail-Vorlage ---------- */
  var form = $("#contact-form");
  if (!form) return;
  var to = form.getAttribute("data-email"), done = $("#form-done"), link = $("#mail-link");
  link.href = "mailto:" + to; link.textContent = to;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    $$("[required]", form).forEach(function (f) {
      var bad = !f.value.trim();
      f.closest(".field").classList.toggle("is-invalid", bad);
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    var v = function (n) { return form.elements[n].value.trim(); };
    var body = ["Guten Tag,", "", "ich interessiere mich für eine Zusammenarbeit mit Atelier Kante.", "",
      "Art des Projekts: " + (v("art") || "noch offen"), "", v("nachricht"), "", "Mit freundlichen Grüßen", v("name")];
    if (v("telefon")) body.push("Telefon: " + v("telefon"));
    var href = "mailto:" + to + "?subject=" + encodeURIComponent("Projektanfrage – " + v("name")) + "&body=" + encodeURIComponent(body.join("\r\n"));
    link.href = href;
    window.location.href = href;
    done.hidden = false;
  });
})();
