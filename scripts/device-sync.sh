#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

REPO="Ice1984m/mikis13-ai"
PROJECT="$HOME/mikis13-ai"
STORE="$HOME/mikis13-certificates"

mkdir -p "$STORE"
chmod 700 "$STORE"

cd "$PROJECT"

git fetch origin
git checkout main
git pull --ff-only origin main

python scripts/sync-certificates.py

cp CERTIFICATES.md "$STORE/CERTIFICATES.md"
cp credentials/state.json "$STORE/state.json"

chmod 600 \
  "$STORE/CERTIFICATES.md" \
  "$STORE/state.json"

echo
echo "Lokale kopie bijgewerkt:"
echo "$STORE/CERTIFICATES.md"
