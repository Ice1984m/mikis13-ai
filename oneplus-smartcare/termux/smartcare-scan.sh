#!/data/data/com.termux/files/usr/bin/bash
# Read-only inventory and SHA-256 report. Never executes or deletes files.
set -u
BASE="$HOME/storage/shared"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BASE/Download/SmartCare-Termux-$STAMP.txt"
mkdir -p "$BASE/Download" 2>/dev/null || {
  echo "Geen toegang tot gedeelde opslag. Voer termux-setup-storage uit."
  exit 1
}
{
  echo "ONEPLUS SMARTCARE TERMUX REPORT"
  echo "Date: $(date)"
  echo "Mode: READ ONLY"
  echo "No files are modified, moved, executed, or deleted."
  echo
  for dir in Download Documents DCIM Pictures Movies Android/media; do
    target="$BASE/$dir"
    echo "===== $dir ====="
    if [ -d "$target" ]; then
      find "$target" -type f -print0 2>/dev/null |
      while IFS= read -r -d '' file; do
        stat -c '%s bytes | %n' "$file" 2>/dev/null || true
        case "$file" in
          *.apk|*.APK|*.sh|*.py|*.js|*.jar) sha256sum "$file" 2>/dev/null || true ;;
        esac
      done
    else
      echo "Unavailable"
    fi
    echo
  done
  echo "NOTE: hashes are integrity identifiers, not malware verdicts."
  echo "SCAN COMPLETE"
} > "$OUT"
echo "Rapport: $OUT"
