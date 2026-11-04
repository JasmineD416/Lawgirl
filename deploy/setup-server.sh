#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 Akamai Cloud (Linode) instance. Run as root:
#   bash setup-server.sh            (defaults to www.lawgirl.ca)
# Safe to re-run; it does not overwrite /etc/lawgirl/lawgirl.env once created.
set -euo pipefail
DOMAIN="${1:-www.lawgirl.ca}"

apt-get update
apt-get install -y curl ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https sqlite3 ufw unattended-upgrades

# Node.js 24 LTS
if ! node -v 2>/dev/null | grep -q '^v24'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi

# Caddy (HTTPS certificates are obtained and renewed automatically)
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get install -y caddy
fi

# Accounts: `lawgirl` runs the site; `deploy` is what GitHub Actions signs in as.
id lawgirl >/dev/null 2>&1 || useradd --system --home /srv/lawgirl --shell /usr/sbin/nologin lawgirl
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
install -d -o root -g root -m 755 /srv/lawgirl /srv/lawgirl/releases
install -d -o lawgirl -g lawgirl -m 750 /var/lib/lawgirl /var/lib/lawgirl/files /var/lib/lawgirl/backups
install -d -o deploy -g deploy -m 700 /home/deploy/.ssh /home/deploy/uploads
touch /home/deploy/.ssh/authorized_keys && chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

# Production settings (secrets). Fill these in with: nano /etc/lawgirl/lawgirl.env
install -d -m 750 -g lawgirl /etc/lawgirl
if [ ! -f /etc/lawgirl/lawgirl.env ]; then
  cat > /etc/lawgirl/lawgirl.env <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
DATABASE_PATH=/var/lib/lawgirl/law-girl.sqlite
FILES_DIR=/var/lib/lawgirl/files
SITE_URL=https://$DOMAIN
PUBLIC_INDEXING=false
OWNER_EMAIL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
BOOK_CATALOG={}
RESEND_API_KEY=
MAIL_FROM=
MAIL_POSTAL_ADDRESS=
RESEND_WEBHOOK_SECRET=
NEWSLETTER_DISPATCH_SECRET=$(openssl rand -hex 32)
RATE_LIMIT_SECRET=$(openssl rand -hex 32)
EOF
  chown root:lawgirl /etc/lawgirl/lawgirl.env && chmod 640 /etc/lawgirl/lawgirl.env
fi

install -m 644 "$(dirname "$0")/lawgirl.service" /etc/systemd/system/lawgirl.service
install -m 755 "$(dirname "$0")/release.sh" /usr/local/bin/lawgirl-release
install -m 755 "$(dirname "$0")/backup.sh" /usr/local/bin/lawgirl-backup
install -m 755 "$(dirname "$0")/newsletter-dispatch.sh" /usr/local/bin/lawgirl-newsletter-dispatch
sed "s/{\$DOMAIN}/$DOMAIN/" "$(dirname "$0")/Caddyfile" > /etc/caddy/Caddyfile
# Send the bare domain (lawgirl.ca) to the www address.
case "$DOMAIN" in www.*) printf '\n%s {\n\tredir https://%s{uri} permanent\n}\n' "${DOMAIN#www.}" "$DOMAIN" >> /etc/caddy/Caddyfile;; esac

# The deploy user may only run the release script as root, nothing else.
echo 'deploy ALL=(root) NOPASSWD: /usr/local/bin/lawgirl-release' > /etc/sudoers.d/lawgirl-deploy
chmod 440 /etc/sudoers.d/lawgirl-deploy

# Scheduled jobs: newsletter dispatch every 5 minutes, database backup nightly.
cat > /etc/cron.d/lawgirl <<'EOF'
*/5 * * * * lawgirl /usr/local/bin/lawgirl-newsletter-dispatch >/dev/null 2>&1
15 3 * * * lawgirl /usr/local/bin/lawgirl-backup >/dev/null
EOF

# Firewall: SSH and web only.
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

systemctl daemon-reload
systemctl enable lawgirl caddy
systemctl reload caddy || systemctl restart caddy
echo "Server prepared. Next: fill in /etc/lawgirl/lawgirl.env and add the GitHub deploy key to /home/deploy/.ssh/authorized_keys."
