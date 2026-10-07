/* Farbfeld Kunstschule – Beispiel-Website
   Design & Umsetzung: Webdesign Janosch Krause */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var COLORS = ["#FF5B37", "#FFC53D", "#3047FF", "#8FC1A0", "#26173D"];

  $$(".year").forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* ---------- Menü (mobil) ---------- */
  var burger = $("#burger"), menu = $("#menu");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  /* ---------- Seitenübergang mit Farbstreifen ---------- */
  var wipe = $(".wipe");
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    var href = a.getAttribute("href") || "";
    if (!/\.html(\?|#|$)/.test(href) || /^https?:/.test(href)) return;
    if (href.split("#")[0] === location.pathname.split("/").pop() && href.indexOf("#") > -1) return;
    e.preventDefault();
    try { sessionStorage.setItem("ff-wipe", "1"); } catch (err) {}
    wipe.classList.add("is-out");
    setTimeout(function () { location.href = href; }, 620);
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) wipe.classList.remove("is-out"); });

  /* ---------- Buchstaben einzeln (hüpfen) ---------- */
  $$("[data-bounce]").forEach(function (el) {
    var i = 0;
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (word) {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            w.style.whiteSpace = "nowrap";
            w.setAttribute("aria-hidden", "true");
            word.split("").forEach(function (c) {
              var s = document.createElement("span");
              s.className = "ch"; s.textContent = c; s.style.setProperty("--i", i++);
              w.appendChild(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") { walk(n); }
      });
    })(el);
    if (el.closest(".hero")) {
      $$(".ch", el).forEach(function (c, k) {
        c.addEventListener("mouseenter", function () { c.style.color = COLORS[k % 4]; });
      });
    }
  });

  /* ---------- Einblenden ---------- */
  var pops = $$(".pop, [data-bounce], .squiggle");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -5% 0px" });
    pops.forEach(function (p) { io.observe(p); });
  } else {
    pops.forEach(function (p) { p.classList.add("is-in"); });
  }

  /* ---------- Zähler ---------- */
  $$("[data-count]").forEach(function (el) {
    var target = +el.getAttribute("data-count");
    if (reduce || !("IntersectionObserver" in window) || target === 0) return;
    el.textContent = "0";
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: .6 });
    o.observe(el);
  });

  /* ---------- Malen mit der Maus (Hero) ---------- */
  var canvas = $(".paint");
  if (canvas && !reduce && window.matchMedia("(hover: hover)").matches) {
    var ctx = canvas.getContext("2d"), hero = canvas.parentElement, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var last = null, hue = 0;
    var size = function () { canvas.width = hero.clientWidth * dpr; canvas.height = hero.clientHeight * dpr; ctx.scale(dpr, dpr); ctx.lineCap = "round"; ctx.lineJoin = "round"; };
    size(); window.addEventListener("resize", size);
    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (last) {
        var d = Math.hypot(x - last.x, y - last.y);
        ctx.strokeStyle = COLORS[Math.floor(hue) % 4];
        ctx.lineWidth = clamp(34 - d * .45, 10, 34);
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.stroke();
        hue += d / 160;
      }
      last = { x: x, y: y };
    });
    hero.addEventListener("pointerleave", function () { last = null; });
    (function fade() {
      ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "rgba(0,0,0,.035)";
      ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
      requestAnimationFrame(fade);
    })();
  }

  /* ---------- Sticker dreht sich beim Scrollen, Zeitstrahl zeichnet sich ---------- */
  var sticker = $(".sticker svg");
  var tl = $(".tl"), tlPath = $(".tl__line path");
  if (tlPath) tlPath.setAttribute("pathLength", "1");
  function onScroll() {
    if (sticker) sticker.style.setProperty("--rot", (window.scrollY * .35).toFixed(1) + "deg");
    if (tl && tlPath) {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      tlPath.style.setProperty("--p", reduce ? 1 : clamp((vh * .75 - r.top) / r.height, 0, 1).toFixed(3));
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Generierte Kunstwerke ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var PAPER = ["#F3EBDD", "#FFF6E8", "#26173D", "#FFE3A0", "#D3EBDB"];
  function blobPath(r, cx, cy, rad, n) {
    var pts = [];
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, rr = rad * (.65 + r() * .5); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    var d = "";
    for (var k = 0; k < n; k++) {
      var p0 = pts[(k - 1 + n) % n], p1 = pts[k], p2 = pts[(k + 1) % n], p3 = pts[(k + 2) % n];
      if (k === 0) d += "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1);
      d += "C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d + "Z";
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function art(seed, style, w, h) {
    var r = rng(seed * 9973 + 17), bg = pick(r, PAPER), s = "", i;
    var cols = COLORS.filter(function (c) { return c !== bg; });
    if (style === 0) {
      for (i = 0; i < 5; i++) s += '<path d="' + blobPath(r, r() * w, r() * h, 60 + r() * 120, 7) + '" fill="' + pick(r, cols) + '" opacity="' + (.75 + r() * .25).toFixed(2) + '"/>';
      for (i = 0; i < 8; i++) s += '<circle cx="' + (r() * w).toFixed(0) + '" cy="' + (r() * h).toFixed(0) + '" r="' + (4 + r() * 10).toFixed(0) + '" fill="' + pick(r, cols) + '"/>';
    } else if (style === 1) {
      var ang = -30 + r() * 60;
      s += '<g transform="rotate(' + ang.toFixed(0) + ' ' + w / 2 + ' ' + h / 2 + ')">';
      for (i = -2; i < 12; i++) { var y = i * 60, amp = 8 + r() * 18; s += '<path d="M-200 ' + y + ' Q ' + (w / 4) + ' ' + (y - amp) + ' ' + (w / 2) + ' ' + y + ' T ' + (w + 200) + ' ' + y + ' V ' + (y + 34 + r() * 20) + ' H -200 Z" fill="' + pick(r, cols) + '"/>'; }
      s += "</g>";
    } else if (style === 2) {
      for (i = 0; i < 6; i++) { var cx = r() * w, cy = r() * h, rad = 20 + r() * 110; s += '<circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + rad.toFixed(0) + '" fill="' + pick(r, cols) + '" opacity=".9"/>'; if (r() > .5) s += '<circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + (rad * .5).toFixed(0) + '" fill="' + pick(r, cols) + '"/>'; }
      for (i = 0; i < 4; i++) s += '<line x1="' + (r() * w).toFixed(0) + '" y1="' + (r() * h).toFixed(0) + '" x2="' + (r() * w).toFixed(0) + '" y2="' + (r() * h).toFixed(0) + '" stroke="#26173D" stroke-width="' + (3 + r() * 6).toFixed(0) + '" stroke-linecap="round"/>';
    } else if (style === 3) {
      for (i = 0; i < 7; i++) { var x0 = r() * w, y0 = r() * h; s += '<path d="M' + x0.toFixed(0) + ' ' + y0.toFixed(0) + ' Q ' + (r() * w).toFixed(0) + ' ' + (r() * h).toFixed(0) + ' ' + (r() * w).toFixed(0) + ' ' + (r() * h).toFixed(0) + '" fill="none" stroke="' + pick(r, cols) + '" stroke-width="' + (14 + r() * 30).toFixed(0) + '" stroke-linecap="round" opacity=".92"/>'; }
    } else {
      var n = 4, cw = w / n, ch = h / Math.round(h / cw);
      for (var gx = 0; gx < n; gx++) for (var gy = 0; gy < Math.round(h / cw); gy++) {
        var x = gx * cw, yy = gy * ch, c = pick(r, cols), t = Math.floor(r() * 4);
        if (t === 0) s += '<rect x="' + x + '" y="' + yy + '" width="' + cw + '" height="' + ch + '" fill="' + c + '"/>';
        else if (t === 1) s += '<circle cx="' + (x + cw / 2) + '" cy="' + (yy + ch / 2) + '" r="' + (Math.min(cw, ch) * .42) + '" fill="' + c + '"/>';
        else if (t === 2) s += '<path d="M' + x + ' ' + (yy + ch) + ' A ' + cw + ' ' + ch + ' 0 0 1 ' + (x + cw) + ' ' + yy + ' V ' + (yy + ch) + ' Z" fill="' + c + '"/>';
      }
    }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Abstraktes Bild"><rect width="' + w + '" height="' + h + '" fill="' + bg + '"/>' + s + "</svg>";
  }
  var ARTISTS = [["Sommerwiese", "Mia, 9 Jahre"], ["Der laute Montag", "Ben, 7 Jahre"], ["Ohne Titel #4", "Lena, 34"], ["Hafen bei Nacht", "Kursgruppe Acryl"], ["Katze, sehr schnell", "Emil, 6 Jahre"], ["Blau ist warm", "Sophie, 15"], ["Morgenrot", "Hannes, 58"], ["Kreise reden", "Comic-Werkstatt"], ["Linie 12", "Aylin, 16"], ["Mein Zimmer", "Noah, 10 Jahre"], ["Tanz", "Abendkurs Aquarell"], ["Ohne Titel #9", "Jana, 41"], ["Gewitter", "Paul, 8 Jahre"], ["Fundstücke", "Linoldruck-Workshop"]];
  var SIZES = [[600, 600], [600, 750], [600, 800], [750, 600], [600, 600]];
  $$("[data-art-grid]").forEach(function (grid) {
    var n = +grid.getAttribute("data-art-grid"), html = "";
    for (var i = 0; i < n; i++) {
      var sz = grid.classList.contains("teaser") ? [600, 600] : SIZES[i % SIZES.length];
      html += '<figure class="art pop" tabindex="0" data-i="' + i + '">' + art(i + 3, i % 5, sz[0], sz[1]) + "<figcaption><b>" + ARTISTS[i][0] + "</b>" + ARTISTS[i][1] + "</figcaption></figure>";
    }
    grid.innerHTML = html;
    $$(".art", grid).forEach(function (a) { if (io) io.observe(a); else a.classList.add("is-in"); });
    if (grid.classList.contains("teaser")) $$(".art", grid).forEach(function (a) { a.addEventListener("click", function () { location.href = "galerie.html"; }); });
  });

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox");
  if (lb) {
    var items = $$(".gallery .art"), cur = 0;
    var show = function (i) {
      cur = (i + items.length) % items.length;
      $(".lightbox__art", lb).innerHTML = $("svg", items[cur]).outerHTML;
      $("figcaption", lb).innerHTML = $("figcaption", items[cur]).innerHTML;
      var f = $("figure", lb); f.style.animation = "none"; void f.offsetWidth; f.style.animation = "";
    };
    var open = function (i) { show(i); lb.hidden = false; document.body.style.overflow = "hidden"; $(".lightbox__close", lb).focus(); };
    var close = function () { lb.hidden = true; document.body.style.overflow = ""; items[cur].focus(); };
    items.forEach(function (it, i) {
      it.addEventListener("click", function () { open(i); });
      it.addEventListener("keydown", function (e) { if (e.key === "Enter") open(i); });
    });
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__prev", lb).addEventListener("click", function () { show(cur - 1); });
    $(".lightbox__next", lb).addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  /* ---------- Kursfilter ---------- */
  var chips = $$(".chip[data-filter]");
  if (chips.length) {
    var courses = $$(".course"), count = $("#count");
    var apply = function (f) {
      chips.forEach(function (c) { c.classList.toggle("is-on", c.getAttribute("data-filter") === f); });
      var n = 0;
      courses.forEach(function (c) {
        var show = f === "alle" || c.getAttribute("data-cat") === f;
        c.classList.toggle("is-hidden", !show);
        c.classList.remove("is-entering");
        if (show) { c.style.setProperty("--n", n++); void c.offsetWidth; if (!reduce) c.classList.add("is-entering"); }
      });
      count.textContent = n;
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); }); });
    var h = location.hash.replace("#", "");
    if (h && $('.chip[data-filter="' + h + '"]')) apply(h);
  }

  /* ---------- Kontaktformular: E-Mail-Vorlage ---------- */
  var form = $("#contact-form");
  if (!form) return;
  var kurs = $("#f-kurs");
  ["Kleine Klecksmonster", "Farbforscher:innen", "Ton und Matsch", "Comic-Werkstatt", "Streetart und Schablone", "Mappenkurs", "Aquarell am Abend", "Acryl und Spachtel", "Linoldruck-Wochenende", "Porträt in einem Tag"].forEach(function (k) {
    var o = document.createElement("option"); o.textContent = k; kurs.appendChild(o);
  });
  var wanted = new URLSearchParams(location.search).get("kurs");
  if (wanted) kurs.value = wanted;
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
    var body = ["Hallo liebes Farbfeld-Team,", "", "ich möchte gern eine kostenlose Probestunde buchen.", "",
      "Für wen: " + v("fuer"), "Kurs: " + (v("kurs") || "noch unsicher – bitte beraten"), "", v("nachricht"), "", "Viele Grüße", v("name")];
    if (v("telefon")) body.push("Telefon: " + v("telefon"));
    var href = "mailto:" + to + "?subject=" + encodeURIComponent("Probestunde – " + v("name")) + "&body=" + encodeURIComponent(body.join("\r\n"));
    link.href = href;
    window.location.href = href;
    done.hidden = false;
  });
})();
