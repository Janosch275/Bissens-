// Eingebaute Lebensmittel-Datenbank. Nährwerte pro 100 g (bzw. 100 ml),
// gerundete Richtwerte aus gängigen Nährwerttabellen.
// Felder: name, kcal, p (Eiweiß), c (Kohlenhydrate), f (Fett), fib (Ballaststoffe),
// portion: [Gramm, Bezeichnung] für Stück-Angaben, aliases: Suchbegriffe.

const RAW = [
  // Fleisch & Fisch
  ['Hähnchenbrust', 110, 23.5, 0, 1.5, 0, [150, 'Filet'], ['hähnchen', 'huhn', 'hühnchen', 'chicken', 'hähnchenfilet', 'hühnerbrust']],
  ['Putenbrust', 105, 24, 0, 1, 0, [150, 'Filet'], ['pute', 'truthahn', 'putenfilet']],
  ['Rinderhack', 250, 18, 0, 20, 0, null, ['hackfleisch', 'hack', 'rindfleisch hack']],
  ['Rindersteak', 130, 22, 0, 4.5, 0, [200, 'Steak'], ['steak', 'rind', 'rindfleisch']],
  ['Schweinefilet', 120, 22, 0, 3.5, 0, null, ['schwein', 'schweinefleisch']],
  ['Kochschinken', 110, 19, 1, 3.5, 0, [20, 'Scheibe'], ['schinken']],
  ['Salami', 380, 20, 1, 33, 0, [10, 'Scheibe'], []],
  ['Lachs', 200, 20, 0, 13, 0, [125, 'Filet'], ['lachsfilet', 'salmon']],
  ['Thunfisch (Dose, Wasser)', 110, 25, 0, 1, 0, [150, 'Dose'], ['thunfisch', 'tuna']],
  ['Garnelen', 85, 19, 0, 1, 0, null, ['shrimps', 'krabben', 'scampi']],
  ['Seelachs', 80, 18, 0, 1, 0, [125, 'Filet'], ['fisch', 'kabeljau', 'alaska seelachs']],

  // Eier & Milchprodukte
  ['Ei', 145, 12.5, 0.7, 10, 0, [60, 'Stück'], ['eier', 'hühnerei', 'egg']],
  ['Eiklar', 50, 11, 0.7, 0.2, 0, [33, 'Stück'], ['eiweiß', 'eiweiss']],
  ['Magerquark', 67, 12, 4, 0.3, 0, [250, 'Becher'], ['quark']],
  ['Skyr', 63, 11, 4, 0.2, 0, [150, 'Becher'], []],
  ['Griechischer Joghurt (10 %)', 120, 4, 4, 10, 0, [150, 'Portion'], ['griechischer joghurt']],
  ['Naturjoghurt (1,5 %)', 47, 4, 5, 1.5, 0, [150, 'Becher'], ['joghurt', 'jogurt']],
  ['Hüttenkäse', 95, 12, 3, 4, 0, [200, 'Becher'], ['körniger frischkäse', 'cottage cheese']],
  ['Milch (1,5 %)', 47, 3.4, 4.8, 1.5, 0, [250, 'Glas'], ['milch', 'fettarme milch']],
  ['Vollmilch (3,5 %)', 64, 3.3, 4.8, 3.5, 0, [250, 'Glas'], ['vollmilch']],
  ['Haferdrink', 45, 0.5, 7, 1.5, 0.8, [250, 'Glas'], ['hafermilch', 'oatly']],
  ['Gouda', 360, 25, 0, 29, 0, [25, 'Scheibe'], ['käse', 'kaese']],
  ['Mozzarella', 250, 18, 1, 19, 0, [125, 'Kugel'], []],
  ['Feta', 265, 14, 1, 22, 0, null, ['schafskäse']],
  ['Parmesan', 400, 35, 0, 29, 0, [10, 'EL'], []],
  ['Frischkäse', 250, 6, 3, 24, 0, [30, 'Portion'], []],
  ['Butter', 740, 0.7, 0.6, 83, 0, [10, 'Portion'], []],
  ['Whey Protein', 380, 78, 7, 5, 0, [30, 'Scoop'], ['whey', 'proteinpulver', 'protein shake', 'eiweißpulver', 'shake']],

  // Getreide, Brot & Beilagen
  ['Haferflocken', 370, 13.5, 59, 7, 10, [50, 'Portion'], ['hafer', 'oats', 'porridge']],
  ['Müsli', 370, 9, 62, 7, 8, [60, 'Portion'], ['muesli', 'granola']],
  ['Vollkornbrot', 220, 7, 40, 1.5, 7, [50, 'Scheibe'], ['brot', 'roggenbrot']],
  ['Toast', 260, 8, 48, 3.5, 3, [25, 'Scheibe'], ['toastbrot', 'weißbrot']],
  ['Brötchen', 270, 9, 53, 1.5, 3, [55, 'Stück'], ['semmel', 'schrippe', 'weckle']],
  ['Laugenbrezel', 280, 8, 56, 2, 2, [80, 'Stück'], ['brezel', 'breze', 'brezn']],
  ['Reis (gekocht)', 130, 2.7, 28, 0.3, 0.4, [180, 'Portion'], ['reis', 'basmati', 'jasminreis']],
  ['Reis (roh)', 350, 7, 78, 0.6, 1.3, null, ['reis roh']],
  ['Nudeln (gekocht)', 150, 5.5, 30, 0.9, 1.8, [200, 'Portion'], ['nudeln', 'pasta', 'spaghetti', 'penne']],
  ['Nudeln (roh)', 355, 12.5, 71, 1.5, 3, null, ['nudeln roh', 'pasta roh']],
  ['Kartoffeln (gekocht)', 72, 2, 15, 0.1, 2, [150, 'Portion'], ['kartoffel', 'kartoffeln', 'salzkartoffeln']],
  ['Süßkartoffel', 86, 1.6, 20, 0.1, 3, [200, 'Stück'], ['süsskartoffel']],
  ['Pommes', 290, 3.4, 36, 15, 3.5, [150, 'Portion'], ['pommes frites', 'fritten']],
  ['Wrap (Tortilla)', 300, 8, 50, 7, 3, [60, 'Stück'], ['wrap', 'tortilla']],
  ['Couscous (gekocht)', 112, 3.8, 23, 0.2, 1.4, [180, 'Portion'], ['couscous', 'bulgur']],
  ['Reiswaffel', 385, 8, 81, 3, 4, [8, 'Stück'], ['reiswaffeln']],

  // Hülsenfrüchte & Pflanzliches Eiweiß
  ['Linsen (gekocht)', 115, 9, 17, 0.4, 8, [150, 'Portion'], ['linsen']],
  ['Kichererbsen (Dose)', 120, 7, 16, 2.5, 6, [240, 'Dose'], ['kichererbsen']],
  ['Kidneybohnen (Dose)', 100, 7, 13, 0.5, 6, [250, 'Dose'], ['bohnen', 'kidneybohnen']],
  ['Tofu', 125, 13, 1.5, 7.5, 1, [200, 'Block'], []],
  ['Tempeh', 190, 19, 9, 11, 5, null, []],
  ['Edamame', 120, 11, 9, 5, 5, [100, 'Portion'], []],

  // Gemüse
  ['Brokkoli', 34, 3, 3, 0.4, 3, [200, 'Portion'], ['broccoli']],
  ['Tomate', 18, 0.9, 2.6, 0.2, 1.2, [100, 'Stück'], ['tomaten']],
  ['Gurke', 12, 0.6, 1.8, 0.1, 0.5, [400, 'Stück'], ['gurken', 'salatgurke']],
  ['Paprika', 30, 1, 5, 0.3, 2, [150, 'Stück'], ['paprikaschote']],
  ['Karotte', 36, 0.9, 7, 0.2, 3, [80, 'Stück'], ['möhre', 'möhren', 'karotten']],
  ['Zucchini', 19, 1.6, 2, 0.4, 1, [250, 'Stück'], []],
  ['Spinat', 23, 2.9, 1.5, 0.4, 2.2, [150, 'Portion'], ['blattspinat']],
  ['Blattsalat', 15, 1.3, 1.5, 0.2, 1.5, [80, 'Portion'], ['salat', 'eisbergsalat', 'rucola']],
  ['Champignons', 22, 3, 1, 0.3, 2, [150, 'Portion'], ['pilze']],
  ['Zwiebel', 40, 1.2, 8, 0.1, 1.8, [80, 'Stück'], ['zwiebeln']],
  ['Mais (Dose)', 85, 3, 16, 1.2, 3, [140, 'Dose'], ['mais']],
  ['Erbsen (TK)', 80, 5.5, 11, 0.4, 5, [150, 'Portion'], ['erbsen']],
  ['Avocado', 160, 2, 1, 15, 7, [140, 'Stück'], []],

  // Obst
  ['Banane', 95, 1.1, 21, 0.2, 2, [120, 'Stück'], ['bananen']],
  ['Apfel', 55, 0.3, 12, 0.2, 2.4, [180, 'Stück'], ['äpfel']],
  ['Orange', 47, 1, 9, 0.2, 2, [180, 'Stück'], ['orangen', 'apfelsine']],
  ['Beeren (gemischt)', 45, 1, 8, 0.4, 5, [125, 'Schale'], ['beeren', 'heidelbeeren', 'himbeeren', 'blaubeeren']],
  ['Erdbeeren', 32, 0.7, 5.5, 0.4, 2, [150, 'Schale'], ['erdbeere']],
  ['Weintrauben', 70, 0.7, 16, 0.2, 1.5, [125, 'Portion'], ['trauben']],
  ['Kiwi', 60, 1, 11, 0.6, 3, [75, 'Stück'], []],
  ['Mango', 60, 0.8, 13, 0.4, 1.6, [300, 'Stück'], []],
  ['Datteln', 280, 2.5, 66, 0.4, 8, [8, 'Stück'], ['dattel']],

  // Nüsse, Öle, Aufstriche
  ['Mandeln', 590, 24, 6, 53, 12, [30, 'Handvoll'], ['mandel']],
  ['Walnüsse', 670, 15, 11, 65, 6, [30, 'Handvoll'], ['walnuss', 'nüsse']],
  ['Erdnussbutter', 600, 25, 12, 50, 7, [15, 'EL'], ['peanut butter', 'erdnussmus']],
  ['Olivenöl', 880, 0, 0, 100, 0, [10, 'EL'], ['öl', 'rapsöl']],
  ['Honig', 305, 0.4, 76, 0, 0, [20, 'EL'], []],
  ['Marmelade', 250, 0.3, 60, 0.1, 1, [20, 'EL'], ['konfitüre']],
  ['Nuss-Nougat-Creme', 540, 6, 57, 31, 3, [15, 'EL'], ['nutella']],
  ['Hummus', 250, 7, 14, 18, 6, [50, 'Portion'], []],

  // Snacks, Süßes, Fertiges
  ['Proteinriegel', 360, 33, 30, 11, 6, [55, 'Riegel'], ['protein riegel', 'proteinbar']],
  ['Zartbitterschokolade (70 %)', 580, 8, 34, 42, 11, [25, 'Stück'], ['zartbitter', 'dunkle schokolade']],
  ['Milchschokolade', 540, 7, 57, 31, 2, [25, 'Stück'], ['schokolade', 'schoki']],
  ['Chips', 540, 6, 50, 34, 4, [50, 'Portion'], ['kartoffelchips']],
  ['Gummibärchen', 340, 7, 77, 0.2, 0, [25, 'Portion'], ['haribo', 'gummibären']],
  ['Pizza Margherita', 250, 10, 30, 9, 2, [350, 'Pizza'], ['pizza']],
  ['Döner', 215, 12, 20, 10, 2, [400, 'Stück'], ['döner kebab', 'kebab']],
  ['Burger', 250, 13, 24, 11, 1.5, [230, 'Stück'], ['hamburger', 'cheeseburger']],
  ['Currywurst', 230, 10, 8, 18, 0.5, [250, 'Portion'], []],

  // Getränke
  ['Cola', 42, 0, 10.6, 0, 0, [330, 'Dose'], ['coca cola', 'limo', 'limonade']],
  ['Orangensaft', 43, 0.7, 9, 0.2, 0.2, [250, 'Glas'], ['o-saft', 'saft']],
  ['Bier', 43, 0.5, 3, 0, 0, [500, 'Flasche'], ['pils']],
  ['Wein', 75, 0.1, 2.5, 0, 0, [200, 'Glas'], ['rotwein', 'weißwein']],
  ['Cappuccino', 40, 2.2, 3.2, 2, 0, [200, 'Tasse'], ['kaffee mit milch', 'latte', 'latte macchiato', 'flat white']],
  ['Kaffee (schwarz)', 2, 0.1, 0, 0, 0, [200, 'Tasse'], ['kaffee', 'espresso']],
];

// IDs werden aus dem Namen abgeleitet, damit sie stabil bleiben, wenn die Liste wächst.
export const FOODS = RAW.map(([name, kcal, p, c, f, fib, portion, aliases]) => ({
  id: 'b:' + name.toLowerCase(),
  name, kcal, p, c, f, fib,
  portion: portion ? { g: portion[0], label: portion[1] } : null,
  aliases,
}));
