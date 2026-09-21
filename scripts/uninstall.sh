#!/usr/bin/env bash
# Remove the MyWork Kit and all its members from a dsh profile (default: web).
set -euo pipefail
PROFILE="${1:-web}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH="${DSH:-dsh}"
names=(dsh-mywork-kit)
while IFS= read -r n; do names+=("$n"); done < <(node -e 'for (const m of require(process.argv[1]).members) console.log(m.name)' "$ROOT/packages/kit/kit.json")
echo "== removing from profile '$PROFILE': ${names[*]}"
"$DSH" plugin --profile "$PROFILE" remove "${names[@]}" || true
echo "== done; restart dsh."
