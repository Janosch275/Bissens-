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
  gunmetal: { name: "Gunmetal",     farbe: "#4a4e55", metall: 1, rau: .32 },
  schwarz:  { name: "Schwarz matt", farbe: "#1c1d1f", metall: .4, rau: .62 },
  bronze:   { name: "Bronze",       farbe: "#8a6a3c", metall: 1, rau: .34 }
};
export const SATTEL = { rot: "#d7261e", gelb: "#e8b51f", schwarz: "#1b1b1d", blau: "#1f4fd1" };

const V = (x, y) => new THREE.Vector2(x, y);

/* ---------- Texturen ---------- */
function reifenTextur(schrift) {
  // Lathe-UV: x = Umfang, y = Profilpunkt. Die Punkte sind so gelegt, dass y-Bereiche bekannt sind.
  const W = 4096, H = 512, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#1a1a1b"; g.fillRect(0, 0, W, H);
  // Lauffläche (y 0.38–0.62): Profilblöcke
  const t0 = H * .37, t1 = H * .63;
  g.fillStyle = "#0b0b0c";
  for (let i = 0; i < 96; i++) {
    const x = (i / 96) * W;
    g.save(); g.translate(x, 0);
    g.fillRect(0, t0, 6, (t1 - t0) * .42);                        // Querrillen schräg versetzt
    g.fillRect(16, t0 + (t1 - t0) * .58, 6, (t1 - t0) * .42);
    g.restore();
  }
  [.3, .5, .7].forEach(f => g.fillRect(0, t0 + (t1 - t0) * f - 5, W, 10));   // Längsrillen
  // Flankenbeschriftung (vordere Flanke: y 0.72–0.9)
  g.fillStyle = "#9a9a9c";
  g.font = "700 30px " + schrift; g.textBaseline = "middle";
  const yF = H * .8;
  ["KURVE SPORT", "245/35 ZR19 93Y", "KURVE SPORT", "245/35 ZR19 93Y"].forEach((t, i) => g.fillText(t, (i / 4) * W + 120, yF));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
function reifenRelief() {
  const W = 4096, H = 512, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#808080"; g.fillRect(0, 0, W, H);
  const t0 = H * .37, t1 = H * .63;
  g.fillStyle = "#000";
  for (let i = 0; i < 96; i++) {
    const x = (i / 96) * W;
    g.fillRect(x, t0, 6, (t1 - t0) * .42);
    g.fillRect(x + 16, t0 + (t1 - t0) * .58, 6, (t1 - t0) * .42);
  }
  [.3, .5, .7].forEach(f => g.fillRect(0, t0 + (t1 - t0) * f - 5, W, 10));
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
function scheibenTextur() {
  const S = 1024, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d"), m = S / 2;
  g.fillStyle = "#7d8186"; g.fillRect(0, 0, S, S);
  g.save(); g.translate(m, m);
  for (let i = 0; i < 2400; i++) {                                   // Drehriefen
    const r = m * (.48 + Math.random() * .52);
    g.strokeStyle = "rgba(" + (Math.random() > .5 ? "255,255,255" : "0,0,0") + "," + (.04 + Math.random() * .06) + ")";
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
  }
  g.fillStyle = "#151517";                                           // Bohrungen
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    [.66, .78, .9].forEach((rr, k) => {
      const aa = a + k * .07;
      g.beginPath(); g.arc(Math.cos(aa) * m * rr, Math.sin(aa) * m * rr, S * .011, 0, Math.PI * 2); g.fill();
    });
  }
  g.fillStyle = "#3a3d42"; g.beginPath(); g.arc(0, 0, m * .48, 0, Math.PI * 2); g.fill();   // Topf
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function nabenTextur(schrift) {
  const S = 512, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = "#16171a"; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#cfd2d6"; g.lineWidth = 10; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 22, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#e9e9e6"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "italic 800 230px " + schrift;
  g.fillText("K", S / 2 + 6, S / 2 + 10);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Speichen ---------- */
function speiche(innen, aussen, bInnen, bAussen, tiefe, kurve = 0) {
  const s = new THREE.Shape();
  s.moveTo(innen, -bInnen / 2);
  s.quadraticCurveTo((innen + aussen) / 2, -bInnen / 2 + kurve, aussen, -bAussen / 2 + kurve);
  s.lineTo(aussen, bAussen / 2 + kurve);
  s.quadraticCurveTo((innen + aussen) / 2, bInnen / 2 + kurve, innen, bInnen / 2);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: tiefe, bevelEnabled: true, bevelThickness: .5, bevelSize: .45, bevelSegments: 4, curveSegments: 20 });
  g.translate(0, 0, -tiefe / 2);
  return g;
}

/* ---------- Felgenfront: eine konkave Gussfläche mit Fenstern ---------- */
const R_IN = 8.2, R_OUT = 22.9, R_FACE = 24.1;
function speichenDef(felge) {
  const L = [];
  if (felge === "stern") {            // 5 Y-Doppelspeichen: Paar läuft nach außen auseinander
    for (let i = 0; i < 5; i++) {
      const c = (i / 5) * Math.PI * 2;
      [-1, 1].forEach(sd => L.push({ c, spreiz: sd * .17, w0: 1.9, w1: 1.35, twist: 0 }));
    }
  } else if (felge === "turbine") {   // 14 schmale, geschwungene Speichen
    for (let i = 0; i < 14; i++) L.push({ c: (i / 14) * Math.PI * 2, spreiz: 0, w0: 1.45, w1: 1.05, twist: .42 });
  } else {                            // Monza: 5 breite Speichen
    for (let i = 0; i < 5; i++) L.push({ c: (i / 5) * Math.PI * 2, spreiz: 0, w0: 4.2, w1: 3.0, twist: 0 });
  }
  return L;
}
function kante(sp, r, seite) {         // Winkel der Speichenkante bei Radius r
  const t = (r - R_IN) / (R_OUT - R_IN);
  const mitte = sp.c + sp.spreiz * Math.pow(t, .8) + sp.twist * t * t;
  const hw = sp.w0 + (sp.w1 - sp.w0) * t;
  return mitte + seite * hw / r;
}
const zTop = r => 4.6 + 5.2 * Math.pow(Math.min(1, Math.max(0, (r - 6) / (R_OUT - 6))), 1.6);

/* Speiche als glatter Körper: gewölbter Querschnitt entlang des Radius */
function speicheMesh(sp, mat, dick) {
  const ringe = 56, prof = [];
  for (let k = 0; k <= 16; k++) { const u = -1 + 2 * k / 16; prof.push([u * .96, 1 - .22 * Math.pow(Math.abs(u), 2.6)]); }   // gewölbte Oberseite
  prof.push([1, .62], [1, .1], [.85, 0], [-.85, 0], [-1, .1], [-1, .62]);                                // Wände + Boden
  const pos = [], idx = [], n = prof.length;
  for (let i = 0; i <= ringe; i++) {
    const r = (R_IN - 2.5) + (R_OUT + 1.2 - (R_IN - 2.5)) * i / ringe;
    const t = Math.min(1, Math.max(0, (r - R_IN) / (R_OUT - R_IN)));
    const mitte = sp.c + sp.spreiz * Math.pow(t, .8) + sp.twist * t * t;
    const hw = sp.w0 + (sp.w1 - sp.w0) * t;
    prof.forEach(([u, h]) => {
      const w = mitte + u * hw / r, z = zTop(r) - dick + h * dick;
      pos.push(Math.cos(w) * r, Math.sin(w) * r, z);
    });
  }
  for (let i = 0; i < ringe; i++) for (let k = 0; k < n; k++) {
    const a = i * n + k, b = i * n + (k + 1) % n, c = (i + 1) * n + k, d = (i + 1) * n + (k + 1) % n;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function felgenFront(felge, mat) {
  const grp = new THREE.Group();
  const dick = felge === "monza" ? 3.2 : 2.9;
  speichenDef(felge).forEach(sp => grp.add(speicheMesh(sp, mat, dick)));
  // massive Nabe mit Kragen
  const nabe = new THREE.Mesh(new THREE.LatheGeometry([
    V(3.1, 3.4), V(3.3, 4.6), V(4, 5.0), V(R_IN + .4, zTop(R_IN + .4) + .1), V(R_IN + 1.6, zTop(R_IN + 1.6) - .7), V(R_IN + 1.4, 1.2)
  ], 160), mat);
  nabe.rotation.x = Math.PI / 2;
  grp.add(nabe);
  // Felgenhorn: Speichen laufen in einen umlaufenden Ring
  const horn = new THREE.Mesh(new THREE.LatheGeometry([
    V(R_OUT - .6, zTop(R_OUT) - 3.4), V(R_OUT - .9, zTop(R_OUT) - .5), V(R_OUT - .2, zTop(R_OUT) + .15), V(R_FACE, zTop(R_OUT) + .25), V(R_FACE + .2, zTop(R_OUT) - 1.5)
  ], 200), mat);
  horn.rotation.x = Math.PI / 2;
  grp.add(horn);
  return grp;
}

/* ---------- Rad bauen ---------- */
export function baueRad({ felge = "stern", finish = "gunmetal", sattel = "rot", schrift = "sans-serif" } = {}) {
  const rad = new THREE.Group();
  const f = FINISH[finish];
  const felgenMat = new THREE.MeshPhysicalMaterial({ color: f.farbe, metalness: f.metall, roughness: f.rau, clearcoat: .6, clearcoatRoughness: .2 });
  const lippenMat = new THREE.MeshPhysicalMaterial({ color: "#d9dce0", metalness: 1, roughness: .12 });
  const gummi = new THREE.MeshPhysicalMaterial({ map: reifenTextur(schrift), bumpMap: reifenRelief(), bumpScale: 2.2, roughness: .86, sheen: .3, sheenColor: new THREE.Color("#3a3a3c") });

  /* Reifen (Drehprofil um die Achse) */
  const reifenGruppe = new THREE.Group();
  const prof = [
    V(24.6, -11), V(26, -11.6), V(29, -12.1), V(31.6, -11.7), V(33, -10.6),                 // hintere Flanke
    V(33.5, -8.5), V(33.6, -4), V(33.6, 0), V(33.6, 4), V(33.5, 8.5),                       // Lauffläche
    V(33, 10.6), V(31.6, 11.7), V(29, 12.1), V(26, 11.6), V(24.6, 11)                       // vordere Flanke
  ];
  const reifen = new THREE.Mesh(new THREE.LatheGeometry(prof, 220), gummi);
  reifen.rotation.x = -Math.PI / 2;
  reifenGruppe.add(reifen);
  rad.add(reifenGruppe);

  /* Felge */
  const felgenGruppe = new THREE.Group();
  const bett = new THREE.Mesh(new THREE.LatheGeometry([V(24.4, -10.5), V(22.4, -9.5), V(21.6, -6), V(21.6, 6), V(22.6, 8.4), V(24.2, 9.4)], 160), new THREE.MeshPhysicalMaterial({ color: "#3d4045", metalness: 1, roughness: .45, side: THREE.DoubleSide }));
  bett.rotation.x = Math.PI / 2;
  felgenGruppe.add(bett);
  const lippe = new THREE.Mesh(new THREE.TorusGeometry(24.2, .55, 18, 200), lippenMat);
  lippe.position.z = zTop(R_OUT) + .1;
  felgenGruppe.add(lippe);

  const front = felgenFront(felge, felgenMat);
  felgenGruppe.add(front);

  // Nabe, Radmuttern, Nabendeckel
  const nabe = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 7.0, 1.6, 64), felgenMat);
  nabe.rotation.x = Math.PI / 2; nabe.position.z = 4.2;
  felgenGruppe.add(nabe);
  const mutterMat = new THREE.MeshPhysicalMaterial({ color: "#b8bcc1", metalness: 1, roughness: .2 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
    const mu = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, 1.6, 6), mutterMat);
    mu.rotation.x = Math.PI / 2; mu.position.set(Math.cos(a) * 4.7, Math.sin(a) * 4.7, 5.2);
    felgenGruppe.add(mu);
  }
  const deckel = new THREE.Mesh(new THREE.CircleGeometry(2.9, 64), new THREE.MeshPhysicalMaterial({ map: nabenTextur(schrift), metalness: .6, roughness: .3, clearcoat: 1 }));
  deckel.position.z = 5.15;
  felgenGruppe.add(deckel);
  rad.add(felgenGruppe);

  /* Bremsscheibe */
  const scheibenGruppe = new THREE.Group();
  const scheibe = new THREE.Mesh(new THREE.CylinderGeometry(18.5, 18.5, 3.2, 128), [
    new THREE.MeshPhysicalMaterial({ color: "#55585d", metalness: 1, roughness: .5 }),
    new THREE.MeshPhysicalMaterial({ map: scheibenTextur(), metalness: .85, roughness: .38 }),
    new THREE.MeshPhysicalMaterial({ map: scheibenTextur(), metalness: .85, roughness: .38 })
  ]);
  scheibe.rotation.x = Math.PI / 2; scheibe.position.z = -2;
  scheibenGruppe.add(scheibe);
  rad.add(scheibenGruppe);

  /* Bremssattel (dreht nicht mit) */
  const sattelGruppe = new THREE.Group();
  const s = new THREE.Shape(), a0 = -.62, a1 = .62, ri = 13.2, ra = 20.6;
  s.absarc(0, 0, ra, a0, a1, false);
  s.absarc(0, 0, ri, a1, a0, true);
  const sattelGeo = new THREE.ExtrudeGeometry(s, { depth: 6.4, bevelEnabled: true, bevelThickness: 1.1, bevelSize: 1.1, bevelSegments: 6, curveSegments: 40 });
  sattelGeo.translate(0, 0, -3.2 - 2);
  const sattelMat = new THREE.MeshPhysicalMaterial({ color: SATTEL[sattel], roughness: .25, clearcoat: 1, clearcoatRoughness: .1 });
  const sattelMesh = new THREE.Mesh(sattelGeo, sattelMat);
  sattelGruppe.add(sattelMesh);
  // Schriftzug auf dem Sattel
  const sc = document.createElement("canvas"); sc.width = 512; sc.height = 128;
  const sg = sc.getContext("2d"); sg.fillStyle = "#fff"; sg.font = "italic 800 92px " + schrift; sg.textAlign = "center"; sg.textBaseline = "middle"; sg.fillText("KURVE", 256, 68);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), new THREE.MeshBasicMaterial({ map: st, transparent: true }));
  label.position.set(17, 0, 2.35); label.rotation.z = Math.PI / 2;
  sattelGruppe.add(label);
  sattelGruppe.rotation.z = Math.PI * .22;
  rad.add(sattelGruppe);

  rad.userData = { reifenGruppe, felgenGruppe, scheibenGruppe, sattelGruppe, felgenMat, sattelMat };
  return rad;
}

/* Drehung und Explosionsansicht (0 = montiert, 1 = zerlegt) */
export function setzeRad(rad, { drehung = 0, explosion = 0 } = {}) {
  const { reifenGruppe, felgenGruppe, scheibenGruppe, sattelGruppe } = rad.userData;
  reifenGruppe.rotation.z = felgenGruppe.rotation.z = scheibenGruppe.rotation.z = drehung;
  felgenGruppe.position.z = explosion * 26;
  reifenGruppe.position.z = explosion * 4;
  reifenGruppe.scale.setScalar(1 + explosion * .06);
  scheibenGruppe.position.z = explosion * -24;
  sattelGruppe.position.set(explosion * 12, explosion * 10, explosion * -40);
}

export function setzeFinish(rad, name) {
  const f = FINISH[name], m = rad.userData.felgenMat;
  m.color.set(f.farbe); m.metalness = f.metall; m.roughness = f.rau;
}
export function setzeSattel(rad, name) { rad.userData.sattelMat.color.set(SATTEL[name]); }

/* ---------- Bühne ---------- */
function studio(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "varying vec3 p; void main(){ float t = p.y * .5 + .5; vec3 c = mix(vec3(.16,.16,.17), vec3(.92,.92,.9), smoothstep(.2,1.,t)); gl_FragColor = vec4(c,1.); }"
  })));
  const box = (w, h, x, y, z, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  box(30, 4, 0, 14, 4, 3);
  box(2, 22, -15, 2, 6, 2.6);
  box(2, 22, 15, 2, 2, 1.8);
  box(8, 8, 8, 6, 14, 1);
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(s, .03).texture;
}

export function erstelleBuehne(canvas, { dpr = Math.min(window.devicePixelRatio || 1, 1.75), hintergrund = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !hintergrund, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  if (hintergrund) scene.background = new THREE.Color(hintergrund);
  scene.environment = studio(renderer);
  const key = new THREE.DirectionalLight("#ffffff", 1.4); key.position.set(-60, 120, 100); scene.add(key);
  const camera = new THREE.PerspectiveCamera(24, 1, 1, 5000);
  function groesse(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  return { THREE, renderer, scene, camera, groesse };
}
