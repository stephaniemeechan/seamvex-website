# Seamvex CRM — watertight implementation checklist

Source plans: chat refinements (no cashflow, GDrive links, Twilio v1, retire legacy sign in prod, `NODE_ENV` gates in `lib/env.ts`).

**Do not deploy until every BLOCKER row is PASS.**

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Production env gate (`lib/env.ts`) | BLOCKER | Implemented |
| 2 | Legal deploy bundle + logos committed | BLOCKER | Implemented — `public/logos/*.png` + `deploy/legal/` in git (verified 2026-06-20) |
| 3 | Postgres schema + migrations | BLOCKER | Implemented |
| 4 | GCS PDF storage in prod | BLOCKER | Implemented — upload via `saveOrderPdf`; download via `readOrderPdf()` in signed-pdf route (`d1531a5`) |
| 5 | Google SSO `@seamvex.com` only | BLOCKER | Implemented |
| 6 | Password login only in development without Google OAuth | BLOCKER | Implemented |
| 7 | `SESSION_SECRET` required in production | BLOCKER | Implemented |
| 8 | RBAC API — contract mutations admin-only | BLOCKER | Implemented |
| 9 | RBAC UI — standard user nav/pages | MUST | Implemented |
| 10 | Contact mutations scoped (supportInfo only for standard) | BLOCKER | Implemented |
| 11 | CSRF on mutating routes | BLOCKER | Implemented |
| 12 | Rate limits on auth routes | BLOCKER | Implemented |
| 13 | Xero callback admin session binding | BLOCKER | Implemented |
| 14 | Single Xero tenant lock on connect | BLOCKER | Implemented |
| 15 | Xero contact sync in | MUST | Implemented |
| 16 | Xero contact push on admin save | MUST | Implemented |
| 17 | Contact active/inactive rule | MUST | Implemented |
| 18 | Support info + Drive attachment links | MUST | Implemented |
| 19 | Resources Drive folder links | MUST | Implemented |
| 20 | Branding PDF + support tier selector | MUST | Implemented |
| 21 | DPA + platform privacy PDF routes | MUST | Implemented |
| 22 | Documenso CE integration | BLOCKER | Implemented (requires env + separate service deploy) |
| 23 | Documenso customer email disabled | MUST | Implemented (`distributionMethod: NONE`) |
| 24 | Documenso webhook verification | BLOCKER | Implemented — header `x-documenso-secret` vs `DOCUMENSO_WEBHOOK_SECRET` |
| 25 | Legacy `/sign` retired in production | BLOCKER | Implemented (`legacySignAllowed()` = `!isProduction()`) |
| 26 | Legacy sign requires `status=sent` in dev | BLOCKER | Implemented |
| 27 | `signToken` stripped from API in prod | BLOCKER | Implemented |
| 28 | Gmail From `@seamvex.com` with display name | MUST | Implemented |
| 29 | Gmail merge fields + ticket thread on send | MUST | Implemented |
| 30 | Tickets + tasks scoping | MUST | Implemented |
| 31 | Twilio voice (in/out) | MUST | Implemented |
| 32 | Twilio click-to-call | MUST | Implemented |
| 33 | No cashflow/overdue reporting | MUST | Implemented |
| 34 | Xero DRAFT invoice on Documenso sign | MUST | Implemented |
| 35 | Middleware hardening | BLOCKER | Implemented |
| 36 | Documentation accurate | MUST | Audited 2026-06-20 — README, DEPLOY, GET-READY, CRM, e-sign, PROPOSALS, XERO-SETUP, DNS-SETUP |
| 37 | Section B — Xero org setup (manual) | MUST | `docs/XERO-SETUP.md` — blocked until Cloud Run env + Google SSO |
| 38 | Section C — Cloud Run deploy (manual) | BLOCKER | `docs/DEPLOY.md` — service live; **env vars not set** (GET-READY §C) |
| 39 | Full pre-production audit | BLOCKER | Code complete on `4946376`; manual C/D/E in GET-READY remain |

See dependency order and acceptance criteria in sub-agent audit output (2026-06-19).
