// Reine Logik ohne DOM: Suche, Texteingabe-Parser, Nährwertberechnung, Ziele, Vorschläge.

export const MACROS = ['kcal', 'p', 'c', 'f', 'fib'];

export function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[()%.,\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Grobe deutsche Pluralformen abschneiden, damit "Eier"/"Bananen"/"Tomaten" treffen.
function stem(w) {
  return w.replace(/(en|er|n|e|s)$/, '');
}

function scoreCandidate(q, cand) {
  if (cand === q) return 100;
  if (cand.startsWith(q + ' ') || cand.startsWith(q)) return 80 - Math.min(20, cand.length - q.length);
  const qs = stem(q);
  if (qs.length >= 2 && stem(cand) === qs) return 90;
  const words = cand.split(' ');
  if (words.some((w) => w === q || (qs.length >= 3 && stem(w) === qs))) return 70;
  if (words.some((w) => w.startsWith(q))) return 55;
  if (q.length >= 3 && cand.includes(q)) return 40;
  // Alle Suchwörter müssen irgendwo vorkommen.
  const qWords = q.split(' ');
  if (qWords.length > 1 && qWords.every((qw) => cand.includes(stem(qw)))) return 35;
  return 0;
}

export function searchFoods(query, foods, limit = 20) {
  const q = normalize(query);
  if (!q) return [];
  const scored = [];
  for (const food of foods) {
    let best = scoreCandidate(q, normalize(food.name));
    for (const a of food.aliases || []) best = Math.max(best, scoreCandidate(q, normalize(a)) - 2);
    if (best > 0) scored.push([best, food]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1].name.length - b[1].name.length);
  return scored.slice(0, limit).map(([, f]) => f);
}

const WORD_NUMBERS = {
  ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, drei: 3, vier: 4, fuenf: 5, fünf: 5,
  halb: 0.5, halbe: 0.5, halben: 0.5, '½': 0.5, '¼': 0.25, '¾': 0.75,
};

// Einheit -> Umrechnung. 'portion' bedeutet: Portionsgröße des Lebensmittels verwenden.
const UNITS = [
  [/^(g|gr|gramm)$/, { g: 1 }],
  [/^(ml)$/, { g: 1 }],
  [/^(kg|kilo)$/, { g: 1000 }],
  [/^(l|liter)$/, { g: 1000 }],
  [/^(el|essloeffel)$/, { spoon: 15 }],
  [/^(tl|teeloeffel)$/, { spoon: 5 }],
  [/^(stueck|stk|x|scheiben?|portionen?|becher|glas|glaeser|tassen?|dosen?|handvoll|riegel|scoops?|filets?|kugeln?|flaschen?|schalen?)$/, { portion: true }],
];

const QTY_RE = '(\\d+(?:[.,]\\d+)?|½|¼|¾|ein|eine|einen|einem|zwei|drei|vier|fünf|halbe?n?)';
const UNIT_RE = '(kg|kilo|gramm|gr|g|ml|liter|l|el|tl|esslöffel|teelöffel|stück|stk|x|scheiben?|portionen?|becher|glas|gläser|tassen?|dosen?|handvoll|riegel|scoops?|filets?|kugeln?|flaschen?|schalen?)';
const LEAD = new RegExp(`^${QTY_RE}\\s*${UNIT_RE}?(?=\\s|$)\\.?\\s*(.*)$`, 'i');
const TRAIL = new RegExp(`^(.*?)\\s+${QTY_RE}\\s*${UNIT_RE}?\\.?$`, 'i');

function parseQty(s) {
  const k = s.toLowerCase();
  if (k in WORD_NUMBERS) return WORD_NUMBERS[k];
  return parseFloat(k.replace(',', '.'));
}

function resolveUnit(unit) {
  if (!unit) return null;
  const u = normalize(unit);
  for (const [re, conv] of UNITS) if (re.test(u)) return conv;
  return null;
}

export function gramsFor(food, qty, unit) {
  const conv = resolveUnit(unit);
  const portionG = food.portion ? food.portion.g : 100;
  if (qty == null || Number.isNaN(qty)) return portionG;
  if (!conv) {
    // Ohne Einheit: kleine Zahlen sind Stückzahlen ("2 Eier"), große sind Gramm ("150 Reis").
    return food.portion && qty <= 20 ? qty * portionG : qty;
  }
  if (conv.g) return qty * conv.g;
  if (conv.spoon) return qty * (food.portion && food.portion.label === 'EL' && conv.spoon === 15 ? food.portion.g : conv.spoon);
  return qty * portionG;
}

// Zerlegt z.B. "200g Hähnchen, 2 Eier und 1 Banane" in einzelne Posten.
export function parseQuickAdd(text, foods) {
  const parts = String(text)
    .split(/(?<!\d),|,(?!\d)|[;\n+]|\s+und\s+|\s+&\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const items = [];
  const unmatched = [];
  for (const part of parts) {
    let qty = null;
    let unit = null;
    let name = part;
    let m = part.match(LEAD);
    if (m && m[3]) {
      qty = parseQty(m[1]);
      unit = m[2] || null;
      name = m[3];
    } else if ((m = part.match(TRAIL)) && m[1]) {
      name = m[1];
      qty = parseQty(m[2]);
      unit = m[3] || null;
    }
    name = name.replace(/^(an|von|vom|der|die|das)\s+/i, '').trim();
    const food = searchFoods(name, foods, 1)[0];
    if (!food) {
      unmatched.push(part);
      continue;
    }
    const grams = Math.round(gramsFor(food, qty, unit));
    items.push({ food, grams, source: part });
  }
  return { items, unmatched };
}

const r1 = (n) => Math.round(n * 10) / 10;

export function nutrientsFor(food, grams) {
  const k = grams / 100;
  return {
    kcal: Math.round(food.kcal * k),
    p: r1(food.p * k),
    c: r1(food.c * k),
    f: r1(food.f * k),
    fib: r1((food.fib || 0) * k),
  };
}

export function sumEntries(entries) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0 };
  for (const e of entries) for (const m of MACROS) t[m] += e[m] || 0;
  for (const m of MACROS) t[m] = m === 'kcal' ? Math.round(t[m]) : r1(t[m]);
  return t;
}

export const ACTIVITY = {
  low: { factor: 1.2, label: 'Wenig Bewegung (Bürojob)' },
  light: { factor: 1.375, label: 'Leicht aktiv (1–2× Sport/Woche)' },
  medium: { factor: 1.55, label: 'Aktiv (3–5× Sport/Woche)' },
  high: { factor: 1.725, label: 'Sehr aktiv (täglich Sport)' },
};

export const GOALS = {
  lose: { delta: -450, proteinPerKg: 2.0, label: 'Abnehmen' },
  keep: { delta: 0, proteinPerKg: 1.6, label: 'Gewicht halten' },
  gain: { delta: 300, proteinPerKg: 1.8, label: 'Muskeln aufbauen' },
};

// Mifflin-St-Jeor-Grundumsatz × Aktivitätsfaktor, danach Makros verteilen.
export function calcGoals({ sex, age, height, weight, activity, goal }) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
  const tdee = bmr * (ACTIVITY[activity] || ACTIVITY.light).factor;
  const g = GOALS[goal] || GOALS.keep;
  const kcal = Math.round((tdee + g.delta) / 10) * 10;
  const p = Math.round(weight * g.proteinPerKg);
  const f = Math.round((kcal * 0.28) / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  const water = Math.round((weight * 35) / 250) * 250;
  return { kcal, p, c, f, fib: 30, water };
}

// Vorschläge, die in das verbleibende Tagesbudget passen.
// Fehlt noch Eiweiß, werden eiweißreiche Lebensmittel bevorzugt, sonst sättigende, kalorienarme.
export function suggestFoods(remaining, foods, limit = 4) {
  const remK = remaining.kcal;
  if (remK < 60) return [];
  const needProtein = remaining.p > 8;
  const out = [];
  for (const food of foods) {
    if (!food.portion || food.kcal < 15 || /roh/.test(food.name)) continue;
    const maxG = (remK / food.kcal) * 100;
    let grams = Math.min(food.portion.g, maxG);
    grams = Math.floor(grams / 5) * 5;
    if (grams < food.portion.g * 0.5) continue;
    const n = nutrientsFor(food, grams);
    let score;
    if (needProtein) {
      const covered = Math.min(n.p, remaining.p) / remaining.p;
      score = (food.p * 4) / food.kcal + covered * 0.5;
    } else {
      score = (food.fib + food.p * 0.5) / food.kcal;
    }
    out.push({ food, grams, n, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

// Eiweiß pro 100 kcal, als schneller Qualitätsindikator in der Suche.
export function proteinDensity(food) {
  return food.kcal ? r1((food.p / food.kcal) * 100) : 0;
}
