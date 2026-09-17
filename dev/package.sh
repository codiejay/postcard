#!/usr/bin/env bash
# Build a distributable zip: only what the extension actually loads.
# The README, the licence and anything in dev/ stay out.
set -euo pipefail

cd "$(dirname "$0")/.."
VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
# Deliberately NOT versioned. GitHub's permanent link is
# /releases/latest/download/<asset-name>, which resolves by FILENAME — put the
# version in the name and every release breaks the link on the portfolio page.
# The version lives in the manifest and the release tag.
OUT="postcard.zip"

rm -f "$OUT"
zip -r -q "$OUT" \
  manifest.json \
  src/ \
  studio/ \
  assets/ \
  -x '*.DS_Store'

echo "built  $OUT  v${VERSION}  ($(du -h "$OUT" | cut -f1))"
echo
echo "contents:"
unzip -Z1 "$OUT" | sed "s/^/  /"
