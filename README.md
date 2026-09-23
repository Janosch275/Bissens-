# Bissen

Minimalistischer Kalorien- und Eiweiß-Tracker fürs Handy. Bissen ist eine installierbare Web-App (PWA): kein App Store, kein Konto, funktioniert offline. Alle Daten bleiben auf dem Gerät.

## Was Bissen anders macht

- **Eintragen per Satz.** Du tippst zum Beispiel `200g Hähnchen, 2 Eier und eine Banane`, und Bissen erkennt Mengen, Einheiten (g, ml, EL, Scheiben, Stück …) und Lebensmittel automatisch.
- **„Was passt noch?“** schlägt Lebensmittel vor, die in dein restliches Kalorienbudget passen. Solange dir noch Eiweiß fehlt, stehen eiweißreiche Lebensmittel vorn.
- **Wochenbilanz** statt starrer Tagesgrenzen: Du siehst, wie viel Spielraum du über die Woche hast.
- **„Wie gestern“** trägt eine Mahlzeit vom Vortag mit einem Tipp erneut ein. Häufige Lebensmittel lassen sich mit der zuletzt genutzten Menge per `+` eintragen.
- **Mahlzeiten-Vorlagen und Favoriten** für Dinge, die du oft isst.
- **Barcode-Scan und Online-Suche** über [Open Food Facts](https://openfoodfacts.org), außerdem eigene Lebensmittel.
- **Eiweißdichte** (g Eiweiß pro 100 kcal) bei jedem Lebensmittel, dazu ein `Eiweiß+`-Badge für besonders eiweißreiche.
- **Gewichtstrend** als 7-Tage-Durchschnitt, damit Wasserschwankungen nicht verwirren.
- Wassertracker, Streak, Dark Mode, Rückgängig nach jedem Eintrag, Backup als JSON-Datei.

## Starten

```bash
npm start     # lokaler Server auf http://localhost:8080
npm test      # Unit-Tests (Parser, Suche, Berechnungen)
```

Ein Build-Schritt ist nicht nötig. Die App besteht nur aus statischen Dateien (HTML, CSS, JavaScript-Module).

## Aufs Handy bringen

1. Die Dateien bei einem statischen Hoster veröffentlichen, zum Beispiel **GitHub Pages** (Repository → Settings → Pages → Branch wählen), Netlify oder Vercel. HTTPS ist Pflicht, damit Offline-Modus und Kamera funktionieren.
2. Die Adresse auf dem Handy öffnen.
   - **iPhone:** Safari → Teilen → *Zum Home-Bildschirm*
   - **Android:** Chrome → Menü → *App installieren*

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | App-Gerüst und Tab-Leiste |
| `css/app.css` | Design (Hell/Dunkel über `prefers-color-scheme`) |
| `js/app.js` | Ansichten, Bottom-Sheets und Interaktionen |
| `js/nutrition.js` | Logik ohne DOM: Satz-Parser, Suche, Nährwerte, Zielberechnung (Mifflin-St Jeor), Vorschläge |
| `js/foods.js` | Eingebaute Lebensmittel-Datenbank (Werte pro 100 g) |
| `js/store.js` | Speicherung in `localStorage` |
| `js/off.js` | Open Food Facts (Barcode, Online-Suche) und Kamera-Scan |
| `sw.js` | Service Worker für den Offline-Betrieb |

Die Nährwerte sind Richtwerte und ersetzen keine medizinische Beratung.
