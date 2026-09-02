# ServeIQ

> **ServeIQ is a cloud restaurant management and point-of-sale (POS) platform with per-guest split payments, offline-first ordering, table-QR menus, and real-time kitchen and guest tracking.**

ServeIQ runs the whole floor of a restaurant, bar or hotel: take table orders, split one bill across guests (per item, by amount, by percentage, or as the remaining balance), settle each guest at the table with cash, card, transfer or USSD, route tickets to the kitchen, track orders live on the guest's phone, and reconcile everything in real time — even when the Internet drops.

It is a monorepo (Nx + Angular) with three deployable apps, backed by a NestJS + PostgreSQL API.

## What makes ServeIQ different

- **Per-guest split payments with item-level allocation** — charge each guest exactly for the items they ate; the tab closes only when the last share is paid.
- **Offline-first** — orders, bills and payments queue on the device and sync (with idempotency) when connectivity returns.
- **Emerging-market ready** — multi-currency (including NGN), transfer/USSD/cash/card settlement, multi-branch, role-based access.
- **Live guest experience** — table-QR menus, online ordering, a real-time order-tracking page, and a table-call button for the waiter.
- **Operational guardrails** — discounts with minimum-order thresholds, ingredient stock deduction, department-routed kitchen orders, audit logs.

## Repository layout

| Path | What it is |
|---|---|
| `apps/waiter` | Angular app for waiters, chefs, supervisors and cashiers (collect orders, route to kitchen, settle bills, split per guest) |
| `apps/admin` | Owner / manager / super-admin dashboard (menu, tables, staff, reports, inventory) |
| `apps/public-menu` | Customer-facing table-QR menu + online ordering + live order tracking |
| `libs/` | Shared Angular libraries (data-access API clients, models) |
| `backend/` | NestJS + PostgreSQL API (git submodule: `DennisMajestie/ServeIQ-Backend`) |

## Quick start

```sh
# waiter app (development)
npx nx serve waiter

# production build
npm run build:waiter

# backend (from backend/)
npm install
npm run build -w apps/api
```

## Deployment

- **Waiter / admin / public-menu:** Vercel, auto-deploy on push to `master` (`serveiq-admin.vercel.app`).
- **Backend API:** Render web service at `https://serveiq-backend.onrender.com`, Swagger at `/api/docs`.

## Links

- Product (coming soon): [https://serveiq.io](https://serveiq.io)
- API docs: [https://serveiq-backend.onrender.com/api/docs](https://serveiq-backend.onrender.com/api/docs)
- Backend repo: [DennisMajestie/ServeIQ-Backend](https://github.com/DennisMajestie/ServeIQ-Backend)
- Contact: [hello@serveiq.io](mailto:hello@serveiq.io)