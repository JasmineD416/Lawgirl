# Developer handoff — Law Girl

## Scope and architecture

The application is Vinext/React, deployed as a Cloudflare Worker on Jasmine’s own Cloudflare account. D1 contains accounts, sessions, content, consent, progress, enrolments and delivery records. R2 contains private paid book files and uploaded cover images. Stripe hosts payment entry. Resend is the implemented email adapter. No emails have been sent by the development tests and no live payments have been taken.

The app has no dependency on any AI platform or third-party sign-in. Students create their own Law Girl account. It cannot be copied into shared PHP/WordPress hosting without a platform port.

## Files

| Path | Purpose |
|---|---|
| `app/site.tsx`, `app/globals.css` | Public website and responsive design |
| `app/data.ts`, `content/episodes.json` | Initial source-verified content |
| `app/catalog.ts` | Default records, publication merge, public answer/file stripping |
| `app/server/catalog.ts` | Durable content, immutable book-edition settings |
| `app/server/core.ts` | Bounded inputs, hashing, rate limits and audit |
| `app/server/auth.ts`, `app/server/session.ts` | Student accounts: password hashing, sessions, tokens, owner check |
| `app/api/account/` | Sign-up, sign-in, sign-out, email confirmation, password reset, profile |
| `app/account-pages.tsx` | Account pages (/signin, /signup, /account, /forgot-password, /reset-password, /verify-email) |
| `app/server/courses.ts` | Law Girl’s Law School enrolment and access checks |
| `wrangler.jsonc`, `build/worker.ts` | Cloudflare Worker, D1 and R2 configuration |
| `app/server/validation.ts` | Content and campaign schemas |
| `app/server/newsletter.ts` | Confirmation, delivery adapter, dispatch and suppression |
| `app/admin/` | Owner Studio |
| `app/api/admin/` | Owner-authorized publishing, uploads and issue actions |
| `app/api/courses/` | Course completion and certificate issuance |
| `app/api/newsletter/` | Subscription, provider events, dispatch and unsubscribe |
| `app/api/[...action]/` | Stripe, entitlement library, file delivery and compatibility APIs |
| `app/education/[course]/` | Generic published course reader |
| `app/certificate/[id]/` | Owner-bound certificate display and printing |
| `db/schema.ts`, `drizzle/` | Schema and ordered immutable migrations |
| `scripts/api-tests.mjs` | Tests using real SQLite and mocked Stripe/Resend |

## Local setup

Node.js 24 LTS and pnpm (via `corepack pnpm`) are recommended. Run `pnpm install --frozen-lockfile`, copy `.env.example` to `.dev.vars` and fill in local values, then run `pnpm run db:migrate:local` and `pnpm run dev` (http://localhost:5173). Create an account at /signup. To use Owner Studio locally, set `OWNER_EMAIL` in `.dev.vars` to that account’s email and confirm it (with Resend configured, or by setting `email_verified_at` in the local D1 database).

## Accounts and sign-in

Students sign up with first name, last name, email and a password of at least 10 characters. Passwords are stored as PBKDF2-SHA256 (100,000 iterations, 16-byte random salt). A sign-in creates a random 256-bit session token; only its SHA-256 hash is stored in D1. The browser receives it in the `lg_session` cookie (HttpOnly, Secure, SameSite=Lax, 30 days). Every state-changing request also requires a same-origin Origin header. Sign-in is rate limited per email and per IP.

Email confirmation links (48 hours) and password reset links (one hour, single use, earlier links cancelled) are sent through Resend; only token hashes are stored. Resetting or changing a password signs out every other session. Forgot-password responses do not reveal whether an account exists.

The owner is the signed-in account whose **confirmed** email equals `OWNER_EMAIL`. An unconfirmed account with that email has no owner access, so nobody can claim the owner role by signing up first. Never implement identity by trusting a user ID or email from a request body.

## Production variables

| Variable | Value/source |
|---|---|
| `OWNER_EMAIL` | Email of Jasmine’s Law Girl account. Owner access starts once that account confirms its email. |
| `SITE_URL` | HTTPS origin, with no trailing slash. Update on domain changes. |
| `STRIPE_SECRET_KEY` | Stripe test secret first; live secret after acceptance testing. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/stripe/webhook`. |
| `BOOK_CATALOG` | Optional legacy JSON fallback. Prefer book fields in Owner Studio. |
| `RESEND_API_KEY` | Resend secret key restricted appropriately. |
| `MAIL_FROM` | Verified sender, e.g. `Law Girl <newsletter@approved-domain>`. |
| `MAIL_POSTAL_ADDRESS` | Owner-approved business sender mailing/contact footer. No value is invented. |
| `RESEND_WEBHOOK_SECRET` | Svix-format signing secret for `/api/newsletter/events`. |
| `NEWSLETTER_DISPATCH_SECRET` | High-entropy secret for server-to-server newsletter dispatch. |
| `RATE_LIMIT_SECRET` | High-entropy salt for pseudonymous request limit keys. |
| `PUBLIC_INDEXING` | Keep false until public launch; true enables crawlable sitemap declaration. |

Set secrets with `wrangler secret put NAME` (or the Cloudflare dashboard → Workers → law-girl → Settings → Variables). Do not put real values in Git, page content, import files or browser bundles. The production owner email is set for Jasmine's verified owning account; source archives do not contain its value.

## Content lifecycle

Default records render before CMS entries are created. Saving an existing seed record retains its previous public version. Saving a genuinely new record creates a draft only. Publish atomically copies validated draft data into the live record. Archive uses a tombstone to prevent the initial seed from reappearing. Optimistic versions reject stale writes. The UI supports source links and original paragraph-based content; it does not render untrusted HTML.

To import, generate a sample using `pnpm run content:sample -- import-example.json`, edit it and use Owner Studio → Setup. Import accepts new IDs only and preserves existing rows. Up to 100 records / 256 KB per request; larger archives can be split. User-owned content and final source inventory must be supplied/verified; current article/media/blog lists are selected entries, not an assertion that every historical item was recovered.

Book fields `price` and `file` are server-only in the public catalog. Upload a PDF or EPUB (20 MB maximum), save its generated private key on the book and set its Stripe Price ID. Cover images are limited to PNG/JPG/WebP; SVG and arbitrary public file paths are not served. Do not make the paid-file bucket public.

## Payments and delivery

Checkout resolves the product, price and R2 file on the server. It records the chosen edition in `checkout_intents`. Fulfillment retrieves the Checkout Session from Stripe, verifies its paid/complete status, source, identity and price, and records the original book edition on the order. Verified signed webhooks and the authenticated return page invoke the same idempotent fulfillment path. Library downloads verify ownership and recheck payment/refund state. Book price/file changes do not move an existing purchaser to a different edition.

Register `checkout.session.completed` and `checkout.session.async_payment_succeeded` (plus `charge.refunded` and `charge.dispute.created` for Law School access revocation) on `/api/stripe/webhook`. This version explicitly requests card checkout. Stripe controls supported wallets on its hosted checkout. Turn on Stripe receipts in the account if desired. Review digital sales tax configuration with the account owner before launch; no tax jurisdiction or exemption is assumed in source.

Stripe and Resend webhooks reach the public Worker URL directly; both are signature-verified. Do not disable verification.

## Monthly newsletter operations

Subscriptions require explicit consent and an emailed confirmation; a pending address never receives a campaign. Confirmation tokens are hashed in storage and expire in 48 hours. One-click unsubscribe and the on-site unsubscribe page share the suppression state. Bounce/complaint webhooks verify Svix signatures before suppressing addresses. Existing explicit-consent v1 subscribers remain intact.

Owner Studio creates a draft issue. Send a preview to the owner's verified email, save it and explicitly approve a send date. Only approved/due issues enter dispatch; arbitrary draft text cannot be sent by the scheduler. Delivery records isolate recipients, recheck consent before sending, claim short leases and use stable provider idempotency keys. Rate-limit/provider failures leave work queued. Uncertain delivery beyond the provider's idempotency window stops for manual reconciliation; do not reset it blindly. Cancellation stops remaining dispatch but cannot recall provider-accepted messages.

The dispatcher processes at most 10 recipients per invocation. For automated delivery, configure a scheduler (for example a Cloudflare Cron Trigger or an external cron service) to POST `/api/newsletter/dispatch` every few minutes with `Authorization: Bearer <NEWSLETTER_DISPATCH_SECRET>`. Keep the secret in the scheduler’s secret store, never in a public schedule prompt or source. No unattended schedule has been activated in this handoff. Until configured, the owner can process approved/due batches from Owner Studio.

Monthly publishing remains editorial: prepare and approve one new issue each month. The system does not generate or send an unreviewed legal newsletter on its own.

## Courses and certificates

### Law Girl’s Law School (paid courses)

A course record has `access` (`free` or `paid`), `enrollment` (`waitlist` or `open`), `price` (Stripe Price ID, server-only) and `priceLabel` (the price text students see). Free courses appear on `/education`; paid courses appear on `/law-school` and use the same reader at `/education/:slug`.

Until a signed-in reader is enrolled, the server sends only the syllabus (module titles and intros). Lesson text, knowledge checks and answers are withheld server-side, and `/api/courses/*` returns 403 for paid courses without an active enrolment. The owner account always has access for previewing.

Enrolment flow: the reader selects Enrol, `POST /api/checkout {course}` creates a Stripe Checkout Session (card, promotion codes allowed) and records a checkout intent. On return to `/education/:slug?session_id=…` the page calls `/api/fulfill`; the signed webhook runs the same idempotent fulfillment. An enrolment is an `orders` row with `kind=course` and `product=course:<id>`. It survives course revisions; progress and certificates stay keyed to the revision.

Refunds and disputes: `charge.refunded` and `charge.dispute.created` webhooks set `revoked_at` on the matching order (by Payment Intent), which removes course access and hides it from the library. A refund found during fulfillment also revokes.

To open a paid course for sale:

1. Replace the seeded Civil Procedure 101 module text and knowledge checks in Owner Studio (increase `revision` when lessons change).
2. In Stripe, create a Product and a one-time Price; copy the Price ID (`price_…`) into the course’s Stripe Price ID field and set the price text.
3. Set Enrolment to Open and publish. Validation refuses an open paid course without a Price ID.


Publish a course with a stable ID/slug, revision and lessons. Each lesson has content and a knowledge check. `correctIndex` is zero-based and server-only. Learner records are keyed by user, course and revision. The server requires all checks to pass before issuing one certificate per entitlement. Certificates store a snapshot of the course title and revision. Increase revision when changing lessons or answers so a changed course does not inherit completed checks. Certificates show completion only; no CPD/CLE accreditation has been claimed.

## Deployment, backup and recovery

One-time Cloudflare setup (from this folder, signed in with `npx wrangler login`):

1. `npx wrangler d1 create law-girl-db` and paste the printed `database_id` into `wrangler.jsonc`.
2. `npx wrangler r2 bucket create law-girl-files` (keep it private).
3. Set each production variable above with `npx wrangler secret put NAME`.
4. `pnpm run deploy` builds, applies pending D1 migrations from `drizzle/` and publishes the Worker.
5. Attach the custom domain in Cloudflare (Workers → law-girl → Settings → Domains & Routes), then set `SITE_URL` to it.
6. In Stripe, add the webhook endpoint `https://<domain>/api/stripe/webhook` with the four events listed under Payments and save its signing secret as `STRIPE_WEBHOOK_SECRET`.

After that, every release is `pnpm test && pnpm run typecheck && pnpm run deploy`. Applied migrations are append-only. Source rollback (`wrangler rollback`) does not roll the database schema back; inspect compatibility first. Content exports omit subscriber/purchase secrets; subscriber CSV is separate and owner-only. Enable D1 Time Travel and set R2 retention according to the owner’s requirements.

## Remaining launch inputs

Final book files and covers; approved prices and product URLs; direct paperback edition URLs; complete article/media inventory; exact LinkedIn newsletter subscription URL; approved course and newsletter copy; payment/email accounts and sender domain; final business privacy/contact details; domain/audience choice; actual-account payment/email acceptance tests; visual browser review. These are account, content and deployment inputs, not files containing missing application features.
