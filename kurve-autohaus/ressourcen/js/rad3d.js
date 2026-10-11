/* KURVE – prozedurales 3D-Rad (three.js, lokal eingebunden)
   Einheiten: Zentimeter. Radachse = Z, Felgenfront zeigt nach +Z. */
import * as THREE from "../vendor/three.module.min.js";

export const FELGEN = {
  stern:   { name: "Stern",   info: "5 Doppelspeichen" },
  turbine: { name: "Turbine", info: "14 geschwungene Speichen" },
  monza:   { name: "Monza",   info: "5 breite Speichen" }
};
export const FINISH = {
  silber:   { name: "Silber",       farbe: "#c9ccd1", metall: 1, rau: .28 },
  gunmetal: { name: "Gunmetal",     farbe: "#5a5f67", metall: 1, rau: .2 },
  schwarz:  { name: "Schwarz matt", farbe: "#1c1d1f", metall: .4, rau: .62 },
  bronze:   { name: "Bronze",       farbe: "#8a6a3c", metall: 1, rau: .34 }
};
export const SATTEL = { rot: "#d7261e", gelb: "#e8b51f", schwarz: "#1b1b1d", blau: "#1f4fd1" };

const V = (x, y) => new THREE.Vector2(x, y);
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const glatt = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------- Maße (cm): 20-Zoll-Felge, 255/35 ZR20 ---------- */
const R_IN = 8.2, R_OUT = 25.0, R_FACE = 26.6;
const zTop = r => 4.2 + 5.4 * Math.pow(clamp01((r - 6) / (R_OUT - 6)), 1.5);   // konkave Felgenfront
const Z_LIP = zTop(R_OUT);

/* Reifenprofil (r, z) von vorne über die Lauffläche nach hinten */
function reifenProfil() {
  const vorn = [
    [26.1, 8.9], [26.5, 9.6], [27.0, 10.3], [27.35, 10.8], [27.7, 10.9], [28.1, 10.78], [29.0, 10.92],
    [30.4, 11.12], [31.6, 11.06], [32.6, 10.8], [33.4, 10.3], [33.95, 9.6], [34.25, 8.6], [34.38, 7.0], [34.42, 4], [34.45, 0]
  ];
  const ctrl = vorn.concat(vorn.slice(0, -1).reverse().map(([r, z]) => [r, -z])).map(([r, z]) => V(r, z));
  return new THREE.SplineCurve(ctrl).getPoints(180);
}

/* ---------- Texturen ---------- */
function reifenTexturen(schrift, pts) {
  // Bogenlängen-UV: v = Anteil am Profilweg, Canvas-Zeile = (1 - v) * H
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const tot = L[L.length - 1], v = L.map(l => l / tot);
  const W = 4096, H = 1024, zeile = i => (1 - v[i]) * H, proCm = H / tot;
  const idx = (pred, rueck) => { const r = pts.map((p, i) => i).filter(i => pred(pts[i])); return rueck ? r[r.length - 1] : r[0]; };
  const yVorn = zeile(idx(p => p.x >= 34.2)), yHinten = zeile(idx(p => p.x >= 34.2, true));
  const yA = Math.min(yVorn, yHinten), yB = Math.max(yVorn, yHinten), tb = yB - yA;
  const yText = zeile(idx(p => p.x >= 30.1)), yRing = zeile(idx(p => p.x >= 32.95));
  const zeichne = (relief) => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    const tief = relief ? "#000" : "#0a0a0b", hoch = relief ? "#c4c4c4" : "#2f2f31";
    g.fillStyle = relief ? "#808080" : "#18181a"; g.fillRect(0, 0, W, H);
    // Lauffläche: 4 Längsrillen, Schulterblöcke, Lamellen
    g.fillStyle = tief;
    [.2, .4, .61, .81].forEach(f => g.fillRect(0, yA + tb * f - tb * .022, W, tb * .044));
    for (let i = 0; i < 88; i++) {
      const x = (i / 88) * W;
      g.fillRect(x, yA - tb * .06, 7, tb * .25);                          // Schulter vorn
      g.fillRect(x + 22, yA + tb * .82, 7, tb * .24);                     // Schulter hinten
    }
    g.lineWidth = 2.5; g.strokeStyle = tief;
    for (let i = 0; i < 132; i++) {                                       // schräge Lamellen in den Mittelrippen
      const x = (i / 132) * W;
      [[.42, .59], [.63, .79]].forEach(([a, b]) => { g.beginPath(); g.moveTo(x, yA + tb * a); g.lineTo(x + 10, yA + tb * (a + (b - a) * .6)); g.stroke(); });
    }
    g.lineWidth = 3; g.strokeStyle = hoch;                                // gegossener Zierring
    g.beginPath(); g.moveTo(0, yRing); g.lineTo(W, yRing); g.stroke();
    // Flankenschrift (erhaben)
    g.fillStyle = hoch; g.textBaseline = "middle"; g.textAlign = "center";
    const hs = (W / (2 * Math.PI * 30.1)) / proCm;
    const text = (t, x, gr, art) => { g.save(); g.translate(x, yText); g.scale(hs, 1); g.font = art + " " + gr * proCm + "px " + schrift; g.fillText(t, 0, 0); g.restore(); };
    for (let k = 0; k < 2; k++) {
      const o = k * W / 2;
      text("KURVE", o + W * .08, 2.3, "italic 800");
      text("SPORT CONTACT", o + W * .19, 1.15, "700");
      text("255/35 ZR20 (95Y) XL", o + W * .36, 1.25, "700");
      text("DOT 4226", o + W * .46, .8, "600");
    }
    const t = new THREE.CanvasTexture(c);
    if (!relief) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: zeichne(false), bump: zeichne(true), v };
}
function scheibenTextur() {
  const S = 1024, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d"), m = S / 2, cm = m / 19;
  g.fillStyle = "#7a7d82"; g.fillRect(0, 0, S, S);
  g.save(); g.translate(m, m);
  for (let i = 0; i < 3000; i++) {                                   // Drehriefen
    const r = cm * (11.5 + Math.random() * 7.5);
    g.strokeStyle = "rgba(" + (Math.random() > .5 ? "255,255,255" : "0,0,0") + "," + (.03 + Math.random() * .07) + ")";
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
  }
  const rg = g.createRadialGradient(0, 0, cm * 11.5, 0, 0, cm * 19);   // dunklere Ränder, leichte Anlauffarbe
  rg.addColorStop(0, "rgba(30,30,34,.55)"); rg.addColorStop(.12, "rgba(0,0,0,0)");
  rg.addColorStop(.88, "rgba(0,0,0,0)"); rg.addColorStop(1, "rgba(60,48,40,.5)");
  g.fillStyle = rg; g.beginPath(); g.arc(0, 0, cm * 19, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 24; i++) {                                     // Querbohrungen in geschwungenen Reihen
    const a = (i / 24) * Math.PI * 2;
    [13.4, 15.2, 17.0].forEach((rr, k) => {
      const aa = a + k * .085, x = Math.cos(aa) * cm * rr, y = Math.sin(aa) * cm * rr;
      g.fillStyle = "#a9adb2"; g.beginPath(); g.arc(x, y, cm * .52, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#0e0e10"; g.beginPath(); g.arc(x, y, cm * .4, 0, Math.PI * 2); g.fill();
    });
  }
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function kuehlTextur() {                                             // innenbelüftete Scheibe: Stege am Rand
  const c = document.createElement("canvas"); c.width = 2048; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#6f7277"; g.fillRect(0, 0, 2048, 64);
  g.fillStyle = "#121214"; g.fillRect(0, 22, 2048, 20);
  g.fillStyle = "#4b4e53";
  for (let i = 0; i < 72; i++) g.fillRect(i * 2048 / 72, 22, 9, 20);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function nabenTextur(schrift) {
  const S = 512, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  const rg = g.createRadialGradient(S * .4, S * .35, 10, S / 2, S / 2, S / 2);
  rg.addColorStop(0, "#2a2b2f"); rg.addColorStop(1, "#0f1012");
  g.fillStyle = rg; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#b9bcc1"; g.lineWidth = 6; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 26, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#e9e9e6"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "italic 800 210px " + schrift;
  g.fillText("K", S / 2 + 6, S / 2 + 10);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Geometrie-Helfer ---------- */
/* Loft: jedes Segment eines Querschnitts bekommt eigene Vertices → harte Kanten zwischen Segmenten */
function loft(segmente, ringe, punkt) {
  const pos = [], idx = [];
  segmente.forEach(seg => {
    const n = seg.length, basis = pos.length / 3;
    for (let i = 0; i <= ringe; i++) seg.forEach(([u, h]) => { const p = punkt(i / ringe, u, h); pos.push(p[0], p[1], p[2]); });
    for (let i = 0; i < ringe; i++) for (let k = 0; k < n - 1; k++) {
      const a = basis + i * n + k, b = a + 1, c = a + n, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function drehteil(profil, mat, seg = 160) {                          // Lathe um die Z-Achse, Profil als [r, z]
  const m = new THREE.Mesh(new THREE.LatheGeometry(profil.map(([r, z]) => V(r, z)), seg), mat);
  m.rotation.x = Math.PI / 2;
  return m;
}

/* ---------- Speichen ---------- */
function speichenDef(felge) {
  const L = [];
  if (felge === "stern") {            // 5 Doppelspeichen, die nach außen auseinanderlaufen
    for (let i = 0; i < 5; i++) {
      const c = (i / 5) * Math.PI * 2;
      [-1, 1].forEach(sd => L.push({ c, d0: sd * 1.72, d1: sd * 4.7, w0: 1.5, w1: 1.05, twist: 0 }));
    }
  } else if (felge === "turbine") {   // 14 schmale, geschwungene Speichen
    for (let i = 0; i < 14; i++) L.push({ c: (i / 14) * Math.PI * 2, d0: 0, d1: 0, w0: 1.3, w1: .95, twist: .42 });
  } else {                            // Monza: 5 breite Speichen
    for (let i = 0; i < 5; i++) L.push({ c: (i / 5) * Math.PI * 2, d0: 0, d1: 0, w0: 4.2, w1: 3.0, twist: 0 });
  }
  return L;
}
// Querschnitt (u = quer in Halbbreiten, h = Höhe 0..1): glanzgedrehte Sichtfläche + lackierte Fasen/Flanken
const SICHT = [...Array(11)].map((_, k) => { const u = -.8 + 1.6 * k / 10; return [u, 1 + .05 * (1 - u * u / .64)]; });
const KOERPER = [
  [[.8, 1], [.97, .88]], [[.97, .88], [1.07, .06]], [[1.07, .06], [1, 0], [-1, 0], [-1.07, .06]],
  [[-1.07, .06], [-.97, .88]], [[-.97, .88], [-.8, 1]]
];
function speichenPunkt(sp, dick0, dick1) {
  const r0 = R_IN - 2.5, r1 = R_OUT + 1.0;
  return (s, u, h) => {
    const r = r0 + (r1 - r0) * s;
    const t = clamp01((r - R_IN) / (R_OUT - R_IN));
    const ansatz = 1 + .55 * glatt(.84, 1, t) + .3 * (1 - glatt(0, .14, t));      // Übergangsradien an Nabe und Horn
    const hw = (sp.w0 + (sp.w1 - sp.w0) * t) * ansatz;
    const d = sp.d0 + (sp.d1 - sp.d0) * Math.pow(t, .9);
    const w = sp.c + sp.twist * t * t + Math.asin(Math.max(-.98, Math.min(.98, (d + u * hw) / r)));
    const dk = dick0 + (dick1 - dick0) * t;
    return [Math.cos(w) * r, Math.sin(w) * r, zTop(r) - dk + h * dk];
  };
}

function felgenFront(felge, lack, schliff) {
  const grp = new THREE.Group();
  const d0 = felge === "monza" ? 4 : 3.8, d1 = felge === "monza" ? 2.9 : 2.6;
  speichenDef(felge).forEach(sp => {
    const p = speichenPunkt(sp, d0, d1);
    grp.add(new THREE.Mesh(loft([SICHT], 64, p), schliff));
    grp.add(new THREE.Mesh(loft(KOERPER, 64, p), lack));
  });
  // Nabe: lackierter Kragen + glanzgedrehte Anlagefläche
  grp.add(drehteil([[2.9, 4.2], [3.2, 4.93], [7.4, 4.93], [7.9, 4.7], [R_IN + 1, zTop(R_IN + 1) - .6], [R_IN + 1.3, .5]], lack));
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.25, 7.38, 120), schliff);
  ring.position.z = 4.95;
  grp.add(ring);
  // Felgenhorn: glanzgedreht, gerundet
  grp.add(drehteil([
    [R_OUT - .2, Z_LIP - 1.6], [R_OUT - .3, Z_LIP - .3], [R_OUT + .1, Z_LIP + .25], [R_FACE - .7, Z_LIP + .45],
    [R_FACE - .15, Z_LIP + .3], [R_FACE + .05, Z_LIP - .3], [R_FACE - .1, Z_LIP - 1.2], [R_FACE - .6, Z_LIP - 1.6]
  ], schliff, 240));
  return grp;
}

/* ---------- Rad bauen ---------- */
export function baueRad({ felge = "stern", finish = "gunmetal", sattel = "rot", schrift = "sans-serif" } = {}) {
  const rad = new THREE.Group();
  const f = FINISH[finish];
  const felgenMat = new THREE.MeshPhysicalMaterial({ color: f.farbe, metalness: f.metall, roughness: f.rau, clearcoat: .7, clearcoatRoughness: .25 });
  const bettMat = new THREE.MeshPhysicalMaterial({ color: f.farbe, metalness: f.metall, roughness: Math.min(1, f.rau + .15), side: THREE.DoubleSide });
  const schliffMat = new THREE.MeshPhysicalMaterial({ color: "#e2e4e7", metalness: 1, roughness: .07, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.25 });
  const chromMat = new THREE.MeshPhysicalMaterial({ color: "#eef0f2", metalness: 1, roughness: .04, envMapIntensity: 1.3 });

  /* Reifen */
  const reifenGruppe = new THREE.Group();
  const pts = reifenProfil();
  const tx = reifenTexturen(schrift, pts);
  const gummi = new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: tx.map, bumpMap: tx.bump, bumpScale: 1.6, roughness: .8, sheen: .35, sheenRoughness: .6, sheenColor: new THREE.Color("#4a4a4d") });
  const reifenGeo = new THREE.LatheGeometry(pts.map(p => V(p.x, -p.y)), 256);
  const uv = reifenGeo.attributes.uv, n = pts.length;
  for (let i = 0; i < uv.count; i++) uv.setY(i, tx.v[i % n]);
  const reifen = new THREE.Mesh(reifenGeo, gummi);
  reifen.rotation.x = -Math.PI / 2;
  reifenGruppe.add(reifen);
  rad.add(reifenGruppe);

  /* Felge */
  const felgenGruppe = new THREE.Group();
  felgenGruppe.add(drehteil([
    [R_FACE - .6, Z_LIP - 1.6], [24.6, 7.6], [23.6, 6.2], [23.3, 3], [23.3, -6.5], [23.9, -8.8], [25.4, -9.8], [26.4, -10.0]
  ], bettMat));
  felgenGruppe.add(felgenFront(felge, felgenMat, schliffMat));

  // Radschrauben in Senkungen, Nabendeckel
  const lochMat = new THREE.MeshStandardMaterial({ color: "#0b0b0c", roughness: .9 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5, x = Math.cos(a) * 5.5, y = Math.sin(a) * 5.5;
    const loch = new THREE.Mesh(new THREE.CircleGeometry(1.22, 40), lochMat);
    loch.position.set(x, y, 4.97);
    const kopf = new THREE.Mesh(new THREE.CylinderGeometry(.78, .78, .9, 6), chromMat);
    kopf.rotation.x = Math.PI / 2; kopf.position.set(x, y, 5.0);
    const kuppe = new THREE.Mesh(new THREE.SphereGeometry(.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), chromMat);
    kuppe.rotation.x = Math.PI / 2; kuppe.position.set(x, y, 5.42);
    felgenGruppe.add(loch, kopf, kuppe);
  }
  const deckelRand = drehteil([[2.6, 5.0], [3.05, 5.05], [3.15, 5.3], [2.95, 5.42]], chromMat, 96);
  const deckel = new THREE.Mesh(new THREE.CircleGeometry(2.96, 64), new THREE.MeshPhysicalMaterial({ map: nabenTextur(schrift), metalness: .5, roughness: .3, clearcoat: 1 }));
  deckel.position.z = 5.38;
  felgenGruppe.add(deckelRand, deckel);
  // Ventil
  const ventil = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 2.2, 20), chromMat);
  const va = Math.PI * .5 + Math.PI / 5;
  ventil.position.set(Math.cos(va) * 23.9, Math.sin(va) * 23.9, 6.6);
  ventil.rotation.set(0, 0, va - Math.PI / 2); ventil.rotateX(-.9);
  felgenGruppe.add(ventil);
  rad.add(felgenGruppe);

  /* Bremsscheibe: Reibring (gelocht, innenbelüftet) + Alu-Topf mit Floating-Bobbins */
  const scheibenGruppe = new THREE.Group();
  const Z_SCH = -4.8, D_SCH = 3.4;
  const reibMat = new THREE.MeshPhysicalMaterial({ map: scheibenTextur(), metalness: .85, roughness: .34, side: THREE.DoubleSide });
  [1, -1].forEach(s => {
    const f2 = new THREE.Mesh(new THREE.RingGeometry(11.5, 19, 160, 1), reibMat);
    f2.position.z = Z_SCH + s * D_SCH / 2;
    scheibenGruppe.add(f2);
  });
  const rand = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, D_SCH, 160, 1, true), new THREE.MeshStandardMaterial({ map: kuehlTextur(), metalness: .7, roughness: .5 }));
  rand.rotation.x = Math.PI / 2; rand.position.z = Z_SCH;
  scheibenGruppe.add(rand);
  const topfMat = new THREE.MeshPhysicalMaterial({ color: "#2a2b2f", metalness: .8, roughness: .32, clearcoat: .5 });
  scheibenGruppe.add(drehteil([[12.2, Z_SCH - .2], [11.4, Z_SCH + .4], [10, -1.6], [9.4, .4], [8.9, .7], [3.4, .7], [3.4, -.2]], topfMat, 120));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, b = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .8, 20), topfMat);
    b.rotation.x = Math.PI / 2; b.position.set(Math.cos(a) * 11.85, Math.sin(a) * 11.85, Z_SCH + D_SCH / 2 + .35);
    scheibenGruppe.add(b);
  }
  rad.add(scheibenGruppe);
  // dunkler Radträger/Staubblech dahinter, damit der Hintergrund nicht durchscheint
  const traeger = new THREE.Mesh(new THREE.CircleGeometry(23.4, 96), new THREE.MeshStandardMaterial({ color: "#0d0d0f", roughness: .85, metalness: .2 }));
  traeger.position.z = -11.5;
  rad.add(traeger);

  /* Bremssattel: Monoblock, umgreift die Scheibe (dreht nicht mit) */
  const sattelGruppe = new THREE.Group();
  const s = new THREE.Shape(), a0 = -.66, a1 = .66, ri = 13.6, ra = 21.2;
  s.absarc(0, 0, ra, a0, a1, false);
  s.absarc(0, 0, ri, a1, a0, true);
  const fase = 1.5, zv = 1.5, zh = -10.2;
  const sattelGeo = new THREE.ExtrudeGeometry(s, { depth: zv - zh - 2 * fase, bevelEnabled: true, bevelThickness: fase, bevelSize: 1.35, bevelOffset: -.2, bevelSegments: 10, curveSegments: 64 });
  sattelGeo.translate(0, 0, zh + fase);
  const sattelMat = new THREE.MeshPhysicalMaterial({ color: SATTEL[sattel], roughness: .32, metalness: .05, clearcoat: 1, clearcoatRoughness: .05 });
  sattelGruppe.add(new THREE.Mesh(sattelGeo, sattelMat));
  // Bremsbelag-Fenster an der Innenkante, Entlüftungsnippel
  const belag = new THREE.Mesh(new THREE.BoxGeometry(3.2, 9, 3.6), new THREE.MeshStandardMaterial({ color: "#2a2a2c", roughness: .8 }));
  belag.position.set(ri - .6, 0, Z_SCH);
  sattelGruppe.add(belag);
  [-1, 1].forEach(sd => {
    const a = sd * .5, nip = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 1.1, 6), chromMat);
    nip.rotation.x = Math.PI / 2; nip.position.set(Math.cos(a) * 19.6, Math.sin(a) * 19.6, zv + .2);
    sattelGruppe.add(nip);
  });
  // Schriftzug auf dem Sattel
  const sc = document.createElement("canvas"); sc.width = 512; sc.height = 128;
  const sg = sc.getContext("2d"); sg.fillStyle = "#fff"; sg.font = "italic 800 92px " + schrift; sg.textAlign = "center"; sg.textBaseline = "middle"; sg.fillText("KURVE", 256, 68);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), new THREE.MeshBasicMaterial({ map: st, transparent: true, toneMapped: false, color: "#f2f2f2" }));
  label.position.set(17.4, 0, zv + .02); label.rotation.z = Math.PI / 2;
  sattelGruppe.add(label);
  sattelGruppe.rotation.z = Math.PI * .22;
  rad.add(sattelGruppe);

  rad.traverse(o => { if (o.isMesh && o !== label) { o.castShadow = true; o.receiveShadow = true; } });
  rad.userData = { traeger, reifenGruppe, felgenGruppe, scheibenGruppe, sattelGruppe, felgenMat, bettMat, sattelMat };
  return rad;
}

/* Drehung und Explosionsansicht (0 = montiert, 1 = zerlegt) */
export function setzeRad(rad, { drehung = 0, explosion = 0 } = {}) {
  const { traeger, reifenGruppe, felgenGruppe, scheibenGruppe, sattelGruppe } = rad.userData;
  reifenGruppe.rotation.z = felgenGruppe.rotation.z = scheibenGruppe.rotation.z = drehung;
  felgenGruppe.position.z = explosion * 26;
  reifenGruppe.position.z = explosion * 4;
  reifenGruppe.scale.setScalar(1 + explosion * .06);
  scheibenGruppe.position.z = explosion * -24;
  traeger.visible = explosion < .02;
  sattelGruppe.position.set(explosion * 12, explosion * 10, explosion * -40);
}

export function setzeFinish(rad, name) {
  const f = FINISH[name], m = rad.userData.felgenMat;
  m.color.set(f.farbe); m.metalness = f.metall; m.roughness = f.rau;
  const b = rad.userData.bettMat; b.color.set(f.farbe); b.metalness = f.metall; b.roughness = Math.min(1, f.rau + .15);
}
export function setzeSattel(rad, name) { rad.userData.sattelMat.color.set(SATTEL[name]); }

/* ---------- Bühne ---------- */
function studio(renderer) {
  // Fotostudio: dunkler Raum, helle Softbox-Streifen – Metall braucht Kontrast, um zu glänzen
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "varying vec3 p; void main(){ float t = p.y * .5 + .5; vec3 c = mix(vec3(.05,.05,.055), vec3(.55,.55,.56), smoothstep(.3,1.,t)); c += vec3(.5) * smoothstep(.06,.0,abs(p.y + .02)); gl_FragColor = vec4(c,1.); }"
  })));
  const box = (w, h, x, y, z, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  box(34, 3, 0, 16, 6, 9);          // Deckenstreifen
  box(2.2, 26, -16, 2, 8, 8);       // Striplight links
  box(1.6, 26, 17, 0, 3, 5);        // Striplight rechts
  box(10, 10, 6, 8, 18, 3.2);       // große Softbox vorne
  box(1.2, 20, -6, -2, 22, 4);      // schmale Kante vorne links
  box(24, 2, 0, -12, 14, 1.4);      // Bodenaufheller
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(s, .02).texture;
}

export function erstelleBuehne(canvas, { dpr = Math.min(window.devicePixelRatio || 1, 1.75), hintergrund = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !hintergrund, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  if (hintergrund) scene.background = new THREE.Color(hintergrund);
  scene.environment = studio(renderer);
  const key = new THREE.DirectionalLight("#ffffff", 1.6); key.position.set(-60, 120, 100);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 60, far: 300 });
  key.shadow.bias = -.0004; key.shadow.normalBias = .04; key.shadow.radius = 3;
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(24, 1, 1, 5000);
  function groesse(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  return { THREE, renderer, scene, camera, groesse };
}
