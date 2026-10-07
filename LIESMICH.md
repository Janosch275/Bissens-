# Webdesign Janosch Krause – Website

Moderne, statische Unternehmenswebsite mit eingebautem Kontaktformular.

## Inhalt

| Datei | Zweck |
| --- | --- |
| `index.html` | Startseite: Hero, Leistungen, Ablauf, Preise mit Rechner, Über mich, FAQ, Kontaktformular |
| `webdesign-bad-nenndorf.html` | Standort-Seite für Kunden aus Bad Nenndorf, Schaumburg und der Region Hannover (lokale Auffindbarkeit bei Google) |
| `robots.txt` | Hinweis für Suchmaschinen – Sitemap-Zeile ergänzen, sobald die Domain steht |
| `impressum.html`, `datenschutz.html` | Rechtliche Seiten – **gelb markierte Platzhalter vor dem Livegang ausfüllen** |
| `kontakt.php` | Nimmt Formular-Anfragen entgegen, speichert sie in `/anfragen` und schickt sie per E-Mail |
| `ressourcen/stile/design.css` | Design: grüne Farbpalette, Schriften, Animationen, Handy-Ansicht |
| `ressourcen/skripte/funktionen.js` | Scroll-Animationen, Menü, Zähler, Formular-Validierung & -Versand |
| `ressourcen/bilder/logo.svg`, `symbol.svg` | Logo (JK-Zeichen mit Mint-Quadrat) und Browser-Tab-Symbol |
| `referenzen/` | Zwei Beispiel-Websites als Arbeitsproben (Kunstschule „Farbfeld“, Architekturbüro „Atelier Kante“) – verlinkt im Bereich „Arbeiten“ |
| `ressourcen/bilder/arbeiten/` | Vorschaubilder der Beispiel-Websites |
| `ressourcen/schriften/` | Sora & Plus Jakarta Sans, lokal eingebunden (DSGVO-freundlich, kein Google-CDN) |

> Hinweis: `index.html` muss so heißen – Webserver laden diese Datei automatisch als Startseite.

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
