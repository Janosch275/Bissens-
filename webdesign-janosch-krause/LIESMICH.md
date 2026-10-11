# Webdesign Janosch Krause – Website

Moderne, statische Unternehmenswebsite mit eingebautem Kontaktformular.

## Inhalt

| Datei | Zweck |
| --- | --- |
| `index.html` | Startseite: Hero, Leistungen, Ablauf, Preise mit Rechner, Über mich, FAQ, Kontaktformular |
| `robots.txt` | Hinweis für Suchmaschinen – Sitemap-Zeile ergänzen, sobald die Domain steht |
| `impressum.html`, `datenschutz.html` | Rechtliche Seiten – **gelb markierte Platzhalter vor dem Livegang ausfüllen** |
| `kontakt.php` | Nimmt Formular-Anfragen entgegen, speichert sie in `/anfragen` und schickt sie per E-Mail |
| `ressourcen/stile/design.css` | Design: grüne Farbpalette, Schriften, Scroll-Animationen, Handy-Ansicht |
| `ressourcen/skripte/funktionen.js` | Scroll-Animationen, Menü, Zähler, Preisrechner, Formular-Validierung & -Versand |
| `ressourcen/bilder/logo.svg`, `symbol.svg` | Logo (JK-Zeichen mit Mint-Quadrat) und Browser-Tab-Symbol |
| `referenzen/` | Zwei Beispiel-Websites als Arbeitsproben (Kunstschule „Farbfeld“, Architekturbüro „Atelier Kante“) – verlinkt im Bereich „Arbeiten“ |
| `ressourcen/bilder/arbeiten/` | Vorschaubilder der Beispiel-Websites |
| `ressourcen/schriften/` | Sora & Plus Jakarta Sans, lokal eingebunden (DSGVO-freundlich, kein Google-CDN) |

> Hinweis: `index.html` muss so heißen – Webserver laden diese Datei automatisch als Startseite.

## Scroll-Animationen

Alle Effekte sind selbst geschrieben – ohne Bibliotheken, ohne CDN, ohne externe Verbindungen:

- Überschrift baut sich Wort für Wort auf, das Browser-Mockup richtet sich beim Scrollen auf, Farbflächen bewegen sich mit Parallaxe
- Leistungs-Karten stapeln sich beim Scrollen übereinander
- Referenz-Fenster klappen beim Hineinscrollen auf
- „Ablauf“ fährt auf großen Bildschirmen horizontal durch die vier Schritte (Handy: Zeitleiste füllt sich)
- „Über mich“-Text füllt sich Wort für Wort, die Karte im Standort-Bereich zeichnet ihre Verbindungen
- Fortschrittsbalken oben, Menü blendet sich beim Runterscrollen aus und beim Hochscrollen ein

Wer in seinem Betriebssystem „Bewegung reduzieren“ eingestellt hat, sieht die Seite ohne Animationen. Ohne JavaScript ist ebenfalls alles sichtbar.

## Kontaktformular einrichten

Kunden schicken ihre Anfrage direkt über die Website – ohne Anruf oder eigenes E-Mail-Programm.

1. In `kontakt.php` ist `EMPFAENGER` bereits eingetragen. `ABSENDER` muss noch auf eine Adresse Ihrer IONOS-Domain gesetzt werden (z. B. `website@ihre-domain.de`).
2. Alle Dateien per FTP/Dateimanager zu einem Webhoster mit PHP hochladen (z. B. IONOS, Strato, All-Inkl).
3. Jede Anfrage landet als E-Mail in Ihrem Postfach und zusätzlich als Sicherung im Ordner `anfragen/` (per `.htaccess` vor Zugriff geschützt).

Eingebaut: Pflichtfeld-Prüfung, Honeypot-Spamschutz, Sperre gegen Mehrfachsenden, Schutz gegen Header-Injection.

**Ohne PHP-Hosting** (z. B. GitHub Pages, Netlify): Im `<form>`-Tag in `index.html` das `action="kontakt.php"` durch die URL eines Formular-Dienstes wie Formspree oder Web3Forms ersetzen – das JavaScript funktioniert damit ebenfalls.

## Lokal ansehen

```bash
php -S localhost:8080
```
Dann http://localhost:8080 öffnen.

## Preise anpassen

Die Preise (Onepager ab 310 €, Mehrpager ab 270 € + ab 90 € je Unterseite, Express-Paket + 390 €, Änderungen ab 35 €) stehen in `index.html` im Abschnitt `<!-- Preise -->`. Ändert sich der Mehrpager-Preis, auch `START`, `PER_PAGE` und `EXPRESS` im Preisrechner in `ressourcen/skripte/funktionen.js` anpassen.
