/* LUND – Shop, Warenkorb & Scroll-Animationen
   Reines JavaScript, keine Bibliotheken, keine externen Dienste. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) root.classList.add("motion");

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function euro(n) { return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Daten ---------- */
  var DIALS = [
    { id: "eisblau", name: "Eisblau", c: "#8fb8d6", txt: "Kühl und hell wie Gletscherwasser." },
    { id: "salbei", name: "Salbei", c: "#7f9a86", txt: "Ruhiges Grün mit warmem Unterton." },
    { id: "nachtblau", name: "Nachtblau", c: "#2b4673", txt: "Tiefes Blau, das im Licht aufleuchtet." },
    { id: "lachs", name: "Lachs", c: "#d9a08a", txt: "Warmer Ton, selten und selbstbewusst." },
    { id: "anthrazit", name: "Anthrazit", c: "#5a5e65", txt: "Zurückhaltend, für jeden Anlass." },
    { id: "silber", name: "Silber", c: "#c9ccd0", txt: "Klassisch hell mit feinem Glanz." }
  ];
  var PREIS = { 39: 1290, 36: 1250 }, GRAVUR = 49;
  var IMG = "ressourcen/bilder/uhren/";
  function dial(id) { return DIALS.filter(function (d) { return d.id === id; })[0]; }
  function hex2rgba(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }

  // gemeinsamer Zustand mit der 3D-Szene
  var LUND = window.LUND = { heroP: 0, heroDial: "eisblau", cfgDial: "eisblau", cfgSize: 39, drag: 0 };
  function setAccent(id) {
    var d = dial(id);
    root.style.setProperty("--dial", d.c);
    root.style.setProperty("--dial-soft", hex2rgba(d.c, .26));
  }

  /* ---------- Hero ---------- */
  var heroPin = $("#hero-pin"), hero = $(".hero"), word = $("#hero-word"), dotsEl = $("#hero-dots"), clock = $("#hero-clock");
  dotsEl.innerHTML = DIALS.map(function (d, i) {
    return '<li><button style="--c:' + d.c + '" data-i="' + i + '" aria-label="Zifferblatt ' + d.name + ' zeigen"><span>' + d.name + '</span></button></li>';
  }).join("");
  var heroIndex = -1;
  function setHeroDial(i) {
    if (i === heroIndex) return;
    heroIndex = i;
    var d = DIALS[i];
    LUND.heroDial = d.id;
    $$("button", dotsEl).forEach(function (b, j) { b.classList.toggle("is-on", j === i); });
    if (reduce) { word.textContent = d.name; }
    else {
      word.classList.add("is-swap");
      setTimeout(function () { word.textContent = d.name; word.classList.remove("is-swap"); }, 260);
    }
    if (window.scrollY < hero.offsetHeight) setAccent(d.id);
  }
  dotsEl.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var i = +b.dataset.i;
    if (reduce) { setHeroDial(i); return; }
    var len = hero.offsetHeight - innerHeight;
    scrollTo({ top: hero.offsetTop + len * ((i + .5) / DIALS.length) * .86, behavior: "smooth" });
  });
  setHeroDial(0);
  function tick() {
    var n = new Date();
    clock.textContent = String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
  }
  tick(); setInterval(tick, 10000);

  /* ---------- Intro: Wörter erscheinen beim Lesen ---------- */
  var lead = $(".split-words");
  if (lead && !reduce) {
    var txt = lead.textContent.trim();
    lead.setAttribute("aria-label", txt);
    lead.innerHTML = txt.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + "</span>"; }).join(" ");
  }
  var leadWords = lead ? $$(".w", lead) : [];

  /* ---------- Kollektion ---------- */
  var cards = $("#cards"), size = 39;
  function renderCards() {
    cards.innerHTML = DIALS.map(function (d, i) {
      return '<article class="wcard' + (reduce ? " is-in" : "") + '" style="--c:' + d.c + ';--d:' + (i % 3) + '" data-id="' + d.id + '">' +
        '<button class="wcard__img" aria-label="LUND ' + size + ' ' + d.name + ' im Konfigurator ansehen">' +
          '<img class="a" src="' + IMG + d.id + '-front-klein.webp" alt="LUND ' + size + ' mm mit Zifferblatt ' + d.name + '" width="600" height="750" loading="lazy">' +
          '<img class="b" src="' + IMG + d.id + '-34-klein.webp" alt="" width="600" height="750" loading="lazy"></button>' +
        '<span class="wcard__dot">' + d.name + '</span>' +
        '<button class="wcard__add" aria-label="LUND ' + size + ' ' + d.name + ' in den Warenkorb"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>' +
        '<div class="wcard__info"><div><h3 class="wcard__name">LUND ' + size + ' ' + d.name + '</h3><p class="wcard__meta">' + d.txt + '</p></div><span class="wcard__price">' + euro(PREIS[size]) + '</span></div>' +
      '</article>';
    }).join("");
    if (io) $$(".wcard", cards).forEach(function (c) { io.observe(c); });
  }
  $$("[data-size]").forEach(function (b) {
    b.addEventListener("click", function () {
      size = +b.dataset.size;
      $$("[data-size]").forEach(function (o) { o.classList.toggle("is-on", o === b); o.setAttribute("aria-pressed", String(o === b)); });
      renderCards();
    });
  });
  cards.addEventListener("click", function (e) {
    var card = e.target.closest(".wcard"); if (!card) return;
    if (e.target.closest(".wcard__add")) { addItem({ dial: card.dataset.id, size: size, gravur: "" }); return; }
    if (e.target.closest(".wcard__img")) {
      setCfgDial(card.dataset.id); setCfgSize(size);
      $("#konfigurator").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
  });

  /* ---------- Konfigurator ---------- */
  var cfgDials = $("#cfg-dials"), gravur = $("#cfg-gravur");
  cfgDials.innerHTML = DIALS.map(function (d) {
    return '<button class="sw" style="--c:' + d.c + '" data-dial="' + d.id + '" aria-label="Zifferblatt ' + d.name + '" aria-pressed="false"></button>';
  }).join("");
  function setCfgDial(id) {
    LUND.cfgDial = id;
    $$(".sw", cfgDials).forEach(function (b) { var on = b.dataset.dial === id; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
    $("#cfg-name").textContent = dial(id).name;
    $("#config-fallback").src = IMG + id + "-34.webp";
    if (window.scrollY > hero.offsetHeight) setAccent(id);
    cfgPrice();
  }
  function setCfgSize(s) {
    LUND.cfgSize = s;
    $$("[data-cfg-size]").forEach(function (b) { var on = +b.dataset.cfgSize === s; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
    cfgPrice();
  }
  function cfgPrice() { $("#cfg-price").textContent = euro(PREIS[LUND.cfgSize] + (gravur.value.trim() ? GRAVUR : 0)); }
  cfgDials.addEventListener("click", function (e) { var b = e.target.closest(".sw"); if (b) setCfgDial(b.dataset.dial); });
  $$("[data-cfg-size]").forEach(function (b) { b.addEventListener("click", function () { setCfgSize(+b.dataset.cfgSize); }); });
  gravur.addEventListener("input", cfgPrice);
  $("#cfg-add").addEventListener("click", function () { addItem({ dial: LUND.cfgDial, size: LUND.cfgSize, gravur: gravur.value.trim() }); });
  setCfgDial("eisblau");

  /* ---------- Warenkorb ---------- */
  var KEY = "lund-warenkorb", bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { bag = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) { /* ohne Speicher weiter */ } }
  function price(it) { return PREIS[it.size] + (it.gravur ? GRAVUR : 0); }
  function render() {
    $("#bag-list").innerHTML = bag.map(function (it, i) {
      var d = dial(it.dial);
      return '<li class="bi"><img src="' + IMG + it.dial + '-front-klein.webp" alt="" width="76" height="95"><div><b>LUND ' + it.size + ' ' + esc(d.name) + '</b><small>' + it.size + ' mm · Edelstahl' + (it.gravur ? ' · Gravur „' + esc(it.gravur) + '“' : '') + '</small>' +
        '<div class="bi__q"><button data-q="-1" data-i="' + i + '" aria-label="Menge verringern">–</button><span>' + it.n + '</span><button data-q="1" data-i="' + i + '" aria-label="Menge erhöhen">+</button></div></div>' +
        '<div class="bi__p">' + euro(price(it) * it.n) + '<button data-rm="' + i + '">Entfernen</button></div></li>';
    }).join("");
    var n = bag.reduce(function (s, it) { return s + it.n; }, 0);
    $("#bag-n").textContent = n;
    $("#bag-sum").textContent = euro(bag.reduce(function (s, it) { return s + price(it) * it.n; }, 0));
  }
  $("#bag-list").addEventListener("click", function (e) {
    var q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]");
    if (q) { var it = bag[+q.dataset.i]; it.n += +q.dataset.q; if (it.n < 1) bag.splice(+q.dataset.i, 1); }
    if (rm) bag.splice(+rm.dataset.rm, 1);
    if (q || rm) { save(); render(); }
  });
  var noteT;
  function note(t) { var el = $("#note"); el.textContent = t; el.classList.add("is-on"); clearTimeout(noteT); noteT = setTimeout(function () { el.classList.remove("is-on"); }, 2600); }
  function addItem(item) {
    var k = item.dial + "|" + item.size + "|" + item.gravur;
    var f = bag.filter(function (b) { return b.dial + "|" + b.size + "|" + b.gravur === k; })[0];
    if (f) f.n++; else { item.n = 1; bag.push(item); }
    save(); render();
    var b = $("#bag-open"); b.classList.remove("is-bump"); void b.offsetWidth; b.classList.add("is-bump");
    note("LUND " + item.size + " " + dial(item.dial).name + " liegt im Warenkorb.");
  }
  render();

  var sheet = $("#bag"), lastFocus;
  function openSheet() { lastFocus = document.activeElement; sheet.hidden = false; document.body.classList.add("is-locked"); $(".close", sheet).focus(); }
  function closeSheet() {
    if (sheet.hidden) return;
    var done = function () { sheet.hidden = true; sheet.classList.remove("is-closing"); document.body.classList.remove("is-locked"); if (lastFocus) lastFocus.focus(); };
    if (reduce) return done();
    sheet.classList.add("is-closing"); setTimeout(done, 480);
  }
  $("#bag-open").addEventListener("click", openSheet);
  sheet.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeSheet(); setMenu(false); }
    if (e.key === "Tab" && !sheet.hidden) {
      var f = $$("button, a[href]", sheet).filter(function (x) { return x.offsetParent !== null; });
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  $("#checkout").addEventListener("click", function (e) {
    e.preventDefault();
    if (!bag.length) return;
    var lines = bag.map(function (it) { return it.n + " × LUND " + it.size + " " + dial(it.dial).name + (it.gravur ? " (Gravur: " + it.gravur + ")" : "") + " – " + euro(price(it) * it.n); });
    var body = "Hallo LUND-Team,\n\nich möchte Folgendes bestellen:\n\n" + lines.join("\n") + "\n\nHandgelenksumfang (cm):\n\nLieferadresse:\n\n";
    location.href = "mailto:bestellung@ihre-domain.de?subject=" + encodeURIComponent("Bestellung LUND") + "&body=" + encodeURIComponent(body);
  });

  /* ---------- Navigation ---------- */
  var top = $("#top-bar"), burger = $("#burger"), nav = $("#nav");
  function setMenu(o) { burger.setAttribute("aria-expanded", String(o)); burger.setAttribute("aria-label", o ? "Menü schließen" : "Menü öffnen"); nav.classList.toggle("is-open", o); top.classList.toggle("menu-open", o); }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  top.addEventListener("focusin", function () { top.classList.remove("is-hidden"); });
  var links = $$("a", nav);
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* ---------- Einblenden ---------- */
  var io = null;
  if ("IntersectionObserver" in window && !reduce) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); if (e.target.querySelector && e.target.querySelector("[data-count]")) countUp(e.target); } });
    }, { threshold: .2, rootMargin: "0px 0px -6% 0px" });
    $$(".rise, .config__in").forEach(function (el) { io.observe(el); });
  } else {
    $$(".rise, .config__in").forEach(function (el) { el.classList.add("is-in"); });
  }
  renderCards();

  function countUp(el) {
    $$("[data-count]", el).forEach(function (n) {
      var t = parseFloat(n.dataset.count), dec = +(n.dataset.dec || 0), s = null;
      (function step(ts) {
        if (!s) s = ts;
        var k = clamp((ts - s) / 1400, 0, 1), v = t * (1 - Math.pow(1 - k, 3));
        n.textContent = v.toFixed(dec).replace(".", ",");
        if (k < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }

  /* ---------- Scroll-Schleife ---------- */
  var macroPin = $("#macro-pin"), macroImgs = $$(".macro__img"), macroItems = $$(".macro__item"), macroBar = $("#macro-bar"), footMark = $(".foot__mark");
  var vh = innerHeight, lastY = scrollY, ticking = false, macroIdx = 0;
  function prog(el) { var r = el.getBoundingClientRect(), len = el.offsetHeight - vh; return len > 0 ? clamp(-r.top / len, 0, 1) : (r.top < 0 ? 1 : 0); }
  function update() {
    ticking = false;
    var sy = scrollY;
    top.classList.toggle("is-solid", sy > 40);
    if (!nav.classList.contains("is-open")) {
      if (sy > lastY + 4 && sy > 500) top.classList.add("is-hidden");
      else if (sy < lastY - 4) top.classList.remove("is-hidden");
    }
    lastY = sy;
    if (reduce) return;

    var hp = prog(hero);
    LUND.heroP = hp;
    heroPin.style.setProperty("--p", hp.toFixed(4));
    setHeroDial(clamp(Math.floor(hp / .86 * DIALS.length), 0, DIALS.length - 1));
    if (sy > hero.offsetHeight - vh * .5) setAccent(LUND.cfgDial);

    leadWords.forEach(function (w) { w.classList.toggle("is-in", w.getBoundingClientRect().top < vh * .72); });

    var mp = prog(macroPin), mi = clamp(Math.floor(mp * 3), 0, 2);
    if (mi !== macroIdx) {
      macroImgs.forEach(function (im, i) { im.classList.toggle("is-on", i === mi); });
      macroItems.forEach(function (it, i) { it.classList.toggle("is-on", i === mi); });
      macroIdx = mi;
    }
    macroImgs[mi].style.setProperty("--z", ((mp * 3) - mi).toFixed(3));
    macroBar.parentNode.style.setProperty("--p", mp.toFixed(4));

    var fr = footMark.getBoundingClientRect();
    footMark.style.setProperty("--p", clamp((vh - fr.top) / (fr.height * 1.4), 0, 1).toFixed(3));
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", function () { vh = innerHeight; req(); });
  update();
  requestAnimationFrame(function () { heroPin.classList.add("is-loaded"); });
})();
