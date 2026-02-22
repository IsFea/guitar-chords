#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$DIR/.server.pid"
PORT_FILE="$DIR/.server.port"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No PID file, server is not running."
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || true)"
PORT="$(cat "$PORT_FILE" 2>/dev/null || true)"

if [[ -z "${PID:-}" ]]; then
  rm -f "$PID_FILE" "$PORT_FILE"
  echo "PID file was empty. Cleaned up."
  exit 0
fi

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  for _ in {1..20}; do
    if ! kill -0 "$PID" 2>/dev/null; then
      break
    fi
    sleep 0.1
  done
  if kill -0 "$PID" 2>/dev/null; then
    kill -9 "$PID" 2>/dev/null || true
  fi
  echo "Stopped server (pid=$PID, port=${PORT:-unknown})"
else
  echo "Process $PID is not running. Cleaning up stale files."
fi

rm -f "$PID_FILE" "$PORT_FILE"
