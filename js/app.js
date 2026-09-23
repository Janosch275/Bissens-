import {
  getState, update, subscribe, replaceState, resetAll, uid, dateKey, parseKey, shiftKey,
  getDay, ensureDay, allFoods, findFood, mealForTime, frequentFoods, streak, MEALS,
} from './store.js';
import {
  parseQuickAdd, searchFoods, nutrientsFor, sumEntries, calcGoals, suggestFoods,
  proteinDensity, ACTIVITY, GOALS,
} from './nutrition.js';
import { lookupBarcode, searchOnline, barcodeSupported, startScanner } from './off.js';

// ---------- Hilfsfunktionen ----------

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const n0 = (v) => nf0.format(Math.round(v || 0));
const n1 = (v) => nf1.format(v || 0);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const ICON = {
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20V11M10 20V5M15 20v-7M20 20V9"/></svg>',
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 12"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"/></svg>',
  barcode: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7V5h3M20 7V5h-3M4 17v2h3M20 17v2h-3M8 9v6M11 9v6M14 9v6M17 9v6"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z"/></svg>',
  starFull: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
};

const MACRO_META = [
  { key: 'p', label: 'Eiweiß', color: 'var(--protein)' },
  { key: 'c', label: 'Kohlenhydrate', color: 'var(--carbs)' },
  { key: 'f', label: 'Fett', color: 'var(--fat)' },
  { key: 'fib', label: 'Ballaststoffe', color: 'var(--fiber)' },
];

const ui = { tab: 'today', date: dateKey() };

function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-undo>Rückgängig</button>' : ''}`;
  el.classList.add('show');
  clearTimeout(toast.t);
  if (undo) el.querySelector('[data-undo]').onclick = () => { undo(); el.classList.remove('show'); };
  toast.t = setTimeout(() => el.classList.remove('show'), 3200);
}

function haptic() {
  if (navigator.vibrate) navigator.vibrate(8);
}

function dayLabel(key) {
  const today = dateKey();
  if (key === today) return 'Heute';
  if (key === shiftKey(today, -1)) return 'Gestern';
  return parseKey(key).toLocaleDateString('de-DE', { weekday: 'long' });
}

// ---------- Einträge ----------

function makeEntry(food, grams, meal) {
  return { id: uid(), foodId: food.id, name: food.name, grams, meal, t: Date.now(), ...nutrientsFor(food, grams) };
}

function addEntries(list, dateK = ui.date) {
  update((s) => {
    const day = ensureDay(s, dateK);
    day.entries.push(...list);
  });
  haptic();
  const ids = list.map((e) => e.id);
  const kcal = list.reduce((a, e) => a + e.kcal, 0);
  toast(list.length === 1 ? `${list[0].name} · ${n0(kcal)} kcal` : `${list.length} Einträge · ${n0(kcal)} kcal`, () => {
    update((s) => {
      const day = ensureDay(s, dateK);
      day.entries = day.entries.filter((e) => !ids.includes(e.id));
    });
  });
}

function rememberFood(food) {
  if (!food.id.startsWith('b:') && !getState().customFoods.some((f) => f.id === food.id)) {
    update((s) => s.customFoods.unshift(food));
  }
}

// ---------- Heute ----------

function ring(eaten, goal) {
  const r = 64;
  const c = 2 * Math.PI * r;
  const pct = goal ? eaten / goal : 0;
  const off = c * (1 - clamp01(pct));
  const left = goal - eaten;
  return `
    <div class="ring ${left < 0 ? 'over' : ''}">
      <svg viewBox="0 0 148 148">
        <circle class="track" cx="74" cy="74" r="${r}" fill="none" stroke-width="12"/>
        <circle class="bar" cx="74" cy="74" r="${r}" fill="none" stroke-width="12" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
      </svg>
      <div class="ring-center">
        <div class="v num">${n0(Math.abs(left))}</div>
        <div class="l">${left < 0 ? 'kcal zu viel' : 'kcal übrig'}</div>
      </div>
    </div>`;
}

function renderToday() {
  const s = getState();
  const g = s.goals;
  const day = getDay(ui.date);
  const tot = sumEntries(day.entries);
  const isToday = ui.date === dateKey();
  const st = streak();
  const d = parseKey(ui.date);

  const macros = MACRO_META.map((m) => `
    <div class="macro">
      <div class="macro-head"><span><span class="dot" style="background:${m.color}"></span>${m.label}</span>
        <span class="num"><b>${n0(tot[m.key])}</b> <span class="muted">/ ${n0(g[m.key])} g</span></span></div>
      <div class="track-line"><i style="width:${clamp01(tot[m.key] / (g[m.key] || 1)) * 100}%;background:${m.color}"></i></div>
    </div>`).join('');

  const glassCount = Math.min(16, Math.max(4, Math.round(g.water / 250)));
  const filled = Math.round(day.water / 250);
  const glasses = Array.from({ length: glassCount }, (_, i) =>
    `<button class="glass ${i < filled ? 'full' : ''}" data-act="water" data-n="${i + 1}" aria-label="${(i + 1) * 250} ml"></button>`).join('');

  // Vorschläge nur für heute und wenn schon etwas gegessen wurde.
  let suggestHtml = '';
  const remaining = { kcal: g.kcal - tot.kcal, p: g.p - tot.p };
  if (isToday && day.entries.length && remaining.kcal > 60) {
    const sugg = suggestFoods(remaining, allFoods().filter((f) => f.portion));
    const hint = remaining.p > 8
      ? `Noch <b>${n0(remaining.p)} g Eiweiß</b> bei ${n0(remaining.kcal)} kcal offen. Das passt rein:`
      : `Eiweißziel geschafft. Für die restlichen ${n0(remaining.kcal)} kcal sättigt das gut:`;
    if (sugg.length) {
      suggestHtml = `
        <div class="section-title"><span>Was passt noch?</span></div>
        <div class="card">
          <p class="suggest-hint">${hint}</p>
          <div class="chips-scroll">${sugg.map((x) => `
            <button class="sugg" data-act="openFood" data-food="${esc(x.food.id)}" data-grams="${x.grams}">
              <div class="n">${esc(x.food.name)}</div>
              <div class="m num">${n0(x.grams)} g · ${n0(x.n.kcal)} kcal</div>
              <div class="m num"><span class="p">+${n0(x.n.p)} g Eiweiß</span></div>
            </button>`).join('')}
          </div>
        </div>`;
    }
  }

  const yesterday = getDay(shiftKey(ui.date, -1));
  const mealsHtml = MEALS.map((meal) => {
    const entries = day.entries.filter((e) => e.meal === meal.id);
    const sum = sumEntries(entries);
    const prev = yesterday.entries.filter((e) => e.meal === meal.id);
    const body = entries.length
      ? entries.map((e) => `
        <button class="entry" data-act="editEntry" data-id="${e.id}">
          <div class="entry-main"><div class="name">${esc(e.name)}</div><div class="meta num">${n0(e.grams)} g · ${n1(e.p)} g Eiweiß</div></div>
          <div class="right"><div class="kc num">${n0(e.kcal)}</div><div class="meta">kcal</div></div>
        </button>`).join('')
      : `<div class="empty-meal">${prev.length
        ? `<button class="link-btn" data-act="copyYesterday" data-meal="${meal.id}">Wie gestern · ${n0(sumEntries(prev).kcal)} kcal</button>`
        : '<span>Noch nichts eingetragen</span>'}</div>`;
    return `
      <section class="card meal">
        <div class="meal-head">
          <h3>${meal.label}${entries.length ? `<span class="sum num">${n0(sum.kcal)} kcal · ${n0(sum.p)} g P</span>` : ''}</h3>
          <div class="meal-actions">
            ${entries.length ? `<button class="icon-btn" data-act="mealMenu" data-meal="${meal.id}" aria-label="Optionen">${ICON.more}</button>` : ''}
            <button class="icon-btn" data-act="add" data-meal="${meal.id}" aria-label="Hinzufügen">${ICON.plus}</button>
          </div>
        </div>
        ${body}
      </section>`;
  }).join('');

  return `
    <header class="top">
      <div class="date-title">
        <div class="big">${dayLabel(ui.date)}</div>
        <div class="sub">${d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}${st > 1 ? ` · ${st} Tage in Folge` : ''}</div>
      </div>
      <div class="date-nav">
        <button class="icon-btn" data-act="prevDay" aria-label="Vorheriger Tag">${ICON.left}</button>
        <button class="icon-btn" data-act="nextDay" aria-label="Nächster Tag" ${isToday ? 'disabled' : ''}>${ICON.right}</button>
      </div>
    </header>

    <section class="card hero">
      ${ring(tot.kcal, g.kcal)}
      <div class="hero-stats">
        <div><div class="k">Gegessen</div><div class="v num">${n0(tot.kcal)} kcal</div></div>
        <div><div class="k">Tagesziel</div><div class="v num">${n0(g.kcal)} kcal</div></div>
      </div>
    </section>

    <section class="card">${macros}</section>

    <section class="card">
      <div class="water-row">
        <div><b>Wasser</b> <span class="muted num">${n1(day.water / 1000)} / ${n1(g.water / 1000)} l</span></div>
        <button class="icon-btn" data-act="waterMinus" aria-label="Glas entfernen" ${day.water ? '' : 'disabled'}>${ICON.minus}</button>
      </div>
      <div class="glasses" style="grid-template-columns:repeat(${glassCount},1fr)">${glasses}</div>
    </section>

    ${suggestHtml}

    <div class="section-title"><span>Mahlzeiten</span></div>
    ${mealsHtml}
  `;
}

// ---------- Woche ----------

function renderWeek() {
  const s = getState();
  const g = s.goals;
  const today = dateKey();
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = shiftKey(today, i - 6);
    const tot = sumEntries(getDay(key).entries);
    return { key, tot, logged: getDay(key).entries.length > 0 };
  });
  const logged = days.filter((d) => d.logged);
  // Heute ist noch nicht vorbei und würde die Bilanz verzerren.
  const closed = logged.filter((d) => d.key !== today);
  const balance = closed.reduce((a, d) => a + (g.kcal - d.tot.kcal), 0);
  const avgK = logged.length ? logged.reduce((a, d) => a + d.tot.kcal, 0) / logged.length : 0;
  const avgP = logged.length ? logged.reduce((a, d) => a + d.tot.p, 0) / logged.length : 0;
  const pHit = logged.filter((d) => d.tot.p >= g.p * 0.9).length;

  const W = 340; const H = 170; const pad = 22;
  const maxV = Math.max(g.kcal * 1.25, ...days.map((d) => d.tot.kcal));
  const bw = (W - pad) / 7;
  const y = (v) => H - 24 - (v / maxV) * (H - 40);
  const bars = days.map((d, i) => {
    const x = pad / 2 + i * bw + bw * 0.22;
    const w = bw * 0.56;
    const top = y(d.tot.kcal);
    const over = d.tot.kcal > g.kcal * 1.05;
    const hitP = d.tot.p >= g.p * 0.9;
    return `
      <rect x="${x}" y="${top}" width="${w}" height="${Math.max(0, H - 24 - top)}" rx="6"
        fill="${d.logged ? (over ? 'var(--fat)' : 'var(--text)') : 'var(--surface-2)'}" opacity="${d.key === today ? 1 : 0.85}"/>
      <text x="${x + w / 2}" y="${H - 6}" text-anchor="middle" ${d.key === today ? 'style="fill:var(--text);font-weight:700"' : ''}>${parseKey(d.key).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}</text>
      ${hitP ? `<circle cx="${x + w / 2}" cy="${top - 8}" r="3.5" fill="var(--protein)"/>` : ''}`;
  }).join('');
  const goalY = y(g.kcal);

  const list = Array.from({ length: 14 }, (_, i) => shiftKey(today, -i))
    .filter((k) => getDay(k).entries.length)
    .map((k) => {
      const t = sumEntries(getDay(k).entries);
      const diff = t.kcal - g.kcal;
      return `<button class="row" data-act="gotoDay" data-date="${k}">
        <div class="row-main"><div class="t">${dayLabel(k)}, ${parseKey(k).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</div>
        <div class="s num">${n0(t.p)} g Eiweiß · ${n0(t.c)} g KH · ${n0(t.f)} g Fett</div></div>
        <div style="text-align:right"><div class="t num">${n0(t.kcal)}</div><div class="s num ${diff > 0 ? 'neg' : ''}">${diff > 0 ? '+' : ''}${n0(diff)}</div></div>
      </button>`;
    }).join('');

  return `
    <header class="top"><h1>Woche</h1>${streak() ? `<span class="pill">${streak()} Tage in Folge</span>` : ''}</header>

    <section class="card balance">
      <div class="muted small">Wochenbilanz · letzte 6 Tage ohne heute</div>
      <div class="v num ${balance >= 0 ? 'pos' : 'neg'}">${balance >= 0 ? '−' : '+'}${n0(Math.abs(balance))} kcal</div>
      <div class="muted small">${!closed.length ? 'Sobald ein Tag abgeschlossen ist, siehst du hier, wie viel Spielraum du hast.'
        : balance >= 0 ? `Du liegst unter deinem Ziel. Das ist Spielraum für ein Essen mit Freunden am Wochenende.`
          : `Du liegst über deinem Ziel. Mit ${n0(Math.abs(balance) / 3)} kcal weniger an 3 Tagen gleichst du das aus.`}</div>
    </section>

    <section class="card">
      <svg class="chart" viewBox="0 0 ${W} ${H}">
        <line x1="${pad / 2}" x2="${W - pad / 2}" y1="${goalY}" y2="${goalY}" stroke="var(--muted)" stroke-dasharray="3 4" stroke-width="1"/>
        <text x="${W - pad / 2}" y="${goalY - 5}" text-anchor="end">Ziel ${n0(g.kcal)}</text>
        ${bars}
      </svg>
      <div class="muted small" style="margin-top:8px"><span style="color:var(--protein)">●</span> Eiweißziel erreicht</div>
    </section>

    <div class="stat-grid">
      <div class="stat"><div class="k">Ø Kalorien</div><div class="v num">${n0(avgK)}</div><div class="d">kcal pro Tag</div></div>
      <div class="stat"><div class="k">Ø Eiweiß</div><div class="v num">${n0(avgP)} g</div><div class="d">Ziel ${n0(g.p)} g</div></div>
      <div class="stat"><div class="k">Eiweißziel</div><div class="v num">${pHit}/${logged.length || 0}</div><div class="d">Tage erreicht</div></div>
      <div class="stat"><div class="k">Getrackt</div><div class="v num">${logged.length}/7</div><div class="d">Tage</div></div>
    </div>

    ${list ? `<div class="section-title"><span>Letzte Tage</span></div><div class="list">${list}</div>` : ''}
  `;
}

// ---------- Gewicht ----------

function renderWeight() {
  const s = getState();
  const keys = Object.keys(s.weights).sort();
  const today = dateKey();
  const last = keys.length ? s.weights[keys[keys.length - 1]] : s.profile.weight;

  // Gleitender 7-Tage-Durchschnitt glättet Wasser-Schwankungen.
  const recent = keys.filter((k) => k >= shiftKey(today, -89));
  const avg = (k) => {
    const win = keys.filter((x) => x <= k && x > shiftKey(k, -7));
    return win.reduce((a, x) => a + s.weights[x], 0) / win.length;
  };
  let chart = '<p class="muted small" style="margin:0">Trage ein paar Tage dein Gewicht ein, dann erscheint hier dein Trend.</p>';
  let trendText = '';
  if (recent.length >= 2) {
    const W = 340; const H = 160; const pad = 26;
    const vals = recent.map((k) => s.weights[k]);
    const lo = Math.min(...vals) - 0.5; const hi = Math.max(...vals) + 0.5;
    const t0 = parseKey(recent[0]).getTime(); const t1 = Math.max(parseKey(recent[recent.length - 1]).getTime(), t0 + 1);
    const x = (k) => pad + ((parseKey(k).getTime() - t0) / (t1 - t0)) * (W - pad - 8);
    const y = (v) => 10 + (1 - (v - lo) / (hi - lo)) * (H - 34);
    const dots = recent.map((k) => `<circle cx="${x(k)}" cy="${y(s.weights[k])}" r="3" fill="var(--muted)" opacity="0.6"/>`).join('');
    const line = recent.map((k, i) => `${i ? 'L' : 'M'}${x(k).toFixed(1)},${y(avg(k)).toFixed(1)}`).join(' ');
    chart = `<svg class="chart" viewBox="0 0 ${W} ${H}">
      <text x="0" y="${y(hi - 0.5) + 4}">${n1(hi - 0.5)}</text><text x="0" y="${y(lo + 0.5) + 4}">${n1(lo + 0.5)}</text>
      ${dots}<path d="${line}" fill="none" stroke="var(--text)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${pad}" y="${H - 4}">${parseKey(recent[0]).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</text>
      <text x="${W - 8}" y="${H - 4}" text-anchor="end">${parseKey(recent[recent.length - 1]).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</text>
    </svg>`;
    const nowAvg = avg(recent[recent.length - 1]);
    const weekAgo = keys.filter((k) => k <= shiftKey(today, -7)).pop();
    if (weekAgo) {
      const diff = nowAvg - avg(weekAgo);
      trendText = `Trend: <b class="num">${diff > 0 ? '+' : ''}${n1(diff)} kg</b> in 7 Tagen`;
    } else {
      trendText = `Trend (7-Tage-Schnitt): <b class="num">${n1(nowAvg)} kg</b>`;
    }
  }

  const list = keys.slice(-10).reverse().map((k) => `
    <div class="row"><div class="row-main"><div class="t">${dayLabel(k)}, ${parseKey(k).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</div></div>
    <div class="t num">${n1(s.weights[k])} kg</div>
    <button class="icon-btn" data-act="delWeight" data-date="${k}" aria-label="Löschen">${ICON.close}</button></div>`).join('');

  return `
    <header class="top"><h1>Gewicht</h1></header>
    <section class="card">
      <label for="w-in">Gewicht heute</label>
      <div class="amount">
        <input id="w-in" type="number" inputmode="decimal" step="0.1" value="${s.weights[today] ?? last ?? ''}" />
        <span class="unit">kg</span>
      </div>
      <div style="margin-top:12px"><button class="btn" data-act="saveWeight">Speichern</button></div>
    </section>
    <section class="card">
      ${trendText ? `<p style="margin:0 0 12px">${trendText}</p>` : ''}
      ${chart}
    </section>
    ${list ? `<div class="section-title"><span>Einträge</span></div><div class="list">${list}</div>` : ''}
  `;
}

// ---------- Profil & Ziele ----------

function profileFields(p) {
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${esc(v.label)}</option>`).join('');
  return `
    <div class="grid2">
      <div><label>Geschlecht</label><select name="sex"><option value="w" ${p.sex === 'w' ? 'selected' : ''}>weiblich</option><option value="m" ${p.sex === 'm' ? 'selected' : ''}>männlich</option></select></div>
      <div><label>Alter</label><input name="age" type="number" inputmode="numeric" value="${p.age}"></div>
      <div><label>Größe (cm)</label><input name="height" type="number" inputmode="numeric" value="${p.height}"></div>
      <div><label>Gewicht (kg)</label><input name="weight" type="number" inputmode="decimal" step="0.1" value="${p.weight}"></div>
    </div>
    <div><label>Aktivität</label><select name="activity">${opt(ACTIVITY, p.activity)}</select></div>
    <div><label>Ziel</label><select name="goal">${opt(GOALS, p.goal)}</select></div>`;
}

function readProfile(root) {
  const v = (n) => root.querySelector(`[name="${n}"]`).value;
  return {
    sex: v('sex'), activity: v('activity'), goal: v('goal'),
    age: +v('age') || 30, height: +v('height') || 170, weight: +String(v('weight')).replace(',', '.') || 70,
  };
}

function renderProfile() {
  const s = getState();
  const g = s.goals;
  const gf = (k, l, unit) => `<div><label>${l} (${unit})</label><input data-goal="${k}" type="number" inputmode="numeric" value="${g[k]}"></div>`;
  return `
    <header class="top"><h1>Profil & Ziele</h1></header>
    <section class="card stack" id="profile-form">
      ${profileFields(s.profile)}
      <button class="btn" data-act="calcGoals">Ziele neu berechnen</button>
    </section>

    <div class="section-title"><span>Tagesziele</span><span style="text-transform:none;letter-spacing:0">anpassbar</span></div>
    <section class="card stack">
      <div class="grid2">
        ${gf('kcal', 'Kalorien', 'kcal')}${gf('p', 'Eiweiß', 'g')}
        ${gf('c', 'Kohlenhydrate', 'g')}${gf('f', 'Fett', 'g')}
        ${gf('fib', 'Ballaststoffe', 'g')}${gf('water', 'Wasser', 'ml')}
      </div>
      <p class="hint" style="margin:0">Änderungen werden sofort gespeichert.</p>
    </section>

    <div class="section-title"><span>Deine Daten</span></div>
    <section class="card stack">
      <p class="small muted" style="margin:0">Alles bleibt auf diesem Gerät, ohne Konto und ohne Cloud. Mit einem Backup nimmst du deine Daten auf ein neues Handy mit.</p>
      <div class="btn-row">
        <button class="btn secondary" data-act="export">Backup sichern</button>
        <button class="btn secondary" data-act="import">Backup laden</button>
      </div>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
      <button class="btn danger" data-act="reset">Alle Daten löschen</button>
    </section>

    <div class="section-title"><span>Als App installieren</span></div>
    <section class="card small">
      <p style="margin:0 0 8px"><b>iPhone:</b> In Safari auf <i>Teilen</i> tippen und dann <i>Zum Home-Bildschirm</i> wählen.</p>
      <p style="margin:0"><b>Android:</b> Im Chrome-Menü (⋮) auf <i>App installieren</i> tippen.</p>
    </section>
    <p class="muted small" style="text-align:center;margin-top:24px">Bissen · Produktdaten von Open Food Facts (ODbL)</p>
  `;
}

// ---------- Bottom Sheets ----------

let sheetCleanup = null;

function openSheet(title, html, mount) {
  closeSheet(true);
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.innerHTML = `
    <div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-close aria-label="Schließen">${ICON.close}</button></div>
    <div class="sheet-body">${html}</div>`;
  document.body.append(overlay, sheet);
  requestAnimationFrame(() => { overlay.classList.add('show'); sheet.classList.add('show'); });
  overlay.onclick = () => closeSheet();
  sheet.querySelector('[data-close]').onclick = () => closeSheet();
  sheetCleanup = mount ? mount(sheet) : null;
  return sheet;
}

function closeSheet(immediate) {
  if (typeof sheetCleanup === 'function') sheetCleanup();
  sheetCleanup = null;
  document.querySelectorAll('.overlay, .sheet').forEach((el) => {
    if (immediate) return el.remove();
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  });
}

function mealSeg(current) {
  return `<div class="seg" data-seg="meal">${MEALS.map((m) =>
    `<button data-meal="${m.id}" class="${m.id === current ? 'on' : ''}">${m.label}</button>`).join('')}</div>`;
}

function bindSeg(root, onChange) {
  const seg = root.querySelector('[data-seg]');
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onChange(b.dataset.meal);
  });
}

function foodRow(food, extra = '') {
  const pd = proteinDensity(food);
  return `<button class="row" data-food="${esc(food.id)}">
    <div class="row-main"><div class="t">${esc(food.name)}${pd >= 8 ? '<span class="badge">Eiweiß+</span>' : ''}</div>
    <div class="s num">${n0(food.kcal)} kcal · ${n1(food.p)} g Eiweiß / 100 g${extra}</div></div>
  </button>`;
}

// Hinzufügen: Schnelleingabe als Text, Suche, Häufiges, Vorlagen, Barcode.
function openAdd(meal = mealForTime()) {
  const state = { meal, online: [], parsed: null };
  const s = getState();
  const freq = frequentFoods(10);
  const favs = s.favorites.map(findFood).filter(Boolean);
  const templates = s.templates;

  const home = `
    <div class="btn-row" style="margin-top:14px">
      <button class="btn secondary" data-act-s="scan">${ICON.barcode} Barcode</button>
      <button class="btn secondary" data-act-s="custom">${ICON.pen} Eigenes</button>
    </div>
    ${templates.length ? `<div class="section-title"><span>Gespeicherte Mahlzeiten</span></div>
      <div class="list">${templates.map((t) => `
        <div class="row"><button class="row-main" style="text-align:left" data-template="${t.id}">
          <div class="t">${esc(t.name)}</div><div class="s num">${t.items.length} Posten · ${n0(sumEntries(t.items).kcal)} kcal · ${n0(sumEntries(t.items).p)} g Eiweiß</div></button>
          <button class="icon-btn" data-del-template="${t.id}" aria-label="Vorlage löschen">${ICON.close}</button></div>`).join('')}</div>` : ''}
    ${favs.length ? `<div class="section-title"><span>Favoriten</span></div><div class="list">${favs.map((f) => foodRow(f)).join('')}</div>` : ''}
    ${freq.length ? `<div class="section-title"><span>Häufig</span><span style="text-transform:none;letter-spacing:0">+ = letzte Menge</span></div>
      <div class="list">${freq.map((e) => `
        <div class="row"><button class="row-main" style="text-align:left" data-food="${esc(e.foodId)}" data-grams="${e.grams}">
          <div class="t">${esc(e.name)}</div><div class="s num">${n0(e.grams)} g · ${n0(e.kcal)} kcal · ${n1(e.p)} g Eiweiß</div></button>
          <button class="add-mini" data-quick="${esc(e.foodId)}" data-grams="${e.grams}" aria-label="Hinzufügen">${ICON.plus}</button></div>`).join('')}</div>`
      : `<p class="hint" style="margin-top:18px">Tipp: Schreib einfach, was du gegessen hast, zum Beispiel <i>„200 g Hähnchen, 150 g Reis und ein Apfel“</i>. Bissen erkennt Mengen und Lebensmittel automatisch.</p>`}
  `;

  openSheet('Hinzufügen', `
    ${mealSeg(meal)}
    <textarea class="quick-input" id="q" rows="1" placeholder="z. B. 2 Eier, 1 Toast und 1 Banane" autocomplete="off" enterkeyhint="done"></textarea>
    <div id="results">${home}</div>
  `, (sheet) => {
    const q = sheet.querySelector('#q');
    const results = sheet.querySelector('#results');
    bindSeg(sheet, (m) => { state.meal = m; });

    const renderResults = () => {
      const text = q.value.trim();
      q.style.height = 'auto';
      q.style.height = Math.min(q.scrollHeight, 140) + 'px';
      if (!text) { results.innerHTML = home; return; }
      const isSentence = /\d|,|;|\n|\s(und|&)\s|^(ein|eine|zwei|drei|halbe?)\s/i.test(text);
      let html = '';
      if (isSentence) {
        state.parsed = parseQuickAdd(text, allFoods());
        const { items, unmatched } = state.parsed;
        if (items.length) {
          const tot = sumEntries(items.map((i) => nutrientsFor(i.food, i.grams)));
          html += `<div class="section-title"><span>Erkannt</span><span class="num" style="text-transform:none;letter-spacing:0">${n0(tot.kcal)} kcal · ${n0(tot.p)} g Eiweiß</span></div>
            <div class="list">${items.map((i, idx) => {
              const n = nutrientsFor(i.food, i.grams);
              return `<button class="row" data-parsed="${idx}"><div class="row-main"><div class="t">${esc(i.food.name)}</div>
                <div class="s num">${n0(i.grams)} g · ${n1(n.p)} g Eiweiß</div></div><div class="t num">${n0(n.kcal)} kcal</div></button>`;
            }).join('')}</div>
            <div style="margin-top:12px"><button class="btn" data-act-s="addParsed">${items.length === 1 ? 'Hinzufügen' : `Alle ${items.length} hinzufügen`}</button></div>`;
        }
        if (unmatched.length) {
          html += `<p class="hint">Nicht gefunden: ${unmatched.map(esc).join(', ')}. Tipp: Suche nach dem Namen ohne Menge, auch online.</p>`;
        }
      } else {
        const local = searchFoods(text, allFoods(), 15);
        html += local.length ? `<div class="section-title"><span>Treffer</span></div><div class="list">${local.map((f) => foodRow(f)).join('')}</div>` : '';
      }
      const onlineTerm = isSentence ? (state.parsed?.unmatched[0] || '') : text;
      if (onlineTerm) {
        html += `<div class="section-title"><span>Markenprodukte</span></div>
          <div id="online">${state.online.length && state.onlineQuery === onlineTerm
            ? `<div class="list">${state.online.map((f) => foodRow(f)).join('')}</div>`
            : `<button class="btn secondary" data-act-s="online" data-term="${esc(onlineTerm)}">${ICON.globe} „${esc(onlineTerm)}“ online suchen</button>`}</div>`;
      }
      results.innerHTML = html || '<p class="hint">Nichts gefunden.</p>';
    };

    q.addEventListener('input', renderResults);
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (state.parsed?.items.length && results.querySelector('[data-act-s="addParsed"]')) addParsed();
      }
    });

    const addParsed = () => {
      const items = state.parsed.items;
      addEntries(items.map((i) => makeEntry(i.food, i.grams, state.meal)));
      closeSheet();
    };

    results.addEventListener('click', async (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.quick) {
        const food = findFood(t.dataset.quick);
        if (food) addEntries([makeEntry(food, +t.dataset.grams, state.meal)]);
        t.innerHTML = '✓';
        return;
      }
      if (t.dataset.food) {
        const food = findFood(t.dataset.food) || state.online.find((f) => f.id === t.dataset.food);
        if (food) openFood(food, { grams: t.dataset.grams ? +t.dataset.grams : undefined, meal: state.meal });
        return;
      }
      if (t.dataset.parsed != null) {
        const i = state.parsed.items[+t.dataset.parsed];
        openFood(i.food, { grams: i.grams, meal: state.meal });
        return;
      }
      if (t.dataset.template) {
        const tpl = getState().templates.find((x) => x.id === t.dataset.template);
        const list = tpl.items.map((it) => ({ ...it, id: uid(), meal: state.meal, t: Date.now() }));
        addEntries(list);
        closeSheet();
        return;
      }
      if (t.dataset.delTemplate) {
        update((s2) => { s2.templates = s2.templates.filter((x) => x.id !== t.dataset.delTemplate); });
        t.closest('.row').remove();
        return;
      }
      const act = t.dataset.actS;
      if (act === 'addParsed') addParsed();
      if (act === 'scan') openScan(state.meal);
      if (act === 'custom') openCustom(state.meal, q.value.trim());
      if (act === 'online') {
        const term = t.dataset.term;
        t.disabled = true;
        t.textContent = 'Suche läuft …';
        try {
          state.online = await searchOnline(term);
          state.onlineQuery = term;
          const box = results.querySelector('#online');
          if (box) box.innerHTML = state.online.length
            ? `<div class="list">${state.online.map((f) => foodRow(f)).join('')}</div>`
            : '<p class="hint">Keine Produkte gefunden.</p>';
        } catch {
          t.disabled = false;
          t.textContent = 'Keine Verbindung. Nochmal versuchen';
        }
      }
    });

    setTimeout(() => q.focus(), 320);
  });
}

// Detailansicht: Menge wählen, Nährwerte live, zu Mahlzeit hinzufügen oder Eintrag bearbeiten.
function openFood(food, { grams, meal = mealForTime(), entry } = {}) {
  let g = grams ?? entry?.grams ?? food.portion?.g ?? 100;
  let curMeal = entry?.meal ?? meal;
  const isFav = () => getState().favorites.includes(food.id);
  const chips = [];
  if (food.portion) {
    for (const k of [0.5, 1, 2]) chips.push([Math.round(food.portion.g * k), `${k === 0.5 ? '½' : k} ${food.portion.label}`]);
  }
  for (const k of [50, 100, 200]) if (!chips.some((c) => c[0] === k)) chips.push([k, `${k} g`]);

  openSheet(esc(food.name), `
    <div class="kcal-big"><div class="v num" id="d-kcal"></div><div class="l">kcal</div></div>
    <div class="nutri" id="d-nutri" style="margin:14px 0"></div>
    <div class="amount">
      <button class="stepper" data-step="-1" aria-label="Weniger">−</button>
      <input id="d-g" type="number" inputmode="decimal" value="${g}">
      <span class="unit">g</span>
      <button class="stepper" data-step="1" aria-label="Mehr">+</button>
    </div>
    <div class="seg" style="margin-top:12px">${chips.map(([v, l]) => `<button data-g="${v}">${l}</button>`).join('')}</div>
    ${mealSeg(curMeal).replace('data-seg="meal"', 'data-seg="meal" id="d-meal"')}
    <p class="hint num" style="margin:-4px 2px 16px">${n1(food.kcal)} kcal · ${n1(food.p)} g Eiweiß · ${n1(food.c)} g KH · ${n1(food.f)} g Fett pro 100 g · <b>${n1(proteinDensity(food))} g Eiweiß pro 100 kcal</b></p>
    <div class="stack">
      <button class="btn" data-d="save">${entry ? 'Speichern' : 'Hinzufügen'}</button>
      <div class="btn-row">
        <button class="btn secondary" data-d="fav">${isFav() ? ICON.starFull : ICON.star} Favorit</button>
        ${entry ? '<button class="btn secondary" data-d="del" style="color:var(--danger)">Löschen</button>'
          : '<button class="btn secondary" data-d="back">Zurück</button>'}
      </div>
    </div>
  `, (sheet) => {
    const input = sheet.querySelector('#d-g');
    const paint = () => {
      g = Math.max(0, parseFloat(String(input.value).replace(',', '.')) || 0);
      const n = nutrientsFor(food, g);
      sheet.querySelector('#d-kcal').textContent = n0(n.kcal);
      sheet.querySelector('#d-nutri').innerHTML = MACRO_META.map((m) =>
        `<div><div class="v num" style="color:${m.color}">${n1(n[m.key])}</div><div class="l">${m.label === 'Kohlenhydrate' ? 'Kohlenh.' : m.label === 'Ballaststoffe' ? 'Ballastst.' : m.label}</div></div>`).join('');
    };
    paint();
    input.addEventListener('input', paint);
    bindSeg(sheet, (m) => { curMeal = m; });
    sheet.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.g) { input.value = t.dataset.g; paint(); }
      if (t.dataset.step) {
        const step = food.portion && food.portion.g <= 60 ? food.portion.g : 10;
        input.value = Math.max(0, g + step * +t.dataset.step);
        paint();
      }
      const d = t.dataset.d;
      if (d === 'save') {
        if (!g) return;
        rememberFood(food);
        if (entry) {
          update((s) => {
            const day = ensureDay(s, ui.date);
            const i = day.entries.findIndex((x) => x.id === entry.id);
            if (i >= 0) day.entries[i] = { ...entry, grams: g, meal: curMeal, ...nutrientsFor(food, g) };
          });
          toast('Gespeichert');
        } else {
          addEntries([makeEntry(food, g, curMeal)]);
        }
        closeSheet();
      }
      if (d === 'del') {
        const dateK = ui.date;
        update((s) => { const day = ensureDay(s, dateK); day.entries = day.entries.filter((x) => x.id !== entry.id); });
        toast(`${entry.name} gelöscht`, () => update((s) => ensureDay(s, dateK).entries.push(entry)));
        closeSheet();
      }
      if (d === 'fav') {
        rememberFood(food);
        update((s) => {
          s.favorites = isFav() ? s.favorites.filter((x) => x !== food.id) : [food.id, ...s.favorites];
        });
        t.innerHTML = `${isFav() ? ICON.starFull : ICON.star} Favorit`;
      }
      if (d === 'back') openAdd(curMeal);
    });
  });
}

function entryFood(e) {
  // Falls das Lebensmittel nicht mehr existiert, aus dem Eintrag rekonstruieren.
  const f = findFood(e.foodId);
  if (f) return f;
  const k = 100 / (e.grams || 100);
  return { id: e.foodId, name: e.name, kcal: e.kcal * k, p: e.p * k, c: e.c * k, f: e.f * k, fib: (e.fib || 0) * k, portion: null, aliases: [] };
}

function openCustom(meal, prefill = '') {
  openSheet('Eigenes Lebensmittel', `
    <div class="stack" id="cf">
      <div><label>Name</label><input name="name" value="${esc(prefill.replace(/^[\d.,\s]+(g|ml)?\s*/i, ''))}" placeholder="z. B. Omas Linsensuppe"></div>
      <p class="hint" style="margin:0">Nährwerte pro 100 g (stehen auf der Verpackung)</p>
      <div class="grid2">
        <div><label>Kalorien (kcal)</label><input name="kcal" type="number" inputmode="decimal"></div>
        <div><label>Eiweiß (g)</label><input name="p" type="number" inputmode="decimal"></div>
        <div><label>Kohlenhydrate (g)</label><input name="c" type="number" inputmode="decimal"></div>
        <div><label>Fett (g)</label><input name="f" type="number" inputmode="decimal"></div>
        <div><label>Ballaststoffe (g)</label><input name="fib" type="number" inputmode="decimal"></div>
        <div><label>Portion (g, optional)</label><input name="portion" type="number" inputmode="decimal"></div>
      </div>
      <button class="btn" data-cf="save">Speichern & weiter</button>
    </div>`, (sheet) => {
    sheet.querySelector('[data-cf]').onclick = () => {
      const v = (n) => parseFloat(String(sheet.querySelector(`[name="${n}"]`).value).replace(',', '.')) || 0;
      const name = sheet.querySelector('[name="name"]').value.trim();
      if (!name) { sheet.querySelector('[name="name"]').focus(); return; }
      const portion = v('portion');
      const food = {
        id: 'u:' + uid(), name, kcal: v('kcal'), p: v('p'), c: v('c'), f: v('f'), fib: v('fib'),
        portion: portion ? { g: portion, label: 'Portion' } : null, aliases: [], source: 'user',
      };
      update((s) => s.customFoods.unshift(food));
      openFood(food, { meal });
    };
  });
}

function openScan(meal) {
  const supported = barcodeSupported();
  openSheet('Barcode scannen', `
    ${supported ? '<video class="scan" playsinline muted></video><p class="hint" id="scan-status">Halte den Barcode in die Kamera.</p>'
      : '<p class="hint" style="margin-top:0">Dein Browser unterstützt keinen Kamera-Scan. Gib die Nummer unter dem Barcode ein.</p>'}
    <div class="stack" style="margin-top:12px">
      <input id="ean" inputmode="numeric" placeholder="Barcode-Nummer, z. B. 4000400..." autocomplete="off">
      <button class="btn" data-scan="lookup">Produkt suchen</button>
    </div>`, (sheet) => {
    let stop = null;
    const status = (t) => { const el = sheet.querySelector('#scan-status') || sheet.querySelector('.hint'); if (el) el.textContent = t; };
    const lookup = async (code) => {
      status('Suche Produkt …');
      try {
        const food = await lookupBarcode(code.trim());
        rememberFood(food);
        openFood(food, { meal });
      } catch (err) {
        status(`${err.message || 'Fehler'}. Du kannst es als eigenes Lebensmittel anlegen.`);
      }
    };
    if (supported) {
      startScanner(sheet.querySelector('video'), (code) => {
        sheet.querySelector('#ean').value = code;
        lookup(code);
      }).then((s) => { stop = s; }).catch(() => status('Kein Kamerazugriff. Gib die Nummer manuell ein.'));
    }
    sheet.querySelector('[data-scan]').onclick = () => {
      const code = sheet.querySelector('#ean').value;
      if (code.trim()) lookup(code);
    };
    return () => stop && stop();
  });
}

function openMealMenu(mealId) {
  const meal = MEALS.find((m) => m.id === mealId);
  const entries = getDay(ui.date).entries.filter((e) => e.meal === mealId);
  openSheet(meal.label, `
    <div class="stack">
      <div><label>Als Vorlage speichern, um sie mit einem Tipp erneut einzutragen</label>
        <input id="tpl-name" value="${esc(meal.label)} (${entries.length} Posten)"></div>
      <button class="btn" data-mm="save">Vorlage speichern</button>
      <button class="btn secondary" data-mm="tomorrow">Auf morgen kopieren</button>
      <button class="btn danger" data-mm="clear">Alle Einträge löschen</button>
    </div>`, (sheet) => {
    sheet.addEventListener('click', (e) => {
      const a = e.target.closest('[data-mm]')?.dataset.mm;
      if (a === 'save') {
        const name = sheet.querySelector('#tpl-name').value.trim() || meal.label;
        const items = entries.map(({ id, t, meal: _m, ...rest }) => rest);
        update((s) => s.templates.unshift({ id: uid(), name, items }));
        toast('Vorlage gespeichert');
        closeSheet();
      }
      if (a === 'tomorrow') {
        const next = shiftKey(ui.date, 1);
        update((s) => ensureDay(s, next).entries.push(...entries.map((x) => ({ ...x, id: uid(), t: Date.now() }))));
        toast(`Auf ${dayLabel(next) === 'Heute' ? 'heute' : 'morgen'} kopiert`);
        closeSheet();
      }
      if (a === 'clear') {
        const dateK = ui.date;
        const removed = entries;
        update((s) => { const d = ensureDay(s, dateK); d.entries = d.entries.filter((x) => x.meal !== mealId); });
        toast(`${meal.label} geleert`, () => update((s) => ensureDay(s, dateK).entries.push(...removed)));
        closeSheet();
      }
    });
  });
}

function openOnboarding() {
  const s = getState();
  openSheet('Willkommen bei Bissen', `
    <p style="margin:0 0 16px" class="muted">Ein paar Angaben, dann berechnet Bissen deinen Kalorien- und Eiweißbedarf. Alles bleibt auf deinem Handy.</p>
    <div class="stack" id="ob">
      ${profileFields(s.profile)}
      <button class="btn" data-ob="go">Los geht's</button>
      <button class="btn danger" style="color:var(--muted)" data-ob="skip">Später</button>
    </div>`, (sheet) => {
    sheet.addEventListener('click', (e) => {
      const a = e.target.closest('[data-ob]')?.dataset.ob;
      if (!a) return;
      update((st) => {
        st.onboarded = true;
        if (a === 'go') {
          st.profile = readProfile(sheet);
          st.goals = calcGoals(st.profile);
          st.weights[dateKey()] = st.profile.weight;
        }
      });
      closeSheet();
      if (a === 'go') toast(`Dein Ziel: ${n0(getState().goals.kcal)} kcal · ${n0(getState().goals.p)} g Eiweiß`);
    });
  });
}

// ---------- Rendering & Events ----------

function render() {
  const view = $('#view');
  const fn = { today: renderToday, week: renderWeek, weight: renderWeight, profile: renderProfile }[ui.tab];
  view.innerHTML = fn();
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === ui.tab));
}

const actions = {
  prevDay: () => { ui.date = shiftKey(ui.date, -1); render(); },
  nextDay: () => { if (ui.date < dateKey()) { ui.date = shiftKey(ui.date, 1); render(); } },
  add: (el) => openAdd(el.dataset.meal || (ui.date === dateKey() ? mealForTime() : 'snack')),
  water: (el) => {
    const n = +el.dataset.n;
    update((s) => {
      const day = ensureDay(s, ui.date);
      day.water = Math.round(day.water / 250) === n ? (n - 1) * 250 : n * 250;
    });
    haptic();
  },
  waterMinus: () => update((s) => { const d = ensureDay(s, ui.date); d.water = Math.max(0, d.water - 250); }),
  editEntry: (el) => {
    const e = getDay(ui.date).entries.find((x) => x.id === el.dataset.id);
    if (e) openFood(entryFood(e), { entry: e });
  },
  openFood: (el) => {
    const f = findFood(el.dataset.food);
    if (f) openFood(f, { grams: +el.dataset.grams, meal: mealForTime() });
  },
  copyYesterday: (el) => {
    const prev = getDay(shiftKey(ui.date, -1)).entries.filter((e) => e.meal === el.dataset.meal);
    addEntries(prev.map((e) => ({ ...e, id: uid(), t: Date.now() })));
  },
  mealMenu: (el) => openMealMenu(el.dataset.meal),
  gotoDay: (el) => { ui.date = el.dataset.date; ui.tab = 'today'; render(); window.scrollTo(0, 0); },
  saveWeight: () => {
    const v = parseFloat(String($('#w-in').value).replace(',', '.'));
    if (!v || v < 20 || v > 400) return toast('Bitte ein gültiges Gewicht eingeben');
    update((s) => { s.weights[dateKey()] = v; s.profile.weight = v; });
    toast('Gewicht gespeichert');
  },
  delWeight: (el) => update((s) => { delete s.weights[el.dataset.date]; }),
  calcGoals: () => {
    const p = readProfile($('#profile-form'));
    update((s) => { s.profile = p; s.goals = calcGoals(p); });
    toast(`Neues Ziel: ${n0(getState().goals.kcal)} kcal · ${n0(getState().goals.p)} g Eiweiß`);
  },
  export: () => {
    const blob = new Blob([JSON.stringify(getState(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bissen-backup-${dateKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  import: () => {
    const input = $('#import-file');
    input.onchange = async () => {
      try {
        const data = JSON.parse(await input.files[0].text());
        if (!data || typeof data.days !== 'object') throw new Error();
        replaceState(data);
        toast('Backup geladen');
      } catch {
        toast('Datei ist kein gültiges Backup');
      }
    };
    input.click();
  },
  reset: () => {
    if (confirm('Wirklich alle Einträge, Ziele und eigenen Lebensmittel löschen?')) {
      resetAll();
      ui.date = dateKey();
      toast('Alle Daten gelöscht');
    }
  },
};

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab[data-tab]');
  if (tab) {
    ui.tab = tab.dataset.tab;
    if (ui.tab === 'today') ui.date = dateKey();
    render();
    window.scrollTo(0, 0);
    return;
  }
  const el = e.target.closest('[data-act]');
  if (el && actions[el.dataset.act] && !el.disabled) actions[el.dataset.act](el);
});

// Ziele im Profil direkt speichern, ohne komplettes Neurendern (Fokus bleibt erhalten).
document.addEventListener('change', (e) => {
  const k = e.target.dataset?.goal;
  if (!k) return;
  const v = Math.max(0, Math.round(+e.target.value || 0));
  const s = getState();
  s.goals[k] = v;
  update(() => {});
});

subscribe(() => {
  // Profilseite nicht bei jeder Eingabe neu zeichnen, damit Formularfelder stabil bleiben.
  if (ui.tab === 'profile' && document.activeElement?.matches('input, select')) return;
  render();
});

// Tageswechsel erkennen, wenn die App nach Mitternacht wieder geöffnet wird.
let lastToday = dateKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dateKey() !== lastToday) {
    if (ui.date === lastToday) ui.date = dateKey();
    lastToday = dateKey();
    render();
  }
});

render();
if (!getState().onboarded) setTimeout(openOnboarding, 250);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Für Tests und Debugging
window.bissen = { openAdd, getState };
