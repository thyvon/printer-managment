# Project Proposal
## Cloud-Based Printer Fleet Management & Automated Billing System

**Prepared by:** Vun Thy
**Prepared for:** [Client / Organization Name]
**Date:** August 13, 2026
**Status:** Draft for review

---

## 1. Executive Summary

This proposal outlines the development of a cloud-based platform for managing printer fleets, automating usage tracking, and generating contract-based invoices for managed print service (MPS) and printer-rental businesses operating in Cambodia.

The system replaces manual, error-prone printer meter readings with an automated pipeline: printers report page counts through a lightweight on-site collector, the cloud platform calculates usage against each customer's contract terms, and invoices are generated and delivered without manual intervention.

This is not a speculative concept. SNMP-based counter collection feeding automated billing is a mature, proven model used by global platforms such as FMAudit, PrintFleet, and Print Audit, and offered as a standard service by every major printer manufacturer. Cambodia also has an active printer/copier rental market today — but it currently runs on informal, manual processes (phone and Telegram-based sales, manual meter checks), which represents a real and currently unaddressed gap.

---

## 2. Market Validation & Opportunity

### 2.1 Global precedent

Managed print billing built on automated SNMP polling is an established software category, not a novel idea:

- **FMAudit, PrintFleet, and Print Audit** — now unified under ECI's Printanista platform — are industry-standard tools used by print dealers worldwide to collect device data and automate billing across multi-vendor fleets.
- **MPS Monitor** offers the same model as a pure cloud SaaS, explicitly built around standard SNMP printer MIB specifications so it works across brands rather than locking a dealer into one manufacturer.
- Every major OEM — Canon, HP, Kyocera, Ricoh, Brother — sells its own "Managed Print Services" program built on the same underlying pattern: monitor usage, automate consumables and billing, reduce cost per page for the customer.

This confirms the architecture we designed (collector agent → cloud ingestion → contract-based billing) follows a well-proven pattern rather than an unvalidated assumption.

### 2.2 The Cambodia opportunity

A market check confirms active printer/copier rental businesses currently operating in Phnom Penh, offering monthly rental plans with page-inclusion tiers — for example, plans bundling a fixed number of free pages per month with the rental fee, sold through Khmer24 classifieds, Facebook pages, and Telegram contact numbers.

Two things stand out from how these businesses currently present themselves online:

1. **No visible dedicated software** — pricing, meter tracking, and customer communication appear to run through informal channels (phone, Telegram, spreadsheets), not a fleet management platform.
2. **Existing demand for page-based billing** — the rental model (base fee + included page volume + overage) is already the norm locally, meaning the *business model* doesn't need to be introduced to the market — only the *automation* does.

This suggests a genuine, currently unaddressed gap rather than a market that needs to be created from scratch.

### 2.3 What this means for the project

The market opportunity is real, but it does not remove the need for validation before a full build. The build plan in Section 8 is structured around securing a pilot customer early, rather than building the complete 14-module system speculatively.

---

## 3. Problem Statement

Businesses that rent out or manage printer fleets — whether for their own operations or as a service to clients — typically face:

- **Manual meter reading** — staff physically check each printer or log in to each device's interface to record page counts.
- **Billing disputes** — without a verifiable, timestamped reading history, discrepancies between billed and actual usage are hard to resolve.
- **Fragmented contract terms** — different customers have different per-page rates, included volumes, and color/mono splits that are difficult to track accurately at scale in spreadsheets or manually.
- **No early warning on toner or maintenance needs** — problems are discovered reactively rather than proactively.

These issues scale poorly — the more devices and customers a rental business manages, the more manual tracking breaks down.

---

## 4. Proposed Solution

A single cloud platform automating the full cycle from printer to payment:

```
Printer
   ↓
Automatic Counter Reading
   ↓
Cloud System
   ↓
Calculate Monthly Usage
   ↓
Apply Contract Pricing
   ↓
Generate Invoice
   ↓
Payment & Reporting
```

A lightweight collector agent installed at each customer site polls printers directly over the local network via SNMP and reports counter data to the cloud platform on a schedule. The platform stores this as a time-series history, applies each customer's contract pricing rules, and produces invoices, reports, and alerts automatically.

---

## 5. Competitive Landscape

| | Global MPS platforms (FMAudit, PrintFleet, MPS Monitor) | This proposal |
|---|---|---|
| Target market | Large dealers, enterprise fleets | Cambodian SME rental businesses |
| Pricing model | Enterprise licensing, per-device fees | Affordable tiers suited to small/mid rental operators |
| Language support | English-only | Bilingual Khmer/English from day one |
| Local payment/invoicing norms | Not adapted to KHR/USD dual pricing | Built for KHR/USD dual pricing common in Cambodia |
| Deployment complexity | Heavier, built for IT-staffed dealers | Lightweight collector agent, minimal setup for non-technical site staff |

The differentiation isn't technical novelty — it's fit. Global platforms are built for large, IT-staffed dealer networks; this platform is scoped for the smaller, informally-run rental businesses that make up the visible Cambodian market today.

---

## 6. Key Modules

| # | Module | Purpose |
|---|---|---|
| 1 | Dashboard | At-a-glance view of fleet status, usage, and revenue |
| 2 | Customer Management | Customer profiles, sites, and contacts |
| 3 | Printer Management | Device inventory, specs, and status per site |
| 4 | Printer Collector Management | Registration and health monitoring of on-site collector agents |
| 5 | Automatic Counter Reading | Scheduled SNMP polling and ingestion of page counts |
| 6 | Contract Management | Pricing tiers, included volumes, contract terms per customer |
| 7 | Usage Calculation | Monthly usage derived from counter deltas |
| 8 | Automatic Billing & Invoicing | Invoice generation from usage + contract terms |
| 9 | Maintenance & Service Management | Service tickets, technician scheduling, service history |
| 10 | Toner & Parts Management | Consumables tracking and low-toner alerts |
| 11 | Reports | Usage trends, revenue, fleet health, customer-level breakdowns |
| 12 | Notifications & Alerts | Email/Telegram alerts for toner, faults, billing events |
| 13 | User & Role Management | Staff accounts, permissions, multi-level access |
| 14 | Audit Logs | Full traceability for billing disputes and compliance |

*Not all 14 modules are needed for a first pilot — see Section 8 for MVP scope.*

---

## 7. System Architecture

The platform is organized into four layers:

**Customer site (on-premises)**
Printers of various vendors, polled locally by a collector agent over SNMP. The collector buffers readings locally and retries on connectivity loss, which matters given inconsistent internet reliability at some SME sites.

**Cloud backend (Laravel 13)**
Handles authentication, core business modules (customer, contract, printer management), and exposes the API consumed by the frontend and, indirectly, by the collector agents.

**Data layer (PostgreSQL 17)**
Counter readings are stored as an append-only time series — never overwritten — preserving a full audit trail for billing disputes. Contract and pricing data is stored separately and referenced at calculation time.

**Processing & delivery**
A scheduled billing engine calculates monthly usage, applies contract pricing, and generates invoices. A dashboard surfaces reports and alerts to staff and, potentially, to customers directly.

---

## 8. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend | Laravel 13 (PHP 8.3) | Eloquent ORM, Sanctum auth, Queues + Horizon for background jobs, built-in scheduler and localization |
| Frontend | Next.js 16 | React framework for the dashboard and reporting UI |
| UI system | **Tailwind CSS + shadcn/ui** | Utility-first styling with accessible, composable components; matches the design approach already used across your other projects (procurement system mockups, product catalog UI) for consistency |
| Data fetching | TanStack Query | Caching + polling for live counter and dashboard data |
| Forms | `react-hook-form` + `zod` | Zod schemas can mirror backend validation rules |
| Charts | Recharts | Usage trends, cost breakdowns in Reports module |
| i18n | `next-intl` (frontend) + Laravel localization (backend) | Bilingual EN/KM support end to end |
| Database | PostgreSQL 17 | Time-series counter data, contract and pricing tables |
| Collector agent | Go | Single dependency-free binary distributed to customer sites; `gosnmp` for polling, `bbolt` for local buffering, `viper` for config |
| Background jobs | Laravel Queues + Horizon (Redis-backed) | Usage calculation, invoice generation, ingestion queues |
| Invoicing/PDF | Spatie Laravel-PDF (Browsershot) | Headless-Chrome rendering, reliable Khmer font support |
| Notifications | Laravel Notifications (mail) + Telegram channel | Toner, maintenance, and billing alerts — Telegram matters given how local rental businesses already communicate with customers |
| Testing | Pest + Playwright | Backend unit/integration and frontend E2E |
| Infrastructure | Docker Compose, NGINX Proxy Manager, Cloudflare Tunnel, k3s | Reuses your existing operational setup |

---

## 9. Go-to-Market & Validation Plan

Given that this platform's success depends as much on landing a real customer as on the build quality, validation is sequenced *before* full development rather than after.

| Step | Action | Goal |
|---|---|---|
| 1 | Contact 3–5 existing Phnom Penh printer rental businesses (informal outreach — phone, Telegram, in person) | Confirm how they currently track usage and bill, and whether automation is a felt pain point |
| 2 | Identify one business willing to pilot, ideally one managing 15+ devices where manual tracking is already straining | Secures a real deployment target, not a hypothetical one |
| 3 | Scope a minimum viable pilot: Customer Management, Printer Management, Collector + Counter Reading, Contract Management, basic Usage Calculation and Invoicing only | Proves the core automation loop works before investing in Maintenance, Toner, Reports, and Notifications modules |
| 4 | Run the pilot in parallel with the customer's existing manual process for one billing cycle | Lets the pilot customer cross-check automated invoices against their current method, building trust before full cutover |
| 5 | Decide on a pricing model based on pilot feedback — options include a flat monthly platform fee, a per-device fee, or a small percentage of billed revenue | Determines whether this becomes a paid product for other rental businesses or stays an internal tool for one operator |

---

## 10. Development Approach

Development is sequenced to de-risk the highest-uncertainty pieces first — both technical and commercial:

| Phase | Scope | Rationale |
|---|---|---|
| 0 | Customer discovery + pilot commitment (Section 9) | Confirms real demand before committing build time |
| 1 | Foundation — Customer, Printer, Contract, User/Role modules (CRUD + auth) | Establishes the data model everything else depends on |
| 2 | Collector agent + counter reading pipeline | The riskiest technical piece — proving reliable data collection before building billing logic on top of it |
| 3 | Usage calculation + contract pricing engine | Core billing logic, backed by real counter data from the pilot site |
| 4 | Automatic invoicing | Generated from validated usage calculations, run alongside the pilot customer's existing process |
| 5 | Maintenance, toner tracking, reports, notifications | Added once the billing core is proven with a real paying (or pilot) customer |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Building without a validated customer | Phase 0 customer discovery happens before development begins, not after |
| Mixed printer vendors with inconsistent SNMP support | Build against standard printer MIB OIDs first; test against the pilot customer's actual fleet early |
| Unreliable site internet connectivity | Local buffering and retry logic in the collector agent so no reading is lost during outages |
| Billing disputes over usage figures | Append-only counter history plus audit logging gives a verifiable record for every invoice |
| Pilot customer distrust of automated billing | Run automated and manual billing in parallel for one cycle before cutover (Section 9, Step 4) |
| Scope creep across 14 modules | MVP scope limited to five core modules for the pilot; remaining modules added only after the core is proven |

---

## 12. Success Metrics

- Pilot customer secured within the discovery phase (go/no-go gate before development)
- Percentage of printers reporting counter data automatically and on schedule
- Time from month-end to invoice delivery (target: same-day, fully automated)
- Agreement between automated and manual billing during the parallel-run cycle
- Collector agent uptime / successful read rate per site
- Pilot customer's willingness to fully cut over from manual billing after one cycle

---

## 13. Next Steps

1. Begin outreach to 3–5 Phnom Penh printer rental businesses this week
2. Secure one pilot commitment before writing production code
3. Scope and build the MVP (Phase 1 + 2) against the pilot customer's actual printer fleet
4. Run the parallel-billing validation cycle before proposing a pricing model for wider rollout

---

*This proposal is a living document and will be refined as pilot feedback and requirements are confirmed.*
