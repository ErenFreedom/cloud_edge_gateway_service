#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$BRANCH" == "HEAD" ]]; then
  echo "❌ You are in detached HEAD state. Checkout a branch first."
  exit 1
fi

echo "========================================"
echo "Sync current branch to personal backup"
echo "========================================"
echo "Current branch: $BRANCH"

git fetch origin "$BRANCH"
git push personal "$BRANCH"

echo ""
echo "✅ Synced $BRANCH to personal backup"
