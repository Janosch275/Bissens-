// Öffnungszeiten: heutigen Tag markieren, Stempel „Geöffnet / Geschlossen“ setzen
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
  if (day < 0) return;

  document.querySelectorAll(".hours li[data-days]").forEach(function (li) {
    if (li.getAttribute("data-days").split(",").indexOf(String(day)) > -1) li.classList.add("is-today");
  });

  function fmt(m) {
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  }

  var open = HOURS[day].filter(function (s) { return now >= s[0] && now < s[1]; })[0];
  var text;
  if (open) {
    text = "Heute bis " + fmt(open[1]) + " Uhr für Sie da";
  } else {
    var later = HOURS[day].filter(function (s) { return now < s[0]; })[0];
    if (later) {
      text = "Heute ab " + fmt(later[0]) + " Uhr erreichbar";
    } else {
      for (var i = 1; i <= 7; i++) {
        var d = (day + i) % 7;
        if (HOURS[d].length) {
          text = "Wieder " + (i === 1 ? "morgen" : "am " + DAYS[d]) + " ab " + fmt(HOURS[d][0][0]) + " Uhr erreichbar";
          break;
        }
      }
    }
  }
  document.querySelectorAll(".today").forEach(function (el) { el.textContent = text; });
  var stamp = document.getElementById("stamp");
  if (stamp) {
    stamp.textContent = open ? "Geöffnet" : "Geschlossen";
    stamp.classList.toggle("is-open", !!open);
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

// Schwebende Navigation: erscheint nach dem Druckbogen, zeigt Fortschritt und aktiven Bereich
(function () {
  var dock = document.querySelector(".dock");
  if (!dock) return;
  var bar = dock.querySelector(".dock__progress");
  var ticking = false;
  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max) : 0);
    dock.classList.toggle("is-hidden", scrollY < innerHeight * 0.55);
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();

  if (!("IntersectionObserver" in window)) return;
  var links = {};
  dock.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      Object.keys(links).forEach(function (id) { links[id].classList.toggle("is-active", id === e.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(links).forEach(function (id) { var sec = document.getElementById(id); if (sec) spy.observe(sec); });
})();

// Sortiment: Vorschaubild folgt der Maus
document.querySelectorAll(".row").forEach(function (row) {
  row.addEventListener("mousemove", function (e) {
    var r = row.getBoundingClientRect();
    row.style.setProperty("--mx", (e.clientX - r.left) + "px");
    row.style.setProperty("--my", (e.clientY - r.top) + "px");
  });
});

// Visitenkarte per Klick / Tippen umdrehen
document.querySelectorAll(".bizcard").forEach(function (card) {
  card.addEventListener("click", function () {
    card.setAttribute("aria-pressed", card.getAttribute("aria-pressed") === "true" ? "false" : "true");
  });
});

// Animationen beim Scrollen (nur mit html.anim – ohne JavaScript oder bei reduzierter Bewegung bleibt alles statisch sichtbar)
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("anim") || !("IntersectionObserver" in window)) {
    root.classList.remove("anim");
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      setTimeout(function () { el.style.transitionDelay = ""; }, 1600); // Hover danach ohne Verzögerung
    });
  }, { threshold: 0.15 });

  [".label-row", ".row", ".pin", ".bizcard", ".studio__text > *", ".callout", ".desk"].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 6) * 80 + "ms";
      io.observe(el);
    });
  });
  // Elemente, die nur eine Klasse „in“ bekommen (eigene Animation)
  document.querySelectorAll(".stamps, .cutword").forEach(function (el) { io.observe(el); });
})();

// Rechtstexte-Overlay mit Escape schließen
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && /^#(impressum|datenschutz)$/.test(location.hash)) location.hash = "footer";
});
