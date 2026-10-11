# Sehwerk – Shop für Blaulichtfilter-Brillen

Statischer Online-Shop für Brillen mit Blaulichtfilter-Gläsern, mit Mikrofasertüchern als Zubehör. Alle Inhalte, Schriften und Bibliotheken liegen lokal – keine Verbindung zu Google, CDNs oder Tracking-Diensten.

## Inhalt

| Datei | Zweck |
| --- | --- |
| `index.html` | Shop: Hero mit 3D-Brille, Blaulichtfilter-Spektrum, Kollektion mit Filter, Fassungs-Galerie, Details, Zubehör, Service, FAQ |
| `impressum.html`, `datenschutz.html` | Rechtliche Seiten – **gelb markierte Platzhalter ausfüllen** |
| `ressourcen/css/stil.css` | Gestaltung und Animationen |
| `ressourcen/js/app.js` | Produktdaten, Filter, Produktdetail, Warenkorb, Scroll-Effekte |
| `ressourcen/js/hero3d.js`, `brille3d.js` | Live-3D-Brille im Hero (three.js) |
| `ressourcen/vendor/` | three.js 0.169 (MIT-Lizenz), lokal eingebunden |
| `ressourcen/bilder/produkte/` | Produktbilder aller Fassungen und Farben (aus dem 3D-Modell gerendert) |
| `ressourcen/schriften/` | Geist & Geist Mono (SIL Open Font License) |

## Animationen

- **Hero:** Die 3D-Brille liegt zusammengeklappt, klappt beim Scrollen die Bügel aus, dreht sich und folgt leicht der Maus. Beschriftungen zeigen auf Glas, Rand und Scharnier, die Überschrift teilt sich nach links und rechts.
- **Leitmotiv „Schärfe“:** Überschriften, Texte und Bilder werden beim Hineinscrollen von unscharf zu scharf – wie durch eine Brille.
- **Blaulichtfilter:** Ein Glas wandert beim Scrollen über das Lichtspektrum eines Bildschirms und senkt die Blaulicht-Spitze ab.
- **Fassungen:** horizontale Galerie mit Parallaxe.
- **Shop:** Bildwechsel beim Überfahren, Farbwahl, Produktansicht als Seitenpanel, Bild fliegt beim Hinzufügen in den Warenkorb.

Mit „Bewegung reduzieren“ oder ohne JavaScript ist alles ohne Animation sichtbar.

## Vor dem Livegang anpassen

- **Markenname „Sehwerk“** ist ein Platzhalter – vor Verwendung markenrechtlich prüfen oder ersetzen.
- **Produkte, Preise, Maße, Farben:** in `ressourcen/js/app.js` (`PRODUKTE`, `ZUBEHOER`, `GLAS_AUFPREIS`, `VERSANDFREI`).
- **Produktangaben prüfen:** „von Hand poliert“, „Metallscharnier, fünffach gelagert“, Hartschicht/Entspiegelung, Lieferzeiten (48 h, 7–10 Werktage), Rückgabe 30 Tage – an die echten Produkte und Bedingungen anpassen.
- **Blaulichtfilter-Grafik** ist schematisch. Echte Filterwerte des Glasherstellers verwenden, keine Heilversprechen machen.
- **Kasse:** Aktuell erzeugt „Zur Kasse“ eine E-Mail mit der Bestellung an `bestellung@ihre-domain.de`. Für einen echten Shop ein Shopsystem bzw. einen Zahlungsanbieter anbinden – dann zusätzlich AGB, Widerrufsbelehrung, Versand- und Zahlungsinformationen ergänzen und die Datenschutzerklärung erweitern.
- **Produktbilder** sind aus dem 3D-Modell gerendert. Sobald echte Fotos vorliegen, einfach die Dateien in `ressourcen/bilder/produkte/` gleichnamig ersetzen (4:3, Hintergrund #ECE8E1 empfohlen).

## Lokal ansehen

```bash
python3 -m http.server 8080
```
Dann http://localhost:8080 öffnen. (Die 3D-Szene braucht einen Webserver, ein Doppelklick auf die Datei reicht nicht.)
