#!/usr/bin/env bash
# Consistent copy of the live SQLite database (safe while the site is running).
# Runs nightly from cron and before every release. Keeps the newest 30 copies.
# Uploaded book files and covers are covered by Akamai's Backups service (whole disk).
set -euo pipefail
DB="$(grep -E '^DATABASE_PATH=' /etc/lawgirl/lawgirl.env | cut -d= -f2-)"
DEST=/var/lib/lawgirl/backups
[ -f "$DB" ] || { echo "No database yet at $DB; nothing to back up."; exit 0; }
FILE="$DEST/law-girl-$(date +%Y%m%d-%H%M%S)${1:+-$1}.sqlite"
sqlite3 "$DB" ".backup '$FILE'"
ls -1t "$DEST"/law-girl-*.sqlite | tail -n +31 | xargs -r rm -f
echo "Backed up to $FILE"
