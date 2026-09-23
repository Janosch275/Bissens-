import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOODS } from '../js/foods.js';
import {
  parseQuickAdd, searchFoods, nutrientsFor, sumEntries, calcGoals, suggestFoods, normalize,
} from '../js/nutrition.js';

const parse = (t) => parseQuickAdd(t, FOODS).items.map((i) => [i.food.name, i.grams]);

test('normalize folds umlauts and punctuation', () => {
  assert.equal(normalize('Hähnchen-Brust (gekocht)'), 'haehnchen brust gekocht');
});

test('search finds by name, alias and plural', () => {
  assert.equal(searchFoods('Eier', FOODS)[0].name, 'Ei');
  assert.equal(searchFoods('hähnchen', FOODS)[0].name, 'Hähnchenbrust');
  assert.equal(searchFoods('Bananen', FOODS)[0].name, 'Banane');
  assert.equal(searchFoods('quark', FOODS)[0].name, 'Magerquark');
  assert.equal(searchFoods('reis', FOODS)[0].name, 'Reis (gekocht)');
  assert.equal(searchFoods('xyzzy', FOODS).length, 0);
});

test('quick add parses a mixed sentence', () => {
  assert.deepEqual(parse('200g Hähnchen, 2 Eier und 1 Banane'), [
    ['Hähnchenbrust', 200], ['Ei', 120], ['Banane', 120],
  ]);
});

test('quick add handles units, words and trailing amounts', () => {
  assert.deepEqual(parse('2 Scheiben Vollkornbrot'), [['Vollkornbrot', 100]]);
  assert.deepEqual(parse('1 EL Erdnussbutter'), [['Erdnussbutter', 15]]);
  assert.deepEqual(parse('eine Banane'), [['Banane', 120]]);
  assert.deepEqual(parse('halbe Avocado'), [['Avocado', 70]]);
  assert.deepEqual(parse('Magerquark 250g'), [['Magerquark', 250]]);
  assert.deepEqual(parse('1,5 kg Kartoffeln'), [['Kartoffeln (gekocht)', 1500]]);
  assert.deepEqual(parse('150 Reis'), [['Reis (gekocht)', 150]]);
  assert.deepEqual(parse('Skyr'), [['Skyr', 150]]);
  assert.deepEqual(parse('2 gouda'), [['Gouda', 50]]);
  assert.deepEqual(parse('300 ml Milch'), [['Milch (1,5 %)', 300]]);
});

test('quick add reports unknown parts', () => {
  const { items, unmatched } = parseQuickAdd('1 Banane, 3 Blorbs', FOODS);
  assert.equal(items.length, 1);
  assert.deepEqual(unmatched, ['3 Blorbs']);
});

test('nutrients scale and sum', () => {
  const chicken = FOODS.find((f) => f.name === 'Hähnchenbrust');
  const n = nutrientsFor(chicken, 200);
  assert.deepEqual(n, { kcal: 220, p: 47, c: 0, f: 3, fib: 0 });
  assert.deepEqual(sumEntries([n, n]), { kcal: 440, p: 94, c: 0, f: 6, fib: 0 });
});

test('goal calculation is plausible', () => {
  const g = calcGoals({ sex: 'm', age: 30, height: 180, weight: 80, activity: 'medium', goal: 'keep' });
  assert.ok(g.kcal > 2500 && g.kcal < 2900, `kcal ${g.kcal}`);
  assert.equal(g.p, 128);
  assert.equal(Math.abs(g.p * 4 + g.c * 4 + g.f * 9 - g.kcal) < 10, true);
  assert.equal(g.water, 2750);
});

test('suggestions prefer protein when protein is missing and fit the budget', () => {
  const s = suggestFoods({ kcal: 300, p: 40 }, FOODS);
  assert.ok(s.length > 0);
  for (const x of s) {
    assert.ok(x.n.kcal <= 300);
    assert.ok(x.food.p / x.food.kcal > 0.15, x.food.name);
  }
  assert.deepEqual(suggestFoods({ kcal: 30, p: 40 }, FOODS), []);
});
