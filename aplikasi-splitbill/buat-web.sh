#!/usr/bin/env bash
# Bangun versi coba gratis (web) ke public/splitbill/coba/ → tayang di willoapparel.com/splitbill/coba/
set -euo pipefail
cd "$(dirname "$0")"
OUT=$(mktemp -d)
npx expo export -p web --output-dir "$OUT"
sed -i 's/<html lang="en">/<html lang="id">/' "$OUT/index.html"
rm -f "$OUT/metadata.json"
rm -rf ../public/splitbill/coba
mkdir -p ../public/splitbill
cp -r "$OUT" ../public/splitbill/coba
echo "OK → public/splitbill/coba/"
