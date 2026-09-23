// Open Food Facts: freie Produktdatenbank für Barcodes und Markenprodukte.
const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_de,brands,nutriments,serving_quantity,quantity';

function toFood(p) {
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n['energy_100g'] != null) kcal = n['energy_100g'] / 4.184; // kJ -> kcal
  if (kcal == null) return null;
  const name = (p.product_name_de || p.product_name || '').trim();
  if (!name) return null;
  const brand = (p.brands || '').split(',')[0].trim();
  const serving = parseFloat(p.serving_quantity);
  return {
    id: 'off:' + p.code,
    name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} · ${brand}` : name,
    kcal: Math.round(kcal),
    p: +(n.proteins_100g || 0).toFixed(1),
    c: +(n.carbohydrates_100g || 0).toFixed(1),
    f: +(n.fat_100g || 0).toFixed(1),
    fib: +(n.fiber_100g || 0).toFixed(1),
    portion: serving > 0 ? { g: Math.round(serving), label: 'Portion' } : null,
    aliases: [],
    source: 'off',
  };
}

export async function lookupBarcode(code) {
  const res = await fetch(`${BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`);
  if (!res.ok) throw new Error('Produkt nicht gefunden');
  const data = await res.json();
  if (data.status !== 1 || !data.product) throw new Error('Produkt nicht gefunden');
  const food = toFood({ ...data.product, code });
  if (!food) throw new Error('Keine Nährwerte hinterlegt');
  return food;
}

export async function searchOnline(query) {
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Suche fehlgeschlagen');
  const data = await res.json();
  return (data.products || []).map(toFood).filter(Boolean);
}

// Kamera-Scan über die native BarcodeDetector-API (Chrome/Android, neuere Safari-Versionen).
export function barcodeSupported() {
  return 'BarcodeDetector' in window && navigator.mediaDevices?.getUserMedia;
}

export async function startScanner(video, onCode) {
  const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  video.srcObject = stream;
  await video.play();
  let stopped = false;
  const stop = () => {
    stopped = true;
    stream.getTracks().forEach((t) => t.stop());
  };
  const tick = async () => {
    if (stopped) return;
    try {
      const codes = await detector.detect(video);
      if (codes.length) {
        stop();
        onCode(codes[0].rawValue);
        return;
      }
    } catch { /* Frame noch nicht bereit */ }
    setTimeout(tick, 250);
  };
  tick();
  return stop;
}
