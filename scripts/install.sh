#!/usr/bin/env bash
# Install the MyWork Kit into a dsh profile (default: web).
#
#   bash scripts/install.sh            # profile "web", everything from npm + this checkout
#   bash scripts/install.sh myprofile  # another profile
#   MODE=npm bash scripts/install.sh   # published packages only (after `pnpm publish`)
#
# What it does: builds the in-repo plugins, then runs `dsh plugin --profile <p> add …`
# for the kit itself (link: in dev mode) and every member listed in packages/kit/kit.json.
# dsh reconciles `dsh.profile.bundles` after each add; restart dsh afterwards.
set -euo pipefail
PROFILE="${1:-web}"
MODE="${MODE:-dev}"          # dev = link: local checkouts; npm = published names
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH="${DSH:-dsh}"

command -v "$DSH" >/dev/null 2>&1 || { echo "dsh not found on PATH (npm i -g @deepseek-ai/dsh, or set DSH=/path/to/dsh)"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required by dsh plugin (npm i -g pnpm)"; exit 1; }

echo "== installing workspace deps"
(cd "$ROOT" && pnpm install)
echo "== building in-repo plugins"
for p in shell schedule browser mcp kit; do (cd "$ROOT/packages/$p" && node "$ROOT/scripts/build-client.mjs" .); done
(cd "$ROOT/packages/codex-ui" && pnpm run --silent build >/dev/null 2>&1)

specs=()
if [ "$MODE" = "dev" ]; then
  specs+=("$ROOT/packages/kit")
  # local members (kit.json entries with a "local" path)
  while IFS= read -r rel; do specs+=("$ROOT/packages/kit/$rel"); done < <(node -e 'for (const m of require(process.argv[1]).members) if (m.local) console.log(m.local)' "$ROOT/packages/kit/kit.json")
else
  specs+=("dsh-mywork-kit")
fi
# community members (no "local" path): name@range
while IFS= read -r spec; do specs+=("$spec"); done < <(node -e 'for (const m of require(process.argv[1]).members) if (!m.local || process.env.MODE === "npm") console.log(m.range ? m.name + "@" + m.range : m.name)' "$ROOT/packages/kit/kit.json")

echo "== installing into profile '$PROFILE':"
printf '   %s\n' "${specs[@]}"
"$DSH" plugin --profile "$PROFILE" add "${specs[@]}"
node "$ROOT/scripts/profile-fixups.mjs" "$PROFILE"

echo
echo "== done. Verify the layers, then (re)start:"
echo "   $DSH --profile $PROFILE --dump-config | grep '^# =='"
echo "   $DSH $PROFILE"
