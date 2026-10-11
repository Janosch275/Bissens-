/* KURVE – Live-3D: Hero-Rad und Felgen-Showroom (three.js lokal, gebündelt zu szene.bundle.js) */
import { baueRad, erstelleBuehne, setzeRad, setzeFinish, setzeSattel } from "./rad3d.js";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const K = () => window.KURVE || { heroP: 0, felge: "stern", finish: "gunmetal", sattel: "rot" };
const SCHRIFT = '"Mona Sans", system-ui, sans-serif';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const weich = t => t * t * (3 - 2 * t);
function tempo(p) {                                    // gleiche Kurve wie der Tacho (km/h)
  if (p < .3) return weich(seg(p, .02, .3)) * 248;
  if (p < .42) return 248 * (1 - weich(seg(p, .3, .42)));
  if (p < .66) return 0;
  return weich(seg(p, .66, .95)) * 286;
}

function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}
function sichtbar(el) {
  let an = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { an = es[0].isIntersecting; }).observe(el);
  return () => an;
}
function buehne(canvas) {
  const b = erstelleBuehne(canvas);
  const neu = () => { const r = canvas.getBoundingClientRect(); b.groesse(Math.max(1, r.width), Math.max(1, r.height)); };
  addEventListener("resize", neu); neu();
  return b;
}

async function start() {
  if (document.fonts && document.fonts.load) { try { await document.fonts.load('800 40px "Mona Sans"'); } catch (e) { /* Ersatzschrift */ } }

  /* ---------- Hero ---------- */
  const heroCanvas = document.getElementById("hero-canvas");
  if (heroCanvas) {
    const h = buehne(heroCanvas);
    const rad = baueRad({ felge: "stern", finish: "gunmetal", sattel: "rot", schrift: SCHRIFT });
    h.scene.add(rad);
    const istSichtbar = sichtbar(heroCanvas);
    let glatt = 0, winkel = 0, zuletzt = performance.now();
    const loop = now => {
      requestAnimationFrame(loop);
      const dt = Math.min(.05, (now - zuletzt) / 1000); zuletzt = now;
      if (!istSichtbar()) return;
      glatt += ((reduce ? .5 : K().heroP) - glatt) * .12;
      const p = glatt;
      // Drehung folgt dem „Tempo“: 248 km/h ≈ 35 Umdrehungen/s – sichtbar gedrosselt
      winkel -= (tempo(p) / 286) * 14 * dt + .15 * dt;
      const expl = weich(seg(p, .42, .52)) - weich(seg(p, .6, .7));
      const dreh = weich(seg(p, .3, .45)) - weich(seg(p, .7, .85));
      const raus = weich(seg(p, .88, 1));
      setzeRad(rad, { drehung: winkel, explosion: expl });
      rad.rotation.y = .12 + dreh * .78 - raus * .1;
      rad.rotation.x = -.04 - dreh * .12;
      const r = heroCanvas.getBoundingClientRect(), schmal = r.width / r.height < .9;
      rad.position.x = (schmal ? 0 : 10) + raus * 180;
      rad.position.y = schmal ? 16 : 0;
      h.camera.position.set(0, 0, (schmal ? 400 : 235) + expl * 95);
      h.camera.lookAt(0, 0, 0);
      h.renderer.render(h.scene, h.camera);
    };
    document.documentElement.classList.add("has-3d");
    requestAnimationFrame(() => heroCanvas.classList.add("is-bereit"));
    requestAnimationFrame(loop);
  }

  /* ---------- Showroom ---------- */
  const showCanvas = document.getElementById("show-canvas");
  if (showCanvas) {
    const s = buehne(showCanvas);
    let zustand = { ...K() };
    let rad = baueRad({ felge: zustand.felge, finish: zustand.finish, sattel: zustand.sattel, schrift: SCHRIFT });
    s.scene.add(rad);
    const istSichtbar = sichtbar(showCanvas);
    let rotY = .5, rotX = -.08, ziehen = null, traeg = 0, ruhe = performance.now(), winkel = 0, schub = 0, zuletzt = performance.now();
    const flaeche = showCanvas.parentNode;
    flaeche.addEventListener("pointerdown", e => { ziehen = { x: e.clientX, y: e.clientY, ry: rotY, rx: rotX }; flaeche.setPointerCapture(e.pointerId); ruhe = performance.now(); });
    flaeche.addEventListener("pointermove", e => {
      if (!ziehen) return;
      const neu = ziehen.ry + (e.clientX - ziehen.x) * .008;
      traeg = neu - rotY; rotY = neu;
      rotX = clamp(ziehen.rx + (e.clientY - ziehen.y) * .004, -.6, .4);
      ruhe = performance.now();
    });
    const los = () => { ziehen = null; };
    flaeche.addEventListener("pointerup", los); flaeche.addEventListener("pointercancel", los);
    const loop = now => {
      requestAnimationFrame(loop);
      const dt = Math.min(.05, (now - zuletzt) / 1000); zuletzt = now;
      if (!istSichtbar()) return;
      const k = K();
      if (k.felge !== zustand.felge) {                    // neues Design: kurz anrollen lassen
        s.scene.remove(rad);
        rad = baueRad({ felge: k.felge, finish: k.finish, sattel: k.sattel, schrift: SCHRIFT });
        s.scene.add(rad); schub = reduce ? 0 : 1;
      }
      if (k.finish !== zustand.finish) setzeFinish(rad, k.finish);
      if (k.sattel !== zustand.sattel) setzeSattel(rad, k.sattel);
      zustand = { ...k };
      schub *= .95;
      winkel -= (schub * 9 + (reduce ? 0 : .25)) * dt;
      if (!ziehen) { rotY += traeg; traeg *= .93; if (!reduce && now - ruhe > 2500) rotY += .0018; }
      setzeRad(rad, { drehung: winkel, explosion: 0 });
      rad.rotation.set(rotX, rotY, 0);
      rad.position.x = -schub * 20;
      const r = showCanvas.getBoundingClientRect();
      s.camera.position.set(0, 0, r.width / r.height < .9 ? 260 : 200);
      s.camera.lookAt(0, 0, 0);
      s.renderer.render(s.scene, s.camera);
    };
    requestAnimationFrame(loop);
  }
}

if (webglOk()) start().catch(() => { /* Ersatzbilder bleiben sichtbar */ });
