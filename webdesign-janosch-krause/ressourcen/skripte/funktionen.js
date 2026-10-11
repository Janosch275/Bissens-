/* Webdesign Janosch Krause – Interaktionen & Scroll-Animationen
   Reines JavaScript ohne externe Bibliotheken oder Dienste. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) root.classList.add("motion");

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

  /* ---------- Überschrift Wort für Wort ---------- */
  if (!reduceMotion) {
    var wordIndex = 0;
    var splitInto = function (el, extraClass) {
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            w.className = "w";
            var inner = document.createElement("span");
            inner.className = "w__in" + (extraClass ? " " + extraClass : "");
            inner.style.setProperty("--wi", wordIndex++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          var cls = node.className;
          node.className = "";
          splitInto(node, cls);
        }
      });
    };
    document.querySelectorAll("[data-split]").forEach(function (el) {
      el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
      splitInto(el, "");
      Array.prototype.forEach.call(el.children, function (c) { c.setAttribute("aria-hidden", "true"); });
    });
  }

  /* ---------- Text, der sich beim Scrollen füllt ---------- */
  document.querySelectorAll("[data-words]").forEach(function (el) {
    if (reduceMotion) return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, i) {
      var s = document.createElement("span");
      s.className = "wd";
      s.style.setProperty("--i", i);
      s.textContent = word;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.style.setProperty("--n", words.length);
  });

  /* ---------- Navigation ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  var lastY = window.scrollY;

  function setMenu(open) {
    if (!toggle || !links) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    links.classList.toggle("is-open", open);
    nav.classList.toggle("menu-open", open);
    if (open) nav.classList.remove("is-hidden");
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
  if (nav) nav.addEventListener("focusin", function () { nav.classList.remove("is-hidden"); });

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

  /* ---------- Einblenden beim Scrollen ---------- */
  var revealEls = document.querySelectorAll(".reveal, .service");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Zähler ---------- */
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

  /* ---------- Scroll-gesteuerte Animationen ---------- */
  var progressBar = document.getElementById("progress-bar");
  var scrollEls = Array.prototype.slice.call(document.querySelectorAll("[data-scroll]"));
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-speed]"));
  var wordEls = Array.prototype.slice.call(document.querySelectorAll("[data-words]"));
  var stackCards = Array.prototype.slice.call(document.querySelectorAll("#stack .service"));
  var faqMark = document.querySelector(".faq-layout__mark");
  var processPin = document.getElementById("process-pin");
  var processTrack = document.getElementById("process-track");
  var processLine = document.getElementById("process-line");
  var processCount = document.getElementById("process-count");
  var steps = processTrack ? Array.prototype.slice.call(processTrack.children) : [];
  var desktopPin = window.matchMedia("(min-width: 901px) and (min-height: 600px)");
  var vh = window.innerHeight;
  var trackOverflow = 0;
  var ticking = false;

  function measure() {
    vh = window.innerHeight;
    if (!processPin || !processTrack) return;
    if (!reduceMotion && desktopPin.matches) {
      processTrack.style.transform = "";
      trackOverflow = Math.max(0, processTrack.scrollWidth - window.innerWidth);
      var travel = Math.max(trackOverflow, vh * 0.9);
      processPin.style.setProperty("--pin-h", (vh + travel) + "px");
    } else {
      trackOverflow = 0;
      processPin.style.removeProperty("--pin-h");
      processTrack.style.transform = "";
    }
  }

  function setActiveStep(p) {
    var active = steps.length ? clamp(Math.floor(p * steps.length + 0.15), 0, steps.length - 1) : 0;
    if (p <= 0.02) active = 0;
    steps.forEach(function (s, i) { s.classList.toggle("is-active", i <= active); });
    if (processCount) processCount.textContent = "0" + (active + 1);
  }

  var stackTops = [];
  function update() {
    ticking = false;
    var y = window.scrollY;
    var docH = document.documentElement.scrollHeight - vh;
    var writes = [];
    function set(el, name, value) { writes.push([el, name, value]); }

    /* --- Lesen --- */
    if (!reduceMotion) {
      scrollEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var mode = el.getAttribute("data-scroll"), p;
        if (mode === "leave") p = -r.top / r.height;
        else if (mode === "enter") p = (vh - r.top) / (vh * 0.75);
        else if (mode === "end") p = (vh - r.top) / r.height;
        else p = (vh - r.top) / (vh + r.height);
        set(el, "--p", clamp(p, 0, 1).toFixed(4));
      });

      parallaxEls.forEach(function (el) {
        var host = el.closest("section") || el.parentNode;
        var r = host.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        set(el, "translate", "0 " + (-r.top * parseFloat(el.getAttribute("data-speed"))).toFixed(1) + "px");
      });

      wordEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        set(el, "--p", clamp((vh * 0.88 - r.top) / (r.height + vh * 0.35), 0, 1).toFixed(4));
      });

      if (stackCards.length) {
        var sticky = getComputedStyle(stackCards[0]).position === "sticky";
        var rects = stackCards.map(function (c) { return c.getBoundingClientRect(); });
        stackCards.forEach(function (card, i) {
          if (!sticky || i === stackCards.length - 1) { set(card, "--s", "1"); set(card, "--dim", "0"); return; }
          if (stackTops[i] === undefined) stackTops[i] = parseFloat(getComputedStyle(card).top) || 0;
          var top = stackTops[i];
          var prog = clamp(1 - (rects[i + 1].top - top) / (vh - top), 0, 1);
          var depth = stackCards.length - 1 - i;
          set(card, "--s", (1 - prog * 0.05 * depth).toFixed(4));
          set(card, "--dim", (prog * 0.18).toFixed(3));
        });
      }

      if (faqMark) {
        var fr = faqMark.getBoundingClientRect();
        set(faqMark, "--p", clamp((vh - fr.top) / (vh + fr.height), 0, 1).toFixed(4));
      }

      if (processPin && processTrack) {
        var pr = processPin.getBoundingClientRect(), pp;
        if (desktopPin.matches) {
          var len = processPin.offsetHeight - vh;
          pp = len > 0 ? clamp(-pr.top / len, 0, 1) : 0;
          set(processTrack, "transform", "translate3d(" + (-pp * trackOverflow).toFixed(1) + "px,0,0)");
        } else {
          var tr = processTrack.getBoundingClientRect();
          pp = clamp((vh * 0.7 - tr.top) / tr.height, 0, 1);
        }
        if (processLine) set(processLine.parentNode, "--p", pp.toFixed(4));
      }
    }

    /* --- Schreiben --- */
    if (progressBar) progressBar.style.transform = "scaleX(" + (docH > 0 ? y / docH : 0) + ")";
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 20);
      if (!nav.classList.contains("menu-open")) {
        if (y > lastY + 2 && y > 500) nav.classList.add("is-hidden");
        else if (y < lastY - 4 || y <= 500) nav.classList.remove("is-hidden");
      }
    }
    lastY = y;
    writes.forEach(function (w) {
      if (w[1].charAt(0) === "-") w[0].style.setProperty(w[1], w[2]);
      else w[0].style[w[1]] = w[2];
    });
    if (!reduceMotion && typeof pp === "number") setActiveStep(pp);
  }

  function requestUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", function () { stackTops = []; measure(); requestUpdate(); });
  window.addEventListener("load", function () { measure(); requestUpdate(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); requestUpdate(); });
  measure();
  update();
  if (reduceMotion) steps.forEach(function (s) { s.classList.add("is-active"); });

  /* ---------- Magnetische Buttons ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (x * 0.18) + "px," + (y * 0.3) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

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
    var pagesVis = document.getElementById("calc-pages-vis");
    var START = 270, PER_PAGE = 90, EXPRESS = 390;
    var updateCalc = function () {
      var n = parseInt(range.value, 10);
      var total = START + n * PER_PAGE + (expressEl && expressEl.checked ? EXPRESS : 0);
      countEl.textContent = n;
      totalEl.textContent = total.toLocaleString("de-DE");
      var fill = (n - range.min) / (range.max - range.min) * 100;
      range.style.setProperty("--fill", fill + "%");
      if (pagesVis) {
        /* Startseite + Unterseiten als kleine Blätter */
        while (pagesVis.children.length > n + 1) pagesVis.removeChild(pagesVis.lastChild);
        while (pagesVis.children.length < n + 1) pagesVis.appendChild(document.createElement("i"));
      }
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
