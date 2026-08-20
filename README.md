# HireLens — Ghost Job Radar 🔍🌐
### *OSINT Job Market Intelligence Terminal & Self-Healing Scraper Infrastructure*

> **"Readable, structured, and handled at the edges. The repository a stranger could pick up on Monday."**

---

## 🎯 What HireLens Does

Over **30% of tech job listings are "ghost jobs"** — requisitions perpetually reposted to collect resumes, bait candidate pipelines, or project fake growth while the role is internally frozen or already closed.

**HireLens** cross-references job postings across primary career portals (Greenhouse, Lever) and aggregator mirrors (LinkedIn, Indeed). It normalizes titles into canonical identifiers using **Google Gemini 3.6 Flash**, computes deterministic **Hiring Authenticity Scores (0–100)** with line-by-line deduction receipts, and **self-heals its own web scrapers** via the real **Bright Data Scraper Studio CLI** (`bdata scraper heal` and `bdata scraper approve`) when target DOM layouts change.

---

## 🏛️ System Architecture & Data Flow

```
External Scraped DOM (Greenhouse, Lever, LinkedIn, Indeed)
    │
    ▼
[ Bright Data Scraper Studio CLI ] (`bdata scraper run <id> <url> --json`)
    │
    ▼
[ Validation Boundary ] (Zod Schema & Strict Types)
    │
    ▼
[ Title Normalization Engine ] (Google Gemini 3.6 Flash / Rule-Based Heuristic Fallback)
    │   Canonical Slug: `<company>-<level>-<domain>` (e.g. `stripe-senior-payments`)
    ▼
[ Deterministic Scoring Engine ] (`backend/src/utils/scoringEngine.ts`)
    │   Base 100 - Repost Loops (-15/ea) - Status Conflicts (-35) - Salary Drift (-20) - Staleness (-5/5d)
    ▼
[ Persistence Layer ] (PostgreSQL via Prisma Singleton + Redis BullMQ Queue)
    │
    ▼
[ Express REST API ] (`/api/listings`, `/api/companies`, `/api/collectors`, `/fixture/v1`, `/fixture/v2`)
    │
    ▼
[ Frontend API Service ] (`frontend/src/services/api.ts` — Type-Safe Boundary & Normalization)
    │
    ▼
[ Custom Domain Hooks ] (`useJobListings`, `useCompanyDossier`, `useCollectorHealth`)
    │
    ▼
[ OSINT Intelligence Terminal ] (React 19 + TanStack Start / Router + Tailwind CSS)
    ├── Job Radar (`/`)
    ├── Company Signals (`/company`)
    └── Scraper Health & Break-and-Heal Console (`/health`)
```

---

## 📂 Project Structure

```text
HireLens/
├── backend/                              # Express + TypeScript + Prisma + BullMQ
│   ├── prisma/schema.prisma              # PostgreSQL schema (Company, ListingSnapshot, JobScore, CollectorHealth)
│   ├── src/
│   │   ├── app.ts                        # Server entry point, middlewares, route registrations
│   │   ├── config/env.ts                 # Zod validated environment variables schema
│   │   ├── controllers/                  # HTTP route handlers (request -> validate -> domain -> response)
│   │   │   ├── collectorController.ts    # Telemetry, break trigger, heal approval, manual sweeps
│   │   │   ├── companyController.ts      # Company dossiers, turnover metrics, discrepancy matrices
│   │   │   ├── fixtureController.ts      # Deterministic /fixture/v1 and /fixture/v2 test pages
│   │   │   └── listingController.ts      # Multi-source listings, scores, search HUD, case files
│   │   ├── domain/                       # Pure business calculations & constants
│   │   ├── errors/AppError.ts            # Typed error hierarchy (NotFoundError, ValidationError, etc.)
│   │   ├── middlewares/                  # Centralized error handler & validation middleware
│   │   ├── routes/                       # Express route declarations
│   │   ├── services/                     # External integrations & background processors
│   │   │   ├── brightDataService.ts      # bdata CLI runner, AST patch heal & approve (--auto-save)
│   │   │   ├── healthMonitor.ts          # Collector health state machine & telemetry tracking
│   │   │   └── normalizer.ts             # Gemini 3.6 Flash structured normalizer + fallback
│   │   ├── types/index.ts                # Shared backend TypeScript types & interfaces
│   │   └── utils/
│   │       ├── scoringEngine.ts          # Deterministic 0–100 authenticity score with guardrails
│   │       ├── prisma.ts                 # Shared PrismaClient singleton
│   │       ├── redis.ts                  # Redis client with graceful offline fallback
│   │       └── __tests__/                # Vitest unit test suite (scoring engine, normalizer)
│
├── frontend/                             # React 19 + TanStack Router + Vite + Tailwind CSS
│   ├── src/
│   │   ├── domain/                       # Extracted pure domain logic
│   │   │   ├── scoring.ts                # Confidence tier resolution & ledger reconciliation
│   │   │   ├── formatting.ts             # Compensation bands, dates, times, barcode generators
│   │   │   └── collectors.ts             # Collector status normalizer & badge tone tokens
│   │   ├── hooks/                        # Feature-level custom hooks
│   │   │   ├── useJobListings.ts         # Job Radar query filtering & case file drawer state
│   │   │   ├── useCompanyDossier.ts      # Company Signals dossier derivation & sparkline trends
│   │   │   └── useCollectorHealth.ts     # Health console polling, break simulation & patch approval
│   │   ├── services/api.ts               # Type-safe API client & external data normalizer
│   │   ├── routes/                       # File-based TanStack Router pages
│   │   │   ├── __root.tsx                # App shell, ErrorBoundary, CustomCursor, QueryProvider
│   │   │   ├── index.tsx                 # Job Radar (Search HUD, Telemetry Cards, Case Cards, Feed)
│   │   │   ├── company.tsx               # Company Signals (Dossier, Sparklines, Matrix, Turnover)
│   │   │   └── health.tsx                # Scraper Health (Break-and-Heal Console, Diff Inspector)
│   │   ├── components/hirelens/          # Core presentational components
│   │   │   ├── Shell.tsx                 # Global header, ticker bar, navigation, and terminal frame
│   │   │   ├── Footer.tsx                # 4-column dark terminal footer with live telemetry
│   │   │   ├── CustomCursor.tsx          # Tactical OSINT crosshair reticle with live coordinates
│   │   │   ├── JobCaseCard.tsx           # Requisition card with score badge & platform chips
│   │   │   └── EvidenceDrawer.tsx        # Itemized score deduction ledger & snapshot timeline
│   │   └── lib/hirelens-data.ts          # Sample data fixtures & fallback offline datasets
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### 1. Installation
```bash
git clone https://github.com/shankywho/HireLens.git
cd HireLens
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### 3. Run Development Server
```bash
# Runs both backend (:3001) and frontend (:5173) concurrently
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Backend HTTP port |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` | `localhost:6379` | BullMQ Redis broker (optional: runs synchronously if offline) |
| `USE_SYNTHETIC_SCRAPER` | `true` | When `true`, runs offline demo dataset & local fixtures. When `false`, executes real `bdata` CLI |
| `BRIGHTDATA_API_KEY` | `""` | API key for Bright Data Scraper Studio CLI authentication |
| `GREENHOUSE_COLLECTOR_ID` | `c_msx28aib1bi38vk8vw` | Primary verified Greenhouse collector ID |
| `GEMINI_API_KEY` | `""` | API key for Google Gemini 3.6 Flash title normalization |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | Backend API URL for frontend client |

---

## 🧭 The "Stranger on Monday" Guide (Where To Look)

| Question | Exact Location |
|---|---|
| **1. Where does the application start?** | Backend: [`backend/src/app.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/app.ts)<br>Frontend: [`frontend/src/routes/__root.tsx`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/routes/__root.tsx) |
| **2. Where are the routes?** | Backend: [`backend/src/routes/`](file:///Users/shankar/PROJECTS/HireLens/backend/src/routes)<br>Frontend: [`frontend/src/routes/`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/routes) |
| **3. Where is Job Radar?** | [`frontend/src/routes/index.tsx`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/routes/index.tsx) & [`frontend/src/hooks/useJobListings.ts`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/hooks/useJobListings.ts) |
| **4. Where is Company Signals?** | [`frontend/src/routes/company.tsx`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/routes/company.tsx) & [`frontend/src/hooks/useCompanyDossier.ts`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/hooks/useCompanyDossier.ts) |
| **5. Where is Scraper Health?** | [`frontend/src/routes/health.tsx`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/routes/health.tsx) & [`frontend/src/hooks/useCollectorHealth.ts`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/hooks/useCollectorHealth.ts) |
| **6. Where are API requests made?** | [`frontend/src/services/api.ts`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/services/api.ts) |
| **7. Where is database access?** | [`backend/src/utils/prisma.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/utils/prisma.ts) & [`backend/prisma/schema.prisma`](file:///Users/shankar/PROJECTS/HireLens/backend/prisma/schema.prisma) |
| **8. Where is scoring implemented?** | Backend: [`backend/src/utils/scoringEngine.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/utils/scoringEngine.ts)<br>Frontend: [`frontend/src/domain/scoring.ts`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/domain/scoring.ts) |
| **9. Where is collector logic?** | [`backend/src/services/brightDataService.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/services/brightDataService.ts) & [`backend/src/services/healthMonitor.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/services/healthMonitor.ts) |
| **10. Where is external data validated?** | [`backend/src/config/env.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/config/env.ts) & [`frontend/src/services/api.ts`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/services/api.ts) |
| **11. Where is external data normalized?** | [`backend/src/services/normalizer.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/services/normalizer.ts) & [`frontend/src/domain/formatting.ts`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/domain/formatting.ts) |
| **12. Where are errors handled?** | Backend: [`backend/src/middlewares/errorHandler.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/middlewares/errorHandler.ts)<br>Frontend: [`frontend/src/components/ErrorBoundary.tsx`](file:///Users/shankar/PROJECTS/HireLens/frontend/src/components/ErrorBoundary.tsx) |
| **13. Where are tests?** | [`backend/src/utils/__tests__/`](file:///Users/shankar/PROJECTS/HireLens/backend/src/utils/__tests__) & [`backend/src/services/__tests__/`](file:///Users/shankar/PROJECTS/HireLens/backend/src/services/__tests__) |
| **14. How do I run the project?** | `npm run dev` (or `npm run build && npm start`) |
| **15. How do I add another collector?** | 1. Add collector ID to `backend/src/services/healthMonitor.ts`<br>2. Add ATS mapping in `backend/src/services/brightDataService.ts` |
| **16. How do I modify a scoring rule?** | Update constants & formulas in [`backend/src/utils/scoringEngine.ts`](file:///Users/shankar/PROJECTS/HireLens/backend/src/utils/scoringEngine.ts) |

---

## 🧮 Core Domain Concepts & Scoring Rules

### Authenticity Scoring Engine (`0–100`)
- **Baseline**: `100` points
- **Repost Loop Penalty**: `-15` points per 30-day repost cycle (capped at `-45`)
- **Cross-Source Status Conflict**: `-35` points (e.g. Active on ATS portal, Closed on LinkedIn)
- **Compensation Drift**: `-20` points (salary spread across platforms > `20%`)
- **Staleness Penalty**: `-5` points per 5 days active beyond 45 days (capped at `-25`)
- **Guardrail A**: A listing flagged by only a single weak anomaly is capped at a minimum score of `80`.
- **Guardrail B**: A listing indexed from only a single platform cannot exceed a score of `85`.

---

## 🧪 Testing

```bash
# Run unit test suite (Scoring engine & Normalizer)
npm run test --workspace=backend

# Run TypeScript typecheck
npm run lint --workspace=backend

# Run production build validation
npm run build
```

---

## 🛠️ Troubleshooting Local Development

1. **Port 3001 already in use**:
   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```
2. **Offline database or Redis**:
   - The backend runs seamlessly in standalone mode if Redis is offline (falling back to direct synchronous scrape execution).
   - If PostgreSQL is offline, `USE_SYNTHETIC_SCRAPER=true` allows the frontend and API to use deterministic mock fixtures without failing.
3. **Render Cold Start Latency**:
   - The deployed production backend on Render free tier sleeps after 15 minutes of inactivity (~45s initial wake-up). Warm up the endpoint by requesting `/health` once before demo testing.
