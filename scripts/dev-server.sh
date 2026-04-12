#!/usr/bin/env bash
# Boots `vercel dev` on a fixed port. `exec`s so signals from the harness
# propagate cleanly to vercel/node — TaskStop kills the subprocess instead of
# orphaning it.
#
# Usage:  ./scripts/dev-server.sh [PORT]    (default: 3001)
#
# If the target port is in use, this script REFUSES to boot and exits with a
# message. An earlier version force-killed stale node processes first, but
# that interacted badly with vercel dev's own cleanup — vercel would try to
# kill sibling processes that no longer existed and exit with a crash chain.
# Manually free the port before re-running: `taskkill //F //PID <pid>`.

set -euo pipefail

PORT="${1:-3001}"

if netstat -ano 2>/dev/null | awk -v port=":$PORT" '$2 ~ port && $4 == "LISTENING" { found=1 } END { exit !found }'; then
  echo "Port $PORT is already in use. Free it first:" >&2
  netstat -ano 2>/dev/null | awk -v port=":$PORT" '$2 ~ port && $4 == "LISTENING" { print "  PID", $NF }' >&2
  echo "Then re-run: ./scripts/dev-server.sh $PORT" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
[ -f .env.local ] && source .env.local
set +a

export NODE_ENV=development

# vercel dev on Windows has a known subprocess-cleanup bug: it periodically
# calls `taskkill /pid ... /T /F` on a child process that already exited and
# crashes the whole dev server. Auto-restart on exit so test runs aren't
# blocked waiting on a dead port.
while true; do
  echo "[dev-server] booting vercel dev on :$PORT ($(date +%H:%M:%S))"
  vercel dev --listen "$PORT" --yes
  code=$?
  echo "[dev-server] vercel dev exited with code $code ($(date +%H:%M:%S)); restarting in 2s"
  sleep 2
done
