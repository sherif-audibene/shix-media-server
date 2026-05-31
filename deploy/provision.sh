#!/usr/bin/env bash
# One-time server provisioning for shix-media-server (bare-metal, behind
# Cloudflare, HTTP origin on 127.0.0.1:6302). Run ONCE as root:
#
#   sudo bash provision.sh
#
# Idempotent: safe to re-run. Prompts for app credentials + video paths the
# first time (they are written only to /opt/shix-media-server/.env.local).
set -euo pipefail

APP=shix-media-server
DEPLOY_DIR=/opt/$APP
SVC_USER=jenkins          # the OS user Jenkins runs as on this box
PORT=6302
ENVF="$DEPLOY_DIR/.env.local"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run with sudo/root." >&2
  exit 1
fi

echo "==> Packages: Node 20, ffmpeg, acl, rsync, git"
if ! command -v node >/dev/null || ! node -v | grep -qE '^v(2[0-9]|[3-9][0-9])'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y ffmpeg acl rsync git

echo "==> pnpm via corepack (system-wide)"
corepack enable
corepack prepare pnpm@10.24.0 --activate || true

echo "==> Deploy dir $DEPLOY_DIR (owned by $SVC_USER)"
mkdir -p "$DEPLOY_DIR"
chown -R "$SVC_USER:$SVC_USER" "$DEPLOY_DIR"

echo "==> Environment file"
if [ -f "$ENVF" ]; then
  echo "    $ENVF already exists — leaving it untouched."
else
  read -rp "    App login username [admin]: " APP_USER; APP_USER=${APP_USER:-admin}
  read -rsp "    App login password: " APP_PASS; echo
  while [ -z "${APP_PASS:-}" ]; do read -rsp "    Password cannot be empty: " APP_PASS; echo; done
  echo "    Video folders, format: Label|/abs/path  (separate multiple with ';')"
  read -rp "    VIDEO_FOLDERS: " VIDEO_FOLDERS
  read -rp "    Public URL via Cloudflare (e.g. https://media.example.com) [blank ok]: " APP_URL
  SECRET=$(openssl rand -hex 32)

  umask 077
  cat > "$ENVF" <<EOF
NODE_ENV=production
PORT=$PORT
FFMPEG_PATH=/usr/bin/ffmpeg

# Served over HTTPS via Cloudflare, so keep the session cookie Secure.
AUTH_INSECURE_COOKIE=false
AUTH_SECRET=$SECRET
AUTH_USERNAME=$APP_USER
AUTH_PASSWORD=$APP_PASS

VIDEO_FOLDERS=$VIDEO_FOLDERS
NEXT_PUBLIC_APP_URL=$APP_URL
EOF
  chown "$SVC_USER:$SVC_USER" "$ENVF"
  chmod 600 "$ENVF"
  echo "    Wrote $ENVF (AUTH_SECRET auto-generated)."

  echo "==> Granting '$SVC_USER' read access to video folders"
  IFS=';' read -ra ENTRIES <<< "$VIDEO_FOLDERS"
  for e in "${ENTRIES[@]}"; do
    p="${e#*|}"; p="$(echo "$p" | xargs)"   # strip label + trim
    if [ -d "$p" ]; then
      setfacl -R -m u:"$SVC_USER":rX "$p" 2>/dev/null \
        && echo "    +r $p" || echo "    (could not setfacl $p — ensure $SVC_USER can read it)"
    else
      echo "    (path not found yet: $p — create it / fix later)"
    fi
  done
fi

echo "==> systemd unit"
cat > /etc/systemd/system/$APP.service <<EOF
[Unit]
Description=shix-media-server (Next.js)
After=network.target

[Service]
Type=simple
User=$SVC_USER
Group=$SVC_USER
WorkingDirectory=$DEPLOY_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=FFMPEG_PATH=/usr/bin/ffmpeg
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -H 127.0.0.1 -p $PORT
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable $APP

echo "==> sudoers: let $SVC_USER restart the service without a password"
echo "$SVC_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart $APP, /usr/bin/systemctl status $APP" \
  > /etc/sudoers.d/$APP
chmod 440 /etc/sudoers.d/$APP

echo
echo "Done. Versions:"
echo "  node $(node -v) | pnpm $(sudo -u $SVC_USER pnpm -v 2>/dev/null || echo '?') | ffmpeg $(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}')"
echo
echo "Next: run the Jenkins job 'shix-media-server' — it builds, rsyncs into"
echo "$DEPLOY_DIR, and starts the service on 127.0.0.1:$PORT."
echo "Then point a Cloudflare Tunnel hostname at http://localhost:$PORT."
