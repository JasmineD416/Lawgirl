# Acceptance and launch checklist

## Automated checks

Run `pnpm test`, `pnpm run typecheck` and `pnpm run build`. Tests apply the actual ordered SQL migrations to an in-memory SQLite database and mock external providers. They cover owner access, Origin checks, draft/public isolation, stale-version rejection, invalid URLs/files, private asset protection, course revisions/completion, hidden answers, purchase ownership, duplicate webhook delivery, mismatched prices, original-edition delivery after catalog changes, refund blocking, confirmation, unsubscribes, draft-send prevention and recipient isolation. Tests do not charge cards or send real messages.

## Browser review (required before launch)

- Review mobile/desktop layout, images, long podcast title wrapping, navigation and keyboard focus.
- Open/close book dialog with keyboard and Escape; select a series and episode season.
- Verify every linked article/media source and direct paperback edition URL.
- Open Owner Studio; save a draft and confirm public content stays unchanged; publish, then archive.
- Publish an original blog post and a second course; test the real public routes.
- Upload a final cover and paid book file; verify paid storage is never publicly exposed.
- Complete all course checks; refresh/resume; issue certificate; print/save as PDF.

## Provider acceptance tests with owner account settings

- Accounts: create an account, confirm the email link, sign out and back in, reset the password from the email link and confirm the old password no longer works. Sign up with OWNER_EMAIL, confirm it, and check Owner Studio opens only after confirmation.

- Law School in Stripe test mode: enrol in a paid course, confirm the syllabus-only view before payment and full lessons after, confirm a second account stays locked, refund the payment and confirm access is removed.

- Use Stripe test mode first. Complete checkout, cancel, replay webhooks, simulate refund, test session ownership and original-edition delivery. Verify successful return page and library download.
- Confirm the provider callback can reach the deployment through an approved access configuration.
- Verify the email sender domain, sender footer and contact details.
- Subscribe using a test recipient under the owner's control; confirm once, retry the confirmation, unsubscribe and confirm suppression before subsequent issues.
- Send an owner preview, approve a test issue and dispatch it to an explicitly authorized test list only.
- Replay a delivery batch and verify it is not resent. Exercise provider failure/rate limiting and uncertain-delivery reconciliation.
- Verify signed bounce/complaint webhooks, one-click unsubscribe and request limits.
- Activate a secret-bearing scheduler only after mail testing and owner approval of the send schedule.

## Content and account inputs

Approve cover artwork, book files/prices/retailer links, source inventory, Stack URLs, original course content, newsletter copy/name, policies, sender address, final domain and site audience. Current articles/media/blog entries are a selected seed archive; complete historical materials must be imported. Credentials are not included in source. No live sales, newsletter broadcasts or unattended sending schedule have been activated during development.
