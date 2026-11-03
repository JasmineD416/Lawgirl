# API and authorization

JSON routes return `Cache-Control: no-store`. Browser mutations require a same-origin Origin header. Identity comes only from the Law Girl session cookie (lg_session) issued by /api/account/signin or /api/account/signup. Secrets remain server-side.

| Endpoint | Method | Access / behavior |
|---|---|---|
| `/api/checkout` | POST | Signed-in; server-selected product/price/file → Stripe Checkout URL |
| `/api/fulfill` | POST | Signed-in; verifies paid session belongs to caller |
| `/api/stripe/webhook` | POST | Stripe HMAC signature and timestamp verification |
| `/api/library` | GET | Signed-in; own orders and awards |
| `/api/download?session=...` | GET | Own verified paid entitlement → private file stream |
| `/api/asset?key=covers%2F...` | GET | Only uploaded image-cover keys; no paid files |
| `/api/courses/progress?course=...` | GET | Own course progress and award |
| `/api/courses/answer` | POST | `{course,revision,lesson,answer}`; server checks answer |
| `/api/courses/certificate` | POST | `{course,revision,name}`; requires every knowledge check |
| `/api/newsletter/subscribe` | POST | `{name,email,consent,website}`; rate-limited double opt-in |
| `/api/newsletter/confirm` | POST | `{token}`; confirms a pending subscription |
| `/api/newsletter/unsubscribe` | POST | `{token}`; or provider one-click form with token query |
| `/api/newsletter/events` | POST | Signature-verified Resend bounce/complaint suppression |
| `/api/newsletter/dispatch` | POST | Scheduler bearer secret; approved and due issues only |
| `/api/admin/state` | GET | Owner only: content, issue state, readiness and counts |
| `/api/admin/save` | POST | Owner only: `{id,kind,payload,expectedVersion}` → draft |
| `/api/admin/publish`, `/archive` | POST | Owner only: optimistic version-checked publication |
| `/api/admin/asset` | POST | Owner only: raw bounded file; filename in `X-File-Name` |
| `/api/admin/export` | GET | Owner only: content JSON |
| `/api/admin/import` | POST | Owner only: validated new drafts; no existing-record overwrite |
| `/api/admin/subscribers` | GET | Owner only: latest 500 subscriber records |
| `/api/subscribers/export` | GET | Owner only: full CSV, formula-escaped fields |
| `/api/admin/campaign/save` | POST | Owner only: editable draft issue |
| `/api/admin/campaign/test` | POST | Owner only: preview to the verified owner email |
| `/api/admin/campaign/approve` | POST | Owner only: saved issue, current version, date, `APPROVE` confirmation |
| `/api/admin/campaign/cancel` | POST | Owner only: cancel remaining delivery |
| `/api/admin/campaign/dispatch` | POST | Owner only: process up to 10 due recipient deliveries |

`/api/learning` and `/api/certificate` retain compatibility for initial introductory-course records. New courses use `/api/courses/*`. Certificate pages support both initial and versioned course awards.


## Accounts

| Route | Purpose |
|---|---|
| `GET /api/account/me` | Current account (or null) |
| `POST /api/account/signup` | firstName, lastName, email, password (10+ characters); signs in |
| `POST /api/account/signin` | email, password; sets lg_session |
| `POST /api/account/signout` | Ends the current session |
| `POST /api/account/verify` | token from the confirmation email |
| `POST /api/account/resend-verification` | Sends a new confirmation email |
| `POST /api/account/forgot` | email; sends a reset link if the account exists |
| `POST /api/account/reset` | token, password; ends other sessions |
| `POST /api/account/profile` | firstName, lastName |
| `POST /api/account/password` | currentPassword, newPassword |
