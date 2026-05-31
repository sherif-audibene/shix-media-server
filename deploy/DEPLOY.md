# Deploying shix-media-server (bare-metal + Jenkins + Nginx/TLS)

The app streams video files off the server's local disk and shells out to
`ffmpeg` for thumbnails, so it must run on the machine where the videos live
(the same box as Jenkins). Jenkins builds from GitHub and (re)starts a systemd
service; Nginx terminates TLS in front of it.

```
GitHub ──▶ Jenkins (build) ──rsync──▶ /opt/shix-media-server ──▶ systemd
                                                                    │ :3000
Browser ──HTTPS──▶ Nginx (TLS) ──▶ 127.0.0.1:3000 ─────────────────┘
```

## 1. One-time server setup

Run as a sudo-capable user.

### Packages

```bash
# Node 20 (NodeSource) — gives /usr/bin/node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs ffmpeg nginx rsync
sudo corepack enable            # provides pnpm
sudo snap install --classic certbot && sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

Confirm: `node -v` (≥20), `ffmpeg -version`, `which ffmpeg` (expect `/usr/bin/ffmpeg`).

### Deploy directory + secrets

```bash
sudo mkdir -p /opt/shix-media-server
sudo chown jenkins:jenkins /opt/shix-media-server      # the user the service runs as

# Production env (NOT in git):
sudo -u jenkins cp deploy/.env.production.example /opt/shix-media-server/.env.local
sudo -u jenkins nano /opt/shix-media-server/.env.local # set AUTH_SECRET, password, VIDEO_FOLDERS, domain
sudo chmod 600 /opt/shix-media-server/.env.local
```

Generate a strong secret: `openssl rand -hex 32`.

Make sure the `jenkins` user can read your media folders, e.g.
`sudo setfacl -R -m u:jenkins:rX /srv/media` (or chmod/group as you prefer).

### systemd service

```bash
sudo cp deploy/shix-media-server.service /etc/systemd/system/
# If you run as a user other than `jenkins`, edit User=/Group= in that file.
sudo systemctl daemon-reload
sudo systemctl enable shix-media-server
# (Jenkins will start it on first deploy; or `sudo systemctl start` after a manual build.)
```

### Let Jenkins restart the service without a password

```bash
echo 'jenkins ALL=(root) NOPASSWD: /usr/bin/systemctl restart shix-media-server' \
  | sudo tee /etc/sudoers.d/shix-media-server
sudo chmod 440 /etc/sudoers.d/shix-media-server
```

### Nginx + TLS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/shix-media-server
sudo sed -i 's/media.example.com/YOUR.DOMAIN/g' /etc/nginx/sites-available/shix-media-server
sudo ln -sf /etc/nginx/sites-available/shix-media-server /etc/nginx/sites-enabled/
sudo certbot --nginx -d YOUR.DOMAIN     # issues the cert and reloads nginx
sudo nginx -t && sudo systemctl reload nginx
```

DNS for `YOUR.DOMAIN` must point at the server, and ports 80/443 must be open.

## 2. Jenkins job

Create a **Pipeline** job:

- **Pipeline script from SCM** → Git →
  `https://github.com/sherif-audibene/shix-media-server.git`, branch `main`.
- Script path: `Jenkinsfile` (default).
- Trigger: a GitHub webhook (`/github-webhook/`) or **Poll SCM**.

The pipeline: install → lint + typecheck → `next build` → rsync into
`/opt/shix-media-server` (preserving `.env.local`) → restart the service →
smoke-test `http://127.0.0.1:3000/login`.

## 3. Deploy

Push to `main` (or click **Build Now**). First run also starts the service.

```bash
# handy checks
sudo systemctl status shix-media-server
journalctl -u shix-media-server -f
```

## Notes & gotchas

- **HTTPS is required** for login: the session cookie is `Secure` in
  production, so it's only stored over TLS. That's why Nginx + certbot is part
  of the setup.
- **ffmpeg**: the service sets `FFMPEG_PATH=/usr/bin/ffmpeg`; the bundled
  `ffmpeg-static` is only a local-dev fallback.
- **Folder scan cache** has a 30s TTL — new files appear within ~30s.
- **Thumbnail cache** lives in the service's private `/tmp` and regenerates
  after a reboot; harmless.
- **Rollback**: `git revert` + rebuild, or keep the previous workspace; the old
  process keeps serving if a build fails (deploy only restarts on success).
- **Updating credentials/folders**: edit `/opt/shix-media-server/.env.local`
  and `sudo systemctl restart shix-media-server` — no rebuild needed.
