// Markiert den heutigen Tag in der Öffnungszeiten-Tabelle und zeigt, ob gerade geöffnet ist.
(function () {
  // Öffnungszeiten in Minuten seit Mitternacht, Index = Wochentag (0 = Sonntag)
  var HOURS = [
    [[12 * 60, 14 * 60 + 30], [17 * 60, 21 * 60 + 30]],
    [],
    [[17 * 60, 23 * 60]],
    [[17 * 60, 23 * 60]],
    [[17 * 60, 23 * 60]],
    [[17 * 60, 23 * 60]],
    [[17 * 60, 23 * 60]]
  ];
  var DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  // Uhrzeit in Bad Nenndorf, unabhängig von der Zeitzone des Besuchers
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

  var el = document.getElementById("today");
  if (el && day >= 0) {
    var open = HOURS[day].filter(function (s) { return now >= s[0] && now < s[1]; })[0];
    var text;
    if (open) {
      text = "Jetzt geöffnet – bis " + fmt(open[1]) + " Uhr";
      el.classList.add("is-open");
    } else {
      var later = HOURS[day].filter(function (s) { return now < s[0]; })[0];
      if (later) {
        text = "Derzeit geschlossen – heute ab " + fmt(later[0]) + " Uhr geöffnet";
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
    el.innerHTML = '<span class="dot" aria-hidden="true"></span>' + text;
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
