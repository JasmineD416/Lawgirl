#!/usr/bin/env bash
# Installs a release built by GitHub Actions. Run by the deploy user via sudo:
#   sudo /usr/local/bin/lawgirl-release /home/deploy/uploads/<name>.tar.gz
# Backs up the database, applies migrations, switches to the new release and
# restarts the site; if the site does not come back, switches back to the previous code.
set -euo pipefail
TARBALL="$(realpath "${1:?Usage: lawgirl-release <tarball>}")"
case "$TARBALL" in /home/deploy/uploads/*.tar.gz) ;; *) echo "Tarball must be in /home/deploy/uploads"; exit 1;; esac

setting() { grep -E "^$1=" /etc/lawgirl/lawgirl.env | head -1 | cut -d= -f2-; }
RELEASES=/srv/lawgirl/releases
NEW="$RELEASES/$(date +%Y%m%d-%H%M%S)"
PREVIOUS="$(readlink -f /srv/lawgirl/current || true)"

mkdir -p "$NEW"
tar -xzf "$TARBALL" -C "$NEW" --no-same-owner
chown -R root:root "$NEW" && chmod -R a+rX,go-w "$NEW"

runuser -u lawgirl -- /usr/local/bin/lawgirl-backup pre-release
(cd "$NEW" && runuser -u lawgirl -- env DATABASE_PATH="$(setting DATABASE_PATH)" node --disable-warning=ExperimentalWarning scripts/migrate.mjs)

ln -sfn "$NEW" /srv/lawgirl/current.new && mv -T /srv/lawgirl/current.new /srv/lawgirl/current
systemctl restart lawgirl

PORT="$(setting PORT)"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT:-3000}/"; then
    echo "Release $(basename "$NEW") is live."
    ls -1dt "$RELEASES"/*/ | tail -n +6 | xargs -r rm -rf   # keep the 5 newest releases
    rm -f "$TARBALL"
    exit 0
  fi
  sleep 1
done

echo "New release did not respond; switching back to the previous code."
if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
  ln -sfn "$PREVIOUS" /srv/lawgirl/current.new && mv -T /srv/lawgirl/current.new /srv/lawgirl/current
  systemctl restart lawgirl
fi
echo "Database migrations (if any) were NOT reversed. See journalctl -u lawgirl for the error."
exit 1
