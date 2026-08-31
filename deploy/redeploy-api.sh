#!/usr/bin/env bash
# Redeploy apps/api on the VPS after pushing to origin/main.
#
# Run this ON THE BOX (ssh in first), or trigger the "Deploy API to VPS"
# GitHub Action which does the same thing. apps/api/.env already lives on the
# box and is gitignored, so the git reset below never touches it.
#
#   ssh ubuntu@<vps> 'bash -s' < deploy/redeploy-api.sh
# or, logged in on the box:
#   cd ~/turborepo && bash deploy/redeploy-api.sh
#
# APP_DIR overrides the checkout location if you cloned somewhere else.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/turborepo}"
REF="${DEPLOY_REF:-main}"

cd "$APP_DIR"

# Reset, not pull — a conflict would wedge every future deploy.
git fetch --prune origin
git checkout -B "$REF" "origin/$REF"
git reset --hard "origin/$REF"

corepack enable
pnpm install --frozen-lockfile
pnpm turbo build --filter=@repo/api...

pm2 startOrReload apps/api/ecosystem.config.js --update-env
pm2 save

sleep 3
curl -fsS http://localhost:3001/health >/dev/null
echo "health check OK — api redeployed at $REF"
