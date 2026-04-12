#!/usr/bin/env bash
# Boots `vercel dev` on a fixed port, killing any stale node process holding it
# first. `exec`s so signals from the harness propagate cleanly to vercel/node —
# TaskStop kills the subprocess instead of orphaning it.
#
# Usage:  ./scripts/dev-server.sh [PORT]    (default: 3001)

set -euo pipefail

PORT="${1:-3001}"

# Kill anything on the target port (Windows-native taskkill via Git Bash).
while read -r pid; do
  [ -n "$pid" ] && taskkill //F //PID "$pid" >/dev/null 2>&1 || true
done < <(netstat -ano 2>/dev/null | awk -v port=":$PORT" '$2 ~ port && $4 == "LISTENING" { print $NF }' | sort -u)

# Load .env.local so vercel dev sees POSTGRES_URL / JWT_SECRET / etc.
set -a
# shellcheck disable=SC1091
[ -f .env.local ] && source .env.local
set +a

# Development-only rate-limit bypass (see api/lib/rateLimit.js).
export NODE_ENV=development

exec vercel dev --listen "$PORT" --yes
