#!/data/data/com.termux/files/usr/bin/bash
set -eu
MODULE="$(cd "$(dirname "$0")/.." && pwd)"
test -s "$MODULE/prompts/master.txt"
test -s "$MODULE/examples/oefeningen.md"
test -d "$HOME/.local/src/llama.cpp"
echo "PASS: master prompt aanwezig"
echo "PASS: oefeningen aanwezig"
echo "PASS: llama.cpp-broncode aanwezig"
