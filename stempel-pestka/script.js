(function () {
  "use strict";

  var EMAIL = "stempel-pestka@web.de";

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Opening hours: highlight today and show open/closed state (Europe/Berlin)
  var hours = { 1: [9, 17], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [9, 14] };
  var table = document.getElementById("hours");
  var state = document.getElementById("open-state");
  if (table && state) {
    var now = new Date();
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(now);
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
      var time = parseInt(map.hour, 10) + parseInt(map.minute, 10) / 60;
    } catch (err) {
      day = now.getDay();
      time = now.getHours() + now.getMinutes() / 60;
    }
    Array.prototype.forEach.call(table.querySelectorAll("tr"), function (row) {
      if (row.getAttribute("data-days").split(",").indexOf(String(day)) !== -1) row.classList.add("today");
    });
    var h = hours[day];
    var isOpen = h && time >= h[0] && time < h[1];
    state.classList.add(isOpen ? "open" : "closed");
    state.textContent = isOpen ? "Jetzt geöffnet – bis " + h[1] + ":00 Uhr" : "Derzeit geschlossen";
  }

  // Order form -> composes an e-mail in the visitor's mail program
  var form = document.getElementById("order-form");
  var hint = document.getElementById("form-hint");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var invalid = [];
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (el) {
        var ok = el.type === "checkbox" ? el.checked : el.value.trim() !== "" && el.checkValidity();
        el.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok) invalid.push(el);
      });
      if (invalid.length) {
        hint.textContent = "Bitte füllen Sie alle Pflichtfelder (*) korrekt aus.";
        hint.className = "form-hint error";
        invalid[0].focus();
        return;
      }
      var d = new FormData(form);
      var art = d.get("art") === "Bitte wählen" ? "-" : d.get("art");
      var body =
        "Name: " + d.get("name") + "\n" +
        "Telefon: " + (d.get("telefon") || "-") + "\n" +
        "E-Mail: " + d.get("email") + "\n" +
        "Stempelart: " + art + "\n\n" +
        "Stempeltext:\n" + d.get("text") + "\n\n" +
        "Anmerkungen:\n" + (d.get("anmerkung") || "-") + "\n";
      var subject = "Stempelanfrage von " + d.get("name");
      window.location.href = "mailto:" + EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      hint.textContent = "Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die Nachricht dort ab.";
      hint.className = "form-hint";
    });
  }

  // Map: load only after consent
  var loadMap = document.getElementById("load-map");
  if (loadMap) {
    loadMap.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src = "https://www.google.com/maps?q=" + encodeURIComponent("Stempel Pestka, Hauptstraße 29, 31559 Haste") + "&output=embed";
      frame.title = "Karte: Stempel Pestka, Hauptstraße 29, 31559 Haste";
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      var box = document.getElementById("map");
      box.innerHTML = "";
      box.appendChild(frame);
    });
  }

  // Reveal sections on scroll
  if ("IntersectionObserver" in window) {
    var targets = document.querySelectorAll(".section h2, .card, .timeline li, .order-form, .prose");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(targets, function (t) { t.classList.add("reveal"); io.observe(t); });
  }
})();
