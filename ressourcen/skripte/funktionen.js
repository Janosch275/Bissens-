/* Webdesign Janosch Krause – Interaktionen & Animationen */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Navigation ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");

  function onScroll() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    if (!toggle || !links) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    links.classList.toggle("is-open", open);
    nav.classList.toggle("menu-open", open);
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* Aktiven Menüpunkt beim Scrollen markieren */
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]:not(.btn)'));
  if ("IntersectionObserver" in window && navAnchors.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navAnchors.forEach(function (a) {
      var section = document.querySelector(a.getAttribute("href"));
      if (section) spy.observe(section);
    });
  }

  /* ---------- Scroll-Reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Zähler im Hero ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null, duration = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- 3D-Neigung des Browser-Mockups ---------- */
  var mock = document.getElementById("mock");
  var visual = mock && mock.parentElement;
  if (mock && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    visual.addEventListener("mousemove", function (e) {
      var r = visual.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      mock.style.transform = "rotateY(" + (x * 14) + "deg) rotateX(" + (-y * 10) + "deg)";
    });
    visual.addEventListener("mouseleave", function () { mock.style.transform = ""; });
  }

  /* ---------- Lichtschein auf Leistungs-Karten ---------- */
  document.querySelectorAll(".service").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- FAQ: immer nur eine Antwort offen ---------- */
  var faqItems = document.querySelectorAll(".faq details");
  faqItems.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      faqItems.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });

  /* ---------- Mehrpager-Preisrechner ---------- */
  var range = document.getElementById("calc-pages");
  if (range) {
    var countEl = document.getElementById("calc-count");
    var totalEl = document.getElementById("calc-total");
    var expressEl = document.getElementById("calc-express");
    var START = 270, PER_PAGE = 90, EXPRESS = 390;
    var updateCalc = function () {
      var n = parseInt(range.value, 10);
      var total = START + n * PER_PAGE + (expressEl && expressEl.checked ? EXPRESS : 0);
      countEl.textContent = n;
      totalEl.textContent = total.toLocaleString("de-DE");
      var fill = (n - range.min) / (range.max - range.min) * 100;
      range.style.setProperty("--fill", fill + "%");
      totalEl.classList.add("bump");
      clearTimeout(updateCalc.t);
      updateCalc.t = setTimeout(function () { totalEl.classList.remove("bump"); }, 180);
    };
    range.addEventListener("input", updateCalc);
    if (expressEl) expressEl.addEventListener("change", updateCalc);
    updateCalc();
  }

  /* ---------- Kontaktformular ---------- */
  var form = document.getElementById("contact-form");
  var packageSelect = document.getElementById("f-package");

  /* Leistung aus der Preistabelle im Formular vorauswählen */
  document.querySelectorAll("[data-package]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-package");
      var chip = document.querySelector('.chip input[value="' + value + '"]');
      if (chip) chip.checked = true;
      if (packageSelect && value === "Onepager") packageSelect.value = "Nur eine Seite (Onepager)";
      var express = document.getElementById("calc-express");
      var expressChip = document.querySelector('.chip input[value="Express-Paket"]');
      if (value === "Mehrpager" && express && express.checked && expressChip) expressChip.checked = true;
    });
  });

  if (!form) return;

  var statusEl = document.getElementById("form-status");
  var successEl = document.getElementById("form-success");
  var submitBtn = document.getElementById("submit-btn");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateField(input) {
    var field = input.closest(".field");
    var valid = input.value.trim() !== "";
    if (input.type === "email") valid = emailRe.test(input.value.trim());
    if (field) field.classList.toggle("is-invalid", !valid);
    return valid;
  }

  var required = form.querySelectorAll(".field [required]");
  required.forEach(function (input) {
    input.addEventListener("blur", function () { if (input.value) validateField(input); });
    input.addEventListener("input", function () {
      if (input.closest(".field").classList.contains("is-invalid")) validateField(input);
    });
  });

  var consent = form.querySelector('input[name="datenschutz"]');
  consent.addEventListener("change", function () {
    consent.closest(".consent").classList.toggle("is-invalid", !consent.checked);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.textContent = "";
    statusEl.classList.remove("is-error");

    var ok = true, firstInvalid = null;
    required.forEach(function (input) {
      if (!validateField(input)) { ok = false; firstInvalid = firstInvalid || input; }
    });
    if (!consent.checked) {
      consent.closest(".consent").classList.add("is-invalid");
      ok = false; firstInvalid = firstInvalid || consent;
    }
    if (!ok) { firstInvalid.focus(); return; }

    submitBtn.classList.add("is-loading");
    submitBtn.querySelector(".btn__label").textContent = "Wird gesendet …";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || data.ok === false || data.success === false) {
            throw new Error(data.message || data.error || "Fehler");
          }
        });
      })
      .then(function () {
        successEl.hidden = false;
        form.reset();
        successEl.setAttribute("tabindex", "-1");
        successEl.focus();
      })
      .catch(function (err) {
        statusEl.classList.add("is-error");
        statusEl.textContent = (err && err.message && err.message !== "Fehler" && err.message !== "Failed to fetch")
          ? err.message
          : "Die Anfrage konnte leider nicht gesendet werden. Bitte versuchen Sie es in einem Moment erneut.";
      })
      .then(function () {
        submitBtn.classList.remove("is-loading");
        submitBtn.querySelector(".btn__label").textContent = "Anfrage senden";
      });
  });

})();
