# Product Requirement Document (PRD)
## Project: Local AI-Powered CV Builder & Career Opportunity Searcher

---

## 1. Executive Summary & Goals

A private, full-stack desktop web application running on the user's laptop, serving two core functions:

- **CV Builder Mode:** AI-guided conversational interview that extracts professional details, structures them, and maps onto multiple design templates.
- **Job Search Mode:** Semantic search engine that reads a CV, scrapes live job postings via automated scrapers/APIs, and ranks them by contextual relevance.

**Design philosophy:** local-first data security. All personal data is stored and processed on the user's machine. Conversational AI features send text to a cloud LLM provider — that text is never stored or trained on by the provider per their API terms.

---

## 2. Target Audience & Core Value Proposition

- **User Persona:** Professionals who want data sovereignty, protection from third-party resume trackers, and context-aware job listings without data harvesting.
- **Value Proposition:** Minimal data exposure — only conversation text reaches the LLM provider under no-retention terms. No cloud storage costs, multi-template design from a single data source, AI-driven filtering that acts as a private career recruiter.

---

## 3. Functional Requirements

### Mode 1: AI-Powered CV Builder

#### Step 1: Guided Chat Interview
- Interactive real-time chat wizard where the AI acts as an executive resume writer.
- AI prompts section-by-section (Contact, Executive Summary, Experience, Education, Skills, Projects) with adaptive follow-up questions.
- Streaming responses with visual highlights of the section being extracted.
- User can pause the interview, edit parsed information manually in an adjacent form (changes saved via `PUT /api/cv/:id/version/:versionId`), and resume the conversation.

#### Step 2: Multi-Template Visual Engine
- User data serializes into a unified, version-controlled schema decoupled from presentation layers (each save creates a new version entry with full history preserved).
- Multi-column visual toggle for template selection (e.g., *Modern Minimalist, Executive Traditional, Creative Tech*).
- Template switching re-renders instantly without data mutation or re-typing.
- PDF export must be pixel-perfect, multi-page, and ATS-compliant (selectable text, no locked shapes).

### Mode 2: Smart Job Opportunity Searcher

#### Step 1: Target Vector Formulation
- User can select any saved CV version as the "Active Targeting Profile."
- System passes the profile to a local text-processing pipeline to generate a semantic profile.

#### Step 2: Automated Live Sourcing
- "Initiate Career Sweep" triggers local web scraping across publicly accessible job boards (e.g., remote-focused boards, government job portals, company career pages with public listings).
- Search parameters inferred from the CV: geographic requirements, remote eligibility, title hierarchies.
- UI displays estimated coverage per source (e.g., "5 of 8 sources searched") and a caveat that results are best-effort — coverage varies by industry, location, and source availability.
- Authenticated/protected job sites (LinkedIn, Indeed, Glassdoor) are explicitly excluded from scraping scope.

#### Step 3: Local Vector Matching & Optimization
- Each scraped job posting is embedded locally in real-time.
- Distance query compares job description vectors against the active CV vector.
- Results ordered strictly by context match score.
- Asynchronous post-processing agent evaluates top matches, extracts missing skills, compensation ranges, company insights, and highlights why the job matches — or what to adjust in the CV.

---

## 4. UI/UX Requirements

- **Layout:** Persistent sidebar navigation toggling between `CV Builder View` and `Job Search Matrix`.
- **State Transparency:** Visual indicator for CPU/memory during local embedding, network request tally during web crawling.
- **Result Feedback:** Inline thumbs up/down on each job result row. Feedback stored locally and used to adjust future result ranking.
- **Printing Fidelity:** Real-time preview matching paper proportions (`A4`/`Letter`) with printable CSS masking interface chrome during export.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Chat response streaming must begin within 2 seconds of user input (excluding network latency to LLM provider).
- Template switching must re-render in under 500ms.
- Local embedding generation must process a CV (avg 500 words) in under 3 seconds.
- Vector similarity query across 1,000 job postings must return in under 1 second.
- PDF export must complete within 10 seconds for a single-page CV.

### 5.2 Security & Privacy
- All personal data stored exclusively on the local machine — zero telemetry, zero cloud sync.
- LLM API keys stored in local database, never exposed to the client-side bundle.
- All outbound LLM requests must use TLS 1.3.
- Scraping subsystem must not exfiltrate user data — network requests are read-only and limited to job search domains.

### 5.3 Reliability
- Offline mode covers: viewing and editing saved CV data, switching templates, and PDF export. The guided interview and job search require network access.
- Scraping failures must not block the UI — results return with whatever data was collected, with clear error indicators per source.
- LLM streaming interruptions must gracefully degrade: retry with exponential backoff (max 3 attempts), then surface a manual re-try button.

### 5.4 Usability
- First-run wizard guides the user through LLM provider setup in under 3 steps: API key (required), base URL (optional, defaults to OpenAI), and model ID (optional, defaults to gpt-4o).
- Guided interview must require no prior AI/chatbot experience.
- Job search must surface at least 5 results per sweep when public sources contain relevant listings for the user's industry and location.

---

## 6. Success Metrics & KPIs

| Metric | Target | How Measured |
|--------|--------|-------------|
| CV export ATS pass rate | ≥ 95% | Parsed against open-source ATS simulators |
| Interview-to-completion rate | ≥ 80% | Users who finish all CV sections across any number of sessions |
| Avg interview duration | ≤ 12 min | Time from first prompt to completed CV |
| Job search result relevance (top 5) | ≥ 70% user-satisfied | In-app thumbs up/down per result |
| Template switch latency | ≤ 500ms | Browser performance measurement |
| Local embedding throughput | ≥ 50 jobs/sec | Benchmark on reference hardware (M1 MacBook Air) |
| API key misconfiguration recovery | ≤ 30s | From error detection to displaying the first-run wizard with the API key field pre-focused |

---

## 7. Constraints

- **Environment:** Must run on Windows, macOS, and Linux without OS-specific code paths.
- **RAM budget:** Maximum 4 GB host memory for the container (Docker memory limit).
- **Disk budget:** Maximum 1 GB for the application image + dependencies; data directory grows organically.
- **Network:** Scraping targets only public, unauthenticated job listing pages. No CAPTCHA bypass, no credential stuffing.
- **LLM dependency:** Application requires an active internet connection and a valid API key for the conversational interview. CV editing and PDF export work fully offline.
- **GPU:** No GPU acceleration assumed — all local ML runs on CPU via ONNX runtime.

---

## 8. Out-of-Scope

- Multi-user or team collaboration features.
- Native mobile apps (iOS/Android) — web-only.
- Direct apply / application submission through the platform.
- Company career page account creation or login automation.
- User-customizable template editor. Templates are pre-built by the developer.
- AI-powered cover letter or thank-you note generation.
- Resume grammar scoring or ATS-specific keyword optimization beyond context matching.
- Cloud-hosted or SaaS version of the application.

---

---
## 9. Implementation History

### Track 0.3 — UI Shell + Database Bootstrap (Completed: 2026-05-21)
- **Sidebar Navigation:** Persistent left sidebar with Home, CV Builder, and Job Search links. Replaced header nav links (removed Home, About, Features). Active route highlighting via TanStack Router `activeProps`.
- **Responsive Design:** Sidebar collapses to hamburger toggle on viewports < 768px with slide animation and backdrop overlay.
- **Routes:** CV Builder (`/cv-builder`) and Job Search (`/job-search`) nested under `_app` layout route, each with empty state placeholders. Landing page hero buttons navigate directly to both routes.
- **Database Engine:** `better-sqlite3` v12.10.0 with `sqlite-vec` v0.1.9 for vector support. `DatabaseManager` singleton with configurable path and `:memory:` test support.
- **Migrations:** Idempotent DDL (`IF NOT EXISTS`) for 4 structural tables (`users`, `cv_profiles`, `cv_profile_versions`, `job_postings`) and 2 virtual vector tables (`vec_cv_profile_versions`, `vec_job_postings`). Structural migrations work without the sqlite-vec extension; vector migrations require it.
- **Debug Endpoint:** `GET /api/internal/debug/db-schema` — returns JSON with all table names and column info. Decoupled handler at `src/lib/server/db-schema.ts` for unit testability.
- **Server Init:** Database initialized on server boot via dynamic import in `router.tsx` (guarded against browser-side execution).
- **Testing:** 50 tests, 14 test files. 92.45% component coverage, 81.48% DB layer coverage. Port changed from 3000 to 3001 (`pnpm dev`).
- **Deviation (2026-05-21):** Original plan listed `npm`. Changed to `pnpm` per developer preference.
- **Deviation (2026-05-21):** Vitest coverage exclusion narrowed — `src/routes/**` removed from exclude list to track route coverage.

### Track 0.1 — Project Scaffold (Completed: 2026-05-21)
- **Framework:** TanStack Start v1.168.8 (React 19) with TypeScript strict mode
- **Routing:** TanStack Router v1.170.6 (file-based routing)
- **Styling:** Tailwind CSS v4
- **Package Manager:** pnpm v10+ (deviated from npm — faster, disk-efficient)
- **Container:** Docker multi-stage build, `node:22-slim` base (deviated from `node:20-slim` — pnpm v11 requires Node.js ≥ v22.13)
- **Health Check:** `GET /api/health` → HTTP 200, `Content-Type: application/json`, `{ "status": "ok" }`. Implemented as a TanStack Start server route (`.ts` with `server.handlers`). Requires `pnpm dev` before build to generate the route tree.
- **Testing:** Vitest v4 + `@vitest/coverage-v8`, first test at 100% coverage
- **CI Readiness:** All TanStack boilerplate removed, branded as Careers Builder. Docker image verified, health endpoint tested inside container.

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **ATS** | Applicant Tracking System — software used by employers to parse and store resumes. |
| **Embedding** | A numerical vector representation of text in a multi-dimensional space. |
| **LLM** | Large Language Model — the cloud AI model powering the conversational interview. |
| **ONNX** | Open Neural Network Exchange — cross-platform format for ML models. |
| **Server Function** | TanStack Start's mechanism for running server-only code from client routes. |
| **Cosine Distance** | A metric measuring similarity between two vectors (0 = identical, 1 = opposite). Used for ranking job matches. |
| **Post-Processing Agent** | An async LLM call that analyzes top job matches to extract insights (missing skills, salary range, match rationale). |
| **Semantic Search** | Search by meaning rather than exact keywords, powered by vector embeddings and similarity scoring. |
| **Vector Match** | A similarity search comparing embeddings using cosine distance. |
| **Vec0** | The virtual vector table engine provided by the `sqlite-vec` extension. |
