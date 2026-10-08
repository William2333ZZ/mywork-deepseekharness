#!/usr/bin/env bash
# Build the web version of the phone app (apps/mobile, Expo web) into ./public for the relay to serve, with the
# security headers for it. The CSP lets the page talk only to this relay (wss) and run only its own scripts.
#   RELAY_HOST=mywork-relay.a313295747.workers.dev bash build-web.sh && npx wrangler deploy
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="${RELAY_HOST:-mywork-relay.a313295747.workers.dev}"
cd "$HERE/../mobile"
rm -rf dist
npx expo export --platform web --output-dir dist >/dev/null
rm -rf "$HERE/public"
mv dist "$HERE/public"
cat > "$HERE/public/_headers" <<HEADERS
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' wss://$HOST; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/_expo/static/*
  Cache-Control: public, max-age=31536000, immutable
HEADERS
echo "web version built into $HERE/public for $HOST"
