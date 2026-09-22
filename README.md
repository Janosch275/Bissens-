# Astoria – Griechisches Restaurant Bad Nenndorf

Statische One-Page-Website (HTML/CSS/JS), als Vorschau/Verkaufsdatei für das Restaurant.

## Auslieferung

`python3 build.py` erzeugt in `dist/`:

- `astoria-website.html` – komplette Website in **einer** Datei (Schriften, CSS, JS eingebettet; funktioniert offline per Doppelklick)
- `astoria-website.zip` – dieselbe Website als Ordner zum Hochladen auf einen Webspace, inkl. `LIESMICH.txt`

## Quelldateien

- `index.html` – Inhalte inkl. Impressum/Datenschutz (Overlay, Platzhalter)
- `style.css`, `main.js` – Gestaltung und „Jetzt geöffnet“-Anzeige
- `fonts/` – lokal eingebundene Schriften, keine externen Anfragen
