"""Erzeugt die Auslieferungsdateien in dist/:
- astoria-website.html  – komplette Website in EINER Datei (Doppelklick genügt, auch offline)
- astoria-website.zip   – dieselbe Website als Ordner mit getrennten Dateien, bereit zum Hochladen
"""
import base64, pathlib, re, zipfile

root = pathlib.Path(__file__).parent
dist = root / "dist"
dist.mkdir(exist_ok=True)
FILES = ["index.html", "style.css", "main.js", "fonts/fonts.css",
         "fonts/cormorant-garamond-latin.woff2", "fonts/inter-latin.woff2", "fonts/inter-greek.woff2"]

# 1) Einzeldatei: Schriften als Base64, CSS und JS inline
fonts_css = (root / "fonts/fonts.css").read_text()
fonts_css = re.sub(r'url\("([^"]+\.woff2)"\)', lambda m: 'url("data:font/woff2;base64,%s")'
                   % base64.b64encode((root / "fonts" / m.group(1)).read_bytes()).decode(), fonts_css)
html = (root / "index.html").read_text()
html = html.replace('<link rel="stylesheet" href="fonts/fonts.css">', "<style>\n" + fonts_css + "</style>")
html = html.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + (root / "style.css").read_text() + "</style>")
html = html.replace('<script src="main.js"></script>', "<script>\n" + (root / "main.js").read_text() + "</script>")
assert 'href="style.css"' not in html and 'src="main.js"' not in html
(dist / "astoria-website.html").write_text(html)

# 2) ZIP mit Ordnerstruktur
with zipfile.ZipFile(dist / "astoria-website.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for f in FILES:
        z.write(root / f, "astoria-website/" + f)
    z.writestr("astoria-website/LIESMICH.txt", (root / "LIESMICH.txt").read_text())

for f in sorted(dist.iterdir()):
    print(f.name, f.stat().st_size // 1024, "KB")
