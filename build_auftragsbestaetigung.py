from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (NameObject, TextStringObject, DictionaryObject, ArrayObject,
                           FloatObject, NumberObject, BooleanObject)
import sys
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Schrift einbetten, damit Sonderzeichen wie € überall gleich aussehen
FONT_DIR = "/usr/share/fonts/truetype/liberation/"
pdfmetrics.registerFont(TTFont("Sans", FONT_DIR + "LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", FONT_DIR + "LiberationSans-Bold.ttf"))

OUT = sys.argv[1]
TMP = OUT + ".tmp.pdf"

W, H = A4
L, R = 62, W - 62
CW = R - L
BLUE = HexColor("#34497A")
GRAY = HexColor("#6B7280")
LINE = HexColor("#D9DCE3")
HEAD = HexColor("#E8EAF3")

c = canvas.Canvas(TMP, pagesize=A4)
c.setTitle("Auftragsbestätigung")
c.setAuthor("Webdesign Janosch Krause")
form = c.acroForm
sig_fields = []   # (name, rect)
num_fields = []   # price fields


def text(x, y, s, font="Sans", size=9.5, color=black, right=False):
    c.setFont(font, size)
    c.setFillColor(color)
    (c.drawRightString if right else c.drawString)(x, y, s)


def field(name, x, y, w, h, value="", tooltip="", align=0, size=9.5, underline=False, bold=False):
    form.textfield(name=name, tooltip=tooltip or name, x=x, y=y, width=w, height=h,
                   value=value, fontName="Helvetica-Bold" if bold else "Helvetica", fontSize=size,
                   borderStyle="underlined" if underline else "solid",
                   borderWidth=0.6 if underline else 0,
                   borderColor=LINE if underline else None,
                   fillColor=None, textColor=black, forceBorder=underline,
                   fieldFlags="")


def hline(x1, x2, y):
    c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(x1, y, x2, y)


def table(top, cols, rows, heights, header=False):
    """Draws grid; returns list of row-bottom y's. cols = x boundaries."""
    y = top
    ys = [top]
    for i, hgt in enumerate(heights):
        if header and i == 0:
            c.setFillColor(HEAD); c.rect(cols[0], y - hgt, cols[-1] - cols[0], hgt, stroke=0, fill=1)
        y -= hgt
        ys.append(y)
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    for yy in ys:
        c.line(cols[0], yy, cols[-1], yy)
    for xx in cols:
        c.line(xx, top, xx, y)
    return ys


# --- Briefkopf ---
y = H - 58
text(L, y, "Webdesign Janosch Krause", "Sans-Bold", 14, BLUE)
y -= 12
text(L, y, "Janosch Krause · Wilhelm-Busch-Weg 18 · 31542 Bad Nenndorf", size=8, color=GRAY)
y -= 10
text(L, y, "E-Mail: Janosch.krause2@icloud.com · Telefon: 01515 0371059", size=8, color=GRAY)

# --- Empfänger ---
y -= 30
for name, tip in [("empf_firma", "Name des Unternehmens"), ("empf_ansprechpartner", "Ansprechpartner"),
                  ("empf_strasse", "Straße, Hausnummer"), ("empf_plz_ort", "PLZ, Ort")]:
    field(name, L, y - 3, 230, 14, tooltip=tip, underline=True)
    text(L + 232, y, tip, size=6.5, color=HexColor("#B0B5C0"))
    y -= 17

# --- Titel + Kopfdaten ---
y -= 14
text(L, y, "Auftragsbestätigung", "Sans-Bold", 16)
y -= 8
cols = [L, L + 175, R]
rh = 19
ys = table(y, cols, 3, [rh] * 3)
for i, (lab, name, val) in enumerate([("Auftragsnummer", "auftragsnummer", "A-2026-001"),
                                      ("Datum", "datum", ""),
                                      ("Voraussichtliche Fertigstellung", "fertigstellung", "")]):
    text(L + 5, ys[i] - 13, lab, "Sans-Bold", 9.5)
    field(name, cols[1] + 3, ys[i + 1] + 2, cols[2] - cols[1] - 6, rh - 4, value=val, tooltip=lab)
y = ys[-1]

# --- Leistungen ---
y -= 18
text(L, y, "Vielen Dank für Ihren Auftrag. Hiermit bestätige ich folgende Vereinbarung:")
y -= 5
cols = [L, R - 95, R]
ys = table(y, cols, 5, [rh] * 5, header=True)
text(L + 5, ys[0] - 13, "Leistung", "Sans-Bold", 9.5)
text(cols[1] + 5, ys[0] - 13, "Preis (€)", "Sans-Bold", 9.5)
rows = [("leistung_1", "[Neubau / Modernisierung]: [Einseitig / Startseite + __ Unterseiten]", "preis_1"),
        ("leistung_2", "Extras", "preis_2"),
        ("leistung_3", "Entwurfspauschale (bereits bezahlt, wird angerechnet)", "preis_3")]
for i, (lname, lval, pname) in enumerate(rows, start=1):
    if lname:
        field(lname, L + 3, ys[i + 1] + 2, cols[1] - L - 6, rh - 4, value=lval, tooltip="Leistung")
    else:
        text(L + 5, ys[i] - 13, lval)
    field(pname, cols[1] + 3, ys[i + 1] + 2, cols[2] - cols[1] - 6, rh - 4, value="0,00",
          tooltip="Preis in Euro", align=2)
    num_fields.append(pname)
text(L + 5, ys[4] - 13, "Gesamt", "Sans-Bold", 9.5)
field("gesamt", cols[1] + 3, ys[5] + 2, cols[2] - cols[1] - 6, rh - 4, value="0,00",
      tooltip="Gesamtbetrag (wird automatisch berechnet)", bold=True)
y = ys[-1] - 10
text(L, y, "Endpreise, gemäß § 19 UStG ohne Umsatzsteuer.", size=7.5, color=GRAY)

# --- Lieferumfang ---
y -= 22
c.setFont("Sans-Bold", 9.5); c.setFillColor(black)
t = c.beginText(L, y); t.setLeading(12.5)
t.setFont("Sans-Bold", 9.5); t.textOut("Lieferumfang: ")
t.setFont("Sans", 9.5)
t.textLine("Website-Dateien als ZIP inklusive Bearbeitungsdatei und leeren Seiten für")
t.textLine("Impressum und Datenschutz. Nicht enthalten: Hosting, Domain, Hochladen, Pflege sowie die")
t.textLine("Inhalte von Impressum und Datenschutzerklärung.")
c.drawText(t)
y -= 3 * 12.5 + 10

# --- Vereinbarungen ---
text(L, y, "Vereinbarungen:", "Sans-Bold", 9.5)
bullets = [["Der Auftraggeber liefert Texte, Fotos und Logo und besitzt die Rechte daran."],
           ["Zahlung innerhalb von 14 Tagen nach Abnahme. Die ZIP-Datei wird nach Zahlungseingang",
            "übergeben."],
           ["Nach vollständiger Zahlung darf der Auftraggeber die Website unbegrenzt nutzen und",
            "verändern."]]
y -= 13
for b in bullets:
    text(L + 5, y, "•")
    for ln in b:
        text(L + 16, y, ln); y -= 12.5
text(L + 5, y, "•")
text(L + 16, y, "Nutzung als Referenz erlaubt:")
bx = L + 16 + c.stringWidth("Nutzung als Referenz erlaubt:", "Sans", 9.5) + 10
for val, label in [("ja", "ja"), ("nein", "nein")]:
    form.radio(name="referenz", tooltip="Nutzung als Referenz erlaubt", value=val, selected=False,
               x=bx, y=y - 2, size=10, buttonStyle="cross", shape="square",
               borderColor=GRAY, fillColor=white, textColor=black, borderWidth=0.8, forceBorder=True)
    text(bx + 14, y, label)
    bx += 14 + c.stringWidth(label, "Sans", 9.5) + 16

# --- Unterschriften ---
y -= 26
cols = [L, L + 105, L + 105 + (CW - 105) / 2, R]
hs = [24, 22, 62, 22]
ys = table(y, cols, 4, hs, header=True)
text(cols[1] + 5, ys[0] - 15, "Auftragnehmer", "Sans-Bold", 9.5)
text(cols[2] + 5, ys[0] - 15, "Auftraggeber", "Sans-Bold", 9.5)
text(L + 5, ys[1] - 14, "Ort, Datum", "Sans-Bold", 9.5)
text(L + 5, ys[2] - 14, "Unterschrift", "Sans-Bold", 9.5)
text(L + 5, ys[3] - 14, "Name", "Sans-Bold", 9.5)
cw = cols[2] - cols[1]
field("an_ort_datum", cols[1] + 3, ys[2] + 2, cw - 6, hs[1] - 4, value="Bad Nenndorf, ", tooltip="Ort, Datum")
field("ag_ort_datum", cols[2] + 3, ys[2] + 2, cw - 6, hs[1] - 4, tooltip="Ort, Datum")
text(cols[1] + 5, ys[3] - 14, "Janosch Krause")
field("ag_name", cols[2] + 3, ys[4] + 2, cw - 6, hs[3] - 4, tooltip="Name Auftraggeber")
sig_fields.append(("unterschrift_auftragnehmer", [cols[1] + 3, ys[3] + 3, cols[2] - 3, ys[2] - 3]))
sig_fields.append(("unterschrift_auftraggeber", [cols[2] + 3, ys[3] + 3, cols[3] - 3, ys[2] - 3]))
# dezente Unterschriftslinie
for x1, x2 in [(cols[1] + 10, cols[2] - 10), (cols[2] + 10, cols[3] - 10)]:
    c.setStrokeColor(HexColor("#C4C8D2")); c.setDash(1, 2); c.line(x1, ys[3] + 12, x2, ys[3] + 12); c.setDash()

c.showPage()
c.save()

# --- Nachbearbeitung: Signaturfelder, Zahlenformat, Summenberechnung ---
reader = PdfReader(TMP)
writer = PdfWriter(clone_from=reader)
page = writer.pages[0]
acro = writer._root_object["/AcroForm"]
fields = acro["/Fields"]


def js(code):
    return DictionaryObject({NameObject("/S"): NameObject("/JavaScript"),
                             NameObject("/JS"): TextStringObject(code)})


fmt = 'AFNumber_Format(2, 2, 0, 0, "", false);'
keystroke = 'AFNumber_Keystroke(2, 2, 0, 0, "", false);'
calc_order = []
for a in page["/Annots"]:
    a = a.get_object()
    name = a.get("/T")
    if name in num_fields + ["gesamt"]:
        a[NameObject("/Q")] = NumberObject(2)  # rechtsbündig
        aa = DictionaryObject({NameObject("/F"): js(fmt), NameObject("/K"): js(keystroke)})
        if name == "gesamt":
            aa[NameObject("/C")] = js('AFSimple_Calculate("SUM", new Array("%s"));' % '", "'.join(num_fields))
            calc_order.append(a.indirect_reference)
        a[NameObject("/AA")] = aa

if calc_order:
    acro[NameObject("/CO")] = ArrayObject(calc_order)

for name, rect in sig_fields:
    sig = DictionaryObject({
        NameObject("/Type"): NameObject("/Annot"),
        NameObject("/Subtype"): NameObject("/Widget"),
        NameObject("/FT"): NameObject("/Sig"),
        NameObject("/T"): TextStringObject(name),
        NameObject("/TU"): TextStringObject("Hier unterschreiben"),
        NameObject("/F"): NumberObject(4),
        NameObject("/Rect"): ArrayObject([FloatObject(v) for v in rect]),
        NameObject("/P"): page.indirect_reference,
    })
    ref = writer._add_object(sig)
    page["/Annots"].append(ref)
    fields.append(ref)

acro[NameObject("/NeedAppearances")] = BooleanObject(True)
writer.add_metadata({"/Title": "Auftragsbestätigung", "/Author": "Webdesign Janosch Krause"})
with open(OUT, "wb") as f:
    writer.write(f)

import os
os.remove(TMP)
print("wrote", OUT)
