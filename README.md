# Law Girl — Education & Media

Website source and operating tools for Jasmine Daya. This is a full-stack Vinext/React application that runs as a Node.js server on Akamai Cloud, with a SQLite database and private file storage on the server. It is not a WordPress theme or a static mockup, and it has no dependency on any AI platform or third-party sign-in.

## What is included

- Responsive homepage and About page; retained podcast artwork; podcast heading: **Breaking down the law, one conversation at a time**.
- Student accounts: students create their own Law Girl account (first name, last name, email, password) with email confirmation, password reset and an account page.
- 32 original podcast episodes with playable audio, search and season filters.
- Law Girl and Private Lender book series, paperback retailer links, cover artwork, Stripe Checkout and an account-bound e-book library.
- Law Girl’s Law School: paid courses sold through Stripe Checkout, with server-side access checks and refund revocation.
- Articles, legal media, blog and LinkedIn Lowdown archives; original writing can be published as native pages.
- Law Girl’s Monthly Rundown: signup with first name, last name and email, confirmation, consent records, branded email template, unsubscribe, bounce/complaint suppression, issue approval, schedules, delivery batches and retry records.
- Owner Studio at `/admin`: draft/publish/archive content, upload private book files and public covers, edit books/products/courses, prepare newsletter issues, inspect subscribers, export/import data.
- Extensible self-paced courses, server-checked knowledge checks, durable progress, versioned course completion certificates and PDF printing.
- Dedicated Stack/product, JD&Co, Geraci LLP and CBPLA pages.
- Sitemap, privacy/terms pages, not-found/error pages and response security headers.
- Database migrations, configuration example, import example generator and integration tests that use real SQLite with mocked Stripe and Resend.

## Start development

Use Node.js 24 LTS and pnpm (`corepack pnpm`). Dependencies are locked in `pnpm-lock.yaml`.

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local  # fill in local values
pnpm run db:migrate          # creates .data/law-girl.sqlite
pnpm run dev                # http://localhost:5173
```

Checks:

```sh
pnpm test
pnpm run typecheck
pnpm run build
```

## Deploy

Merging a pull request into `main` publishes the site automatically through GitHub Actions. Server setup and the team workflow are in `docs/DEPLOYMENT.md`.

## Developer guide

Read `docs/DEVELOPER_HANDOFF.md`, `docs/CONTENT_MAP.md`, `docs/ACCEPTANCE_CHECKLIST.md` and `docs/API.md`. The complete unconfigured variable names are in `.env.example`; production values live only on the server in `/etc/lawgirl/lawgirl.env`. No live keys are included.
