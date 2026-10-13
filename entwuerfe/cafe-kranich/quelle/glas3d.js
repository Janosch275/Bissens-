/* Café Kranich – 3D-Latte-macchiato, der sich beim Scrollen füllt (three.js, gebündelt zu ../glas3d.bundle.js) */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

/* Maße des Glases (Einheiten ≈ 10 cm) */
const BASE = 0.2, RIM = 2.4, R_IN_BOT = 0.515, R_IN_TOP = 0.6;
const rIn = y => mix(R_IN_BOT, R_IN_TOP, clamp((y - BASE) / (RIM - BASE), 0, 1)) - 0.006;

function glasGeometrie() {
  const p = [];
  // außen von unten nach oben
  p.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.545, 0.03), new THREE.Vector2(0.552, 0.12));
  for (let i = 0; i <= 20; i++) { const t = i / 20, y = mix(0.12, RIM, t); p.push(new THREE.Vector2(mix(0.552, 0.64, t), y)); }
  // Lippe
  p.push(new THREE.Vector2(0.632, RIM + 0.012), new THREE.Vector2(0.612, RIM + 0.012));
  // innen von oben nach unten
  for (let i = 0; i <= 20; i++) { const t = i / 20, y = mix(RIM, BASE + 0.03, t); p.push(new THREE.Vector2(mix(R_IN_TOP + 0.005, R_IN_BOT + 0.005, t), y)); }
  p.push(new THREE.Vector2(R_IN_BOT - 0.02, BASE), new THREE.Vector2(0, BASE));
  const g = new THREE.LatheGeometry(p, 128);
  g.computeVertexNormals();
  return g;
}

function bohnenGeometrie() {
  // Ellipsoid mit abgeflachter Seite und S-förmiger Kerbe – wie eine echte geröstete Bohne
  const g = new THREE.SphereGeometry(1, 48, 32);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (v.z > 0) v.z *= 0.45;                                   // flache Seite
    const kerbeX = Math.sin(v.y * 2.6) * 0.12;                  // S-Kurve
    const tief = Math.exp(-Math.pow((v.x - kerbeX) / 0.13, 2)) * Math.max(0, v.z + 0.05) * 1.6;
    v.z -= tief * 0.55;
    p.setXYZ(i, v.x * 0.105, v.y * 0.155, v.z * 0.085);
  }
  g.computeVertexNormals();
  return g;
}

function kakaoTextur() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d");
  x.fillStyle = "#FBF6EE"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const r = Math.random() * 110, a = Math.random() * Math.PI * 2;
    x.fillStyle = `rgba(110,70,40,${(0.06 + Math.random() * 0.18) * (1 - r / 130)})`;
    x.beginPath(); x.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, Math.random() * 1.8 + 0.4, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function schattenTextur() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(30,22,15,.45)"); g.addColorStop(.55, "rgba(30,22,15,.16)"); g.addColorStop(1, "rgba(30,22,15,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function starte() {
  const stage = document.getElementById("stage");
  const canvas = document.getElementById("glas");
  if (!stage || !canvas) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!webglOk()) { document.documentElement.classList.add("no-3d"); return; }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeebe6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);

  const key = new THREE.DirectionalLight(0xfff1e0, 1.6); key.position.set(3, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe6ff, 0.8); rim.position.set(-4, 3, -3); scene.add(rim);

  const welt = new THREE.Group(); scene.add(welt);
  const glasGruppe = new THREE.Group(); welt.add(glasGruppe);

  // Untersetzer in Kobaltblau
  const teller = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.86, 0.07, 96), new THREE.MeshPhysicalMaterial({ color: 0x15218c, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.55 }));
  teller.position.y = -0.035; glasGruppe.add(teller);
  const schatten = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: schattenTextur(), transparent: true, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2; schatten.position.y = -0.071; glasGruppe.add(schatten);

  // Flüssigkeiten (werden pro Bild neu vermessen)
  const mat = {
    milch: new THREE.MeshPhysicalMaterial({ color: 0xf2e9dc, roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) }),
    misch: new THREE.MeshPhysicalMaterial({ color: 0xa57b57, roughness: 0.35 }),
    espresso: new THREE.MeshPhysicalMaterial({ color: 0x4a2c1a, roughness: 0.22, clearcoat: 0.4 }),
    schaum: new THREE.MeshPhysicalMaterial({ color: 0xfbf6ee, roughness: 0.92 })
  };
  const schicht = {};
  ["milch", "misch", "espresso", "schaum"].forEach(k => { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat[k]); m.visible = false; glasGruppe.add(m); schicht[k] = m; });
  const haube = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: kakaoTextur(), roughness: 0.95 }));
  haube.visible = false; glasGruppe.add(haube);
  const espressoStrahl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 1, 16), mat.espresso);
  espressoStrahl.visible = false; glasGruppe.add(espressoStrahl);

  function setzeSchicht(m, y0, y1) {
    if (y1 - y0 < 0.004) { m.visible = false; return; }
    m.visible = true;
    m.geometry.dispose();
    m.geometry = new THREE.CylinderGeometry(rIn(y1), rIn(y0), y1 - y0, 96, 1, false);
    m.position.y = (y0 + y1) / 2;
  }

  // Glas – physikalisch mit Lichtbrechung
  const glas = new THREE.Mesh(glasGeometrie(), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.12, ior: 1.45, attenuationColor: new THREE.Color(0xf4fbff), attenuationDistance: 4,
    specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, side: THREE.DoubleSide
  }));
  glas.renderOrder = 2; glasGruppe.add(glas);

  // Kaffeebohnen
  const bohnenMat = new THREE.MeshPhysicalMaterial({ color: 0x3e2416, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const bohnenGeo = bohnenGeometrie();
  const bohnen = [];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(bohnenGeo, bohnenMat);
    const s = 0.9 + Math.random() * 0.45; b.scale.setScalar(s);
    const d = { a: (i / 9) * Math.PI * 2 + Math.random() * 0.25, r: 0.98 + Math.random() * 0.35, y: 0.3 + Math.random() * 2.3, sp: 0.15 + Math.random() * 0.2, rx: Math.random() * 6, ry: Math.random() * 6, wob: Math.random() * 6 };
    b.userData = d; welt.add(b); bohnen.push(b);
  }

  // Maus-Parallaxe
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  addEventListener("pointermove", e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });

  let w = 1, h = 1, desktop = true;
  function groesse() {
    const r = canvas.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    desktop = w > 900;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (desktop) camera.setViewOffset(w, h, -w * 0.21, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", groesse); groesse();

  let sichtbar = true;
  new IntersectionObserver(es => { sichtbar = es[0].isIntersecting; }).observe(stage);

  function fortschritt() {
    const span = stage.offsetHeight - innerHeight;
    return span > 0 ? clamp((scrollY - stage.offsetTop) / span, 0, 1) : 0;
  }

  let pGlatt = reduce ? 1 : 0, zeit = 0, last = performance.now();
  function bild(now) {
    requestAnimationFrame(bild);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!sichtbar) return;
    zeit += dt;
    const ziel = reduce ? 1 : fortschritt();
    pGlatt += (ziel - pGlatt) * Math.min(1, dt * 6);
    const p = pGlatt;
    window.dispatchEvent(new CustomEvent("cafe:fortschritt", { detail: p }));

    // Füllstände: erst Milch, dann Schaum, dann sinkt der Espresso in die Mitte
    const milchP = ease(seg(p, 0.14, 0.36)), schaumP = ease(seg(p, 0.38, 0.58)), espP = ease(seg(p, 0.62, 0.84));
    const milchTop = mix(BASE, 1.12, milchP);
    const esp = 0.46 * espP, mischH = 0.09 * espP;
    const schaumH = 0.62 * schaumP;
    const y1 = milchTop, y2 = y1 + mischH, y3 = y2 + esp, y5 = y3 + schaumH;
    setzeSchicht(schicht.milch, BASE, y1);
    setzeSchicht(schicht.misch, y1, y2);
    setzeSchicht(schicht.espresso, y2, y3);
    setzeSchicht(schicht.schaum, y3, y5);
    if (schaumH > 0.02) {
      haube.visible = true; const r = rIn(y5);
      haube.scale.set(r, 0.06 + 0.1 * schaumP, r); haube.position.y = y5 - 0.002;
    } else haube.visible = false;
    // Espresso-Strahl während des Eingießens
    const giess = espP > 0.01 && espP < 0.96;
    espressoStrahl.visible = giess;
    if (giess) { const top = 3.5, bot = y5 + 0.02; espressoStrahl.scale.y = top - bot; espressoStrahl.position.set(0.05, (top + bot) / 2, 0); }

    // Glas dreht sich langsam, Bohnen kreisen
    glasGruppe.rotation.y = zeit * 0.12 + p * Math.PI * 1.2;
    bohnen.forEach((b, i) => {
      const d = b.userData;
      const weg = ease(seg(p, 0.1, 0.3)) * (1 - ease(seg(p, 0.86, 1)));
      const r = d.r + weg * 0.45;
      const a = d.a + zeit * d.sp * 0.4 + p * 2;
      b.position.set(Math.cos(a) * r, d.y + Math.sin(zeit * 0.8 + d.wob) * 0.08 - weg * 0.4, Math.sin(a) * r);
      b.rotation.set(d.rx + zeit * d.sp, d.ry + zeit * d.sp * 0.7, 0);
    });

    // Kamera-Fahrt
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    const dist = mix(7.4, 5.6, ease(seg(p, 0.05, 0.6))) + ease(seg(p, 0.86, 1)) * 1.4 + (desktop ? 0 : 2.2);
    const hoch = mix(0.32, 0.12, ease(seg(p, 0, 0.55))) + ease(seg(p, 0.55, 0.8)) * 0.18 - ease(seg(p, 0.86, 1)) * 0.1;
    const az = mix(-0.25, 0.35, p) + mx * 0.25;
    const tgtY = mix(1.25, 1.35, p) + (desktop ? 0 : -0.35);
    camera.position.set(Math.sin(az) * dist, tgtY + Math.sin(hoch) * dist - my * 0.4, Math.cos(az) * dist);
    camera.lookAt(0, tgtY, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(bild);
  document.documentElement.classList.add("has-3d");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", starte); else starte();
