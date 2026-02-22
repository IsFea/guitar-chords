#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$DIR/.server.pid"
PORT_FILE="$DIR/.server.port"
LOG_FILE="$DIR/.server.log"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
    PORT="$(cat "$PORT_FILE" 2>/dev/null || true)"
    echo "Server already running (pid=$PID, port=${PORT:-unknown})"
    exit 0
  fi
  rm -f "$PID_FILE" "$PORT_FILE"
fi

PORT="$(
python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"

nohup python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$DIR" >"$LOG_FILE" 2>&1 &
PID=$!

sleep 0.2
if ! kill -0 "$PID" 2>/dev/null; then
  echo "Failed to start server. See $LOG_FILE"
  exit 1
fi

echo "$PID" > "$PID_FILE"
echo "$PORT" > "$PORT_FILE"

echo "Started: http://127.0.0.1:$PORT (pid=$PID)"
