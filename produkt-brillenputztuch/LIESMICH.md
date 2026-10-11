# Klarsicht – Produktseite Brillenputztuch

Statische, hochwertige Produktseite für ein Mikrofaser-Brillenputztuch – mit Scroll-Animationen, ganz ohne externe Dienste.

## Inhalt

| Datei | Zweck |
| --- | --- |
| `index.html` | Produktseite: Hero, Das Tuch, Mikrofaser, Vorteile, Vorher/Nachher, Farben, Anwendung, Bestellen, FAQ |
| `impressum.html`, `datenschutz.html` | Rechtliche Seiten – **gelb markierte Platzhalter vor dem Livegang ausfüllen** |
| `ressourcen/stile/stil.css` | Design, Farben, Animationen, Handy-Ansicht |
| `ressourcen/skripte/app.js` | Alle Animationen & Interaktionen (ohne Bibliotheken) |
| `ressourcen/bilder/` | Produktfoto (JPG + WebP) |
| `ressourcen/schriften/` | Mona Sans & Geist Mono, lokal eingebunden (Lizenz: SIL OFL) |

## Animationen

- **Einstieg:** dunkler Vorhang mit Brillenglas, Brille und Schriftzug fahren ein
- **Hero:** Beim Scrollen wischt ein Tuch Fingerabdrücke und Schlieren von den Gläsern – durch die sauberen Gläser wird „KLAR“ scharf. Danach erscheint der Text, und die Seite zoomt durch das linke Glas in den nächsten Abschnitt
- **Mikrofaser:** gepinnter Mikroskop-Zoom in die Fasern, drei Aussagen wechseln, Schmutzpartikel verschwinden
- **Vorteile:** Karten neigen sich zur Maus, Lichtpunkt folgt
- **Vorher/Nachher:** Regler zum Ziehen, führt sich beim ersten Sichtbarwerden einmal selbst vor
- **Farben:** Klick auf eine Farbe färbt das Tuch um, das Tuch dreht sich beim Scrollen
- Zeilenweise einfliegende Überschriften, aufziehende Bilder, zeichnende Linie, hochzählende Preise, magnetische Buttons, eigener Cursor, Fortschrittsbalken

Bei der Systemeinstellung „Bewegung reduzieren“ und ohne JavaScript ist alles ohne Animation sichtbar.

## Vor dem Livegang anpassen

- **Markenname „Klarsicht“** ist ein Platzhalter – vor Verwendung prüfen (Markenrecht) bzw. durch den eigenen Namen ersetzen
- **Produktangaben** (Größe 18 × 18 cm, Farben, Pflegehinweise) an das echte Produkt anpassen
- **Preise** (7,90 € / 17,90 € / 24,90 €) in `index.html` im Abschnitt `<!-- Kaufen -->` – Attribut `data-count` (in Cent) und angezeigten Wert ändern
- **Hinweis „inkl. MwSt.“** anpassen, falls die Kleinunternehmerregelung gilt
- **Bestell-E-Mail** `bestellung@ihre-domain.de` (3× in `index.html`) ersetzen
- Für einen echten Onlineshop zusätzlich AGB, Widerrufsbelehrung und Versandinformationen ergänzen

## Lokal ansehen

```bash
php -S localhost:8080
```
oder `python3 -m http.server 8080`, dann http://localhost:8080 öffnen.
