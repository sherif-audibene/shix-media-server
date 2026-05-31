#!/usr/bin/env bash
# One-shot installer for shix-media-server on Debian/Ubuntu.
# Installs prerequisites, fetches + builds the app, configures it, and starts
# it as a systemd service on 127.0.0.1:6302 (front it with Cloudflare Tunnel).
#
#   sudo bash provision.sh
#
# Idempotent: re-running updates code + rebuilds, and keeps your existing
# /opt/shix-media-server/.env.local untouched.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

APP=shix-media-server
DEPLOY_DIR=/opt/$APP
SVC_USER=jenkins                 # OS user that runs Jenkins (and the service)
PORT=6302
REPO=https://github.com/sherif-audibene/shix-media-server.git
ENVF=$DEPLOY_DIR/.env.local

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root:  sudo bash $0" >&2
  exit 1
fi
id "$SVC_USER" >/dev/null 2>&1 || { echo "User '$SVC_USER' not found."; exit 1; }

echo "==> [1/7] System packages (git, ffmpeg, acl, rsync, curl)"
apt-get update -y
apt-get install -y ca-certificates curl git acl rsync ffmpeg

echo "==> [2/7] Node.js 20"
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE '^v(2[0-9]|[3-9][0-9])'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "    node $(node -v)"

echo "==> [3/7] pnpm via corepack"
corepack enable
corepack prepare pnpm@10.24.0 --activate
echo "    pnpm $(pnpm -v)"

echo "==> [4/7] Source code at $DEPLOY_DIR"
if [ -d "$DEPLOY_DIR/.git" ]; then
  git -C "$DEPLOY_DIR" fetch --depth 1 origin main
  git -C "$DEPLOY_DIR" reset --hard origin/main
else
  mkdir -p "$DEPLOY_DIR"
  git clone --depth 1 "$REPO" "$DEPLOY_DIR"
fi

echo "==> [5/7] Configuration ($ENVF)"
if [ -f "$ENVF" ]; then
  echo "    Exists — leaving it as-is."
else
  read -rp "    App login username [admin]: " APP_USER; APP_USER=${APP_USER:-admin}
  read -rsp "    App login password (blank = auto-generate): " APP_PASS; echo
  GEN=0
  if [ -z "${APP_PASS:-}" ]; then
    APP_PASS=$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | cut -c1-16); GEN=1
  fi
  echo "    Video folders — format 'Label|/abs/path', separate multiple with ';'"
  echo "    e.g. Movies|/home/sherifs/media/movies;Downloads|/home/sherifs/Downloads"
  read -rp "    VIDEO_FOLDERS: " VIDEO_FOLDERS
  read -rp "    Public Cloudflare URL (https://...; leave blank if unsure): " APP_URL
  SECRET=$(openssl rand -hex 32)

  umask 077
  cat > "$ENVF" <<EOF
NODE_ENV=production
PORT=$PORT
FFMPEG_PATH=/usr/bin/ffmpeg

# Served over HTTPS via Cloudflare → keep the session cookie Secure.
AUTH_INSECURE_COOKIE=false
AUTH_SECRET=$SECRET
AUTH_USERNAME=$APP_USER
AUTH_PASSWORD=$APP_PASS

VIDEO_FOLDERS=$VIDEO_FOLDERS
NEXT_PUBLIC_APP_URL=$APP_URL
EOF
  [ "$GEN" = 1 ] && echo "    >>> Generated app password: $APP_PASS"

  echo "    Granting '$SVC_USER' read access to video folders…"
  IFS=';' read -ra ENTRIES <<< "$VIDEO_FOLDERS"
  for e in "${ENTRIES[@]}"; do
    p="${e#*|}"; p="$(echo "$p" | xargs)"
    if [ -d "$p" ]; then
      setfacl -R -m u:"$SVC_USER":rX "$p" 2>/dev/null && echo "      +r $p" \
        || echo "      (couldn't setfacl $p — ensure $SVC_USER can read it)"
    else
      echo "      (path not found yet: $p)"
    fi
  done
fi

echo "==> [6/7] Install deps + build"
cd "$DEPLOY_DIR"
pnpm install --frozen-lockfile
pnpm build
chown -R "$SVC_USER:$SVC_USER" "$DEPLOY_DIR"

echo "==> [7/7] systemd service + Jenkins sudoers"
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

# Let Jenkins restart the service after future deploys, no password.
echo "$SVC_USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart $APP, /usr/bin/systemctl status $APP" \
  > /etc/sudoers.d/$APP
chmod 440 /etc/sudoers.d/$APP

systemctl daemon-reload
systemctl enable "$APP"
systemctl restart "$APP"

echo "==> Health check"
ok=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/login"; then ok=1; break; fi
  sleep 1
done

echo
if [ "$ok" = 1 ]; then
  echo "✅ Running on http://127.0.0.1:$PORT"
else
  echo "⚠️  Service started but health check didn't pass yet. Check:"
  echo "    journalctl -u $APP -n 50 --no-pager"
fi
echo
echo "Next:"
echo "  • Point a Cloudflare Tunnel hostname at  http://localhost:$PORT"
echo "  • Future updates: just push to GitHub and run the Jenkins job"
echo "    'shix-media-server' (build → rsync into $DEPLOY_DIR → restart)."
echo "  • Edit creds/folders later:  sudoedit $ENVF  &&  sudo systemctl restart $APP"
