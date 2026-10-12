# KURVE Automobile – Präsentationswebsite für ein Autohaus

Statische Website (kein Shop) für ein fiktives Autohaus mit Verkauf, Werkstatt und Felgenservice. Alle Inhalte, Schriften und Bibliotheken liegen lokal – keine Verbindung zu Google, CDNs oder Tracking-Diensten, keine Cookies.

## Inhalt

| Datei | Zweck |
| --- | --- |
| `index.html` | Hero mit 3D-Rad, Zahlen, Leistungen, Leistungsprüfstand, Geschichte als Rennstrecke, Kontakt mit Terminanfrage |
| `impressum.html`, `datenschutz.html` | Rechtliche Seiten – **markierte Platzhalter ausfüllen** |
| `ressourcen/css/stil.css` | Gestaltung und Animationen |
| `ressourcen/js/app.js` | Tacho, Zähler, Paneele, Zeichnung, Rennstrecke, Formular, Navigation |
| `ressourcen/js/szene.bundle.js` | Live-3D (Hero + Showroom), gebündelt – läuft auch per Doppelklick |
| `ressourcen/js/rad3d.js`, `szene.js` | Quellcode des 3D-Rads. Nach Änderungen neu bündeln: `npx esbuild ressourcen/js/szene.js --bundle --format=iife --minify --outfile=ressourcen/js/szene.bundle.js` |
| `ressourcen/vendor/` | three.js 0.169 (MIT-Lizenz) |
| `ressourcen/schriften/` | Mona Sans, Geist, Geist Mono (SIL Open Font License) |

## Animationen

- **Hero:** Ein 3D-Rad (Reifen mit Profil und Flankenbeschriftung, konkave Gussfelge, gelochte Bremsscheibe, Bremssattel) dreht beim Scrollen hoch. Tacho und Drehzahlbalken laufen mit, Fahrtwind-Linien erscheinen. Dann bremst es, dreht sich zur Seite und zerlegt sich in seine Teile (Explosionsansicht mit Bauteil-Liste), setzt sich wieder zusammen, beschleunigt auf 286 km/h und rollt aus dem Bild.
- **Zahlen:** Rollende Ziffern wie ein Kilometerzähler.
- **Leistungen:** Schräge Paneele, die sich beim Überfahren öffnen.
- **Leistungsprüfstand:** Beim Scrollen läuft die Drehzahl hoch, Leistungs- und Drehmomentkurve zeichnen sich wie bei einer echten Messung, Drehzahl, PS und Nm laufen live mit; am Ende erscheint die Spitzenleistung.
- **Geschichte:** Ein Punkt fährt beim Scrollen eine Rennstrecke ab, die Etappen leuchten nacheinander auf.

Mit „Bewegung reduzieren“ oder ohne JavaScript ist alles ohne Animation sichtbar.

## Vor dem Livegang anpassen

- **Name „KURVE Automobile“**, Adresse, Telefon, Öffnungszeiten, Gründungsjahr und Kennzahlen sind Platzhalter.
- **Geschichte** (1998–2024) und **Leistungen** (z. B. 120-Punkte-Check, 12 Monate Garantie) an das echte Autohaus anpassen.
- **Terminanfrage** öffnet das E-Mail-Programm an `termin@ihre-domain.de` – Adresse ersetzen.

- **Prüfstandswerte** sind eine Beispielmessung (bis 414 PS / 530 Nm). Den Verlauf bestimmen die Funktionen `nm()` und `ps()` in `ressourcen/js/app.js` – dort lassen sich echte Messwerte eintragen.
