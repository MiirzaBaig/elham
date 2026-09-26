#!/bin/sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/appointment-booking-api.zip"
cd "$ROOT"
rm -f "$OUT"
zip -r "$OUT" . \
  -x 'node_modules/*' \
  -x 'dist/*' \
  -x 'coverage/*' \
  -x 'demo-ui/*' \
  -x 'demo-ui/**/*' \
  -x '.env' \
  -x '.env.test' \
  -x '.env.local' \
  -x '*.zip' \
  -x '.DS_Store'
echo "Created $OUT"
