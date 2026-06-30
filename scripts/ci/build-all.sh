#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "Building backend"
echo "========================================"

cd "$ROOT_DIR/backend"
npm ci
npm run build

echo "========================================"
echo "Building client"
echo "========================================"

cd "$ROOT_DIR/client"
npm ci
npm run build

echo ""
echo "✅ Backend and client builds completed"
