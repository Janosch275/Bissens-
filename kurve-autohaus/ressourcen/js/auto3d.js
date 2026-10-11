/* KURVE – prozedurales 3D-Sportcoupé (three.js, lokal)
   Einheiten: Zentimeter. Länge entlang X (Front = +X), Breite Y, Höhe Z (Boden = 0). */
import * as THREE from "../vendor/three.module.min.js";
import { baueRad, setzeRad } from "./rad3d.js";

const RAD_V = 128, RAD_H = -142, ACHSE = 33.5, LAUF = 37;

/* ---------- Hilfsfunktionen für die Form ---------- */
const lerp = (a, b, t) => a + (b - a) * t;
function kurve(punkte, x) {                         // stückweise weiche Interpolation durch [x, wert]-Punkte
  if (x <= punkte[0][0]) return punkte[0][1];
  for (let i = 1; i < punkte.length; i++) {
    const [x0, y0] = punkte[i - 1], [x1, y1] = punkte[i];
    if (x <= x1) { const t = (x - x0) / (x1 - x0); return lerp(y0, y1, t * t * (3 - 2 * t)); }
  }
  return punkte[punkte.length - 1][1];
}
// Karosserie-Profile (x → Wert)
const OBERKANTE = [[-227, 60], [-223, 84], [-205, 88], [-120, 89], [-70, 90], [40, 88], [70, 84], [140, 70], [190, 60], [214, 52], [224, 40]];
const BREITE = [[-227, 80], [-222, 96], [-180, 100], [-140, 100], [-70, 95], [0, 94], [90, 95], [128, 96], [180, 93], [212, 86], [224, 70]];
function unterkante(x) {
  let z = kurve([[-226, 30], [-218, 16], [-180, 13], [200, 11], [224, 22]], x);
  [RAD_V, RAD_H].forEach(xr => { const d = x - xr; if (Math.abs(d) < LAUF) z = Math.max(z, ACHSE + Math.sqrt(LAUF * LAUF - d * d) * .92); });
  return z;
}

/* Lofted Fläche: Querschnitte (Superellipse) entlang X */
function loft({ von, bis, schritte, punkte, querschnitt, material }) {
  const pos = [], idx = [];
  for (let i = 0; i <= schritte; i++) {
    const x = lerp(von, bis, i / schritte);
    querschnitt(x).forEach(([y, z]) => pos.push(x, y, z));
  }
  for (let i = 0; i < schritte; i++) for (let k = 0; k < punkte; k++) {
    const a = i * punkte + k, b = i * punkte + (k + 1) % punkte, c = (i + 1) * punkte + k, d = (i + 1) * punkte + (k + 1) % punkte;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, material);
}
function superellipse(n, w, zu, zo, punkte, einzug = .12) {
  const pts = [], zc = (zu + zo) / 2, h = (zo - zu) / 2;
  for (let k = 0; k < punkte; k++) {
    const t = (k / punkte) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const yy = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), zz = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    pts.push([yy * w * (zz > 0 ? 1 - einzug * zz : 1), zc + zz * h]);
  }
  return pts;
}

/* ---------- Auto bauen ---------- */
export function baueAuto({ farbe = "#cf1d14", schrift = "sans-serif" } = {}) {
  const auto = new THREE.Group();
  const lack = new THREE.MeshPhysicalMaterial({ color: farbe, roughness: .42, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.2 });
  const glas = new THREE.MeshPhysicalMaterial({ color: "#0b0d10", roughness: .04, metalness: .2, clearcoat: 1, envMapIntensity: 1.6 });
  const schwarz = new THREE.MeshPhysicalMaterial({ color: "#111214", roughness: .55 });
  const chrom = new THREE.MeshPhysicalMaterial({ color: "#cfd2d6", metalness: 1, roughness: .15 });

  // Karosserie
  const P = 96;
  const koerper = loft({
    von: -226, bis: 224, schritte: 180, punkte: P, material: lack,
    querschnitt: x => superellipse(7, kurve(BREITE, x), unterkante(x), kurve(OBERKANTE, x), P, .2)
  });
  auto.add(koerper);

  // Kabine (Glas) – flach, stark geneigte Frontscheibe
  const kabine = loft({
    von: -92, bis: 76, schritte: 90, punkte: P, material: glas,
    querschnitt: x => {
      const dach = kurve([[-92, 89], [-60, 103], [-25, 110], [15, 111], [40, 104], [76, 85]], x);
      const w = kurve([[-92, 72], [-30, 70], [30, 68], [76, 76]], x);
      return superellipse(5, w, 60, dach, P, .3);
    }
  });
  auto.add(kabine);
  // lackiertes Dach über der Kabine
  const dach = loft({
    von: -48, bis: 34, schritte: 50, punkte: P, material: lack,
    querschnitt: x => {
      const z = kurve([[-48, 105], [-25, 110.4], [15, 111.4], [34, 106.5]], x);
      return superellipse(5, kurve([[-48, 52], [0, 54], [34, 50]], x), z - 3, z + .7, P, .3);
    }
  });
  auto.add(dach);

  // Heckflügel mit Stützen
  const fluegel = new THREE.Mesh(new THREE.BoxGeometry(32, 186, 3.2), lack);
  fluegel.position.set(-212, 0, 112); fluegel.rotation.y = .1;
  auto.add(fluegel);
  [-1, 1].forEach(s => {
    const end = new THREE.Mesh(new THREE.BoxGeometry(36, 2.4, 22), lack);
    end.position.set(-212, s * 93, 104); auto.add(end);
    const stuetze = new THREE.Mesh(new THREE.BoxGeometry(14, 2.6, 26), lack);
    stuetze.position.set(-202, s * 60, 96); stuetze.rotation.y = -.25; auto.add(stuetze);
  });

  // Seitliche Lufteinlässe, Spiegel, Lichter
  [-1, 1].forEach(s => {
    const einlass = new THREE.Mesh(new THREE.BoxGeometry(48, 6, 16), schwarz);
    einlass.position.set(-74, s * 93.5, 66); einlass.rotation.z = s * .06; auto.add(einlass);
    const spiegel = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), lack);
    spiegel.scale.set(10, 4, 5.5); spiegel.position.set(64, s * 82, 92); auto.add(spiegel);
    const scheinwerfer = new THREE.Mesh(new THREE.BoxGeometry(18, 22, 1.2), glas);
    scheinwerfer.position.set(204, s * 60, 56); scheinwerfer.rotation.y = .9; auto.add(scheinwerfer);
    const rueck = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 2, 32), new THREE.MeshPhysicalMaterial({ color: "#8e0b0b", emissive: "#b00", emissiveIntensity: .45, roughness: .15, clearcoat: 1 }));
    rueck.rotation.z = Math.PI / 2; rueck.position.set(-224, s * 62, 66); auto.add(rueck);
    const rueck2 = rueck.clone(); rueck2.position.y = s * 44; auto.add(rueck2);
  });
  // Frontgrill, Heckgitter
  const grill = new THREE.Mesh(new THREE.BoxGeometry(2, 120, 9), schwarz);
  grill.position.set(222, 0, 30); auto.add(grill);
  const heck = new THREE.Mesh(new THREE.BoxGeometry(2, 150, 16), schwarz);
  heck.position.set(-225, 0, 42); auto.add(heck);

  // Räder
  const raeder = [];
  [[RAD_V, 1], [RAD_V, -1], [RAD_H, 1], [RAD_H, -1]].forEach(([x, s]) => {
    const rad = baueRad({ felge: "stern", finish: "silber", sattel: "rot", schrift });
    rad.scale.setScalar(.98);
    rad.rotation.x = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    rad.position.set(x, s * 80, ACHSE);
    auto.add(rad); raeder.push({ rad, s });
  });

  auto.userData = { raeder, lack };
  return auto;
}

export function setzeAuto(auto, { drehung = 0 } = {}) {
  auto.userData.raeder.forEach(({ rad, s }) => setzeRad(rad, { drehung: s > 0 ? drehung : -drehung, explosion: 0 }));
}
