#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR/backend"

echo "========================================"
echo "Backend CI Check"
echo "========================================"

npm ci

npm run lint --if-present
npm run typecheck --if-present
npm run build
npm test --if-present

echo "✅ Backend check passed"
