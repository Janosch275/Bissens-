/* Sehwerk – Shop, Warenkorb & Scroll-Animationen
   Reines JavaScript ohne Bibliotheken und ohne externe Dienste. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) root.classList.add("motion");

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function euro(n) { return n.toFixed(2).replace(".", ",") + " €"; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Produktdaten ---------- */
  var FARBEN = {
    "schwarz": { name: "Schwarz", c: "#151515" }, "schwarz-matt": { name: "Schwarz matt", c: "#2a2a2a" },
    "havanna": { name: "Havanna", c: "#7a4518" }, "honig": { name: "Honig", c: "#b06e2a" },
    "flaschengruen": { name: "Flaschengrün", c: "#1f4a3a" }, "bordeaux": { name: "Bordeaux", c: "#5e1622" },
    "gold": { name: "Gold", c: "#c9a560" }, "silber": { name: "Silber", c: "#c8ccd0" },
    "rauchgrau": { name: "Rauchgrau", c: "#55595e" }, "rose": { name: "Rosé", c: "#c99189" }
  };
  var PRODUKTE = [
    { id: "kant", name: "Kant", form: "eckig", formName: "Eckig · Acetat", preis: 119, neu: false, farben: ["schwarz", "havanna"], mass: [52, 18, 145],
      text: "Eine klare, rechteckige Fassung mit kräftigem Rand. Unser Klassiker für den Schreibtisch – passt zu fast jeder Gesichtsform." },
    { id: "ilse", name: "Ilse", form: "rund", formName: "Panto · Acetat", preis: 109, neu: false, farben: ["havanna", "honig"], mass: [48, 20, 145],
      text: "Runde Panto-Form mit leicht abgeflachter Oberkante. Weich, freundlich und angenehm leicht." },
    { id: "otto", name: "Otto", form: "eckig", formName: "Eckig · Acetat", preis: 129, neu: true, farben: ["flaschengruen", "schwarz-matt"], mass: [51, 19, 145],
      text: "Breiter Rand, weiche Ecken, viel Präsenz. Für alle, die ihre Brille gern zeigen." },
    { id: "mila", name: "Mila", form: "cateye", formName: "Cat-Eye · Acetat", preis: 119, neu: true, farben: ["bordeaux", "havanna"], mass: [53, 17, 140],
      text: "Dezentes Cat-Eye mit sanft angehobenen Außenkanten. Elegant, ohne laut zu sein." },
    { id: "bruno", name: "Bruno", form: "metall", formName: "Rund · Metall", preis: 139, neu: false, farben: ["gold", "silber"], mass: [47, 21, 145],
      text: "Feine runde Metallfassung mit Nasenpads und Bügelenden aus Acetat. Federleicht auf der Nase." },
    { id: "frieda", name: "Frieda", form: "eckig", formName: "Oversize · Acetat", preis: 119, neu: false, farben: ["rauchgrau", "rose"], mass: [55, 17, 145],
      text: "Großzügige Form in transparentem Acetat. Hell, modern und überraschend leicht." }
  ];
  var ZUBEHOER = [
    { id: "tuch", name: "Mikrofasertuch", sub: "Einzeln, 18 × 18 cm", preis: 9 },
    { id: "tuch3", name: "Tuch-Set", sub: "3 Mikrofasertücher", preis: 22 }
  ];
  var GLAS_AUFPREIS = 49;
  var VERSANDFREI = 60;
  var BILD = "ressourcen/bilder/produkte/";
  function bild(id, farbe, ansicht, klein) { return BILD + id + "-" + farbe + "-" + ansicht + (klein ? "-klein" : "") + ".webp"; }
  function produkt(id) { return PRODUKTE.filter(function (p) { return p.id === id; })[0]; }

  /* ---------- Kollektion aufbauen ---------- */
  var grid = $("#grid");
  PRODUKTE.forEach(function (p, i) {
    var f = p.farben[0];
    var card = document.createElement("article");
    card.className = "card";
    card.dataset.form = p.form;
    card.dataset.id = p.id;
    card.dataset.farbe = f;
    card.style.setProperty("--d", i % 3);
    card.innerHTML =
      '<div class="card__visual"><button class="card__media" aria-label="' + esc(p.name) + ' ansehen">' +
        '<img class="main" src="' + bild(p.id, f, "34", true) + '" alt="Brille ' + esc(p.name) + ' in ' + esc(FARBEN[f].name) + '" width="700" height="525" loading="lazy">' +
        '<img class="alt" src="' + bild(p.id, f, "front", true) + '" alt="" width="700" height="525" loading="lazy">' +
        (p.neu ? '<span class="card__tag">Neu</span>' : "") +
      '</button>' +
      '<button class="card__add">In den Warenkorb</button></div>' +
      '<div class="card__row"><h3 class="card__name">' + esc(p.name) + '</h3><span class="card__price">' + euro(p.preis) + '</span></div>' +
      '<div class="card__meta"><span class="card__form">' + esc(p.formName) + ' · <span class="card__farbe">' + esc(FARBEN[f].name) + '</span></span>' +
        '<div class="swatches">' + p.farben.map(function (k, j) {
          return '<button class="sw' + (j === 0 ? " is-on" : "") + '" style="--c:' + FARBEN[k].c + '" data-farbe="' + k + '" aria-label="Farbe ' + esc(FARBEN[k].name) + '" aria-pressed="' + (j === 0) + '"></button>';
        }).join("") + '</div></div>';
    grid.appendChild(card);
  });

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card"); if (!card) return;
    var p = produkt(card.dataset.id);
    var sw = e.target.closest(".sw");
    if (sw) {
      var f = sw.dataset.farbe;
      card.dataset.farbe = f;
      $$(".sw", card).forEach(function (s) { s.classList.toggle("is-on", s === sw); s.setAttribute("aria-pressed", String(s === sw)); });
      var main = $(".main", card), alt = $(".alt", card);
      main.src = bild(p.id, f, "34", true); main.alt = "Brille " + p.name + " in " + FARBEN[f].name;
      alt.src = bild(p.id, f, "front", true);
      $(".card__farbe", card).textContent = FARBEN[f].name;
      return;
    }
    if (e.target.closest(".card__add")) {
      addToCart({ id: p.id, farbe: card.dataset.farbe, glas: "ohne" }, $(".card__media", card));
      return;
    }
    if (e.target.closest(".card__media")) openProduct(p.id, card.dataset.farbe);
  });

  /* Filter */
  $$(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.filter;
      $$(".chip").forEach(function (c) { c.classList.toggle("is-on", c === chip); c.setAttribute("aria-pressed", String(c === chip)); });
      var n = 0;
      $$(".card", grid).forEach(function (card) {
        var show = f === "alle" || card.dataset.form === f || (f === "rund" && card.dataset.form === "metall");
        card.classList.toggle("is-out", !show);
        if (show && !reduce) {
          card.classList.remove("is-in"); card.style.setProperty("--d", n++);
          void card.offsetWidth; card.classList.add("is-in");
        }
      });
    });
  });

  /* ---------- Zubehör ---------- */
  var acc = $("#acc-items");
  ZUBEHOER.forEach(function (z) {
    var row = document.createElement("div");
    row.className = "acc-item";
    row.innerHTML = '<div><b>' + esc(z.name) + '</b><small>' + esc(z.sub) + '</small></div><span class="price">' + euro(z.preis) + '</span>' +
      '<button class="btn btn--line" data-acc="' + z.id + '">Hinzufügen</button>';
    acc.appendChild(row);
  });
  acc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-acc]"); if (!b) return;
    addToCart({ id: b.dataset.acc }, $(".acc__img"));
  });

  /* ---------- Ebenen (Dialoge) ---------- */
  var lastFocus = null;
  function openLayer(el) {
    lastFocus = document.activeElement;
    el.hidden = false; el.classList.remove("is-closing");
    document.body.classList.add("is-locked");
    var f = $(".x", el); if (f) f.focus();
  }
  function closeLayer(el) {
    if (el.hidden) return;
    if (reduce) { el.hidden = true; document.body.classList.remove("is-locked"); if (lastFocus) lastFocus.focus(); return; }
    el.classList.add("is-closing");
    setTimeout(function () { el.hidden = true; el.classList.remove("is-closing"); if (!$(".layer:not([hidden])")) document.body.classList.remove("is-locked"); if (lastFocus) lastFocus.focus(); }, 480);
  }
  $$(".layer").forEach(function (l) {
    l.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeLayer(l); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") $$(".layer:not([hidden])").forEach(closeLayer);
    if (e.key === "Tab") {                                  // Fokus im offenen Dialog halten
      var open = $(".layer:not([hidden])"); if (!open) return;
      var f = $$("button, a[href], input", open).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Produktdetail ---------- */
  var pdLayer = $("#product"), pdImg = $("#pd-img"), pdState = {};
  function pdImage() {
    var src = bild(pdState.id, pdState.farbe, pdState.view, false);
    if (reduce) { pdImg.src = src; return; }
    pdImg.classList.add("is-swap");
    setTimeout(function () { pdImg.src = src; pdImg.onload = function () { pdImg.classList.remove("is-swap"); }; }, 200);
  }
  function openProduct(id, farbe) {
    var p = produkt(id);
    pdState = { id: id, farbe: farbe || p.farben[0], view: "34" };
    $("#pd-form").textContent = p.formName;
    $("#pd-name").textContent = p.name;
    $("#pd-price").textContent = euro(p.preis);
    $("#pd-desc").textContent = p.text;
    $("#pd-color-name").textContent = FARBEN[pdState.farbe].name;
    $("#pd-colors").innerHTML = p.farben.map(function (k) {
      return '<button class="sw' + (k === pdState.farbe ? " is-on" : "") + '" style="--c:' + FARBEN[k].c + '" data-farbe="' + k + '" aria-label="Farbe ' + esc(FARBEN[k].name) + '" aria-pressed="' + (k === pdState.farbe) + '"></button>';
    }).join("");
    $("#pd-size").innerHTML = '<div><dt>Glas</dt><dd>' + p.mass[0] + ' mm</dd></div><div><dt>Steg</dt><dd>' + p.mass[1] + ' mm</dd></div><div><dt>Bügel</dt><dd>' + p.mass[2] + ' mm</dd></div>';
    $$(".pd__views button").forEach(function (b) { b.classList.toggle("is-on", b.dataset.view === "34"); });
    $$('input[name="glas"]').forEach(function (r) { r.checked = r.value === "ohne"; });
    pdImg.src = bild(id, pdState.farbe, "34", false);
    pdImg.alt = "Brille " + p.name + " in " + FARBEN[pdState.farbe].name;
    updatePdPrice();
    openLayer(pdLayer);
  }
  function updatePdPrice() {
    var p = produkt(pdState.id), mit = $('input[name="glas"]:checked').value === "mit";
    $("#pd-price").textContent = euro(p.preis + (mit ? GLAS_AUFPREIS : 0));
  }
  $("#pd-colors").addEventListener("click", function (e) {
    var sw = e.target.closest(".sw"); if (!sw) return;
    pdState.farbe = sw.dataset.farbe;
    $$("#pd-colors .sw").forEach(function (s) { s.classList.toggle("is-on", s === sw); s.setAttribute("aria-pressed", String(s === sw)); });
    $("#pd-color-name").textContent = FARBEN[pdState.farbe].name;
    pdImg.alt = "Brille " + produkt(pdState.id).name + " in " + FARBEN[pdState.farbe].name;
    pdImage();
  });
  $$(".pd__views button").forEach(function (b) {
    b.addEventListener("click", function () {
      pdState.view = b.dataset.view;
      $$(".pd__views button").forEach(function (o) { o.classList.toggle("is-on", o === b); });
      pdImage();
    });
  });
  $$('input[name="glas"]').forEach(function (r) { r.addEventListener("change", updatePdPrice); });
  $("#pd-add").addEventListener("click", function () {
    addToCart({ id: pdState.id, farbe: pdState.farbe, glas: $('input[name="glas"]:checked').value }, $(".pd__media"));
    closeLayer(pdLayer);
  });

  /* ---------- Warenkorb ---------- */
  var KEY = "sehwerk-warenkorb", cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* ohne Speicher weiter */ } }
  function itemInfo(it) {
    var z = ZUBEHOER.filter(function (a) { return a.id === it.id; })[0];
    if (z) return { name: z.name, sub: z.sub, preis: z.preis, img: "ressourcen/bilder/tuch-brille.webp" };
    var p = produkt(it.id);
    var mit = it.glas === "mit";
    return { name: p.name, sub: FARBEN[it.farbe].name + " · " + (mit ? "mit Sehstärke" : "ohne Sehstärke"), preis: p.preis + (mit ? GLAS_AUFPREIS : 0), img: bild(p.id, it.farbe, "34", true) };
  }
  function key(it) { return [it.id, it.farbe || "", it.glas || ""].join("|"); }
  function total() { return cart.reduce(function (s, it) { return s + itemInfo(it).preis * it.n; }, 0); }

  function renderCart() {
    var list = $("#cart-list");
    list.innerHTML = cart.map(function (it, i) {
      var inf = itemInfo(it);
      return '<li class="ci"><img src="' + inf.img + '" alt="" width="96" height="72"><div><b>' + esc(inf.name) + '</b><small>' + esc(inf.sub) + '</small>' +
        '<div class="ci__qty"><button data-q="-1" data-i="' + i + '" aria-label="Menge verringern">–</button><span>' + it.n + '</span><button data-q="1" data-i="' + i + '" aria-label="Menge erhöhen">+</button></div></div>' +
        '<div class="ci__price">' + euro(inf.preis * it.n) + '<button class="ci__rm" data-rm="' + i + '">Entfernen</button></div></li>';
    }).join("");
    var n = cart.reduce(function (s, it) { return s + it.n; }, 0), sum = total();
    $("#cart-count").textContent = n;
    $("#cart-empty").hidden = cart.length > 0;
    $("#cart-sum").textContent = euro(sum);
    var rest = VERSANDFREI - sum;
    $("#ship-text").textContent = rest > 0 ? "Noch " + euro(rest) + " bis zum kostenlosen Versand." : "Ihre Bestellung wird kostenlos versendet.";
    $("#ship-bar").style.setProperty("--s", clamp(sum / VERSANDFREI, 0, 1));
    $("#checkout").toggleAttribute("aria-disabled", !cart.length);
  }
  $("#cart-list").addEventListener("click", function (e) {
    var q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]");
    if (q) { var it = cart[+q.dataset.i]; it.n += +q.dataset.q; if (it.n < 1) cart.splice(+q.dataset.i, 1); }
    if (rm) cart.splice(+rm.dataset.rm, 1);
    if (q || rm) { save(); renderCart(); }
  });

  var toastT;
  function toast(t) {
    var el = $("#toast"); el.textContent = t; el.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("is-on"); }, 2400);
  }
  function addToCart(item, fromEl) {
    var k = key(item), found = cart.filter(function (c) { return key(c) === k; })[0];
    if (found) found.n++; else { item.n = 1; cart.push(item); }
    save();
    var inf = itemInfo(item);
    var count = $("#cart-count");
    function done() { renderCart(); count.classList.remove("is-bump"); void count.offsetWidth; count.classList.add("is-bump"); toast(inf.name + " liegt im Warenkorb."); }
    if (reduce || !fromEl) { done(); return; }
    // Bild fliegt in den Warenkorb
    var a = fromEl.getBoundingClientRect(), b = $("#cart-open").getBoundingClientRect();
    var fly = document.createElement("div");
    fly.className = "flyer";
    fly.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px;background-image:url('" + inf.img + "')";
    document.body.appendChild(fly);
    requestAnimationFrame(function () {
      var s = 30 / a.width;
      fly.style.transformOrigin = "0 0";
      fly.style.transform = "translate(" + (b.left + b.width / 2 - 15 - a.left) + "px," + (b.top + b.height / 2 - 11 - a.top) + "px) scale(" + s + ")";
      fly.style.opacity = ".6";
      fly.style.borderRadius = "50%";
    });
    setTimeout(function () { fly.remove(); done(); }, 860);
  }
  $("#cart-open").addEventListener("click", function () { openLayer($("#cart")); });
  $("#checkout").addEventListener("click", function (e) {
    e.preventDefault();
    if (!cart.length) return;
    var lines = cart.map(function (it) { var inf = itemInfo(it); return it.n + " × " + inf.name + " (" + inf.sub + ") – " + euro(inf.preis * it.n); });
    var body = "Hallo Sehwerk-Team,\n\nich möchte Folgendes bestellen:\n\n" + lines.join("\n") + "\n\nZwischensumme: " + euro(total()) + "\n\nLieferadresse:\n\n";
    location.href = "mailto:bestellung@ihre-domain.de?subject=" + encodeURIComponent("Bestellung Sehwerk") + "&body=" + encodeURIComponent(body);
  });
  renderCart();

  /* ---------- Navigation ---------- */
  var head = $("#head"), burger = $("#burger"), menu = $("#menu");
  function setMenu(o) { burger.setAttribute("aria-expanded", String(o)); burger.setAttribute("aria-label", o ? "Menü schließen" : "Menü öffnen"); menu.classList.toggle("is-open", o); if (o) head.classList.remove("is-hidden"); }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  head.addEventListener("focusin", function () { head.classList.remove("is-hidden"); });
  var navLinks = $$(".menu a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* ---------- Galerie aufbauen ---------- */
  var track = $("#gal-track");
  PRODUKTE.forEach(function (p) {
    var s = document.createElement("article");
    s.className = "slide";
    s.innerHTML = '<div class="slide__img"><img src="' + bild(p.id, p.farben[0], "front", false) + '" alt="Brille ' + esc(p.name) + ' von vorne" width="1400" height="1050" loading="lazy"><p class="slide__name">' + esc(p.name) + '</p></div>' +
      '<p class="slide__specs"><span>Glas <b>' + p.mass[0] + '</b></span><span>Steg <b>' + p.mass[1] + '</b></span><span>Bügel <b>' + p.mass[2] + '</b></span><span><b>' + euro(p.preis) + '</b></span></p>';
    track.appendChild(s);
  });

  /* ---------- Fokus-Effekt: Zeilen ---------- */
  function splitLines(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w) { return "<span>" + esc(w) + " </span>"; }).join("");
    var lines = [], top = null;
    $$("span", el).forEach(function (s) {
      if (top === null || Math.abs(s.offsetTop - top) > 4) { lines.push([]); top = s.offsetTop; }
      lines[lines.length - 1].push(s.textContent);
    });
    el.innerHTML = lines.map(function (l) { return '<span class="ln" aria-hidden="true">' + esc(l.join("").trim()) + "</span>"; }).join("");
  }
  var focusLines = $$(".focus-lines");

  /* ---------- Einblenden ---------- */
  function startObservers() {
    if (!reduce) focusLines.forEach(splitLines);
    if (!("IntersectionObserver" in window) || reduce) {
      $$(".focus, .reveal-mask, .card, .ln").forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: .2, rootMargin: "0px 0px -8% 0px" });
    $$(".focus, .reveal-mask, .card").forEach(function (el) { io.observe(el); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(startObservers); else startObservers();

  /* ---------- Spektrum berechnen ---------- */
  function g(x, m, s) { return Math.exp(-Math.pow(x - m, 2) / (2 * s * s)); }
  function spek(l) { return .98 * g(l, 449, 11) + .58 * g(l, 552, 42) + .42 * g(l, 610, 34) + .05; }
  function filt(l) { return 1 - .62 * g(l, 438, 22) - .25 * (l < 420 ? 1 : 0) * g(l, 400, 20); }
  function X(l) { return 40 + (l - 380) / 400 * 740; }
  function Yv(v) { return 360 - v * 290; }
  var dRaw = "", dF = "";
  for (var l = 380; l <= 780; l += 2) {
    dRaw += (l === 380 ? "M" : "L") + X(l).toFixed(1) + " " + Yv(spek(l)).toFixed(1);
    dF += (l === 380 ? "M" : "L") + X(l).toFixed(1) + " " + Yv(spek(l) * filt(l)).toFixed(1);
  }
  $("#raw").setAttribute("d", dRaw);
  $("#filt").setAttribute("d", dF);
  $("#filt-area").setAttribute("d", dF + "L780 360L40 360Z");
  var lensRect = $("#lens-rect"), lensFrame = $("#lens-frame"), specSteps = $$("#spec-steps li");
  function setLens(p) {
    var w = 150, x = -w + p * (780 + w);           // Glas wandert über das Spektrum
    lensFrame.setAttribute("x", (x).toFixed(1));
    lensFrame.setAttribute("width", w);
    lensRect.setAttribute("width", clamp(x + w - 40, 0, 740).toFixed(1));
    lensFrame.style.opacity = p > .97 ? 0 : 1;
    var step = p < .28 ? 0 : p < .62 ? 1 : 2;
    specSteps.forEach(function (li, i) { li.classList.toggle("is-on", i <= step); });
  }
  if (reduce) setLens(1);

  /* ---------- Scroll-Schleife ---------- */
  var heroPin = $("#hero-pin"), hero = $(".hero"), specPin = $("#spec-pin"), galPin = $("#gal-pin"), galSticky = $(".gallery__sticky");
  var galN = $("#gal-n"), galBar = $("#gal-bar"), footBig = $(".foot__big"), detailImg = $(".focus-img");
  var vh = innerHeight, lastY = scrollY, ticking = false, galOverflow = 0;

  function measure() {
    vh = innerHeight;
    if (galPin && !reduce) {
      track.style.transform = "";
      galOverflow = Math.max(0, track.scrollWidth - innerWidth);
      galPin.style.setProperty("--gal-h", (vh + galOverflow * 1.1) + "px");
    }
  }
  function prog(el) {
    var r = el.getBoundingClientRect(), len = el.offsetHeight - vh;
    return len > 0 ? clamp(-r.top / len, 0, 1) : (r.top < 0 ? 1 : 0);
  }
  function update() {
    ticking = false;
    var sy = scrollY;
    if (sy > lastY + 4 && sy > 400 && !menu.classList.contains("is-open")) head.classList.add("is-hidden");
    else if (sy < lastY - 4) head.classList.remove("is-hidden");
    head.classList.toggle("is-line", sy > 40);
    lastY = sy;
    if (reduce) return;

    var hp = prog(hero);
    heroPin.style.setProperty("--p", hp.toFixed(4));
    window.__heroP = hp;

    setLens(prog(specPin));

    if (galPin) {
      var gp = prog(galPin);
      track.style.transform = "translate3d(" + (-gp * galOverflow).toFixed(1) + "px,0,0)";
      galBar.parentNode.style.setProperty("--p", gp.toFixed(4));
      galN.textContent = "0" + (Math.min(6, Math.floor(gp * 5.999) + 1));
      $$(".slide", track).forEach(function (s) {
        var r = s.getBoundingClientRect();
        var c = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;   // -1 … 1
        s.style.setProperty("--sx", (c * -6).toFixed(2) + "%");
        s.style.setProperty("--nx", (c * 18).toFixed(2) + "vw");
      });
    }

    focusLines.forEach(function (el) {
      $$(".ln", el).forEach(function (ln) { ln.classList.toggle("is-in", ln.getBoundingClientRect().top < vh * .78); });
    });
    if (detailImg) {
      var dr = detailImg.getBoundingClientRect();
      detailImg.style.setProperty("--f", clamp((vh - dr.top) / (vh * .7), 0, 1).toFixed(3));
    }
    if (footBig) {
      var fr = footBig.getBoundingClientRect();
      footBig.style.setProperty("--p", clamp((vh - fr.top) / (fr.height * 1.6), 0, 1).toFixed(3));
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", function () { measure(); req(); });
  addEventListener("load", function () { measure(); req(); });
  measure(); update();

  requestAnimationFrame(function () { heroPin.classList.add("is-loaded"); });
})();
