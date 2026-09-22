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

// Inhalte beim Scrollen sanft einblenden (ohne JavaScript bleibt alles sichtbar)
(function () {
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      setTimeout(function () { el.style.transitionDelay = ""; }, 900); // Hover danach ohne Verzögerung
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".card, .step, .shot, .trait, .hours, .map").forEach(function (el, i) {
    el.classList.add("reveal");
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    io.observe(el);
  });
})();

// Rechtstexte-Overlay mit Escape schließen
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && /^#(impressum|datenschutz)$/.test(location.hash)) location.hash = "footer";
});
