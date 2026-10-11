/* Sehwerk – Live-3D-Brille im Hero (three.js lokal, keine externen Dienste) */
import { baueBrille, erstelleBuehne, setzeBuegel } from "./brille3d.js";

const canvas = document.getElementById("hero-canvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

if (canvas && webglOk()) {
  try { start(); } catch (e) { /* Fallback-Bild bleibt sichtbar */ }
}

function start() {
  const b = erstelleBuehne(canvas, { hintergrund: "#ECE8E1", dpr: Math.min(window.devicePixelRatio || 1, 1.75) });
  const { THREE, scene, camera, renderer, boden } = b;
  const brille = baueBrille("kant", "schwarz");
  scene.add(brille);
  boden.position.y = -26;

  // Ankerpunkte für die Beschriftungen
  const m = brille.userData.modell, off = m.bridge / 2 + m.w / 2;
  const anker = {
    glas: new THREE.Vector3(off - 6, 6, 1),
    rand: new THREE.Vector3(-off - m.w / 2 - 1, -10, 2),
    scharnier: new THREE.Vector3(off + m.w / 2 + 3, m.h * .3, -10)
  };
  const labels = [...document.querySelectorAll(".lbl")];

  const ziel = new THREE.Vector3(0, -2, -30);
  let w = 1, h = 1, p = 0, ziehP = 0, mx = 0, my = 0, zmx = 0, zmy = 0, dirty = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    b.groesse(w, h);
    dirty = true;
  }
  addEventListener("resize", resize);
  resize();

  if (window.matchMedia("(hover: hover)").matches && !reduce) {
    addEventListener("mousemove", e => { zmx = e.clientX / innerWidth - .5; zmy = e.clientY / innerHeight - .5; dirty = true; }, { passive: true });
  }

  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (v, a, z) => Math.min(1, Math.max(0, (v - a) / (z - a)));

  function frame() {
    const ziel_p = reduce ? .42 : (window.__heroP || 0);
    ziehP += (ziel_p - ziehP) * .12;                     // weich nachziehen
    mx += (zmx - mx) * .06; my += (zmy - my) * .06;
    if (Math.abs(ziel_p - ziehP) > .0005 || Math.abs(zmx - mx) > .001 || Math.abs(zmy - my) > .001) dirty = true;
    if (dirty) { render(ziehP); dirty = false; }
    requestAnimationFrame(frame);
  }

  function render(t) {
    // Choreografie: zusammengeklappt → Bügel öffnen & drehen → Rundgang → frontal
    const a = ease(seg(t, 0, .42));
    const c = ease(seg(t, .42, .8));
    const d = ease(seg(t, .8, 1));
    setzeBuegel(brille, a);
    brille.rotation.y = -.15 + a * -.5 + c * 1.05 + d * (-.4) + mx * .25;
    brille.rotation.x = .12 - a * .12 + my * .08;
    brille.position.y = a * 2;

    const hoch = innerWidth < 700;
    const basis = 330 * Math.max(1, (hoch ? 1.25 : 1.08) / (w / h));
    const dist = basis * (1 - d * .28) + (1 - a) * 30;
    const elev = .16 + a * .12 - d * .12;
    camera.position.set(ziel.x, ziel.y + dist * elev, ziel.z + dist);
    camera.lookAt(ziel.x, ziel.y + (hoch ? -12 : 0), ziel.z);
    renderer.render(scene, camera);

    // Beschriftungen projizieren
    const sichtbar = t > .3 && t < .78 && !hoch;
    brille.updateMatrixWorld();
    labels.forEach(l => {
      const v = anker[l.dataset.anchor].clone().applyMatrix4(brille.matrixWorld).project(camera);
      const x = (v.x * .5 + .5) * w, y = (-v.y * .5 + .5) * h;
      const rechts = l.classList.contains("lbl--r");
      l.style.transform = `translate(${(rechts ? x - l.offsetWidth - 70 : x + 70).toFixed(1)}px, ${(y - 10).toFixed(1)}px)`;
      l.classList.toggle("is-on", sichtbar);
    });
  }

  document.documentElement.classList.add("has-3d");
  render(0);
  requestAnimationFrame(() => canvas.classList.add("is-ready"));
  requestAnimationFrame(frame);
}
