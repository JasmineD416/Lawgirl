# Deployment and team workflow — Law Girl on Akamai Cloud

## How it fits together

- **GitHub** holds the code and is where all changes happen, through pull requests.
- **GitHub Actions** checks every change and, once it is merged into `main`, builds the site and publishes it to the server.
- **Akamai Cloud** runs one Linux server (a "Linode"). On it:
  - **Caddy** answers web traffic and handles HTTPS certificates automatically.
  - The **Law Girl app** (Node.js) runs as the `lawgirl` service.
  - **SQLite** holds accounts, content, orders and subscribers: `/var/lib/lawgirl/law-girl.sqlite`.
  - **Private files** (paid e-books, uploaded covers) live in `/var/lib/lawgirl/files`.
  - **Production settings and secrets** live only in `/etc/lawgirl/lawgirl.env`, never in GitHub.
  - **Scheduled jobs** send approved newsletter batches every 5 minutes and back up the database nightly.

Website content (articles, books, courses, newsletter issues) is edited in Owner Studio at `/admin` and does not need a developer or a deployment.

## One-time setup

### 1. Create the server (Akamai Cloud dashboard)

Linodes → **Create Linode**:

- **Image:** Ubuntu 24.04 LTS
- **Region:** closest to your audience (for example Toronto, CA)
- **Plan:** Shared CPU, Linode 2 GB is enough to start; it can be resized later
- **Label:** `lawgirl-web`
- **Root password:** a strong password, stored in your password manager
- **SSH keys:** add your own public key if you have one
- **Backups:** turn on (whole-server snapshots, including uploaded book files)

Note the server's **IPv4 address** once it is running.

### 2. Point the domain at the server

lawgirl.ca's DNS is managed at GoDaddy (Domain → DNS). Doing this replaces the old WordPress site, so do it only after the first release succeeds (step 6, whose health check confirms the site is running on the server), and keep a backup of the WordPress site.

- Change the `A` record for `@` to the server's IPv4 address.
- Change `www` (currently a `CNAME` to `@`) to an `A` record with the server's IPv4 address, or leave the `CNAME` in place.
- Leave any `MX` and `TXT` records alone; they handle email.

`lawgirl.ca` redirects to `www.lawgirl.ca`. HTTPS starts working within a few minutes of DNS reaching the server.

### 3. Prepare the server

From this project folder on your computer (PowerShell or Terminal):

```sh
scp -r deploy root@SERVER_IP:/root/
ssh root@SERVER_IP "bash /root/deploy/setup-server.sh"
```

This installs Node.js 24, Caddy, the firewall, the `lawgirl` service, backups and the newsletter schedule. It creates `/etc/lawgirl/lawgirl.env` with the two random secrets already generated.

### 4. Fill in production settings

```sh
ssh root@SERVER_IP
nano /etc/lawgirl/lawgirl.env
```

Fill in `OWNER_EMAIL`, the Stripe keys, the Resend keys, `MAIL_FROM` and `MAIL_POSTAL_ADDRESS`. Use Stripe **test** keys until acceptance testing is complete. Keep `PUBLIC_INDEXING=false` until launch. Each setting is described in `docs/DEVELOPER_HANDOFF.md` → Production variables. After later changes, run `systemctl restart lawgirl`.

### 5. Let GitHub publish to the server

Create a key pair used only by GitHub, on your computer:

```sh
ssh-keygen -t ed25519 -f lawgirl-deploy -N "" -C "github-actions-deploy"
type lawgirl-deploy.pub | ssh root@SERVER_IP "cat >> /home/deploy/.ssh/authorized_keys"
ssh-keyscan SERVER_IP
```

(On macOS/Linux use `cat` instead of `type`.)

In GitHub: repository → **Settings → Environments → New environment** → `production` → add these **environment secrets**:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | the server's IPv4 address |
| `DEPLOY_SSH_KEY` | the full contents of the `lawgirl-deploy` file (the private key) |
| `DEPLOY_KNOWN_HOSTS` | the full output of `ssh-keyscan SERVER_IP` |

Then delete the local `lawgirl-deploy` files. The `deploy` account on the server can only upload releases and run the release script; it cannot read the production secrets.

### 6. First release

GitHub → **Actions → Deploy → Run workflow** (on `main`). When it finishes, the site is live at your domain.

### 7. Connect payments and email

- **Stripe** → Developers → Webhooks: add `https://www.lawgirl.ca/api/stripe/webhook` with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded` and `charge.dispute.created`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
- **Resend:** verify the sender domain, then add a webhook to `https://www.lawgirl.ca/api/newsletter/events` and put its signing secret in `RESEND_WEBHOOK_SECRET`.
- Restart the app: `systemctl restart lawgirl`.
- Sign up on the live site with the `OWNER_EMAIL` address and confirm it. Owner Studio is then available at `/admin`.

## Team workflow

### Access

- **GitHub:** the owner stays the repository owner/admin. Add each developer under Settings → Collaborators with the **Write** role. For a firm-owned site, consider moving the repository into a free GitHub Organization so it is not tied to one personal account.
- **Akamai Cloud:** the owner keeps the account. Add developers as separate users (Account → Users & Grants) with access only to this Linode, and add each developer's own SSH key to the server. Never share one password.
- **Secrets** (Stripe, Resend) stay in `/etc/lawgirl/lawgirl.env` and the GitHub `production` environment; they never go into code, issues or chat.

### Protect `main`

GitHub → Settings → **Branches → Add branch ruleset** (or protection rule) for `main`:

- Require a pull request before merging, with **1 approval**, so each developer's work is reviewed by the other.
- Require the **Checks** status check to pass.
- Block force pushes and deletion.

Optional: under Settings → Environments → `production`, add the owner as a **required reviewer**, so every release waits for the owner's approval in GitHub before going live.

### Making a change

1. Create a branch from `main` (for example `fix-book-page-spacing`).
2. Make and test the change locally (`pnpm run dev`, then `pnpm test`, `pnpm run typecheck`, `pnpm run build`).
3. Push the branch and open a pull request. GitHub runs the checks automatically.
4. The other developer reviews and approves.
5. Merge. GitHub Actions publishes the site within a few minutes; watch it under **Actions → Deploy**.
6. Check the live site.

### Undoing a release

Open the merged pull request in GitHub and click **Revert**. Merging the revert pull request publishes the previous version. If a release fails its health check, the server automatically keeps or restores the previous code; the Deploy run shows as failed.

Database changes (migrations) are never undone automatically. Write migrations so the previous code still works with the new database, and add a new migration to correct mistakes instead of editing an applied one.

## Day-to-day operations

| Task | Command (on the server, as root) |
|---|---|
| Is the site running? | `systemctl status lawgirl` |
| Recent app logs | `journalctl -u lawgirl -n 200` |
| Restart after changing settings | `systemctl restart lawgirl` |
| Back up the database now | `runuser -u lawgirl -- lawgirl-backup manual` |
| List backups | `ls -lh /var/lib/lawgirl/backups` |
| Install OS security updates | `apt update && apt upgrade` (unattended-upgrades also applies security fixes) |

**To restore a backup:**

1. `systemctl stop lawgirl`
2. Copy the chosen backup over `/var/lib/lawgirl/law-girl.sqlite`.
3. Delete `law-girl.sqlite-wal` and `law-girl.sqlite-shm` if present.
4. `chown lawgirl:lawgirl /var/lib/lawgirl/law-girl.sqlite`
5. `systemctl start lawgirl`

Copy important backups off the server periodically, for example to Akamai Object Storage or a firm drive.
