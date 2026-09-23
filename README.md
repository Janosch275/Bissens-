# Goldene Pekingente – China-Restaurant Bad Nenndorf

Statische One-Page-Website (HTML/CSS/JS) für das China-Restaurant Goldene Pekingente, Bahnhofstraße 21, Bad Nenndorf.
Modernisierte Fassung im Stil der Astoria-Seite – in Lackrot und Gold, mit chinesischem Hui-Muster statt Mäander.

## Auslieferung

`python3 build.py` erzeugt in `dist/`:

- `pekingente-website-verkauf.zip` – fertige Website als Ordner zum Hochladen auf einen Webspace, inkl. `LIESMICH.txt`
- `pekingente-website-vorschau.zip` – **eine** HTML-Datei mit allem eingebettet (Schriften, CSS, JS), mit „Vorschau“-Hinweis und `noindex` – zum Zeigen und Versenden
- `pekingente-vorschau.html` – dieselbe Vorschau ungezippt

## Quelldateien

- `index.html` – Inhalte inkl. Impressum/Datenschutz (Overlay)
- `style.css`, `main.js` – Gestaltung, „Jetzt geöffnet“-Anzeige (Hero und Öffnungszeiten), Einblenden beim Scrollen
- `fonts/` – lokal eingebundene Schriften, keine externen Anfragen

## Chinesische Zeichen

`fonts/noto-serif-sc-subset.woff2` enthält nur die auf der Seite verwendeten Zeichen (~4 KB).
Nach Textänderungen mit neuen Zeichen neu erzeugen:

```sh
CH=$(python3 -c "import re;print(''.join(sorted(set(re.findall(r'[一-鿿]',open('index.html').read())))))")
ENC=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$CH")
URL=$(curl -s -A "Mozilla/5.0 Chrome/120" "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&text=$ENC" | grep -o 'https://[^)]*')
curl -s -o fonts/noto-serif-sc-subset.woff2 "$URL"
```
