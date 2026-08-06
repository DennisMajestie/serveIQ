# ServeIQ — Beta Testing Guide

This guide covers how to deploy a **staging** environment, onboard 2–3 beta
businesses, and collect feedback. It is meant for the ServeIQ team, not for
beta customers.

---

## 1. Release checklist (run before every beta deploy)

- [ ] `npx tsc --noEmit` passes in `backend/apps/api` (no new errors).
- [ ] Migrations run on the staging DB (`npm run migration:run`).
- [ ] Seed script runs (`npm run seed`) against staging so each beta business
      starts with demo data.
- [ ] `SENTRY_DSN` is set so errors are captured (see `main.ts`).
- [ ] `BETA_MODE=true` is set in staging env.
- [ ] Smoke-test the feedback flow:
      `POST /api/v1/feedback` with a valid auth token returns the created
      record.
- [ ] Smoke-test a full order → bill → payment against **Paystack test keys**
      (never prod keys on staging).

## 2. Environment variables (staging)

Copy `backend/apps/api/.env.example` and fill in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres URL for the staging database |
| `REDIS_URL` | Redis for queues/sync |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Long random secrets |
| `PAYSTACK_SECRET_KEY` | Paystack **test** key (`sk_test_...`) first |
| `PAYSTACK_PUBLIC_KEY` | Paystack **test** key (`pk_test_...`) |
| `SENTRY_DSN` | Error monitoring DSN |
| `NODE_ENV` | `production` on the deployed backend |
| `BETA_MODE` | `true` |

> Never commit real Paystack keys. Test keys are fine on the staging branch.

## 3. Onboarding a beta business

Business development decides which businesses to onboard. For each business:

1. **Create the account** through the app registration flow.
2. **Run the demo seed** against that business (or let them enter data live —
   the in-app UI supports creating menu items, tables, departments, etc.).
3. **Verify subscription** is active so billing/Checkout flags are not shown.
4. **Hand over** the customer-facing app URL and admin app URL.
5. **Confirm they can log in** on both a desktop and an Android tablet/phone.

## 4. Bug reporting flow

- Staff use the **Feedback** button (floating pencil FAB, bottom-right in the
  admin   app). It opens a form: category (Bug / Feature / UX / Performance /
  Other), a message, and auto-attaches the current URL and user agent.
- Submissions are stored via `POST /api/v1/feedback` and visible to the
  platform team (`GET /admin/feedback`).
- The team can triage: set `status` to `open` / `in_review` / `resolved` and add
  `admin_notes`.

## 5. Monitoring

- **Errors:** Sentry — enabled when `SENTRY_DSN` is set in `main.ts`.
- **Health:** `GET /health` and the superadmin `GET /admin/system/health`.
- **Billing coverage:** `backend/apps/api/test/billing.e2e-spec.ts` covers the
  V1 billing flow and cross-business data leakage.

## 6. Known limits (do not promise to beta customers)

- End-to-end test execution on a clean machine (backed by V1 billing e2e tests).
- Offline sync on the device is not verified.
- Load testing at 100 concurrent users is not done.
- Production Paystack keys not wired (test keys only).

## 7. Exit criteria → commercial

Track against `backend/MASTER_CHECKLIST.md`: real E2E verification, offline sync,
load test, prod Paystack keys, staging env, 3 beta businesses onboarded, demo
videos, onboarding guide.