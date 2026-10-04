# Stempel Pestka – Website (Relaunch 2026)

Moderne, statische Website für **Stempel Pestka** (www.stempel-pestka.de).

**Aktualisierte Angaben**
- Inhaberin: Nadine Rieboldt (vorher Ortwin Pestka)
- Neuer Standort: Hauptstraße 29, 31559 Haste (vorher Wedekindplatz 2, 30161 Hannover)
- Telefon: 05723 9569222 · E-Mail: stempel-pestka@web.de
- Öffnungszeiten: Mo–Do 09–17 Uhr, Fr 09–14 Uhr

**Dateien**
- `index.html` – Startseite (Über uns, Produkte, Bestellformular, Anfahrt/Öffnungszeiten)
- `impressum.html`, `datenschutz.html` – Rechtstexte
- `legal.css` – Gestaltung der Rechtstexte
- `index.html` ist komplett eigenständig (CSS und JavaScript eingebettet) und lässt sich direkt per Doppelklick im Browser öffnen.

**Gestaltungsprinzip „Spiegelbild → Abdruck“**
Jeder Stempel wird spiegelverkehrt gefertigt und erst im Abdruck lesbar. Daraus folgen alle Elemente:
- Startseite: Buchstaben drehen sich von spiegelverkehrt zu lesbar; eine Gummiplatte wird gewendet, aufgedrückt und hinterlässt einen Abdruck mit Tagesdatum.
- Adressänderung: alte Adresse wird durchgestrichen, „Neue Adresse“ wird aufgestempelt.
- Geschichte: Jahreszahl 1924 rollt wie ein Paginierstempel.
- Sortiment als Setzkasten (Hommage an den Schriftsetzer Ortwin Pestka).
- „Ausprobieren“: Live-Vorschau von Gummiplatte und Abdruck, sendet keine Daten.
- „Anfrage“: eigenständiges Anfrageformular (öffnet das E-Mail-Programm).
- Öffnungszeiten als Datumsstempel (GEÖFFNET/GESCHLOSSEN).
Farbpalette: Hellgrün (#a6dc7e) und Grautöne, dunkleres Grün (#33702a) für lesbaren Text.
Alle Animationen nutzen eine gemeinsame Bewegungskurve, laufen einmalig ab und werden bei „Bewegung reduzieren“ abgeschaltet.

**Veröffentlichen:** Alle Dateien dieses Ordners per FTP in das Webverzeichnis von stempel-pestka.de hochladen. Kein Build-Schritt nötig.

**Vor dem Livegang prüfen**
- Umsatzsteuer-ID im Impressum ergänzen (falls vorhanden, siehe Kommentar in `impressum.html`)
- Ob die Siegelerlaubnis für Dienstsiegel (Land Niedersachsen) auf die neue Inhaberin übergegangen ist – dann kann sie wieder erwähnt werden
- Öffnungszeiten und E-Mail-Adresse bestätigen
