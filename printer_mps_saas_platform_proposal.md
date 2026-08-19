# Project Proposal
## A Multi-Tenant SaaS Platform for Printer Fleet Management & Automated Billing

**Prepared by:** Vun Thy
**Prepared for:** [Client / Investor / Internal Review]
**Date:** August 13, 2026
**Status:** Draft for review

---

## 1. Executive Summary

This proposal outlines a **multi-tenant SaaS platform** that Cambodian printer rental and managed print service (MPS) businesses subscribe to, in order to run their own operations: tracking printer fleets, automating usage-based billing to their own customers, and managing maintenance and consumables — all without manual meter reading.

This is not a single-company internal tool. It is a software product built once and sold as a subscription to many independent rental businesses, each operating in complete isolation from the others inside the same platform. The platform owner (you) generates recurring revenue from tenant subscriptions; each tenant, in turn, uses the platform to bill *their* own end customers automatically.

The underlying automation model — SNMP-based counter collection feeding contract-based billing — is proven globally by platforms like FMAudit, PrintFleet, and MPS Monitor. What doesn't exist yet, based on market research, is an affordable, bilingual, Cambodia-focused **subscription** version of this tooling aimed at the smaller, informally-run rental operators who currently have no dedicated software at all.

---

## 2. Business Model: Multi-Tenant SaaS

This is a two-sided billing structure, and it's important to keep the two layers distinct throughout this proposal:

| Layer | Who pays whom | What it covers |
|---|---|---|
| **Platform subscription** | Tenant (rental company) → Platform owner (you) | Monthly/annual SaaS fee for access to the platform, scaled by device count or plan tier |
| **Tenant's own billing** | Tenant's customers → Tenant | The automated page-usage invoicing the platform generates *on the tenant's behalf*, for their rental customers |

You never touch the tenant's customer relationships or revenue directly — the platform is infrastructure the tenant uses to run and bill their own business. Your revenue is the subscription fee.

**Multi-tenancy** means every rental company (tenant) that signs up gets a fully isolated workspace — their own customers, printers, contracts, and invoices — while all running on the same shared codebase and infrastructure. This is the same architectural pattern already proven in your 2bReady platform (`BelongsToCompany` scoping), applied here to rental businesses instead of compliance-auditing companies.

---

## 3. Market Validation & Opportunity

### 3.1 Global precedent for the product category

Automated, SNMP-based print billing is a mature, established software category:

- **FMAudit, PrintFleet, and Print Audit** (unified under ECI's Printanista) are industry-standard tools used by print dealers worldwide to automate multi-vendor billing.
- **MPS Monitor** runs the same model as pure cloud SaaS, built on standard printer MIB specifications so it works across brands.
- Every major OEM (Canon, HP, Kyocera, Ricoh, Brother) offers an equivalent "Managed Print Services" program.

None of these, however, are built as an affordable multi-tenant SaaS product for small, independent rental operators in Southeast Asia — they're licensed to large, IT-staffed dealer networks.

### 3.2 The Cambodia opportunity

Active printer/copier rental businesses are already operating in Phnom Penh today, selling monthly plans with page-inclusion tiers through Khmer24 classifieds, Facebook, and Telegram. Two things matter for a SaaS play specifically:

1. **No visible dedicated software** — these businesses appear to run on manual tracking and informal customer communication, meaning there's no incumbent SaaS competitor to displace.
2. **Multiple independent businesses, not one big player** — this is exactly the shape of market a multi-tenant SaaS product is built for: many small operators who each need the same tooling but can't justify building it themselves.

### 3.3 Addressable market shape

Rather than one company needing a custom internal system, the real opportunity is **N independent rental businesses**, each a potential tenant. Even a modest number of paying tenants (a handful of rental shops each managing dozens of devices) is enough to validate recurring revenue before wider expansion across other Cambodian cities or into Laos/Myanmar-adjacent markets with similar informal MPS sectors.

---

## 4. Problem Statement

Printer rental businesses — the platform's target tenants — face:

- **Manual meter reading** across every customer site, which doesn't scale past a handful of devices.
- **Billing disputes** with no verifiable, timestamped reading history to resolve them.
- **Manually tracked contract terms** — different customers, different per-page rates and included volumes, usually managed in spreadsheets.
- **No proactive maintenance or toner alerts** — problems are discovered reactively.
- **No dedicated software available to them at a price or complexity level that fits their business size** — existing global MPS platforms are built for large dealers, not a shop running 30–50 rental units.

That last point is the gap this platform fills.

---

## 5. Proposed Solution

Each tenant, once onboarded, runs the same automated cycle independently within their own isolated workspace:

```
Printer
   ↓
Automatic Counter Reading
   ↓
Cloud System (tenant-scoped)
   ↓
Calculate Monthly Usage
   ↓
Apply Contract Pricing
   ↓
Generate Invoice
   ↓
Payment & Reporting
```

A lightweight collector agent, registered to a specific tenant and site, polls printers over SNMP and reports counter data to the platform. All data — printers, contracts, invoices — is scoped to that tenant and invisible to every other tenant on the platform.

---

## 6. Multi-Tenancy Architecture

This is the core technical differentiator versus building the system as a single-company tool, so it's worth detailing on its own.

**Tenant isolation pattern**
Every table that holds business data (customers, printers, contracts, invoices, users) carries a `company_id` (tenant) foreign key, enforced through a global query scope at the ORM level — the same `BelongsToCompany` pattern already built and proven in 2bReady. Every query is automatically scoped to the authenticated user's tenant; there is no code path where one tenant can see another's data by mistake.

**Shared infrastructure, isolated data**
All tenants run on the same application codebase and the same PostgreSQL database (single-database, shared-schema multi-tenancy) — this keeps hosting costs low and makes platform-wide updates instant for every tenant, which matters for a small operator selling this at SME-friendly price points.

**Platform control plane vs. tenant application plane**
Two distinct layers of the product:
- **Platform control plane** — you, the platform owner, manage tenant sign-ups, subscription plans, billing to tenants, and platform-wide health/monitoring.
- **Tenant application plane** — what each rental company sees and uses day to day: their customers, printers, contracts, and invoices, with zero visibility into the platform or other tenants.

**Collector agents belong to a tenant**
Each collector agent is registered with a tenant-specific API key at install time, so counter data is routed and scoped correctly from the moment it's ingested.

---

## 7. Competitive Landscape

| | Global MPS platforms (FMAudit, PrintFleet, MPS Monitor) | This platform |
|---|---|---|
| Business model | Licensed software, sold to large IT-staffed dealers | Multi-tenant SaaS, self-serve or lightly-assisted onboarding |
| Target tenant size | Large print dealers, enterprise fleets | Small-to-mid Cambodian rental operators (tens of devices) |
| Pricing | Enterprise licensing | SME-friendly subscription tiers (Section 9) |
| Language | English-only | Bilingual Khmer/English throughout |
| Local payment norms | Not adapted to KHR/USD or local payment rails | Built for KHR/USD and local payment methods (e.g. Bakong KHQR) |
| Onboarding complexity | Heavier, assumes dedicated IT staff | Lightweight collector install, minimal technical setup |

---

## 8. Platform Modules

### Platform control plane (you, the platform owner)
| Module | Purpose |
|---|---|
| Tenant Management & Onboarding | Sign-up, provisioning, and lifecycle management of rental-company tenants |
| Subscription & Plan Billing | Recurring billing from tenants to you, plan upgrades/downgrades, dunning |
| Platform Admin Dashboard | Cross-tenant health, usage, and support visibility (without exposing tenant business data) |
| Platform Analytics | Aggregate metrics — active tenants, device counts, MRR — for your own business decisions |

### Tenant application (per rental-company workspace)
| # | Module | Purpose |
|---|---|---|
| 1 | Dashboard | At-a-glance view of the tenant's fleet, usage, and revenue |
| 2 | Customer Management | The tenant's own rental customers |
| 3 | Printer Management | Device inventory per customer site |
| 4 | Printer Collector Management | Registration and health of the tenant's collector agents |
| 5 | Automatic Counter Reading | Scheduled SNMP polling and ingestion |
| 6 | Contract Management | The tenant's pricing tiers and terms with their customers |
| 7 | Usage Calculation | Monthly usage from counter deltas |
| 8 | Automatic Billing & Invoicing | Invoices generated for the tenant's own customers |
| 9 | Maintenance & Service Management | Service tickets and history |
| 10 | Toner & Parts Management | Consumables tracking and alerts |
| 11 | Reports | Usage, revenue, and fleet-health reporting |
| 12 | Notifications & Alerts | Email/Telegram alerts to tenant staff |
| 13 | User & Role Management | The tenant's own staff accounts and permissions |
| 14 | Audit Logs | Traceability for the tenant's billing disputes |

---

## 9. Pricing & Packaging *(illustrative — to validate with prospective tenants)*

A tiered subscription model based on managed device count keeps entry cost low for small operators while scaling revenue with tenants that grow:

| Tier | Devices managed | Illustrative monthly price | Target tenant |
|---|---|---|---|
| Starter | Up to 20 | ~$25–40/mo | Small rental shop, first-time adopter |
| Growth | Up to 100 | ~$80–120/mo | Established operator with multiple customer sites |
| Enterprise | 100+ / custom | Custom pricing | Larger dealer, may want white-label or API access |

These figures are placeholders — real pricing should come out of the go-to-market conversations in Section 11, where you can gauge what a rental operator would actually pay against the manual-process cost it replaces. A free or heavily discounted trial period for the first cohort of tenants is worth considering to reduce adoption friction while the product is still unproven.

---

## 10. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend | Laravel 13 (PHP 8.3) | Eloquent ORM, Sanctum auth, Queues + Horizon, built-in scheduler and localization |
| Multi-tenancy | Custom `BelongsToCompany`-style global scoping | Same pattern proven in 2bReady — single database, shared schema, tenant-scoped queries |
| Frontend | Next.js 16 | Dashboard and reporting UI, used by both platform admin and tenant users |
| UI system | Tailwind CSS + shadcn/ui | Utility-first styling with accessible, composable components |
| Data fetching | TanStack Query | Caching and polling for live counter/dashboard data |
| Forms | `react-hook-form` + `zod` | Schema validation mirroring backend rules |
| Charts | Recharts | Usage trends, revenue, and fleet-health visualizations |
| i18n | `next-intl` (frontend) + Laravel localization (backend) | Bilingual EN/KM throughout, for both platform admin and every tenant |
| Database | PostgreSQL 17 | Tenant-scoped tables; counter readings stored as append-only time series |
| Collector agent | Go | Single dependency-free binary, tenant-scoped API key at registration; `gosnmp`, `bbolt`, `viper` |
| Background jobs | Laravel Queues + Horizon (Redis-backed) | Usage calculation, invoicing, and per-tenant ingestion queues |
| Platform subscription billing | Stripe (cards) + local payment rail (e.g. Bakong KHQR / ABA PayWay) | Two different billing engines exist in this system — this one is *your* revenue from tenants, distinct from the tenant's own customer invoicing (Spatie Laravel-PDF, below) |
| Tenant invoicing/PDF | Spatie Laravel-PDF (Browsershot) | Reliable Khmer font rendering for tenant-issued customer invoices |
| Notifications | Laravel Notifications (mail) + Telegram channel | Both platform-level (tenant billing reminders) and tenant-level (toner/maintenance alerts) |
| Testing | Pest + Playwright | Backend unit/integration and frontend E2E |
| Infrastructure | Docker Compose, NGINX Proxy Manager, Cloudflare Tunnel, k3s | Shared infrastructure serving all tenants |

---

## 11. Go-to-Market Plan

Because this is now a product sold to many independent businesses rather than built for one, validation needs to prove *repeatable* demand, not just one customer's willingness to try it.

| Step | Action | Goal |
|---|---|---|
| 1 | Outreach to 8–10 Phnom Penh printer rental businesses (phone, Telegram, in person) | Confirm the pain point and gauge willingness to pay across multiple independent operators, not just one |
| 2 | Recruit 2–3 as free or discounted beta tenants | Cross-tenant validation that the multi-tenancy model and onboarding flow work for genuinely different businesses |
| 3 | Run each beta tenant's automated billing alongside their existing manual process for one cycle | Builds trust before cutover, per tenant |
| 4 | Use beta feedback to finalize pricing tiers (Section 9) | Replaces illustrative pricing with numbers validated against real willingness to pay |
| 5 | Convert beta tenants to paying subscriptions; begin outbound sales to the wider rental market | Establishes first recurring revenue and a repeatable onboarding motion |

---

## 12. Development Approach

| Phase | Scope | Rationale |
|---|---|---|
| 0 | Customer discovery across multiple prospective tenants (Section 11) | Confirms repeatable demand, not just one willing customer |
| 1 | Multi-tenancy foundation — tenant provisioning, `BelongsToCompany` scoping, auth, subscription billing skeleton | The tenancy model is the architectural core; get it right before building on top of it |
| 2 | Tenant-facing foundation modules — Customer, Printer, Contract, User/Role | Standard CRUD, now correctly tenant-scoped from the start |
| 3 | Collector agent + counter reading pipeline | Highest technical risk — validate against beta tenants' real, mixed-vendor fleets |
| 4 | Usage calculation + contract pricing engine | Core billing logic for tenants' own customers |
| 5 | Automatic invoicing (tenant-facing) + platform subscription billing (tenant-to-you) | Both billing engines live, running in parallel with beta tenants' manual processes |
| 6 | Maintenance, toner tracking, reports, notifications | Added once the tenancy and billing core are proven across multiple beta tenants |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Building the tenancy model without validating repeatable demand | Phase 0 outreach targets multiple prospective tenants, not one |
| Data leakage between tenants | Global query scoping enforced at the ORM level, tested explicitly per module before launch |
| Mixed printer vendors with inconsistent SNMP support | Build against standard printer MIB OIDs first; validate against each beta tenant's actual fleet |
| Unreliable site internet connectivity | Local buffering and retry logic in the collector agent |
| Tenants distrust automated billing to their own customers | Parallel-run automated and manual billing per tenant before cutover |
| Pricing set too high or too low for the actual market | Beta-tenant feedback finalizes pricing before wider rollout, not guesswork upfront |
| Platform subscription payment collection (local payment norms) | Support local rails (Bakong KHQR) alongside cards from day one, rather than assuming card-only billing works in this market |
| Single-tenant technical incident affecting others (shared infrastructure) | Tenant-scoped queues and rate limits so one tenant's load or failure doesn't degrade others |

---

## 14. Success Metrics

Framed as SaaS metrics, since the business is now subscription revenue rather than a single delivered system:

- Number of beta tenants successfully onboarded and running in parallel-billing mode
- Conversion rate from beta to paying subscription
- Monthly Recurring Revenue (MRR) after initial rollout
- Tenant churn rate
- Average devices managed per tenant (growth signal for tier upgrades)
- Time from tenant sign-up to first automated invoice generated
- Zero cross-tenant data incidents

---

## 15. Next Steps

1. Begin outreach to 8–10 Phnom Penh printer rental businesses this week
2. Recruit 2–3 beta tenants before writing production code
3. Build the multi-tenancy foundation (Phase 1) validated against real, distinct beta tenants — not a single hypothetical one
4. Finalize pricing tiers from beta feedback before any public launch or wider marketing

---

*This proposal supersedes the single-tenant version and reflects the platform as a subscription product sold to multiple independent rental businesses.*
