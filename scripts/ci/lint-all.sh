#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run_lint() {
  local app_dir="$1"

  echo ""
  echo "========================================"
  echo "Linting $app_dir"
  echo "========================================"

  cd "$ROOT_DIR/$app_dir"
  npm ci
  npm run lint --if-present
}

run_lint "backend"
run_lint "client"

echo ""
echo "✅ Lint passed"
