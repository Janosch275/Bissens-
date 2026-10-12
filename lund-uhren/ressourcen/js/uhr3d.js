/* LUND – prozedurale 3D-Uhr (three.js, lokal eingebunden)
   Einheiten: Millimeter. Zifferblatt liegt in der XY-Ebene und zeigt nach +Z, 12 Uhr = +Y. */
import * as THREE from "../vendor/three.module.min.js";

/* ---------- Zifferblattfarben ---------- */
export const ZIFFERBLAETTER = {
  eisblau:  { name: "Eisblau",  farbe: "#8fb8d6", hell: "#cfe4f2", dunkel: "#4f7896", druck: "#ffffff" },
  salbei:   { name: "Salbei",   farbe: "#7f9a86", hell: "#c0d3c4", dunkel: "#4b6352", druck: "#ffffff" },
  nachtblau:{ name: "Nachtblau",farbe: "#1f3354", hell: "#4c6a98", dunkel: "#0c1626", druck: "#ffffff" },
  lachs:    { name: "Lachs",    farbe: "#d9a08a", hell: "#f3d2c4", dunkel: "#a36852", druck: "#ffffff" },
  anthrazit:{ name: "Anthrazit",farbe: "#3a3d42", hell: "#6c7077", dunkel: "#17191c", druck: "#ffffff" },
  silber:   { name: "Silber",   farbe: "#c9ccd0", hell: "#f1f2f4", dunkel: "#8c9096", druck: "#1b1d20" }
};

/* ---------- Zifferblatt-Textur (Sonnenschliff, Minuterie, Druck) ---------- */
function zifferblattTextur(z, schrift) {
  const S = 2048, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d"), m = S / 2;
  // Grundfarbe mit radialem Verlauf
  const rg = g.createRadialGradient(m, m * .9, 0, m, m, m);
  rg.addColorStop(0, z.hell); rg.addColorStop(.55, z.farbe); rg.addColorStop(1, z.dunkel);
  g.fillStyle = rg; g.fillRect(0, 0, S, S);
  // Sonnenschliff: konischer Hell-Dunkel-Wechsel
  if (g.createConicGradient) {
    const cg = g.createConicGradient(-Math.PI / 4, m, m);
    [[0, .14], [.25, -.12], [.5, .14], [.75, -.12], [1, .14]].forEach(([o, v]) => cg.addColorStop(o, v > 0 ? "rgba(255,255,255," + v + ")" : "rgba(0,0,0," + (-v) + ")"));
    g.fillStyle = cg; g.fillRect(0, 0, S, S);
  }
  // feine radiale Schliffspuren
  g.save(); g.translate(m, m);
  for (let i = 0; i < 4200; i++) {
    const a = (i / 4200) * Math.PI * 2;
    g.strokeStyle = (i % 3 ? "rgba(255,255,255," : "rgba(0,0,0,") + (.012 + (i * 7919 % 13) / 700) + ")";
    g.lineWidth = .8;
    g.beginPath(); g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); g.lineTo(Math.cos(a) * m, Math.sin(a) * m); g.stroke();
  }
  const vg = g.createRadialGradient(0, 0, m * .8, 0, 0, m);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.35)");
  g.fillStyle = vg; g.fillRect(-m, -m, S, S);
  // Minuterie
  g.strokeStyle = z.druck; g.fillStyle = z.druck;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, r1 = m * .955, r0 = i % 5 ? m * .925 : m * .905;
    g.globalAlpha = i % 5 ? .55 : .85; g.lineWidth = i % 5 ? 3 : 5;
    g.beginPath(); g.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); g.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1); g.stroke();
  }
  g.globalAlpha = 1;
  // Druck
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "700 " + Math.round(S * .052) + "px " + schrift;
  g.letterSpacing = (S * .012) + "px";
  g.fillText("LUND", 0, -m * .44);
  g.globalAlpha = .75;
  g.font = "500 " + Math.round(S * .02) + "px " + schrift;
  g.letterSpacing = (S * .006) + "px";
  g.fillText("AUTOMATIK", 0, m * .4);
  g.fillText("100 M", 0, m * .47);
  g.globalAlpha = 1;
  // Datumsfenster bei 3 Uhr
  const dw = S * .07, dh = S * .052, dx = m * .62;
  g.fillStyle = "#1d1f22"; g.fillRect(dx - dw / 2 - 6, -dh / 2 - 6, dw + 12, dh + 12);
  g.fillStyle = "#f6f6f4"; g.fillRect(dx - dw / 2, -dh / 2, dw, dh);
  g.fillStyle = "#16181b"; g.font = "600 " + Math.round(dh * .72) + "px " + schrift; g.letterSpacing = "0px";
  g.fillText(String(new Date().getDate()), dx, dh * .04);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const texCache = {};
function dialTex(name, schrift) { return texCache[name] || (texCache[name] = zifferblattTextur(ZIFFERBLAETTER[name], schrift)); }

/* ---------- Materialien ---------- */
// Schliffspuren als Rauheitskarte: Linien entlang U (quer = false) oder entlang V (quer = true)
const strichCache = {};
function striche(quer) {
  if (strichCache[quer]) return strichCache[quer];
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = "#c8c8c8"; g.fillRect(0, 0, S, S);
  let z = 7;
  const rnd = () => (z = (z * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2600; i++) {
    const v = 150 + Math.floor(rnd() * 105), y = rnd() * S, x = rnd() * S, l = S * (.2 + rnd() * .8);
    g.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
    if (quer) g.fillRect(y, x - l / 2, 1 + rnd() * 1.5, l); else g.fillRect(x - l / 2, y, l, 1 + rnd() * 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (strichCache[quer] = t);
}
const stahlPoliert = () => new THREE.MeshPhysicalMaterial({ color: "#e6e8eb", metalness: 1, roughness: .045, envMapIntensity: 1.15 });
function stahlGebuerstet(quer = false, rep = 1) {
  const t = striche(quer).clone(); t.needsUpdate = true; t.repeat.set(rep, rep);
  return new THREE.MeshPhysicalMaterial({ color: "#c9cdd2", metalness: 1, roughness: .34, roughnessMap: t, bumpMap: t, bumpScale: .015 });
}
const leucht = () => new THREE.MeshPhysicalMaterial({ color: "#f1f0e8", roughness: .55, emissive: "#d9f2e4", emissiveIntensity: .05 });

function kantenProfil(w, h, r) {                // abgerundetes Rechteck als Shape
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function block(w, h, d, mat, bevel = .35) {
  const g = new THREE.ExtrudeGeometry(kantenProfil(w, h, Math.min(w, h) * .1), { depth: d, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 });
  g.translate(0, 0, -d / 2);
  return new THREE.Mesh(g, mat);
}

/* Glied: Querschnitt (Breite × Dicke) mit leicht gewölbter Oberseite, entlang der Länge extrudiert */
function glied(w, len, dick, mat, wolb = .25, fase = .22) {
  const q = new THREE.Shape(), r = Math.min(.5, w * .15);
  q.moveTo(-w / 2 + r, 0); q.lineTo(w / 2 - r, 0); q.quadraticCurveTo(w / 2, 0, w / 2, r);
  q.lineTo(w / 2, dick - wolb);
  q.bezierCurveTo(w / 2, dick - wolb * .3, w * .3, dick, 0, dick);
  q.bezierCurveTo(-w * .3, dick, -w / 2, dick - wolb * .3, -w / 2, dick - wolb);
  q.lineTo(-w / 2, r); q.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  const g = new THREE.ExtrudeGeometry(q, { depth: len - 2 * fase, bevelEnabled: true, bevelThickness: fase, bevelSize: fase * .8, bevelOffset: -fase * .8, bevelSegments: 4, curveSegments: 14 });
  g.rotateX(Math.PI / 2);                      // Länge entlang −Y, Dicke entlang +Z
  g.translate(0, len / 2 - fase, -dick / 2);
  return new THREE.Mesh(g, mat);
}

/* Gehäusemittelteil von oben: Kreis mit fließend angesetzten Bandanstößen */
function gehaeuseUmriss(R, L, Y) {
  const s = new THREE.Shape(), Rc = R + .35, w = 52 * Math.PI / 180;
  const P = a => [Math.cos(a) * Rc, Math.sin(a) * Rc];
  s.moveTo(L, Y);
  s.quadraticCurveTo(L, R * .82, ...P(w));
  s.absarc(0, 0, Rc, w, -w, true);
  s.quadraticCurveTo(L, -R * .82, L, -Y);
  s.lineTo(-L, -Y);
  s.quadraticCurveTo(-L, -R * .82, ...P(Math.PI + w));
  s.absarc(0, 0, Rc, Math.PI + w, Math.PI - w, true);
  s.quadraticCurveTo(-L, R * .82, -L, Y);
  s.closePath();
  const loch = new THREE.Path(); loch.absarc(0, 0, R * .9, 0, Math.PI * 2, true);
  s.holes.push(loch);
  return s;
}

/* ---------- Uhr bauen ---------- */
export function baueUhr({ zifferblatt = "eisblau", durchmesser = 39, schrift = "sans-serif" } = {}) {
  const R = durchmesser / 2;
  const uhr = new THREE.Group();
  const polished = stahlPoliert(), brushed = stahlGebuerstet(false, 1), flanke = stahlGebuerstet(true, 1 / 30);
  const V = (x, y) => new THREE.Vector2(x, y);
  const dreh = (pts, mat, seg = 200) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, z]) => V(r, z)), seg), mat); m.rotation.x = Math.PI / 2; return m; };

  const bw = R * 1.12, L = bw / 2 + .35, Y = R + 4.2;          // Bandbreite, Anstoßbreite, Anstoßende
  const Z0 = -4.6, Z1 = 2.6, F = .5;                            // Gehäusemittelteil unten/oben, Fase
  // Mittelteil mit Anstößen: Oberseite längs gebürstet, Flanken senkrecht gebürstet, Kanten als polierte Fase
  const deckel = stahlGebuerstet(true, 1 / 22);
  const mitte = new THREE.ExtrudeGeometry(gehaeuseUmriss(R, L, Y), { depth: Z1 - Z0 - 2 * F, bevelEnabled: true, bevelThickness: F, bevelSize: F, bevelOffset: -F, bevelSegments: 5, curveSegments: 96 });
  mitte.translate(0, 0, Z0 + F);
  uhr.add(new THREE.Mesh(mitte, [deckel, flanke]));
  // Boden
  uhr.add(dreh([[0, -5.3], [R * .78, -5.3], [R * .86, -5.05], [R * .93, -4.6]], brushed, 120));

  // Lünette: flach, kreisförmig satiniert, mit polierter Außen- und Innenfase
  uhr.add(dreh([[R + .1, Z1 - .05], [R + .05, Z1 + .45], [R - .45, Z1 + .95]], polished));
  uhr.add(dreh([[R - .45, Z1 + .95], [R * .875, Z1 + 1.05]], brushed));
  uhr.add(dreh([[R * .875, Z1 + 1.05], [R * .84, Z1 + .7], [R * .815, Z1 - .2]], polished));

  // Zifferblatt
  const dialMat = () => new THREE.MeshPhysicalMaterial({ metalness: .28, roughness: .34, clearcoat: .55, clearcoatRoughness: .12 });
  const zb = new THREE.Mesh(new THREE.CircleGeometry(R * .8, 128), dialMat());
  zb.material.map = dialTex(zifferblatt, schrift);
  zb.position.z = 1.2;
  const zb2 = new THREE.Mesh(zb.geometry, dialMat());           // Überblend-Ebene für weiche Farbwechsel
  Object.assign(zb2.material, { transparent: true, depthWrite: false });
  const uT = { value: 0 };
  zb2.material.onBeforeCompile = sh => {
    sh.uniforms.uT = uT;
    sh.fragmentShader = "uniform float uT;\n" + sh.fragmentShader.replace("#include <map_fragment>",
      "#include <map_fragment>\n float rr = length(vMapUv - .5) * 2.;\n diffuseColor.a *= 1. - smoothstep(uT * 1.1 - .06, uT * 1.1, rr);");
  };
  zb2.userData.uT = uT;
  zb2.position.z = 1.21; zb2.visible = false;
  uhr.add(zb, zb2);
  // Rehaut: schräger Ring zwischen Zifferblatt und Glas
  uhr.add(dreh([[R * .8, 1.2], [R * .818, 2.4]], new THREE.MeshPhysicalMaterial({ color: "#7d8288", metalness: .9, roughness: .4, side: THREE.DoubleSide }), 160));

  // Indexe: facettiert, poliert, mit Leuchtmasse
  const indexe = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    if (i === 3) continue;                         // Datum bei 3 Uhr
    const a = (i / 12) * Math.PI * 2, doppelt = i === 0;
    (doppelt ? [-.95, .95] : [0]).forEach(dx => {
      const ix = new THREE.Group();
      const len = R * .2;
      const metall = block(1.15, len, .35, polished, .28);
      const lume = new THREE.Mesh(new THREE.BoxGeometry(.42, len * .74, .2), leucht());
      lume.position.z = .38;
      ix.add(metall, lume);
      const rr = R * .62;
      ix.position.set(Math.sin(a) * rr + Math.cos(a) * dx, Math.cos(a) * rr - Math.sin(a) * dx, 1.55);
      ix.rotation.z = -a;
      indexe.add(ix);
    });
  }
  uhr.add(indexe);

  // Zeiger
  function zeiger(laenge, breite, z) {
    const g = new THREE.Group();
    // zwei leicht geneigte Hälften ergeben einen polierten Grat in der Mitte
    [-1, 1].forEach(seite => {
      const h = new THREE.Shape();
      h.moveTo(0, -laenge * .14); h.lineTo(seite * breite / 2, -laenge * .14); h.lineTo(seite * breite * .45, laenge * .92); h.lineTo(0, laenge); h.closePath();
      const geo = new THREE.ExtrudeGeometry(h, { depth: .2, bevelEnabled: true, bevelThickness: .06, bevelSize: .05, bevelSegments: 2 });
      const m = new THREE.Mesh(geo, polished);
      m.rotation.y = seite * -.3;
      g.add(m);
    });
    const lume = new THREE.Mesh(new THREE.BoxGeometry(breite * .3, laenge * .58, .16), leucht());
    lume.position.set(0, laenge * .48, .36);
    g.add(lume);
    g.position.z = z;
    return g;
  }
  const hStd = zeiger(R * .5, 1.8, 2.25), hMin = zeiger(R * .74, 1.4, 2.8);
  const hSek = new THREE.Group();
  const nadel = new THREE.Mesh(new THREE.BoxGeometry(.24, R * .9, .12), polished);
  nadel.position.y = R * .3;
  const gegen = new THREE.Mesh(new THREE.CylinderGeometry(.65, .65, .25, 24), polished); gegen.rotation.x = Math.PI / 2; gegen.position.y = -R * .1;
  hSek.add(nadel, gegen); hSek.position.z = 3.15;
  const kappe = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 1.1, 32), polished); kappe.rotation.x = Math.PI / 2; kappe.position.z = 2.9;
  uhr.add(hStd, hMin, hSek, kappe);

  // Saphirglas
  const glas = new THREE.Mesh(new THREE.CylinderGeometry(R * .82, R * .82, .6, 128), new THREE.MeshPhysicalMaterial({
    color: "#ffffff", transparent: true, opacity: .08, roughness: 0, clearcoat: 1, depthWrite: false, envMapIntensity: 1.6,
    iridescence: .3, iridescenceIOR: 1.3, iridescenceThicknessRange: [300, 420]
  }));
  glas.rotation.x = Math.PI / 2; glas.position.z = 3.2;
  uhr.add(glas);
  const rc = document.createElement("canvas"); rc.width = rc.height = 512;
  const rg2 = rc.getContext("2d"), lg = rg2.createLinearGradient(0, 0, 512, 512);
  lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(.3, "rgba(255,255,255,.0)"); lg.addColorStop(.38, "rgba(255,255,255,.5)");
  lg.addColorStop(.47, "rgba(255,255,255,.07)"); lg.addColorStop(.62, "rgba(255,255,255,0)"); lg.addColorStop(1, "rgba(255,255,255,0)");
  rg2.fillStyle = lg; rg2.beginPath(); rg2.arc(256, 256, 256, 0, Math.PI * 2); rg2.fill();
  const reflexTex = new THREE.CanvasTexture(rc); reflexTex.colorSpace = THREE.SRGBColorSpace;
  const reflex = new THREE.Mesh(new THREE.CircleGeometry(R * .82, 96), new THREE.MeshBasicMaterial({ map: reflexTex, transparent: true, opacity: .26, depthWrite: false, blending: THREE.AdditiveBlending }));
  reflex.position.z = 3.52;
  uhr.add(reflex);

  // Verschraubte Krone mit Rändelung bei 3 Uhr
  const kroneGeo = new THREE.CylinderGeometry(2.5, 2.5, 3.0, 72, 1);
  const kp = kroneGeo.attributes.position;
  for (let i = 0; i < kp.count; i++) {
    const x = kp.getX(i), z = kp.getZ(i), r = Math.hypot(x, z);
    if (r > 2.4) { const a = Math.atan2(z, x), k = Math.round((a / (Math.PI * 2)) * 72); const f = k % 2 ? .9 : 1; kp.setX(i, x * f); kp.setZ(i, z * f); }
  }
  kroneGeo.computeVertexNormals();
  const krone = new THREE.Mesh(kroneGeo, polished);
  krone.rotation.z = Math.PI / 2; krone.position.set(R + 2.0, 0, -1.0);
  const kroneKopf = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.45, .5, 64), polished);
  kroneKopf.rotation.z = Math.PI / 2; kroneKopf.position.set(R + 3.75, 0, -1.0);
  const kroneHals = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.4, 32), brushed);
  kroneHals.rotation.z = Math.PI / 2; kroneHals.position.set(R + .5, 0, -1.0);
  uhr.add(krone, kroneKopf, kroneHals);
  // Kronenschutz, aus dem Gehäuse herausgezogen
  [-1, 1].forEach(s => {
    const k = block(2.4, 2.6, 5.2, flanke, .6);
    k.position.set(R + 1.2, s * 3.75, -1.0);
    uhr.add(k);
  });

  // Integriertes H-Glieder-Armband: gebürstete Außenglieder, polierte Mittelglieder, fugendicht
  const band = new THREE.Group();
  const laengs = stahlGebuerstet(true, 1 / 8);
  const mittelPoliert = new THREE.MeshPhysicalMaterial({ color: "#e2e4e7", metalness: 1, roughness: .13 });
  const BR = 26, glieder = 13, teil = 5.2, dick = 2.5, fuge = .14;
  [-1, 1].forEach(seite => {
    for (let i = 0; i < glieder; i++) {
      const g = new THREE.Group();
      const breite = bw * (1 - i * .012);
      const a1 = glied(breite * .37, teil - fuge, dick, laengs), a2 = a1.clone();
      a1.position.x = -breite * .315; a2.position.x = breite * .315;
      const m = glied(breite * .23 - fuge, teil - fuge, dick - .1, mittelPoliert, .3);
      m.position.set(0, teil * .5, 0);
      g.add(a1, a2, m);
      const s0 = (i + .5) * teil, gerade = 4;                 // erst gerade, dann zur Schließe gebogen
      const th = Math.max(0, s0 - gerade) / BR;
      const yy = Y + Math.min(s0, gerade) + BR * Math.sin(th), zz = Z1 - dick / 2 - .15 - BR * (1 - Math.cos(th));
      g.position.set(0, seite * yy, zz);
      g.rotation.x = -seite * th;
      if (seite < 0) g.rotation.z = Math.PI;
      band.add(g);
    }
  });
  uhr.add(band);

  uhr.userData = { hStd, hMin, hSek, zb, zb2, schrift, R };
  setzeZeit(uhr, new Date());
  return uhr;
}

export function setzeZeit(uhr, d) {
  const { hStd, hMin, hSek } = uhr.userData;
  const s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
  hStd.rotation.z = -h / 12 * Math.PI * 2;
  hMin.rotation.z = -m / 60 * Math.PI * 2;
  hSek.rotation.z = -s / 60 * Math.PI * 2;
}

export function setzeZifferblatt(uhr, name) { mischeZifferblatt(uhr, name, name, 0); }

/* Weicher Übergang: Zifferblatt a, darüber b mit Deckkraft t (0…1) */
export function mischeZifferblatt(uhr, a, b, t) {
  const { zb, zb2, schrift } = uhr.userData;
  const ta = dialTex(a, schrift), tb = dialTex(b, schrift);
  if (zb.material.map !== ta) { zb.material.map = ta; zb.material.needsUpdate = true; }
  if (zb2.material.map !== tb) { zb2.material.map = tb; zb2.material.needsUpdate = true; }
  zb2.userData.uT.value = t;
  zb2.visible = t > .002 && a !== b;
}

/* ---------- Studio-Umgebung mit Softboxen ---------- */
function studio(renderer) {
  const s = new THREE.Scene();
  const box = (w, h, x, y, z, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  // Raum mit weichem Verlauf statt reinem Schwarz
  const raum = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "varying vec3 p; void main(){ float t = p.y * .5 + .5; vec3 c = mix(vec3(.025,.027,.03), vec3(.3,.31,.33), smoothstep(.35,1.,t)); gl_FragColor = vec4(c,1.); }"
  }));
  s.add(raum);
  box(18, 1.6, 0, 10, 3, 9);      // schmales Oberlicht
  box(1.1, 16, -11, 1, 3, 7);     // Streifen links
  box(1.1, 16, 11, 1, 1, 4);      // Streifen rechts
  box(4, 10, 6, 3, 10, 2.2);      // Softbox vorne rechts
  box(.8, 12, -4, 0, 12, 3);      // Kante vorne links
  box(14, 1.4, 0, -8, 6, .9);     // Aufheller unten
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(s, .03).texture;
}

export function erstelleBuehne(canvas, { hintergrund = "#0E0F11", dpr = Math.min(window.devicePixelRatio || 1, 2), transparent = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  if (!transparent) scene.background = new THREE.Color(hintergrund);
  scene.environment = studio(renderer);
  const key = new THREE.DirectionalLight("#ffffff", 1.6); key.position.set(-40, 80, 90); scene.add(key);
  const rim = new THREE.DirectionalLight("#ffffff", .8); rim.position.set(60, -20, -40); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 5000);
  function groesse(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  return { THREE, renderer, scene, camera, groesse };
}
