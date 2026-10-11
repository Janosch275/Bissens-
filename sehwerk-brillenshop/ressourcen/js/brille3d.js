/* Sehwerk – prozedurale 3D-Brillen (three.js, lokal eingebunden)
   Einheiten: Millimeter. Vorderseite der Fassung liegt in der XY-Ebene, Bügel zeigen nach -Z. */
import * as THREE from "../vendor/three.module.min.js";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";

/* ---------- Modelle ---------- */
export const MODELLE = {
  kant:   { w: 52, h: 37, nTop: 5.2, nBot: 3.2, rim: 3.8, depth: 5.4, bridge: 18, mat: "acetat" },
  ilse:   { w: 48, h: 44, nTop: 2.5, nBot: 2.15, rim: 3.4, depth: 5.0, bridge: 20, mat: "acetat", panto: .1 },
  otto:   { w: 51, h: 42, nTop: 4.4, nBot: 3.2, rim: 4.6, depth: 6.0, bridge: 19, mat: "acetat" },
  mila:   { w: 53, h: 39, nTop: 3.0, nBot: 2.5, rim: 4.0, depth: 5.5, bridge: 17, mat: "acetat", cat: .26 },
  bruno:  { w: 47, h: 45, nTop: 2.15, nBot: 2.05, rim: 1.1, depth: 1.6, bridge: 21, mat: "metall" },
  frieda: { w: 55, h: 47, nTop: 4.2, nBot: 3.0, rim: 4.4, depth: 5.6, bridge: 17, mat: "acetat" }
};

export const FARBEN = {
  "schwarz-matt": { typ: "opak", farbe: "#141414", rauheit: .55, klarlack: .2 },
  "schwarz":      { typ: "opak", farbe: "#0d0d0d", rauheit: .18, klarlack: 1 },
  "havanna":      { typ: "schildpatt", basis: "#6b3a12", flecken: "#2a1407", hell: "#b8732a" },
  "honig":        { typ: "transparent", farbe: "#a8641f", tint: .6 },
  "kristall":     { typ: "transparent", farbe: "#e9eef0", tint: .08 },
  "rauchgrau":    { typ: "transparent", farbe: "#55595e", tint: .6 },
  "flaschengruen":{ typ: "transparent", farbe: "#1f4a3a", tint: .8 },
  "bordeaux":     { typ: "transparent", farbe: "#5e1622", tint: .8 },
  "rose":         { typ: "transparent", farbe: "#c99189", tint: .5 },
  "gold":         { typ: "metall", farbe: "#c9a560" },
  "silber":       { typ: "metall", farbe: "#c8ccd0" }
};

/* ---------- Glasform ---------- */
function glasPunkte(m, extra = 0, seite = 1, n = 96) {
  const a = m.w / 2 + extra, b = m.h / 2 + extra, pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    const ne = s >= 0 ? m.nTop : m.nBot;
    let x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / ne);
    let y = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / ne);
    const xn = x / a, yn = y / b;
    if (m.panto) x *= 1 + m.panto * yn * .5;                 // oben etwas breiter
    if (m.cat && xn * seite > 0 && yn > 0) y += m.cat * b * Math.pow(xn * seite, 2.2) * Math.pow(yn, 1.5) * 1.3;   // Cat-Eye: außen oben hochgezogen
    if (yn < 0) y *= 1 - .06 * Math.pow(Math.abs(xn), 2);   // unten leicht weicher
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

/* ---------- Materialien ---------- */
function schildpattTextur(f) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = f.basis; g.fillRect(0, 0, 1024, 1024);
  let seed = 11;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.filter = "blur(14px)";
  for (let i = 0; i < 70; i++) {
    g.fillStyle = r() > .45 ? f.flecken : f.hell;
    g.globalAlpha = .35 + r() * .55;
    g.beginPath();
    g.ellipse(r() * 1024, r() * 1024, 20 + r() * 90, 10 + r() * 50, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  g.filter = "blur(4px)";
  for (let i = 0; i < 120; i++) {
    g.fillStyle = f.flecken; g.globalAlpha = .4 + r() * .5;
    g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 4 + r() * 16, 3 + r() * 10, r() * 3, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 70, 1 / 70);
  return t;
}

function fassungsMaterial(name) {
  const f = FARBEN[name];
  if (f.typ === "metall") return new THREE.MeshPhysicalMaterial({ color: f.farbe, metalness: 1, roughness: .22, clearcoat: .3 });
  if (f.typ === "schildpatt") return new THREE.MeshPhysicalMaterial({ map: schildpattTextur(f), roughness: .2, clearcoat: 1, clearcoatRoughness: .08 });
  if (f.typ === "transparent") return new THREE.MeshPhysicalMaterial({
    color: f.farbe, roughness: .08, clearcoat: 1, clearcoatRoughness: .04, transparent: true, opacity: .42 + f.tint * .5,
    envMapIntensity: 1.2, side: THREE.DoubleSide
  });
  return new THREE.MeshPhysicalMaterial({ color: f.farbe, roughness: f.rauheit, clearcoat: f.klarlack, clearcoatRoughness: .2 });
}

function glasMaterial() {
  // Klares Glas mit leichter Blaulicht-Entspiegelung (bläulicher Reflex)
  return new THREE.MeshPhysicalMaterial({
    color: "#fff8e8", roughness: 0, metalness: 0, transparent: true, opacity: .16, depthWrite: false,
    specularColor: new THREE.Color("#9fc0ff"), specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0,
    iridescence: .8, iridescenceIOR: 1.3, iridescenceThicknessRange: [300, 450], envMapIntensity: 2.2
  });
}
const metallTeile = () => new THREE.MeshPhysicalMaterial({ color: "#b9bcc0", metalness: 1, roughness: .25 });

/* ---------- Geometrie ---------- */
function biege(geo, k) {                       // leichte Wölbung der Glasfläche
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, p.getZ(i) - k * (x * x + y * y));
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
}

function acetatRand(m, seite, mat) {
  const outer = new THREE.Shape(glasPunkte(m, m.rim, seite));
  outer.holes.push(new THREE.Path(glasPunkte(m, 0, seite).reverse()));
  const geo = new THREE.ExtrudeGeometry(outer, { depth: m.depth - 1.6, bevelEnabled: true, bevelThickness: .8, bevelSize: .9, bevelSegments: 4, curveSegments: 48 });
  geo.translate(0, 0, -(m.depth - 1.6) / 2);
  return new THREE.Mesh(geo, mat);
}

function metallRand(m, seite, mat) {
  const pts = glasPunkte(m, m.rim * .5, seite, 120).map(p => new THREE.Vector3(p.x, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 240, m.rim * .7, 16, true), mat);
}

export function baueBrille(modellName, farbName) {
  const m = MODELLE[modellName];
  const mat = fassungsMaterial(farbName);
  const glas = glasMaterial();
  const gruppe = new THREE.Group();
  const front = new THREE.Group();
  gruppe.add(front);
  const off = m.bridge / 2 + m.w / 2;          // Abstand Glasmitte zur Mitte
  const metall = m.mat === "metall";

  [-1, 1].forEach(seite => {
    const rand = metall ? metallRand(m, seite, mat) : acetatRand(m, seite, mat);
    rand.position.x = seite * off;
    rand.castShadow = true;
    front.add(rand);

    const lg = new THREE.ShapeGeometry(new THREE.Shape(glasPunkte(m, metall ? .2 : .9, seite)), 48);
    biege(lg, .0016);
    const linse = new THREE.Mesh(lg, glas);
    linse.position.set(seite * off, 0, metall ? 0 : .4);
    linse.renderOrder = 2;
    front.add(linse);
  });

  /* Steg */
  const by = m.h * .2, hw = metall ? m.bridge / 2 + 1 : m.bridge / 2 - m.rim + 2.2;
  if (metall) {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-hw, by, 0), new THREE.Vector3(-hw * .5, by + 4.5, 0), new THREE.Vector3(0, by + 5.6, 0),
      new THREE.Vector3(hw * .5, by + 4.5, 0), new THREE.Vector3(hw, by, 0)
    ]);
    front.add(new THREE.Mesh(new THREE.TubeGeometry(c, 60, m.rim * .65, 12), mat));
    // Nasenpads
    [-1, 1].forEach(s => {
      const pad = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshPhysicalMaterial({ color: "#ffffff", transmission: .9, roughness: .15, thickness: 2 }));
      pad.scale.set(3, 5.5, 1.4);
      pad.position.set(s * (m.bridge / 2 - 1.5), -6, -6);
      pad.rotation.y = s * .5;
      front.add(pad);
    });
  } else {
    const sh = new THREE.Shape();
    const top = by + 4.2, bot = by - 2.4;
    sh.moveTo(-hw, bot);
    for (let i = 0; i <= 24; i++) { const x = -hw + 2 * hw * i / 24; sh.lineTo(x, top + .8 * (1 - Math.pow(x / hw, 2))); }
    for (let i = 24; i >= 0; i--) { const x = -hw + 2 * hw * i / 24; sh.lineTo(x, bot + 3.4 * (1 - Math.pow(x / hw, 2))); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: m.depth - 1.6, bevelEnabled: true, bevelThickness: .8, bevelSize: .7, bevelSegments: 3 });
    g.translate(0, 0, -(m.depth - 1.6) / 2);
    const steg = new THREE.Mesh(g, mat); steg.castShadow = true;
    front.add(steg);
  }

  /* Backen + Bügel mit Scharnier */
  const bx = off + m.w / 2 + m.rim * (metall ? .4 : .6);
  const bh = m.h * .3;
  const buegel = [];
  [-1, 1].forEach(seite => {
    const bs = new THREE.Shape(), bw = metall ? 2.2 : 4.2, bhh = metall ? 2.2 : 6.6, r = bw * .45;
    bs.moveTo(-bw / 2 + r, -bhh / 2); bs.lineTo(bw / 2 - r, -bhh / 2); bs.quadraticCurveTo(bw / 2, -bhh / 2, bw / 2, -bhh / 2 + r);
    bs.lineTo(bw / 2, bhh / 2 - r); bs.quadraticCurveTo(bw / 2, bhh / 2, bw / 2 - r, bhh / 2); bs.lineTo(-bw / 2 + r, bhh / 2);
    bs.quadraticCurveTo(-bw / 2, bhh / 2, -bw / 2, bhh / 2 - r); bs.lineTo(-bw / 2, -bhh / 2 + r); bs.quadraticCurveTo(-bw / 2, -bhh / 2, -bw / 2 + r, -bhh / 2);
    const bg = new THREE.ExtrudeGeometry(bs, { depth: m.depth + 3, bevelEnabled: true, bevelThickness: .6, bevelSize: .5, bevelSegments: 3 });
    bg.rotateY(Math.PI / 2); bg.translate(-(m.depth + 3) / 2, 0, 0); bg.rotateY(-Math.PI / 2);
    const backe = new THREE.Mesh(bg, mat);
    backe.position.set(seite * (bx - (metall ? 0 : 1.6)), bh, -(m.depth / 2 + 1.2));
    backe.castShadow = true;
    front.add(backe);
    if (!metall) {                                       // Zierniete vorne
      const niet = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .6, 20), metallTeile());
      niet.rotation.x = Math.PI / 2;
      niet.position.set(seite * (bx - 1.6), bh, m.depth / 2 + .7);
      front.add(niet);
    }

    const scharnier = new THREE.Group();
    scharnier.position.set(seite * bx, bh, -(m.depth + 2.2));
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 5, 20), metallTeile());
    scharnier.add(hinge);

    // Bügel: Seitenprofil (Z nach hinten, Y nach oben), dann um die Y-Achse ausgerichtet
    const len = 138, prof = new THREE.Shape();
    const dick = metall ? 1.6 : 4.8;
    prof.moveTo(0, dick / 2);
    prof.lineTo(-len * .72, dick * .42);
    prof.quadraticCurveTo(-len * .9, dick * .3, -len, -16);
    prof.lineTo(-len + 2.5, -17.5);
    prof.quadraticCurveTo(-len * .88, -dick * .2, -len * .72, -dick * .42);
    prof.lineTo(0, -dick / 2);
    prof.closePath();
    const tg = new THREE.ExtrudeGeometry(prof, { depth: metall ? 1.2 : 2.4, bevelEnabled: true, bevelThickness: .5, bevelSize: .5, bevelSegments: 3, curveSegments: 24 });
    tg.translate(0, 0, -(metall ? .6 : 1.2));
    const arm = new THREE.Mesh(tg, mat);
    arm.rotation.y = -Math.PI / 2;                       // Profil zeigt nach -Z
    arm.castShadow = true;
    const armHalter = new THREE.Group();
    armHalter.add(arm);
    if (metall) {                                        // Bügelenden aus Acetat
      const tip = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 34, 6, 12), new THREE.MeshPhysicalMaterial({ color: "#2a1d14", roughness: .3, clearcoat: 1 }));
      tip.rotation.x = Math.PI / 2 - .55; tip.position.set(0, -9, -len + 14);
      armHalter.add(tip);
    }
    scharnier.add(armHalter);
    scharnier.userData.seite = seite;
    front.add(scharnier);
    buegel.push(scharnier);
  });

  gruppe.userData = { buegel, modell: m, front };
  setzeBuegel(gruppe, 1);
  return gruppe;
}

/* Bügel öffnen (1) oder schließen (0) */
export function setzeBuegel(brille, offen) {
  brille.userData.buegel.forEach(s => {
    const zu = s.userData.seite * (Math.PI / 2 - .12);
    s.rotation.y = zu * (1 - offen) - s.userData.seite * .06 * offen;
    s.rotation.x = .05 * offen;
  });
}

/* ---------- Bühne ---------- */
export function erstelleBuehne(canvas, { transparent = false, hintergrund = "#ECE8E1", schatten = true, dpr = Math.min(window.devicePixelRatio, 2) } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = schatten;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  if (!transparent) scene.background = new THREE.Color(hintergrund);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .8;

  const camera = new THREE.PerspectiveCamera(24, 1, 1, 30000);

  const key = new THREE.DirectionalLight("#ffffff", 2.2);
  key.position.set(60, 220, 120);
  key.castShadow = schatten;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 14; key.shadow.blurSamples = 20; key.shadow.bias = -.0004;
  const sc = key.shadow.camera; sc.left = -700; sc.right = 700; sc.top = 700; sc.bottom = -700; sc.near = 10; sc.far = 1500;
  scene.add(key);
  scene.add(new THREE.HemisphereLight("#ffffff", "#d8d2c8", .5));

  const boden = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.ShadowMaterial({ opacity: .16 }));
  boden.rotation.x = -Math.PI / 2;
  boden.receiveShadow = true;
  scene.add(boden);

  function groesse(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  return { THREE, renderer, scene, camera, boden, key, groesse };
}
