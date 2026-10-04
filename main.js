// Markiert den heutigen Tag in der Öffnungszeiten-Tabelle und zeigt, ob gerade geöffnet ist.
(function () {
  // Öffnungszeiten in Minuten seit Mitternacht, Index = Wochentag (0 = Sonntag)
  var HOURS = [
    [],
    [[9 * 60, 17 * 60]],
    [[9 * 60, 17 * 60]],
    [[9 * 60, 17 * 60]],
    [[9 * 60, 17 * 60]],
    [[9 * 60, 14 * 60]],
    []
  ];
  var DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  // Uhrzeit in Haste, unabhängig von der Zeitzone des Besuchers
  var parts = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
  var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  var now = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);

  var row = document.querySelector('.hours tr[data-day="' + day + '"]');
  if (row) row.classList.add("is-today");

  function fmt(m) {
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  }

  if (day >= 0) {
    var open = HOURS[day].filter(function (s) { return now >= s[0] && now < s[1]; })[0];
    var text;
    if (open) {
      text = "Jetzt geöffnet – bis " + fmt(open[1]) + " Uhr";
    } else {
      var later = HOURS[day].filter(function (s) { return now < s[0]; })[0];
      if (later) {
        text = "Derzeit geschlossen – heute ab " + fmt(later[0]) + " Uhr erreichbar";
      } else {
        for (var i = 1; i <= 7; i++) {
          var d = (day + i) % 7;
          if (HOURS[d].length) {
            text = "Derzeit geschlossen – wieder " + (i === 1 ? "morgen" : "am " + DAYS[d]) + " ab " + fmt(HOURS[d][0][0]) + " Uhr";
            break;
          }
        }
      }
    }
    document.querySelectorAll(".today").forEach(function (el) {
      el.innerHTML = '<span class="dot" aria-hidden="true"></span>' + text;
      el.classList.toggle("is-open", !!open);
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

// Navigation: Lesefortschritt, kompakte Kopfzeile, aktiver Menüpunkt
(function () {
  var nav = document.querySelector(".nav");
  var bar = document.querySelector(".progress");
  var ticking = false;
  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max) : 0);
    if (nav) nav.classList.toggle("is-scrolled", scrollY > 20);
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();

  if (!("IntersectionObserver" in window)) return;
  var links = {};
  document.querySelectorAll(".nav__links a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      Object.keys(links).forEach(function (id) { links[id].classList.toggle("is-active", id === e.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(links).forEach(function (id) { var sec = document.getElementById(id); if (sec) spy.observe(sec); });
})();

// Animationen beim Scrollen (nur mit html.anim – ohne JavaScript oder bei reduzierter Bewegung bleibt alles statisch sichtbar)
(function () {
  if (!document.documentElement.classList.contains("anim") || !("IntersectionObserver" in window)) {
    document.documentElement.classList.remove("anim");
    return;
  }

  // Einblenden mit leichtem Versatz
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      setTimeout(function () { el.style.transitionDelay = ""; }, 1400); // Hover danach ohne Verzögerung
    });
  }, { threshold: 0.12 });
  var groups = [".section__head", ".card", ".step", ".trait", ".hours", ".map",
                "#ueber-uns .split > div:first-child", "#zeiten .split > div:first-child", "#kontakt .split > div:first-child"];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 90 + "ms";
      io.observe(el);
    });
  });

  // Einmalige Effekte: Schneidelinie, Kennzahlen
  var once = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      once.unobserve(e.target);
      if (e.target.classList.contains("facts")) countUp(e.target);
      // Galerie: Bilder sind vor dem Aufdecken weggeschnitten und damit selbst nie „sichtbar“ – daher über den Container
      if (e.target.classList.contains("gallery")) e.target.querySelectorAll(".shot").forEach(function (el) {
        el.classList.add("in");
        setTimeout(function () { el.style.transitionDelay = ""; }, 1800);
      });
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(".gallery .shot").forEach(function (el, i) {
    el.classList.add("reveal");
    el.style.transitionDelay = i * 120 + "ms";
  });
  document.querySelectorAll(".cutline, .facts, .gallery").forEach(function (el) { once.observe(el); });

  function countUp(root) {
    root.querySelectorAll("[data-count]").forEach(function (el) {
      var to = parseInt(el.getAttribute("data-count"), 10), suffix = el.getAttribute("data-suffix") || "";
      var t0 = null, dur = 1300;
      el.textContent = "0" + suffix;
      requestAnimationFrame(function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * eased) + suffix;
        if (k < 1) requestAnimationFrame(step);
      });
    });
  }
})();

// Rechtstexte-Overlay mit Escape schließen
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && /^#(impressum|datenschutz)$/.test(location.hash)) location.hash = "footer";
});
