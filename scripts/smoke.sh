#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-https://myhomestaging.ru}"
PAGES=(
  "/"
  "/portfolio"
  "/blog"
  "/blog/kedrova-kvartira-pod-sdashu"
)

failures=0
for p in "${PAGES[@]}"; do
  url="$BASE$p"
  html=$(curl -sf --compressed -m 30 -A "myhomestaging-smoke/1.0" "$url" || true)
  if [ -z "$html" ]; then
    echo "FAIL $p — empty response or non-2xx"
    failures=$((failures + 1))
    continue
  fi
  if ! echo "$html" | grep -q '<h1'; then
    echo "FAIL $p — no <h1> in HTML"
    failures=$((failures + 1))
    continue
  fi
  if ! echo "$html" | grep -q 'application/ld+json'; then
    echo "FAIL $p — no JSON-LD"
    failures=$((failures + 1))
    continue
  fi
  echo "OK   $p"
done

if [ "$failures" -gt 0 ]; then
  echo
  echo "Smoke failed: $failures page(s)"
  exit 1
fi

echo
echo "Smoke passed: ${#PAGES[@]} page(s)"
