# LUND – Präsentationsseite für Automatikuhren mit farbigen Zifferblättern

Statische Präsentationsseite (kein Shop) für eine Edelstahl-Automatikuhr mit integriertem Armband und sechs Zifferblattfarben. Alle Inhalte, Schriften und Bibliotheken liegen lokal – keine Verbindung zu Google, CDNs oder Tracking-Diensten.

> Die Uhr ist ein **eigenes Design** (rundes Gehäuse, flache Lünette, integriertes H-Gliederarmband, Sonnenschliff-Zifferblatt). Bitte keine Markennamen, Logos oder geschützten Designs anderer Hersteller übernehmen.

## Inhalt

| Datei | Zweck |
| --- | --- |
| `index.html` | Hero mit 3D-Uhr, Intro mit Kennzahlen, Detail-Zoom, Kollektion (36/39 mm), 3D-Farbstudio, Technik, Haltung, FAQ, Kontakt |
| `impressum.html`, `datenschutz.html` | Rechtliche Seiten – **markierte Platzhalter ausfüllen** |
| `ressourcen/css/stil.css` | Gestaltung und Animationen |
| `ressourcen/js/app.js` | Daten, Kollektion, Farbstudio-Bedienung, Scroll-Effekte |
| `ressourcen/js/szene.bundle.js` | Live-3D (Hero + Konfigurator), fertig gebündelt – funktioniert auch per Doppelklick |
| `ressourcen/js/uhr3d.js`, `szene.js` | Quellcode der 3D-Uhr. Nach Änderungen neu bündeln: `npx esbuild ressourcen/js/szene.js --bundle --format=iife --minify --outfile=ressourcen/js/szene.bundle.js` |
| `ressourcen/bilder/uhren/` | Produktbilder aller Zifferblätter (aus dem 3D-Modell gerendert) |
| `ressourcen/vendor/` | three.js 0.169 (MIT-Lizenz) |
| `ressourcen/schriften/` | Mona Sans, Geist, Geist Mono (SIL Open Font License) |

## Animationen

- **Hero:** Die 3D-Uhr zeigt die echte Uhrzeit, dreht sich beim Scrollen und wechselt dabei nacheinander durch alle sechs Zifferblattfarben. Farbname, Lichtschein und Akzentfarbe der Seite wechseln mit. Die Farbpunkte rechts springen direkt zu einer Farbe.
- **Intro:** Der Text erscheint Wort für Wort beim Lesen, die Kennzahlen zählen hoch.
- **Details:** Gepinnter Zoom durch Zifferblatt, Gehäuse und Armband.
- **Farbstudio:** Uhr live in 3D, mit Maus/Finger drehbar; Zifferblatt und Größe wechseln sofort.
- Karten mit Bildwechsel, Lichtschein in Zifferblattfarbe, ausblendendes Menü.

Mit „Bewegung reduzieren“ oder ohne JavaScript bleibt alles ohne Animation sichtbar.

## Vor dem Livegang anpassen

- **Markenname „LUND“** ist ein Platzhalter – vor Verwendung markenrechtlich prüfen oder ersetzen (auch auf dem Zifferblatt in `uhr3d.js` und in den Bildern).
- **Technische Daten** (Werk, Gangreserve 41 h, Höhe 9,8 mm, 100 m) sind Beispielwerte – an die echte Uhr anpassen.
- **Texte zu Atelier und Service** an die eigenen Gegebenheiten anpassen; die Kontakt-Adresse `hallo@ihre-domain.de` ersetzen.
- **Produktbilder:** Sobald echte Fotos vorliegen, gleichnamig in `ressourcen/bilder/uhren/` ersetzen (Format 4:5, dunkler Hintergrund #131518 empfohlen).

## Lokal ansehen

Doppelklick auf `index.html` oder `python3 -m http.server 8080` und http://localhost:8080 öffnen.
