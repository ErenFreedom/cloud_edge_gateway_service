#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$BRANCH" == "HEAD" ]]; then
  echo "❌ You are in detached HEAD state. Checkout a branch first."
  exit 1
fi

echo "========================================"
echo "Safe push to company + personal"
echo "========================================"
echo "Current branch: $BRANCH"
echo ""

echo "Checking git status..."
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree is not clean. Commit or stash your changes first."
  git status --short
  exit 1
fi

echo ""
echo "Running full checks before push..."
./scripts/ci/check-all.sh

echo ""
echo "Pushing $BRANCH to company origin..."
git push origin "$BRANCH"

echo ""
echo "Pushing $BRANCH to personal backup..."
git push personal "$BRANCH"

echo ""
echo "✅ Pushed $BRANCH to origin and personal"
