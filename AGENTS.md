# AGENTS.md — Printer MPS Development Guide

This file is the source of truth for how to build and maintain this project. Read it before writing code. It is maintained collaboratively between Vun Thy (product owner) and the AI senior engineer.

## Project Overview

Cloud-based **Printer Fleet Management & Automated Billing** platform for Cambodian managed-print-service (MPS) and printer-rental businesses.

Flow: SNMP collector agent at customer site → cloud backend → contract pricing → auto-invoice.

## Monorepo Layout

| Path | Component | Stack |
|------|-----------|-------|
| `backend/` | Cloud API + billing engine | Laravel 13 (PHP 8.3+), Eloquent, Sanctum, Horizon, Pest |
| `frontend/` | Dashboard + reporting UI | Next.js 16, Tailwind + shadcn/ui, TanStack Query, next-intl |
| `collector/` | On-site agent | Go, gosnmp, bbolt, viper |
| `docker-compose.yml` | Local infra | PostgreSQL 17, Redis 7 |

## Local Development Setup

### 1. Start infrastructure (Postgres + Redis)

```bash
docker compose up -d
# Check health:
docker compose ps          # both containers should report "healthy"
```

### 2. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env       # already configured for pgsql + redis by default
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

Workers:
```bash
php artisan queue:work      # process background jobs
php artisan horizon         # or run Horizon dashboard (requires Redis)
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

### 4. Collector (Go)

```bash
cd collector
go build ./...
# Create config.yaml, then run:
./collector
```

## Required Commands (run after code changes)

| Task | Command | Where |
|------|---------|-------|
| Backend unit/integration tests | `php artisan test` | `backend/` |
| Backend code style (Pint) | `./vendor/bin/pint` | `backend/` |
| Frontend lint | `npm run lint` | `frontend/` |
| Frontend typecheck/build | `npm run build` | `frontend/` |
| Frontend E2E tests | `npm run test:e2e` | `frontend/` |
| Collector build | `go build ./...` | `collector/` |
| Collector vet | `go vet ./...` | `collector/` |

**Always** run the relevant tests/lint/build for a component after changing it.

## Architecture & Data Flow

```
Customer site                          Cloud
─────────────                          ─────
Printer ──SNMP──▶ collector agent ──HTTPS──▶ Laravel API ──▶ PostgreSQL (append-only time series)
                  (Go, local bbolt                     │
                   buffering/retry)                    ▼
                                 Next.js dashboard ◀── usage/invoice/alert data
```

Key design decisions (from the proposal):
- Counter readings are **append-only** — never overwritten — preserving an audit trail for billing disputes.
- Collector **buffers locally** (bbolt) and retries on connectivity loss (unreliable SME internet).
- Billing is contract-driven: usage deltas × per-customer pricing tiers (included volume, color/mono split).
- Bilingual **EN/KM** end-to-end (next-intl frontend + Laravel localization backend).

## Conventions

- **No code comments** unless they explain genuinely non-obvious logic.
- Backend: use Eloquent models + migrations for all schema; Pest for tests.
- Frontend: shadcn/ui components; `react-hook-form` + `zod` for forms (schemas should mirror backend validation); TanStack Query for data fetching/polling.
- i18n: add all user-facing strings to `frontend/messages/{en,km}.json`; never hardcode UI text.
- Multi-currency: support KHR/USD dual pricing where relevant.
- Match existing style in the file being edited.

## Testing Strategy

1. **Backend (Pest)** — model/unit + feature/integration tests.
2. **Frontend E2E (Playwright)** — critical journeys, verified against running dev server.
3. Manual cross-verification against real printer hardware (SNMP) using the pilot fleet.

## Build Sequence (from proposal)

Phases: discovery → foundation (Customer/Printer/Contract/User) → collector+counter pipeline → usage calc → invoicing → maintenance/toner/reports/notifications. MVP = 5 core modules; do not build the full 14-module spec speculatively.

## Branching / Workflow

This project is **not yet a git repo at the root**. Initialize and commit early so changes are trackable, then:
- One branch/PR per feature or module.
- Keep the proposal (`printer_mps_system_proposal.md`) in sync with what's actually built.

## Handoff Notes for the Senior AI

- Re-read this file at the start of every session.
- Verify infra is up (`docker compose ps`) before backend work.
- Confirm which module is in scope; MVP-first mindset — don't over-engineer.
