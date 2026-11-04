#!/usr/bin/env bash
# Sends the next batch of any approved, due newsletter issue. Runs every 5 minutes from cron.
set -euo pipefail
setting() { grep -E "^$1=" /etc/lawgirl/lawgirl.env | head -1 | cut -d= -f2-; }
SECRET="$(setting NEWSLETTER_DISPATCH_SECRET)"
[ -n "$SECRET" ] || exit 0
curl -fsS -o /dev/null -X POST -H "Authorization: Bearer $SECRET" "http://127.0.0.1:$(setting PORT)/api/newsletter/dispatch"
