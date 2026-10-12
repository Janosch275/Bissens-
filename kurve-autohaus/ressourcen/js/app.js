/* KURVE Automobile – Interaktionen & Scroll-Animationen
   Reines JavaScript, keine Bibliotheken, keine externen Dienste. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) root.classList.add("bewegt");

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }
  function weich(t) { return t * t * (3 - 2 * t); }

  var jahr = $("#jahr"); if (jahr) jahr.textContent = new Date().getFullYear();

  // gemeinsamer Zustand mit der 3D-Szene
  var K = window.KURVE = { heroP: 0 };

  /* ---------- Navigation ---------- */
  var kopf = $("#kopf"), burger = $("#burger"), menue = $("#menue");
  function setMenue(o) { burger.setAttribute("aria-expanded", String(o)); burger.setAttribute("aria-label", o ? "Menü schließen" : "Menü öffnen"); menue.classList.toggle("is-offen", o); kopf.classList.toggle("menue-offen", o); }
  burger.addEventListener("click", function () { setMenue(burger.getAttribute("aria-expanded") !== "true"); });
  menue.addEventListener("click", function (e) { if (e.target.closest("a")) setMenue(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenue(false); });
  kopf.addEventListener("focusin", function () { kopf.classList.remove("is-weg"); });
  var links = $$("a", menue);
  if ("IntersectionObserver" in window) {
    var spaeher = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("is-an", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) spaeher.observe(s); });
  }

  /* ---------- Zähler mit rollenden Ziffern (wie ein Kilometerzähler) ---------- */
  $$(".zaehler").forEach(function (z) {
    var wert = z.dataset.wert;
    z.setAttribute("aria-label", wert);
    z.innerHTML = wert.split("").map(function (d) {
      var spalte = "";
      for (var i = 0; i <= 9; i++) spalte += "<span>" + i + "</span>";
      return '<span class="ziffer" aria-hidden="true" data-d="' + d + '"><span>' + spalte + "</span></span>";
    }).join("");
  });
  function rollen(z) {
    $$(".ziffer", z).forEach(function (f, i) {
      var inner = f.firstChild;
      inner.style.transitionDelay = (i * 0.12) + "s";
      inner.style.transform = "translateY(-" + (+f.dataset.d * 10) + "%)";
    });
  }

  /* ---------- Einblenden ---------- */
  var beob = null;
  if ("IntersectionObserver" in window && !reduce) {
    beob = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-da");
        $$(".zaehler", e.target).forEach(rollen);
        beob.unobserve(e.target);
      });
    }, { threshold: .2, rootMargin: "0px 0px -6% 0px" });
    $$(".auf, .paneele").forEach(function (el) { beob.observe(el); });
  } else {
    $$(".auf, .paneele").forEach(function (el) { el.classList.add("is-da"); });
    $$(".zaehler").forEach(rollen);
  }

  /* ---------- Leistungs-Paneele ---------- */
  var paneele = $$(".paneel");
  function oeffne(p) { paneele.forEach(function (x) { x.classList.toggle("is-offen", x === p); x.setAttribute("aria-expanded", String(x === p)); }); }
  paneele.forEach(function (p) {
    p.setAttribute("role", "button");
    p.addEventListener("click", function () { oeffne(p); });
    p.addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover)").matches) oeffne(p); });
    p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); oeffne(p); } });
  });

  /* ---------- Formular → E-Mail ---------- */
  var form = $("#formular");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(form), fehler = $("#formular-fehler");
    if (!String(f.get("name")).trim() || !String(f.get("kontakt")).trim()) {
      fehler.textContent = "Bitte Name und Telefon oder E-Mail angeben.";
      (String(f.get("name")).trim() ? form.kontakt : form.name).focus();
      return;
    }
    fehler.textContent = "";
    var text = "Anliegen: " + f.get("anliegen") + "\nName: " + f.get("name") + "\nKontakt: " + f.get("kontakt") +
      "\nWunschtermin: " + (f.get("termin") || "–") + "\n\n" + (f.get("nachricht") || "");
    location.href = "mailto:termin@ihre-domain.de?subject=" + encodeURIComponent("Anfrage: " + f.get("anliegen")) + "&body=" + encodeURIComponent(text);
  });

  /* ---------- Scroll-Choreografie ---------- */
  var hero = $(".hero"), heroPin = $("#hero-pin"), tacho = $("#tacho"), drehzahl = $("#drehzahl"), teile = $$("#teile li");
  var pruef = $(".pruef"), pruefPin = $("#pruef-pin");
  var strecke = $(".strecke"), streckePin = $("#strecke-pin"), kurs = $("#kurs"), fahrzeug = $("#fahrzeug"), etappen = $$("#etappen li");
  var fussWort = $(".fuss__wort");
  var kursLaenge = kurs.getTotalLength();
  var vh = innerHeight, letzt = scrollY, tick = false;

  function prog(el) { var r = el.getBoundingClientRect(), l = el.offsetHeight - vh; return l > 0 ? clamp(-r.top / l, 0, 1) : (r.top < 0 ? 1 : 0); }
  // Tempo-Verlauf: hochdrehen, für die Explosionsansicht abbremsen, wieder beschleunigen
  function tempo(p) {
    if (p < .3) return weich(seg(p, .02, .3)) * 248;
    if (p < .42) return 248 * (1 - weich(seg(p, .3, .42)));
    if (p < .66) return 0;
    return weich(seg(p, .66, .95)) * 286;
  }

  function update() {
    tick = false;
    var y = scrollY;
    kopf.classList.toggle("is-fest", y > 30);
    if (!menue.classList.contains("is-offen")) {
      if (y > letzt + 4 && y > 500) kopf.classList.add("is-weg");
      else if (y < letzt - 4) kopf.classList.remove("is-weg");
    }
    letzt = y;
    if (reduce) return;

    var hp = prog(hero);
    K.heroP = hp;
    var v = tempo(hp);
    heroPin.style.setProperty("--p", hp.toFixed(4));
    heroPin.style.setProperty("--speed", (v / 286).toFixed(3));
    tacho.textContent = Math.round(v);
    drehzahl.style.setProperty("--rpm", (v / 286 * .92 + (v > 0 ? .06 * Math.sin(y * .05) : 0)).toFixed(3));
    var teil = hp > .42 && hp < .68 ? clamp(Math.floor(seg(hp, .42, .64) * 4), 0, 3) : -1;
    teile.forEach(function (li, i) { li.classList.toggle("is-an", i === teil); });

    pruefZiel = seg(prog(pruef), .06, .9);

    var rp = prog(strecke);
    streckePin.style.setProperty("--runde", rp.toFixed(4));
    var pt = kurs.getPointAtLength(rp * kursLaenge);
    fahrzeug.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
    etappen.forEach(function (li, i) { li.classList.toggle("is-an", rp >= i / etappen.length - .02); });

    var fr = fussWort.getBoundingClientRect();
    fussWort.style.setProperty("--p", clamp((vh - fr.top) / (fr.height * 1.5), 0, 1).toFixed(3));
  }
  function req() { if (!tick) { tick = true; requestAnimationFrame(update); } }
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", function () { vh = innerHeight; req(); });
  update();
  if (reduce) { etappen.forEach(function (li) { li.classList.add("is-an"); }); fahrzeug.setAttribute("transform", "translate(1540 120)"); }
  requestAnimationFrame(function () { heroPin.classList.add("is-geladen"); });

  /* ---------- Leistungsprüfstand: Messkurven folgen dem Scrollen ---------- */
  // Beispielfahrzeug: Drehmomentverlauf in Nm, Leistung daraus berechnet (PS = Nm · U/min / 7023)
  var N0 = 1000, N1 = 7600, X0 = 60, X1 = 940, Y0 = 490, Y1 = 30, PSMAX = 600, NMMAX = 600;
  function nm(n) {
    if (n < 2500) return 380 + 150 * weich(seg(n, 1000, 2500));
    if (n < 5000) return 530 - 6 * Math.sin((n - 2500) / 2500 * Math.PI);
    return 530 - 175 * Math.pow(seg(n, 5000, 7600), 1.35);
  }
  function ps(n) { return nm(n) * n / 7023; }
  function px(n) { return X0 + (n - N0) / (N1 - N0) * (X1 - X0); }
  function pyPs(v) { return Y0 - v / PSMAX * (Y0 - Y1); }
  function pyNm(v) { return Y0 - v / NMMAX * (Y0 - Y1); }
  var spitzeN = N0, spitzePs = 0;
  for (var n = N0; n <= N1; n += 10) if (ps(n) > spitzePs) { spitzePs = ps(n); spitzeN = n; }
  var tsd = function (v) { return Math.round(v).toLocaleString("de-DE"); };

  // Raster und Achsbeschriftung
  var gitter = $("#pruef-gitter"), g = "";
  for (var u = 1000; u <= 7000; u += 1000) g += '<line x1="' + px(u) + '" x2="' + px(u) + '" y1="' + Y1 + '" y2="' + Y0 + '"/><text x="' + px(u) + '" y="' + (Y0 + 30) + '" text-anchor="middle">' + (u / 1000) + '</text>';
  for (var q = 0; q <= 600; q += 100) g += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + pyPs(q) + '" y2="' + pyPs(q) + '"/><text x="' + (X0 - 12) + '" y="' + (pyPs(q) + 5) + '" text-anchor="end">' + q + '</text>';
  g += '<text x="' + X1 + '" y="' + (Y0 + 58) + '" text-anchor="end" class="pruef__achse">Drehzahl × 1.000 1/min</text>';
  g += '<text x="' + (X0 - 12) + '" y="' + (Y1 - 14) + '" text-anchor="end" class="pruef__achse">PS / Nm</text>';
  gitter.innerHTML = g;

  var pkPs = $("#pk-ps"), pkNm = $("#pk-nm"), pkFl = $("#pk-flaeche"), scan = $("#pk-scan"), pPs = $("#pk-pps"), pNm = $("#pk-pnm");
  var spitze = $("#pk-spitze"), wRpm = $("#pw-rpm"), wPs = $("#pw-ps"), wNm = $("#pw-nm");
  $("#pk-sl").setAttribute("x1", px(spitzeN)); $("#pk-sl").setAttribute("x2", px(spitzeN));
  var st = $("#pk-st"); st.setAttribute("x", px(spitzeN) - 14); st.setAttribute("y", pyPs(spitzePs) - 16);
  st.textContent = "max. " + Math.round(spitzePs) + " PS bei " + tsd(Math.round(spitzeN / 100) * 100) + " 1/min";

  var pruefZiel = reduce ? 1 : seg(prog(pruef), .06, .9), pruefAnz = -1;
  function zeichnePruef(f) {
    var bis = N0 + (N1 - N0) * f, dPs = "", dNm = "";
    for (var n = N0; n <= bis; n += 50) {
      dPs += (n === N0 ? "M" : "L") + px(n).toFixed(1) + " " + pyPs(ps(n)).toFixed(1);
      dNm += (n === N0 ? "M" : "L") + px(n).toFixed(1) + " " + pyNm(nm(n)).toFixed(1);
    }
    dPs += "L" + px(bis).toFixed(1) + " " + pyPs(ps(bis)).toFixed(1);
    dNm += "L" + px(bis).toFixed(1) + " " + pyNm(nm(bis)).toFixed(1);
    pkPs.setAttribute("d", dPs); pkNm.setAttribute("d", dNm);
    pkFl.setAttribute("d", dPs + "L" + px(bis).toFixed(1) + " " + Y0 + "L" + X0 + " " + Y0 + "Z");
    var x = px(bis).toFixed(1);
    scan.setAttribute("x1", x); scan.setAttribute("x2", x);
    pPs.setAttribute("cx", x); pPs.setAttribute("cy", pyPs(ps(bis)).toFixed(1));
    pNm.setAttribute("cx", x); pNm.setAttribute("cy", pyNm(nm(bis)).toFixed(1));
    wRpm.textContent = tsd(Math.round(bis / 10) * 10); wPs.textContent = Math.round(ps(bis)); wNm.textContent = Math.round(nm(bis));
    spitze.classList.toggle("is-an", bis >= spitzeN);
    pruefPin.style.setProperty("--mess", f.toFixed(4));
  }
  (function messen() {
    if (!reduce) requestAnimationFrame(messen);
    var neu = pruefAnz < 0 ? pruefZiel : pruefAnz + (pruefZiel - pruefAnz) * .14;   // weiches Nachlaufen
    if (Math.abs(neu - pruefAnz) > .0002) { pruefAnz = neu; zeichnePruef(neu); }
  })();
})();
