#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "========================================"
echo "Running production-safe project checks"
echo "========================================"
echo "Current blocking checks: backend build + client build"
echo "Lint is intentionally not blocking yet because existing UI files have lint debt."
echo ""

"$ROOT_DIR/scripts/ci/build-all.sh"

echo ""
echo "✅ Production-safe checks passed"
