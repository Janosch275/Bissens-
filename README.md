# PRINT & CUT Werbetechnik – Haste

Statische One-Page-Website (HTML/CSS/JS) für PRINT & CUT Werbetechnik, Florian Krause.
Modernisierte Fassung im Stil der Astoria-Seite; Farben, Logo und Schriften des bisherigen Auftritts bleiben erhalten.

## Auslieferung

`python3 build.py` erzeugt in `dist/`:

- `printcut-website-verkauf.zip` – fertige Website als Ordner zum Hochladen auf einen Webspace, inkl. `LIESMICH.txt`
- `printcut-website-vorschau.zip` – **eine** HTML-Datei mit allem eingebettet (Schriften, Bilder, CSS, JS), mit „Vorschau“-Hinweis und `noindex` – zum Zeigen und Versenden
- `printcut-vorschau.html` – dieselbe Vorschau ungezippt

## Quelldateien

- `index.html` – Inhalte inkl. Impressum/Datenschutz (Overlay)
- `style.css`, `main.js` – Gestaltung, „Jetzt geöffnet“-Anzeige, Einblenden beim Scrollen
- `assets/` – Logo und Referenzbilder
- `fonts/` – lokal eingebundene Schriften, keine externen Anfragen
