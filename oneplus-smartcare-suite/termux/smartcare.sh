#!/data/data/com.termux/files/usr/bin/bash
# OnePlus SmartCare Security Suite - read-only Termux MVP
set -Eeuo pipefail
umask 077

if [[ ! -d "${HOME}/storage/shared" ]]; then
  echo "Gedeelde opslag niet gekoppeld. Voer eerst uit: termux-setup-storage" >&2
  exit 1
fi

ROOT="${HOME}/storage/shared"
DOWNLOAD="${ROOT}/Download"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DOWNLOAD"
REPORT="$DOWNLOAD/SmartCare-Security-$STAMP.txt"

{
  echo "ONEPLUS SMARTCARE SECURITY SUITE"
  echo "Datum: $(date -Is)"
  echo "Modus: READ-ONLY"
  echo "Apparaat: $(getprop ro.product.model 2>/dev/null || echo onbekend)"
  echo "Android: $(getprop ro.build.version.release 2>/dev/null || echo onbekend)"
  echo
  echo "== OPSLAG =="
  df -h "$ROOT" 2>/dev/null || true
  echo
  echo "== BESTANDSINVENTAR =="
  for rel in Download Documents DCIM Pictures Movies Android/media; do
    dir="$ROOT/$rel"
    echo
    echo "-- $rel --"
    if [[ -d "$dir" ]]; then
      find "$dir" -type f -printf '%s bytes | %p\n' 2>/dev/null || true
    else
      echo "Niet aanwezig of geen toegang"
    fi
  done
  echo
  echo "== BESTANDSTYPEN IN DOWNLOADS EN DOCUMENTS =="
  for dir in "$ROOT/Download" "$ROOT/Documents"; do
    if [[ -d "$dir" ]]; then
      find "$dir" -type f -print0 2>/dev/null
    fi
  done | awk -v RS='\0' '
    {
      n=split($0,a,"/");
      name=a[n];
      if (name !~ /\./) ext="[geen extensie]";
      else { sub(/^.*\./,"",name); ext="." tolower(name); }
      count[ext]++
    }
    END { for (e in count) print count[e],e }
  ' | sort -nr
  echo
  echo "== CONTROLEPUNTEN: APK / SCRIPTS / ARCHIEVEN =="
  echo "Bestandstypen zijn geen malware-oordeel."
  find "$ROOT/Download" "$ROOT/Documents" -type f \
    \( -iname '*.apk' -o -iname '*.sh' -o -iname '*.py' -o -iname '*.js' \
       -o -iname '*.jar' -o -iname '*.zip' \) -print 2>/dev/null || true
  echo
  echo "== SHA-256 VAN APK'S EN SCRIPTS =="
  while IFS= read -r -d '' f; do
    sha256sum "$f" 2>/dev/null || true
  done < <(find "$ROOT/Download" "$ROOT/Documents" -type f \
    \( -iname '*.apk' -o -iname '*.sh' -o -iname '*.py' -o -iname '*.js' \
       -o -iname '*.jar' \) -print0 2>/dev/null)
  echo
  echo "== EERDERE INVENTARIS (INDIEN AANWEZIG) =="
  if [[ -f "$DOWNLOAD/SmartCare-Security-Inventory.txt" ]]; then
    echo "Gevonden: SmartCare-Security-Inventory.txt"
    sha256sum "$DOWNLOAD/SmartCare-Security-Inventory.txt"
    cat "$DOWNLOAD/SmartCare-Security-Inventory.txt"
  else
    echo "Geen bestaand SmartCare-Security-Inventory.txt aangetroffen."
  fi
  echo
  echo "== BEPERKINGEN =="
  echo "- Alleen-lezen inventaris; geen verwijdering of wijziging."
  echo "- Geen APK's of scripts worden uitgevoerd of geïnstalleerd."
  echo "- SHA-256 is integriteitscontrole, geen malwaredetectie."
  echo "- Geen netwerkverkeer of externe upload."
  echo
  echo "SCAN VOLTOOID"
} > "$REPORT"

chmod 600 "$REPORT"
echo "Scan voltooid. Rapport: $REPORT"
