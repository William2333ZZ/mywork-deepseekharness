#!/usr/bin/env bash
# Create an isolated dsh test environment (never touches ~/.dsh) and run the
# web profile with this repo's plugins linked in.
#
#   bash scripts/dev-env.sh            # install dsh from npm into .dsh-dev-home/, link plugins, start web on :3090
#   bash scripts/dev-env.sh restart    # rebuild client bundles and restart the server
#   bash scripts/dev-env.sh stop
#
# Requirements: Node >= 24 on PATH (dsh's npm entry uses import.meta.main; on
# macOS: `brew install node@24` then PATH=/opt/homebrew/opt/node@24/bin:$PATH), pnpm.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV="$ROOT/.dsh-dev-home"
export DSH_HOME="$DEV/home"
PORT="${PORT:-3090}"
BIN="$DEV/npm/node_modules/@deepseek-ai/dsh/lib/bin.js"
LOG="$DEV/web.log"
cmd="${1:-start}"

# dsh's npm entry needs Node >= 24; fall back to Homebrew's node@24 when the default node is older.
major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$major" -lt 24 ]; then
  for cand in /opt/homebrew/opt/node@24/bin /usr/local/opt/node@24/bin; do
    if [ -x "$cand/node" ]; then export PATH="$cand:$PATH"; major=24; break; fi
  done
fi
[ "$major" -ge 24 ] || { echo "Node >= 24 required (found $(node --version 2>/dev/null)); on macOS: brew install node@24"; exit 1; }

# Optional: seed a workspace so the composer is usable right away (DEV_WORKSPACE=/abs/path; default: this repo).
seed_workspace() {
  local ws; ws="$(cd "${DEV_WORKSPACE:-$ROOT}" && pwd -P)"
  local file="$DSH_HOME/storages/workspace.json"
  node - "$file" "$ws" <<'JS'
const fs = require('node:fs'); const [file, ws] = process.argv.slice(2)
let doc; try { doc = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { doc = { unit: { name: 'workspace', version: 2 }, global: { initialized: true, workspaceIds: [], archivedSessionIds: [] }, tables: { workspaces: {} } } }
if (Object.values(doc.tables.workspaces).some((w) => w.path === ws)) process.exit(0)
const id = require('node:crypto').randomUUID(); const now = new Date().toISOString()
doc.tables.workspaces[id] = { path: ws, title: require('node:path').basename(ws), sessionIds: [], createdAt: now, updatedAt: now }
doc.global.workspaceIds = [...(doc.global.workspaceIds || []), id]
fs.mkdirSync(require('node:path').dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n')
console.log('seeded workspace ' + ws)
JS
}

stop() { pkill -f "dsh/lib/bin.js web --port $PORT" 2>/dev/null || true; }
build() { (cd "$ROOT" && pnpm install >/dev/null); for p in shell schedule browser mcp kit; do (cd "$ROOT/packages/$p" && node "$ROOT/scripts/build-client.mjs" .); done; (cd "$ROOT/packages/codex-ui" && pnpm run --silent build >/dev/null 2>&1); }
start() {
  stop; sleep 1
  # `;` not `&&`: the & must apply to nohup alone, or the subshell waits for the server and hangs pipelines.
  # Run from the repo root (= the seeded workspace): plugins that default a cwd to process.cwd()
  # (e.g. IM accounts) then point at a registered workspace instead of .dsh-dev-home.
  (cd "$ROOT"; nohup node "$BIN" web --port "$PORT" --no-open > "$LOG" 2>&1 < /dev/null & disown)
  for _ in $(seq 1 40); do sleep 1; grep -q "dsh web:" "$LOG" 2>/dev/null && break; done
  cat "$LOG"
}

case "$cmd" in
  stop) stop ;;
  restart) build; start ;;
  start)
    mkdir -p "$DEV/npm" "$DSH_HOME"
    if [ ! -f "$BIN" ]; then (cd "$DEV/npm" && npm init -y >/dev/null && npm i @deepseek-ai/dsh@alpha); fi
    build
    node "$BIN" plugin --profile web add "$ROOT/packages/kit" "$ROOT/packages/codex-ui" "$ROOT/packages/shell" "$ROOT/packages/schedule" "$ROOT/packages/browser" "$ROOT/packages/mcp"
    if [ "${MEMBERS:-yes}" = "yes" ]; then
      echo "== installing community kit members (MEMBERS=no to skip)"
      specs=(); while IFS= read -r spec; do specs+=("$spec"); done < <(node -e 'for (const m of require(process.argv[1]).members) if (!m.local) console.log(m.range ? m.name + "@" + m.range : m.name)' "$ROOT/packages/kit/kit.json")
      node "$BIN" plugin --profile web add "${specs[@]}"
    fi
    node "$ROOT/scripts/profile-fixups.mjs" web
    seed_workspace
    start
    echo
    echo "Open the URL above. API key: 设置 → 模型 (or export DEEPSEEK_API_KEY before running this script)." ;;
  *) echo "usage: $0 [start|restart|stop]"; exit 2 ;;
esac
