// Persistenz in localStorage. Alles bleibt auf dem Gerät, kein Konto nötig.
import { FOODS } from './foods.js';

const KEY = 'bissen:v1';

export const MEALS = [
  { id: 'breakfast', label: 'Frühstück' },
  { id: 'lunch', label: 'Mittagessen' },
  { id: 'dinner', label: 'Abendessen' },
  { id: 'snack', label: 'Snacks' },
];

const DEFAULT = () => ({
  version: 1,
  onboarded: false,
  profile: { sex: 'w', age: 30, height: 170, weight: 70, activity: 'light', goal: 'keep' },
  goals: { kcal: 2000, p: 120, c: 220, f: 65, fib: 30, water: 2500 },
  days: {},       // 'YYYY-MM-DD' -> { entries: [], water: 0 }
  weights: {},    // 'YYYY-MM-DD' -> kg
  customFoods: [], // eigene + per Barcode/online gefundene Lebensmittel
  favorites: [],  // foodIds
  templates: [],  // gespeicherte Mahlzeiten { id, name, items: [{foodId, name, grams, ...nährwerte}] }
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT(), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Konnte Daten nicht laden', e);
  }
  return DEFAULT();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Konnte Daten nicht speichern', e);
  }
}

export function getState() {
  return state;
}

export function update(fn) {
  fn(state);
  persist();
  listeners.forEach((l) => l(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function replaceState(next) {
  state = { ...DEFAULT(), ...next };
  persist();
  listeners.forEach((l) => l(state));
}

export function resetAll() {
  replaceState(DEFAULT());
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftKey(key, days) {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function getDay(key) {
  return state.days[key] || { entries: [], water: 0 };
}

export function ensureDay(s, key) {
  if (!s.days[key]) s.days[key] = { entries: [], water: 0 };
  return s.days[key];
}

export function allFoods() {
  return [...state.customFoods, ...FOODS];
}

export function findFood(id) {
  return allFoods().find((f) => f.id === id) || null;
}

export function mealForTime(d = new Date()) {
  const h = d.getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h >= 17 && h < 22) return 'dinner';
  return 'snack';
}

// Häufig gegessene Lebensmittel der letzten 30 Tage mit zuletzt genutzter Menge.
export function frequentFoods(limit = 12) {
  const today = dateKey();
  const stats = new Map();
  for (let i = 0; i < 30; i++) {
    const day = state.days[shiftKey(today, -i)];
    if (!day) continue;
    for (const e of day.entries) {
      const s = stats.get(e.foodId) || { count: 0, last: null };
      s.count += 1 + (30 - i) / 30; // jüngere Einträge zählen etwas mehr
      if (!s.last || e.t > s.last.t) s.last = e;
      stats.set(e.foodId, s);
    }
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((s) => s.last);
}

// Aufeinanderfolgende Tage mit mindestens einem Eintrag (heute darf noch leer sein).
export function streak() {
  let key = dateKey();
  if (!getDay(key).entries.length) key = shiftKey(key, -1);
  let n = 0;
  while (getDay(key).entries.length) {
    n++;
    key = shiftKey(key, -1);
  }
  return n;
}
