/* LUND – Live-3D: Hero-Uhr und Konfigurator (three.js lokal, gebündelt zu szene.bundle.js) */
import { baueUhr, erstelleBuehne, setzeZeit, setzeZifferblatt } from "./uhr3d.js";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STATE = () => window.LUND || { heroP: 0, heroDial: "eisblau", cfgDial: "eisblau", cfgSize: 39 };
const SCHRIFT = '"Mona Sans", system-ui, sans-serif';

function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

function sichtbar(el) {
  let on = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { on = es[0].isIntersecting; }).observe(el);
  return () => on;
}

function szene(canvas, hintergrund) {
  const b = erstelleBuehne(canvas, { hintergrund, dpr: Math.min(window.devicePixelRatio || 1, 1.75), transparent: true });
  const resize = () => { const r = canvas.getBoundingClientRect(); b.groesse(Math.max(1, r.width), Math.max(1, r.height)); };
  addEventListener("resize", resize);
  resize();
  return Object.assign(b, { resize });
}

async function start() {
  if (document.fonts && document.fonts.load) { try { await document.fonts.load('700 40px "Mona Sans"'); } catch (e) { /* weiter mit Ersatzschrift */ } }

  /* ---------- Hero ---------- */
  const heroCanvas = document.getElementById("hero-canvas");
  if (heroCanvas) {
    const h = szene(heroCanvas);
    let uhr = baueUhr({ zifferblatt: STATE().heroDial, schrift: SCHRIFT });
    h.scene.add(uhr);
    let dialAktuell = STATE().heroDial, spin = 0, glatt = 0;
    const istSichtbar = sichtbar(heroCanvas);
    const loop = () => {
      requestAnimationFrame(loop);
      if (!istSichtbar()) return;
      const s = STATE();
      if (s.heroDial !== dialAktuell) { setzeZifferblatt(uhr, s.heroDial); dialAktuell = s.heroDial; spin = 1; }
      glatt += ((reduce ? .3 : s.heroP) - glatt) * .1;
      spin *= .93;
      const p = glatt;
      uhr.rotation.y = .5 * Math.cos(p * Math.PI * 2.2) + spin * .35;
      uhr.rotation.x = -.38 - .16 * Math.sin(p * Math.PI * 3);
      uhr.rotation.z = .12 * Math.sin(p * Math.PI * 2) - spin * .08;
      const r = heroCanvas.getBoundingClientRect(), schmal = r.width / r.height < .8;
      h.camera.position.set(schmal ? 0 : -14, 0, (schmal ? 330 : 245) - p * 20);
      h.camera.lookAt(0, schmal ? 6 : 0, 0);
      setzeZeit(uhr, new Date());
      h.renderer.render(h.scene, h.camera);
    };
    document.documentElement.classList.add("has-3d");
    requestAnimationFrame(() => heroCanvas.classList.add("is-ready"));
    loop();
  }

  /* ---------- Konfigurator ---------- */
  const cfgCanvas = document.getElementById("config-canvas");
  if (cfgCanvas) {
    const k = szene(cfgCanvas);
    let groesse = STATE().cfgSize, dial = STATE().cfgDial;
    let uhr = baueUhr({ zifferblatt: dial, durchmesser: groesse, schrift: SCHRIFT });
    k.scene.add(uhr);
    const istSichtbar = sichtbar(cfgCanvas);
    let rotY = .4, rotX = -.35, ziehen = null, traeg = 0, zuletzt = performance.now();
    const stage = cfgCanvas.parentNode;
    stage.addEventListener("pointerdown", e => { ziehen = { x: e.clientX, y: e.clientY, ry: rotY, rx: rotX }; stage.setPointerCapture(e.pointerId); zuletzt = performance.now(); });
    stage.addEventListener("pointermove", e => {
      if (!ziehen) return;
      const dx = e.clientX - ziehen.x, dy = e.clientY - ziehen.y;
      const neu = ziehen.ry + dx * .008;
      traeg = neu - rotY; rotY = neu;
      rotX = Math.max(-1.1, Math.min(.3, ziehen.rx + dy * .005));
      zuletzt = performance.now();
    });
    const los = () => { ziehen = null; };
    stage.addEventListener("pointerup", los); stage.addEventListener("pointercancel", los);
    const loop = () => {
      requestAnimationFrame(loop);
      if (!istSichtbar()) return;
      const s = STATE();
      if (s.cfgSize !== groesse) {
        k.scene.remove(uhr); groesse = s.cfgSize; dial = s.cfgDial;
        uhr = baueUhr({ zifferblatt: dial, durchmesser: groesse, schrift: SCHRIFT }); k.scene.add(uhr);
      } else if (s.cfgDial !== dial) { setzeZifferblatt(uhr, s.cfgDial); dial = s.cfgDial; }
      if (!ziehen) {
        rotY += traeg; traeg *= .94;
        if (!reduce && performance.now() - zuletzt > 2500) rotY += .0025;   // langsames Drehen im Leerlauf
      }
      uhr.rotation.set(rotX, rotY, 0);
      const r = cfgCanvas.getBoundingClientRect(), schmal = r.width / r.height < .9;
      k.camera.position.set(0, 0, schmal ? 230 : 185);
      k.camera.lookAt(0, 0, 0);
      setzeZeit(uhr, new Date());
      k.renderer.render(k.scene, k.camera);
    };
    loop();
  }
}

if (webglOk()) start().catch(() => { /* Ersatzbilder bleiben sichtbar */ });
