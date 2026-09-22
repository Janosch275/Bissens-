"""Erzeugt die Auslieferungsdateien in dist/:
- printcut-website-verkauf.zip   – fertige Website als Ordner (getrennte Dateien), bereit zum Hochladen
- printcut-website-vorschau.zip  – EINE HTML-Datei mit allem eingebettet (Doppelklick genügt, auch offline),
                                   mit Hinweis „Vorschau“ und noindex – zum Zeigen/Versenden an Kunden
- printcut-vorschau.html         – dieselbe Vorschau-Datei ungezippt
"""
import base64, mimetypes, pathlib, re, zipfile

root = pathlib.Path(__file__).parent
dist = root / "dist"
dist.mkdir(exist_ok=True)
NAME = "printcut-website"
FILES = ["index.html", "style.css", "main.js", "fonts/fonts.css",
         *sorted(str(p.relative_to(root)) for p in (root / "fonts").glob("*.woff2")),
         *sorted(str(p.relative_to(root)) for p in (root / "assets").iterdir())]


def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if path.suffix == ".woff2":
        mime = "font/woff2"
    return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode())


# 1) Verkauf: ZIP mit Ordnerstruktur
with zipfile.ZipFile(dist / f"{NAME}-verkauf.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for f in FILES:
        z.write(root / f, f"{NAME}/{f}")
    z.writestr(f"{NAME}/LIESMICH.txt", (root / "LIESMICH.txt").read_text())

# 2) Vorschau: Einzeldatei – Schriften, Bilder, CSS und JS eingebettet
fonts_css = re.sub(r'url\("([^"]+\.woff2)"\)', lambda m: 'url("%s")' % data_uri(root / "fonts" / m.group(1)),
                   (root / "fonts/fonts.css").read_text())
html = (root / "index.html").read_text()
html = html.replace('<link rel="stylesheet" href="fonts/fonts.css">', "<style>\n" + fonts_css + "</style>")
html = html.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + (root / "style.css").read_text() + "</style>")
html = html.replace('<script src="main.js"></script>', "<script>\n" + (root / "main.js").read_text() + "</script>")
html = re.sub(r'(src|href)="(assets/[^"]+)"', lambda m: '%s="%s"' % (m.group(1), data_uri(root / m.group(2))), html)
html = html.replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n  <meta name="viewport"', 1)
badge = ('<div style="position:fixed;left:16px;bottom:16px;z-index:40;background:#221d16;color:#fff;'
         'font:500 12px/1 \'IBM Plex Mono\',monospace;letter-spacing:.1em;text-transform:uppercase;'
         'padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.35);box-shadow:0 6px 18px rgba(0,0,0,.25);pointer-events:none;opacity:.9">'
         'Vorschau · Entwurf</div>\n')
html = html.replace("<script>\n", badge + "<script>\n", 1)
assert 'href="style.css"' not in html and 'src="main.js"' not in html and '"assets/' not in html
(dist / "printcut-vorschau.html").write_text(html)
with zipfile.ZipFile(dist / f"{NAME}-vorschau.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("printcut-vorschau.html", html)
    z.writestr("HINWEIS.txt", "PRINT & CUT Werbetechnik – Website-Vorschau\n\n"
               "printcut-vorschau.html per Doppelklick im Browser öffnen (funktioniert auch offline,\n"
               "am Handy z. B. über die Dateien-App). Dies ist ein Entwurf zur Ansicht.\n")

for f in sorted(dist.iterdir()):
    print(f.name, f.stat().st_size // 1024, "KB")
