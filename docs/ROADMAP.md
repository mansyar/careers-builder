# Development Roadmap

## Project: Local AI-Powered CV Builder & Career Opportunity Searcher

---

Each phase delivers end-to-end testable vertical slices. Every track cuts through frontend → API → database and is independently verifiable via Playwright E2E (unless noted otherwise).

---

## Phase 0: Skeleton

Goal: Bootable app with navigation shell and database connectivity.

### Track 0.1 — Project Scaffold ✅ *(Complete — 2026-05-21)*
- Initialized TanStack Start project with TypeScript (strict mode)
- Configured Vite 8, Nitro, TanStack Router (file-based routing)
- Set up Dockerfile with `node:22-slim` (deviated from `node:20-slim` for pnpm v11 compat), Playwright Chromium, and `wget`
- Health check endpoint at `GET /api/health` returns HTTP 200 with `Content-Type: application/json` and `{ "status": "ok" }`. Uses TanStack Start server route pattern (`.ts` with `server.handlers`). Requires `pnpm dev` before build to generate route tree.
- Dev toolchain: pnpm (deviated from npm), Vitest, `@vitest/coverage-v8`
- All TanStack boilerplate removed — branded as Careers Builder
- **Test:** Docker boots, `GET /api/health` returns 200 (tested: 100% coverage)

### Track 0.2 — Dev Tooling & Git Hooks ✅ *(Complete — 2026-05-21)*
- Configured ESLint + Prettier with flat config, TypeScript-ESLint, and React plugins
- Set up Husky + lint-staged for pre-commit hooks (lint, format, file size check)
- Set up pre-push hooks (TypeScript typecheck, 80% coverage threshold)
- Added pnpm scripts: lint, format, format:check, typecheck, check:all
- **Test:** 14 tests passing, 94% line coverage

### Track 0.3 — UI Shell + Database Bootstrap ✅ *(Complete — 2026-05-21)*
- Persistent sidebar with Home, CV Builder, Job Search navigation (active route highlighting)
- Header nav links removed (brand + ThemeToggle only)
- Responsive sidebar: desktop always visible, mobile hamburger toggle with backdrop overlay
- Routes: `/cv-builder` and `/job-search` nested under `_app` layout route with empty states
- Landing page hero buttons and clickable feature cards navigate to both routes
- `better-sqlite3` + `sqlite-vec` installed and initialized at boot
- `DatabaseManager` singleton (configurable path, `:memory:` for tests, WAL mode, FK enforcement)
- Idempotent migrations for `users`, `cv_profiles`, `cv_profile_versions`, `job_postings`, `vec_cv_profile_versions`, `vec_job_postings`
- `GET /api/internal/debug/db-schema` returns all table/column info (decoupled handler pattern)
- Landpage page landing page updated with working "Build Your CV" and "Search Jobs" CTA buttons
- Dev tooling: coverage exclusion narrowed to include `src/routes/**`, `pnpm dev --port 3001`
- **Test:** 50 tests passing, 14 test files, 92.45% component coverage, 81.48% DB layer coverage

---

## Phase 1: CV Data Layer

Goal: Full CRUD for CV profiles and versions. Manual editing works. No AI yet.

### Track 1.1 — CV Profile & Version API ✅ *(Complete — 2026-05-21)*
- `POST /api/cv` — create profile (auto-creates first empty version)
- `GET /api/cv/:cvProfileId/versions` — list versions
- `GET /api/cv/:cvProfileId/version/:versionId` — get single version JSON
- `PUT /api/cv/:cvProfileId/version/:versionId` — update version (deep merge, copy-on-write)
- Decoupled handler pattern: business logic in `src/lib/server/cv-profiles.ts`, thin TanStack Start server routes
- Full TDD cycle (Red → Green) for all 4 handlers: deepMerge, createCvProfile, listVersions, getVersion, updateVersion
- **Test:** 102 tests passing, 88.23% overall coverage (handler layer at 91%). Create profile → add data via PUT → verify via GET → copy-on-write creates new version → historical versions remain immutable.

### Track 1.2 — Manual CV Editor Form
- Frontend form renders all CV sections (Contact, Executive Summary, Experience, Education, Skills, Projects)
- Each section is a collapsible panel with fields mapped from `full_cv_json`
- Save button calls `PUT` endpoint
- Form works fully offline (model data cached in TanStack Router loader)
- **Test:** Fill form → save → refresh page → data persists → edit again → new version created

---

## Phase 2: AI Provider & Chat

Goal: LLM connection configured, streaming chat works, structured extraction saves to DB.

### Track 2.1 — Provider Configuration
- First-run wizard component: API key, base URL, model ID
- Validates key by making a test `streamText` call
- Settings saved to `users.target_settings` (encrypted)
- Settings UI accessible from sidebar
- **Test:** Enter invalid key → error shown. Enter valid key → saved. Restart → key persists (encrypted).

### Track 2.2 — Streaming Chat Endpoint
- `POST /api/chat` Server Function using `streamText()` → `toUIMessageStreamResponse()`
- Chat UI component using `useChat` hook from `@ai-sdk/react`
- System prompt sets context: "You are an executive resume writer. Guide the user section by section."
- Messages persisted to conversation history (in-memory per session)
- **Test:** Type message → see streaming response → verify messages array updates

### Track 2.3 — Structured Section Extraction
- User clicks "Done — extract this section" button in chat
- `POST /api/chat/extract` calls `generateObject()` with per-section Zod schema
- Validated data inserted as new `cv_profile_versions` row
- `active_version_id` updated on `cv_profiles`
- Preview panel re-renders with extracted data
- **Test:** Chat → click extract → verify DB row created → preview shows data → edit via form → re-extract creates new version

---

## Phase 3: Templates & PDF Export

Goal: CV renders as styled template, exports as ATS-compliant PDF.

### Track 3.1 — Template Preview Engine
- Three template components: Modern Minimalist, Executive Traditional, Creative Tech
- `POST /api/cv/preview` renders template to HTML via `renderToString` + minimal provider shell
- Template toggle switcher in UI loads each preview on selection
- **Test:** Select CV → switch through all 3 templates → each renders different layout → HTML contains expected section headings

### Track 3.2 — Playwright PDF Pipeline
- `POST /api/cv/export` renders template HTML, feeds to Playwright `page.setContent()`, calls `page.pdf()`
- PDF returns as `application/pdf` binary stream
- ATS compliance: selectable text, no locked shapes, embedded fonts
- **Test:** Export PDF → download → `pdf-parse` confirms text content and page count → text is selectable (verify via PDF text layer)

---

## Phase 4: Embedding & Scraping Pipeline

Goal: Local ONNX embedding works, web scraper populates job_postings, vectors are stored.

### Track 4.1 — Local Embedding Engine
- `@xenova/transformers` pipeline singleton loaded at first call
- `all-MiniLM-L6-v2` auto-downloads to `{vault_data}/models/`
- Embedding adapter function: `async function embed(text: string): Promise<Float32Array>`
- Batch embedding with `p-limit` (max 3 concurrent)
- Model unavailable state surfaces cleanly in UI
- **Test:** Embed single string → returns 384-dim array. Embed batch of 10 → all return. Values are non-zero (model loaded correctly).

### Track 4.2 — Web Scraper
- Playwright scraper reads static HTML fixtures (one per target source)
- Extracts: title, company, location, description_raw
- Dedupes by `source_url`, inserts into `job_postings`
- Handles timeout (30s), rate-limit (429), and blocked responses
- **Test:** Fixture HTML → run scraper → verify `job_postings` has correct count. Fixture with timeout → verify skip + logged error.

### Track 4.3 — End-to-End Embed + Store
- Embed CV text → store in `vec_cv_profile_versions.biography_embedding`
- Embed job description → store in `vec_job_postings.description_embedding`
- SQLite `MATCH` query using cosine distance returns ranked results
- **Test:** Insert 2 job vectors (one similar to CV, one unrelated) → MATCH query returns similar job first → distance scores are in [0, 1]

---

## Phase 5: Job Sweep Orchestration & Results

Goal: Full sweep flow works end-to-end with background jobs and ranked results UI.

### Track 5.1 — Sweep Orchestration
- `POST /api/jobs/sweep` enqueues job via `p-queue`, returns `sweepId`
- Background worker: embed CV → run scrapers → embed jobs → vector match
- `GET /api/jobs/sweep/:sweepId` polls status with progress (scraped, embedded, matched counts)
- `setInterval` poller checks completion
- UI shows progress bar during sweep
- **Test:** Start sweep → poll → verify status goes `started → running → complete`. Progress counts increment. Results contain ranked jobs.

### Track 5.2 — Job Results UI
- Ranked list with: title, company, location, match score (cosine distance)
- Color-coded match score (green < 0.3, yellow < 0.5, red ≥ 0.5)
- Click to expand: raw description, match rationale
- **Test:** Sweep completes → results render in order → expand shows details → match scores display correct colors

### Track 5.3 — Post-Processing Agent
- `POST /api/jobs/:jobId/analyze` — async LLM call for top N results
- Extracts: missing skills, estimated salary range, company insights, match rationale
- Results cached per job — re-analysis only on explicit request
- **Test:** Analyze job → returns insight fields → re-call returns cached result (no second LLM call)

### Track 5.4 — Feedback & Re-ranking
- Thumbs up/down on each result → stored in new `job_feedback` table (`id`, `job_id`, `positive`, `created_at`)
- Feedback displayed as icon state in UI
- **Test:** Thumbs up → icon shows active state → refresh → state persists. Thumbs 5 jobs → `job_feedback` table has 5 rows.

---

## Phase 6: Hardening & Polish

Goal: Error paths covered, offline mode solid, performance targets met, deployment ready.

### Track 6.1 — Error State Coverage
- LLM provider unreachable → "Connection lost" banner + retry button
- API key invalid → first-run wizard re-triggers
- Scraping source blocked → result row shows "Source unavailable" with reason
- Embedding model not downloaded → "Downloading model..." progress bar
- PDF export fails → "Retry export" button with error detail
- Database write fails → transaction rollback, user notification
- **Test:** Mock each failure scenario → verify correct UI state and recovery path

### Track 6.2 — Offline Mode
- CV editor form works with cached data (no network)
- Template preview renders from cached JSON (no network)
- PDF export from cached data (no network)
- Chat + job search show "Requires network" placeholder
- **Test:** Enable offline mode in DevTools → edit CV → save → switch templates → export PDF → all succeed. Click chat → placeholder shown.

### Track 6.3 — Performance Benchmarking
- Measure all 10 benchmarks from TDD §8 on reference machine
- Optimize hot paths: embedding batching, vector query, template SSR
- Profile memory: ONNX model memory, Chromium subprocess overhead
- **Test:** Regression test suite runs benchmarks and asserts targets

### Track 6.4 — CI Pipeline & Docker Optimization
- GitHub Actions: Vitest on every commit, Playwright E2E nightly
- Docker multi-stage build: dev deps in build stage, prod deps + compiled output in final stage
- Playwright browsers cached in CI (not re-downloaded every run)
- Docker image tagged with version and pushed to registry
- **Test:** CI passes on PR → E2E passes on merge → image size ≤ 1 GB

---

## Phase Dependency Graph

```
Phase 0 (Skeleton)
  └─ Phase 1 (CV Data Layer) ──────────────────────┐
       └─ Phase 2 (AI Chat)                         │
            ├─ Phase 3 (Templates & PDF) ───────────┤
            └─ Phase 4 (Embedding & Scraping) ──────┤
                 └─ Phase 5 (Job Sweep & Results) ──┤
                      └─ Phase 6 (Hardening) ◄──────┘
```

Phases 3 and 4 are independent after Phase 2 completes — they can be built in parallel.
