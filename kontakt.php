<?php
/**
 * Kontaktformular-Handler – Webdesign Janosch Krause
 *
 * Nimmt Anfragen aus dem Formular auf der Website entgegen,
 * speichert sie als Sicherung im Ordner /anfragen und
 * schickt sie per E-Mail an die unten eingetragene Adresse.
 *
 * Voraussetzung: Webhosting mit PHP (z. B. IONOS, Strato, All-Inkl, Hostinger).
 */

// ===================== EINSTELLUNGEN =====================
const EMPFAENGER   = 'kontakt@deine-domain.de';      // <- Hier Ihre E-Mail-Adresse eintragen
const ABSENDER     = 'website@deine-domain.de';      // <- Adresse Ihrer eigenen Domain (wichtig gegen Spam-Filter)
const BETREFF      = 'Neue Projektanfrage über die Website';
const SPEICHERN    = true;                           // Anfragen zusätzlich als Datei sichern
const SPEICHERPFAD = __DIR__ . '/anfragen';
const MIN_SEKUNDEN_ZWISCHEN_ANFRAGEN = 30;           // einfacher Schutz gegen Mehrfach-Absendungen
// =========================================================

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function antwort(int $status, bool $ok, string $message = ''): void {
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function feld(string $name, int $max = 500): string {
    $wert = isset($_POST[$name]) && is_string($_POST[$name]) ? trim($_POST[$name]) : '';
    $wert = str_replace(["\r\n", "\r"], "\n", $wert);
    return mb_substr($wert, 0, $max);
}

function einzeilig(string $wert): string {
    // verhindert Header-Injection
    return trim(preg_replace('/[\r\n\t]+/', ' ', $wert));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    antwort(405, false, 'Methode nicht erlaubt.');
}

// Honeypot: Bots füllen dieses unsichtbare Feld aus
if (feld('website') !== '') {
    antwort(200, true);
}

// Einfache Drosselung pro Browser-Sitzung
session_start();
$jetzt = time();
if (isset($_SESSION['letzte_anfrage']) && ($jetzt - $_SESSION['letzte_anfrage']) < MIN_SEKUNDEN_ZWISCHEN_ANFRAGEN) {
    antwort(429, false, 'Bitte warten Sie einen Moment, bevor Sie erneut senden.');
}

$name      = einzeilig(feld('name', 120));
$email     = einzeilig(feld('email', 160));
$firma     = einzeilig(feld('firma', 160));
$telefon   = einzeilig(feld('telefon', 60));
$seiten    = einzeilig(feld('seiten', 80));
$budget    = einzeilig(feld('budget', 80));
$nachricht = feld('nachricht', 5000);
$consent   = feld('datenschutz', 5) === 'ja';

$leistungen = [];
if (isset($_POST['leistungen']) && is_array($_POST['leistungen'])) {
    foreach (array_slice($_POST['leistungen'], 0, 10) as $l) {
        if (is_string($l)) $leistungen[] = einzeilig(mb_substr($l, 0, 60));
    }
}

if ($name === '' || $nachricht === '') {
    antwort(422, false, 'Bitte füllen Sie alle Pflichtfelder aus.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    antwort(422, false, 'Bitte geben Sie eine gültige E-Mail-Adresse an.');
}
if (!$consent) {
    antwort(422, false, 'Bitte stimmen Sie der Datenverarbeitung zu.');
}

$zeitpunkt = date('d.m.Y H:i');
$text  = "Neue Anfrage vom {$zeitpunkt}\n";
$text .= str_repeat('-', 40) . "\n";
$text .= "Name:        {$name}\n";
$text .= "E-Mail:      {$email}\n";
$text .= "Unternehmen: " . ($firma ?: '–') . "\n";
$text .= "Telefon:     " . ($telefon ?: '–') . "\n";
$text .= "Leistungen:  " . ($leistungen ? implode(', ', $leistungen) : '–') . "\n";
$text .= "Seitenzahl:  " . ($seiten ?: 'Noch unklar') . "\n";
$text .= "Budget:      " . ($budget ?: 'Keine Angabe') . "\n";
$text .= str_repeat('-', 40) . "\n\n";
$text .= $nachricht . "\n";

// 1) Sicherung als Datei
$gespeichert = false;
if (SPEICHERN) {
    if (!is_dir(SPEICHERPFAD)) {
        @mkdir(SPEICHERPFAD, 0750, true);
    }
    $htaccess = SPEICHERPFAD . '/.htaccess';
    if (!file_exists($htaccess)) {
        @file_put_contents($htaccess, "Require all denied\nDeny from all\n");
    }
    $datei = SPEICHERPFAD . '/' . date('Y-m-d_H-i-s') . '_' . bin2hex(random_bytes(3)) . '.txt';
    $gespeichert = @file_put_contents($datei, $text) !== false;
}

// 2) Versand per E-Mail
$header = [
    'From: Website-Kontaktformular <' . ABSENDER . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . phpversion(),
];
$betreff = '=?UTF-8?B?' . base64_encode(BETREFF . ' – ' . $name) . '?=';
$gesendet = @mail(EMPFAENGER, $betreff, $text, implode("\r\n", $header));

if (!$gesendet && !$gespeichert) {
    antwort(500, false, 'Die Anfrage konnte leider nicht gesendet werden. Bitte versuchen Sie es später erneut.');
}

$_SESSION['letzte_anfrage'] = $jetzt;
antwort(200, true, 'Vielen Dank! Ihre Anfrage ist eingegangen.');
