#!/usr/bin/env bash
#
# deploy.sh — runs ON THE DIGITALOCEAN DROPLET, inside /var/www/amc
#
# Called by the GitHub Actions workflow (.github/workflows/deploy.yml) and
# can also be run by hand over SSH:   cd /var/www/amc && ./deploy.sh
#
# It pulls the latest main, installs dependencies, rebuilds the frontend and
# restarts the API under PM2. The .env file and server/uploads are NEVER
# touched — they live only on the server.

set -euo pipefail

APP_DIR="/var/www/amc"
BRANCH="main"

echo "──────────────────────────────────────────────"
echo " AMC 2027 deploy — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "──────────────────────────────────────────────"

cd "$APP_DIR"

# ── 1. Pull latest code ────────────────────────────────────────────────────
echo "→ Fetching $BRANCH…"
git fetch --all
git reset --hard "origin/$BRANCH"

# ── 2. Backend dependencies ────────────────────────────────────────────────
echo "→ Installing server dependencies…"
cd "$APP_DIR/server"
npm ci --omit=dev

# ── 3. Frontend build ──────────────────────────────────────────────────────
echo "→ Building client…"
cd "$APP_DIR/client"
npm ci
npm run build     # reads VITE_API_URL from /var/www/amc/.env at build time

# ── 4. Make sure the uploads directory survives and stays writable ────────
mkdir -p "$APP_DIR/server/uploads/speakers"
chown -R "$(whoami)":www-data "$APP_DIR/server/uploads" 2>/dev/null || true
chmod -R 775 "$APP_DIR/server/uploads"

# ── 5. Restart the API ─────────────────────────────────────────────────────
echo "→ Restarting API…"
cd "$APP_DIR/server"
pm2 reload amc-api --update-env || pm2 start app.js --name amc-api
pm2 save

# ── 6. Reload Nginx (picks up the new client build) ───────────────────────
echo "→ Reloading Nginx…"
nginx -t && systemctl reload nginx

echo ""
echo "✅ Deploy complete."
pm2 status amc-api
