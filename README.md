# Printer MPS

Cloud-based **Printer Fleet Management & Automated Billing** platform for Cambodian managed-print-service (MPS) and printer-rental businesses.

Flow: SNMP collector agent at customer site → cloud backend → contract pricing → auto-invoice.

## Monorepo

| Path | Component | Stack |
|------|-----------|-------|
| `backend/` | Cloud API + billing engine | Laravel 13, Eloquent, Sanctum, Horizon, Pest |
| `frontend/` | Dashboard + reporting UI | Next.js 16, Tailwind + shadcn/ui, TanStack Query, next-intl |
| `collector/` | On-site agent | Go, gosnmp, bbolt, viper |
| `docker-compose.yml` | Local infra | PostgreSQL 17, Redis 7 |

See [AGENTS.md](./AGENTS.md) for full setup, conventions, and commands.
