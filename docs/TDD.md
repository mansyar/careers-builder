# Technical Design Document (TDD)
## Project: Local AI-Powered CV Builder & Career Opportunity Searcher

---

## 1. System Architecture

Containerized local web server running an isomorphic full-stack TypeScript framework. Conversational logic is dispatched via secure TLS to external cloud LLM providers through the Vercel AI SDK. Data orchestration, state persistence, vector embeddings, and web parsing are processed entirely locally.

---

## 2. System Component Specifications

### Frontend Layer
- **Framework:** TanStack Start (React). Full SSR with declarative hydration.
- **Routing & State:** TanStack Router. Modal choices, interview progress, sort criteria committed to URL search parameters.
- **AI Coordination:** Vercel AI SDK UI (`@ai-sdk/react`) — `useChat` hook for streaming conversation. Server-side `streamText` and `generateObject` from `ai` core. Structured extraction triggered via a dedicated `POST /api/chat/extract` endpoint, not client-side streaming.

### Core Backend & Utilities
- **Server Core:** Embedded Nitro server engine bundled via Vite inside TanStack Start's compile pipeline.
- **AI SDK Core:** `ai` package providing `streamText`, `generateText`, `generateObject`, `tool`, `convertToModelMessages`, `stepCountIs`.
- **LLM Adapter:** `@ai-sdk/openai` (or `@ai-sdk/gateway` via Vercel AI Gateway) for OpenAI-compatible provider access.
- **PDF Generator:** Server-side Playwright print pipeline — renders the selected template in headless Chromium, exports to PDF using `page.pdf()` with A4/Letter dimensions. Reuses the same Playwright dependency from the scraping layer.
- **Network Scrapers:** Playwright wrapped in a task runner with evasion defaults (headless Chromium, user-agent masking, request spacing) for unauthenticated career page scraping.

### Data Layer & Local Machine AI
- **Relational Engine:** `better-sqlite3` embedded in the Node.js backend.
- **Vector Engine:** `sqlite-vec` extension loaded dynamically into SQLite at boot.
- **Embeddings Processor:** `@xenova/transformers` running `all-MiniLM-L6-v2` (unquantized) in-memory via ONNX. Maps text into 384-dimensional vector space. Vercel AI SDK's `embed` / `embedMany` API is not used here — `@xenova/transformers` is called directly with a thin adapter wrapper.
- **Model Lifecycle:** The ONNX model (~90 MB) auto-downloads from Hugging Face Hub on first `pipeline()` call, cached at `{vault_data}/models/all-MiniLM-L6-v2/`. Download failure gracefully degrades — embedding-dependent features show an unavailable state rather than crashing.
- **Embedding Pipeline:** Runs as a singleton to avoid reloading the model per batch. Jobs are embedded with controlled concurrency (max 3 concurrent via `p-limit`, configurable in `target_settings`) to prevent OOM on the 4 GB memory budget.

---

## 3. Database Schema (SQLite Dialect)

Relational tables linked via row IDs to Virtual Vector Tables (`vec0`) from `sqlite-vec`.

### Structural Tables

#### `users` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `target_settings` | TEXT | JSON: API keys, target locations, remote flags |

#### `cv_profiles` Table
Acts as the "active/latest" pointer. Full version history stored in `cv_profile_versions`.
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `user_id` | INTEGER | FK REFERENCES users(id) |
| `active_version_id` | INTEGER | FK REFERENCES cv_profile_versions(id), NULLABLE — set after first version is inserted |

#### `cv_profile_versions` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `cv_profile_id` | INTEGER | FK REFERENCES cv_profiles(id) |
| `version_number` | INTEGER | Sequential per profile |
| `version_label` | TEXT | e.g., "Software Engineer - Core V2" |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `full_cv_json` | TEXT | Structured JSON: personal, experience, education, skills |

#### `job_postings` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `source_url` | TEXT | UNIQUE |
| `title` | TEXT | |
| `company` | TEXT | |
| `location` | TEXT | |
| `description_raw` | TEXT | |
| `scraped_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### Virtual Vector Tables

#### `vec_cv_profile_versions` (`USING vec0`)
| Column | Type | Notes |
|--------|------|-------|
| `cv_version_id` | INTEGER PRIMARY KEY | FK REFERENCES cv_profile_versions(id) |
| `biography_embedding` | float[384] | |

#### `vec_job_postings` (`USING vec0`)
| Column | Type |
|--------|------|
| `job_id` | INTEGER PRIMARY KEY |
| `description_embedding` | float[384] |

---

## 4. API Contract Specifications

### Server Functions (TanStack Start)

Endpoints follow TanStack Start's file-based routing: `src/routes/api/chat.ts` → `POST /api/chat`, `src/routes/api/cv/export.ts` → `POST /api/cv/export`, etc.

#### `GET /api/health` — Health Check *(Implemented — Track 0.1)*
```
Response:
{
  "status": "ok"
}
```
Returns HTTP 200 with `Content-Type: application/json`. Used by Docker `HEALTHCHECK` and system monitoring. Implemented as a TanStack Start server route at `src/routes/api/health.ts` using `createFileRoute` with `server: { handlers: { GET: ... } }`. Requires `pnpm dev` to run at least once before production build to generate the route tree — build-only will tree-shake the handler code.

#### `GET /api/internal/debug/db-schema` — Debug Database Schema *(Implemented — Track 0.3)*
```
Response:
{
  "tables": [
    {
      "name": "users",
      "columns": [{ "name": "id", "type": "INTEGER" }, { "name": "created_at", "type": "DATETIME" }, ...]
    },
    ...
  ]
}
```
Returns JSON listing all database tables and their columns. Uses a decoupled handler at `src/lib/server/db-schema.ts` (querying `sqlite_master` + `PRAGMA table_info`) wrapped by a thin TanStack Start server route at `src/routes/api/internal/debug/db-schema.ts`. Used by automated tests to verify database tables exist after boot.

#### `POST /api/chat` — Conversational Interview
```
Request:
{
  messages: UIMessage[]   // Conversation history from useChat
}

Response: Stream<UIMessage>
Uses streamText() → toUIMessageStreamResponse()
```

#### `POST /api/chat/extract` — Structured Section Extraction
Triggered by user clicking "Done — extract this section" button in the chat UI.
```
Request:
{
  messages: UIMessage[],        // Last N turns of conversation
  section: "contact" | "executive-summary" | "experience" | "education" | "skills" | "projects",
  cvProfileId: number
}

Response:
{
  section: string,
  data: Record<string, unknown>,  // Zod-validated against per-section schema
  cvProfileId: number
}
Uses generateObject() with Zod output schema
```

#### `POST /api/cv/preview` — Render Template Preview (HTML)
Uses `renderToString` to render the template React component with the CV JSON injected as props. The template component is wrapped in a minimal provider shell (React.StrictMode + a bare RouterProvider stub) to satisfy TanStack Start's context requirements without needing the full app router. Returns the resulting HTML string.
```
Request:
{
  cvVersionId: number,
  templateId: "modern-minimal" | "executive-traditional" | "creative-tech"
}

Response: HTML string (SSR-rendered template)
```

#### `GET /api/cv/:cvProfileId/versions` — List Versions
```
Response:
{
  versions: Array<{
    id: number,
    versionNumber: number,
    versionLabel: string,
    createdAt: string
  }>,
  activeVersionId: number
}
```

#### `PUT /api/cv/:cvProfileId/version/:versionId` — Update Version (Manual Edit)
Accepts partial JSON patches to `full_cv_json` fields. Used by the adjacent form editor during pause/resume and by offline editing.
```
Request:
{
  patch: Record<string, unknown>  // Partial CV JSON fields to merge
}

Response:
{
  id: number,
  versionNumber: number,
  full_cv_json: Record<string, unknown>  // Full merged result
}
```
Merges patch into existing `full_cv_json` using deep merge. Creates a new `cv_profile_versions` row if the active version is being edited (copy-on-write).

#### `POST /api/cv/export` — Export PDF
Single Server Function: renders the React template component to HTML via `renderToString` (with the same minimal provider shell as the preview endpoint), injects template CSS, then passes the full HTML to Playwright's `page.setContent()` and calls `page.pdf()`.
```
Request:
{
  cvVersionId: number,
  templateId: string,
  paperSize: "A4" | "Letter"
}

Response: application/pdf binary stream
```

#### `POST /api/jobs/sweep` — Initiate Career Sweep
Background job mechanism: the handler enqueues a job into an in-process `p-queue` worker and returns immediately with a `sweepId`. A `setInterval` poller in the Nitro server checks job completion status. (Can be swapped for `worker_threads` without changing the API contract.)
```
Request:
{
  cvVersionId: number
}

Response:
{
  sweepId: string,         // Polling identifier
  status: "started",
  estimatedJobs: number
}
Results polled via GET /api/jobs/sweep/:sweepId
```

#### `GET /api/jobs/sweep/:sweepId` — Poll Sweep Results
```
Response:
{
  status: "running" | "complete" | "failed",
  progress: { scraped: number, embedded: number, matched: number },
  results?: Array<{
    jobId: number,
    title: string,
    company: string,
    location: string,
    matchScore: number,       // Cosine distance (0-1, lower = better)
    insights: {
      missingSkills: string[],
      estimatedSalaryRange?: string,
      matchRationale: string
    }
  }]
}
```

---

### Provider Configuration

Stored in `users.target_settings` as JSON. Configured via the first-run wizard UI.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `provider.apiKey` | `string` | Yes | — | Encrypted at rest via AES-256-GCM (see §9) |
| `provider.baseUrl` | `string` | No | `https://api.openai.com/v1` | For custom OpenAI-compatible endpoints (LiteLLM, Ollama proxy, etc.) |
| `provider.modelId` | `string` | No | `gpt-4o` | Passed as the model argument to `streamText()` / `generateObject()` |

The Vercel AI SDK adapter is configured at boot from these settings:

```typescript
import { openai } from '@ai-sdk/openai';

const model = openai(modelId, { baseURL: baseUrl });
// Used in: streamText({ model, ... }), generateObject({ model, ... })
```

Missing or invalid API key renders all chat/extract endpoints inoperable — the UI shows the first-run wizard instead of the interview view.

---

## 5. Key Data Flows

### A. Conversational CV Extraction Loop
1. User input sent via `useChat` hook → `POST /api/chat`.
2. Server function calls `streamText()` with the conversation history, routing to the cloud OpenAI-compatible endpoint.
3. Cloud model returns streaming response → `toUIMessageStreamResponse()` delivers tokens to the chat UI.
4. When the user decides a section is complete, they click "Done — extract this section" → `POST /api/chat/extract` with the conversation context and target section.
5. Server function calls `generateObject()` with a Zod output schema matching the target section. Response is validated and inserted as a new `cv_profile_versions` row.
6. Updated JSON returns to the browser → React design components re-render.
7. The user can pause any time, edit parsed data via the adjacent form (which calls `PUT /api/cv/:cvProfileId/version/:versionId`), and resume the conversation.

### B. One-Click Vector Job Sweep & Local Scoring
1. User selects a target CV version and clicks search → `POST /api/jobs/sweep`.
2. Server-side background worker passes the version's text to `@xenova/transformers` → 384-dimensional float array, stored in `vec_cv_profile_versions`.
3. Async Playwright crawlers fetch job postings into `job_postings`.
4. Each posting is embedded (max 3 concurrent) and written to `vec_job_postings`.
5. Native SQLite vector `MATCH` (cosine distance) compares `vec_cv_profile_versions.biography_embedding` against `vec_job_postings.description_embedding`.
6. Results below the threshold return to the frontend with insight annotations.

### C. PDF Export Pipeline
1. User selects template and clicks export → `POST /api/cv/export`.
2. Server function renders the React template component to an HTML string via `renderToString` (no internal HTTP request needed).
3. Server function injects template CSS and calls Playwright's `page.setContent(html)` on a headless browser instance.
4. `page.pdf({ format: 'A4', printBackground: true })` produces the PDF.
5. PDF stream returned to client as a downloadable file.

---

## 6. Error Handling Strategy

### LLM Calls
- **Stream interruptions:** `useChat` reports error state → UI shows "Connection lost" banner with retry button.
- **Structured extraction failures:** If `generateObject` throws, retry once. If that also fails, fall back to prompting the model for plain-text JSON and attempt `JSON.parse`. If both approaches fail, surface the raw model output in a textarea for manual correction.
- **API key errors:** Detect `401`/`403` from provider → show inline setup guide and disable interview until resolved.

### Scraping
- Per-source timeout: 30 seconds max per page (configurable per source in `users.target_settings` — 15s for simple sites, 30s for JS-heavy sites). Timeouts logged with source URL.
- Non-blocking architecture: failed sources are omitted from results, not retried automatically.
- Rate-limit detection: if a source returns `429` or blocks the request, mark it as `rate_limited` and skip for the remainder of the sweep.

### Database
- `better-sqlite3` is synchronous and single-connection — all write operations wrapped in try-catch with transaction rollback on failure.
- Vector match query failures (e.g., empty `vec_job_postings`) return empty results instead of throwing.

### PDF Export
- Playwright PDF failures show a "Retry export" button with the error details. If the error indicates a missing font, retry with a fallback font defined in the template CSS.
- Missing fonts or template assets log a warning and fall back to system fonts.

---

## 7. Testing Strategy

### Unit Tests
- **Framework:** Vitest (bundled with TanStack Start). Coverage via `@vitest/coverage-v8`.
- **Scope:** Database helpers, embedding adapter, vector query builder, Zod schema validation.
- **Mocking:** LLM calls mocked via `vi.mock('ai')`; file system calls via `memfs`.
- **Implemented *(Track 0.1)*:** Health check handler test at `src/lib/server/health.spec.ts` — 100% coverage.

### Integration Tests
- **Chat flow:** Test Server Function handler logic directly by calling the handler with mock request/response objects, rather than spawning a full HTTP server. Assert streaming response structure from the `streamText` result.
- **Scraping:** Test Playwright scripts against static HTML fixtures (no live URLs).
- **PDF generation:** Render a known template, assert PDF output has expected text content and page count using `pdf-parse` to extract text from the generated buffer.

### E2E Tests
- **Framework:** Playwright Test (reuses the Playwright dependency).
- **Scenarios:**
  1. Full interview flow — type answers, verify structured CV saves to DB.
  2. Template switching — select each template, verify preview re-renders.
   3. Job sweep — mock API responses, verify results render correctly.
   4. PDF export — download file, verify it opens with selectable text.
- **DB verification in E2E:** Uses a test-only `GET /api/internal/debug/latest-cv` endpoint (disabled in production builds) to read back saved CV data after the interview flow completes.

### CI
- Run Vitest unit + integration tests on every commit.
- Run Playwright E2E tests nightly and on PR merge to main.
- Target: ≥ 80% code coverage for database and embedding layers.
- **Pre-commit gates:** ESLint linting + Prettier formatting + file size check (≤ 500 lines) via Husky + lint-staged.
- **Pre-push gates:** TypeScript type check + coverage threshold (≥ 80%) enforced via Git hooks.

---

## 8. Performance Benchmarks

Benchmarks target a reference machine: Apple M1 MacBook Air, 8 GB RAM, macOS 14.

| Operation | Target | Measurement Method |
|-----------|--------|-------------------|
| LLM first-token latency | ≤ 2s | `performance.now()` around `streamText` call |
| Structured extraction (per section) | ≤ 5s | `performance.now()` around `generateObject` |
| Local embedding (500-word CV) | ≤ 3s | `process.hrtime.bigint()` wrapper |
| Local embedding per job posting | ≤ 150ms | Batch benchmark of 100 postings |
| Vector match (1,000 vectors) | ≤ 500ms | `console.time('vector-match')` wrapping the `SELECT ... FROM vec_job_postings WHERE ... MATCH ...` query |
| Template SSR + HTML render | ≤ 200ms | Server-side `console.time` |
| PDF export (Playwright, 1 page) | ≤ 5s | `page.pdf()` wall time |
| Container cold start (first-ever, w/ downloads) | ≤ 3 min | Docker `run` to ready log line (includes Chromium + ONNX download) |
| Container cold start (subsequent, cached) | ≤ 30s | Docker `run` to ready log line |
| Docker image size | ≤ 1 GB | `docker images` |

---

## 9. Security, Sandboxing & Deployment

### Docker Configuration
- **Base Layer:** `node:22-slim` (Debian) — Node.js v22 required for latest pnpm. Includes headless Chromium runtime dependencies and `wget` for health checks.
  - *Deviation (2026-05-21):* Changed from originally specified `node:20-slim` because pnpm v11+ requires Node.js ≥ v22.13.
- **State Volume Mounts:** Host path (e.g., `./vault_data`) → `/app/data/` inside container. Persists `local_vault.db` and cached ONNX models across container rebuilds.
- **Memory Limits:** Minimum 4 GB RAM allocated to prevent scraping crashes on consumer laptops.
- **Network Policy:** Container egress allowed only to configured LLM provider endpoints and job source domains. Single ingress port (3000) exposed for the local web UI; all other ingress ports blocked.
- **Health Check:** `wget --spider http://localhost:3000/api/health` every 30s, 15s start period, 3 retries.

### Data Sandboxing
- All user data, embeddings, and ONNX model cache are confined to the mounted volume.
- No process outside the container accesses the database directly.
- LLM API keys are encrypted via Node `crypto.createCipheriv` (AES-256-GCM) before writing to `better-sqlite3`. The encryption key is derived from a machine-local secret file at `{vault_data}/.secret` (64 random bytes generated on first run). If this file is deleted, all encrypted data becomes unrecoverable — the user must re-enter API keys through the first-run wizard.
