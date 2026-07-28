#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

echo "=== Officiële Termux-certificaten installeren ==="
pkg update -y
pkg install -y ca-certificates openssl curl git gh

echo
echo "=== Certificaatmap controleren ==="
CERT_FILE="$PREFIX/etc/tls/cert.pem"
CERT_DIR="$PREFIX/etc/tls/certs"

if [ -f "$CERT_FILE" ]; then
  echo "OK: $CERT_FILE"
  openssl version
else
  echo "WAARSCHUWING: standaard certificaatbestand niet gevonden."
  echo "Voer uit: pkg reinstall ca-certificates"
  exit 1
fi

echo
echo "=== HTTPS-test ==="
curl --fail --silent --show-error https://github.com/ >/dev/null
curl --fail --silent --show-error https://developers.google.com/ >/dev/null
echo "OK: HTTPS-certificaatcontrole werkt."

echo
echo "Er zijn geen onbekende rootcertificaten toegevoegd."
echo "Installeer nooit willekeurige .cer, .crt, .p12 of .pfx-bestanden uit Telegram, darkweb of onbekende websites."
