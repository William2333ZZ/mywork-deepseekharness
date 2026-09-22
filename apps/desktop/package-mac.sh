#!/usr/bin/env bash
# Wrap apps/desktop/dist/mac-arm64/MyWork DSH.app into a dmg (run after `node build.mjs mac-arm64`).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/dist/mac-arm64"
OUT="$HERE/dist/MyWork-DSH-mac-arm64.dmg"
[ -d "$SRC/MyWork DSH.app" ] || { echo "build the app first: node build.mjs mac-arm64"; exit 1; }
rm -f "$OUT"
STAGE="$(mktemp -d)"
cp -R "$SRC/MyWork DSH.app" "$STAGE/"
cp "$SRC/README.txt" "$STAGE/" 2>/dev/null || true
ln -s /Applications "$STAGE/Applications"
hdiutil create -volname "MyWork DSH" -srcfolder "$STAGE" -ov -format UDZO "$OUT"
rm -rf "$STAGE"
echo "OK → $OUT"
