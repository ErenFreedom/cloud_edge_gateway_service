# Contributing Guide

This document defines the GitHub workflow for contributing to the `cloud_edge_gateway_service` repository.

The goal is to keep production code stable, ensure every change is reviewed, and make sure backend and client builds pass before code is merged.

---

## Protected Branches

This repository uses three protected long-running branches:

```text
main      = production-ready branch
staging   = pre-production testing branch
dev       = active integration branch



Regular contributors must not push directly to main, staging, or dev.

All changes must go through a pull request.

Branch Flow

The standard development flow is:

feature/fix/hotfix branch
        ↓ Pull Request
dev
        ↓ Pull Request
staging
        ↓ Pull Request
main
Branch Purposes
dev is used for active development and integration.
staging is used for pre-production testing.
main is the production-ready branch.
Creating a New Branch

Always start from the latest dev branch:

git checkout dev
git pull origin dev

Create a new branch for your work:

git checkout -b feature/short-feature-name

Recommended branch naming:

feature/dev_name_site-monitor-ui
feature/dev_name_user-management-panel
fix/dev_name_mqtt-reconnect
fix/dev_name_login-otp-validation
hotfix/dev_name_prod-api-crash

Use:

feature/ for new functionality
fix/ for normal bug fixes
hotfix/ for urgent production fixes
Committing Changes

Check your changes:

git status

Stage and commit:

git add .
git commit -m "Meaningful commit message"

Use clear commit messages, for example:

Add site monitor dashboard panel
Fix MQTT reconnect handling
Update user management modal styling
Run Local Checks Before Pushing

Before pushing your branch, run:

./scripts/ci/check-all.sh

This currently validates:

Backend Build
Client Build

If this script fails locally, fix the issue before opening a pull request.

Pushing Your Branch

Push your branch to the company repository:

git push origin feature/dev_name_short-feature-name

Example:

git push origin feature/dev_name_site-monitor-ui
Opening a Pull Request

Open a pull request with:

base: dev
compare: your-branch-name

Example:

base: dev
compare: feature/dev_name_site-monitor-ui

Do not open feature pull requests directly into main.

Pull Request Requirements

Before a pull request can be merged, the following requirements must pass:

Backend Build
Client Build
At least 1 approval
Resolved conversations
Branch up to date with base branch

GitHub Actions will automatically run CI checks on pull requests targeting:

dev
staging
main

Required checks:

CI / Backend Build
CI / Client Build
Merge Method

Use:

Squash and merge

This keeps the repository history clean and supports the linear history rule.

Avoid normal merge commits unless explicitly required.

Promotion to Staging and Main

After feature branches are merged into dev, validated changes can be promoted using pull requests.

Promote from dev to staging:

base: staging
compare: dev

After staging validation, promote from staging to main:

base: main
compare: staging

Final release flow:

feature branch
   ↓ PR
dev
   ↓ PR
staging
   ↓ PR
main
Protected Branch Rules

The following actions are not allowed on protected branches:

Direct pushes by regular contributors
Force pushes
Branch deletions
Merging without required CI checks
Merging without approval

Protected branches:

main
staging
dev



Personal Backup Remote

Some maintainers may also maintain a personal backup remote.

The company remote should remain:

origin

Example:

git push origin branch-name

If a personal backup remote exists, it should be pushed explicitly:

git push personal branch-name

Do not rely on automatic multi-remote pushes for company workflow.



Local Scripts

Available scripts:

./scripts/ci/check-all.sh

Runs production-safe checks for backend and client builds.

./scripts/ci/build-all.sh

Builds backend and client.

./scripts/ci/lint-all.sh

Runs lint checks. This is currently for manual cleanup and is not required in CI yet.

./scripts/git/push-both.sh

For maintainers only. Runs checks and pushes the current branch to both company and personal remotes.



Important Contributor Rules

Please follow these rules:

Always start work from the latest dev.
Always create a separate branch for your work.
Never push directly to main, staging, or dev.
Always run local checks before opening a pull request.
Always open pull requests into dev first.
Wait for CI checks to pass.
Wait for review approval.
Use Squash and merge.

Emergency Admin Bypass

Repository administrators may have bypass access for urgent production fixes.

This should only be used for emergencies. Normal development should still follow the pull request workflow.