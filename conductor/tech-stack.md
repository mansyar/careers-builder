# Technology Stack

## Frontend
- **Framework:** TanStack Start (React) — Full SSR with declarative hydration
- **Language:** TypeScript
- **Routing:** TanStack Router — Modal choices, interview progress, search parameters committed to URL
- **AI UI:** `@ai-sdk/react` — `useChat` hook for streaming conversation
- **Styling:** CSS (with print-ready media queries for A4/Letter PDF previews)

## Backend & Server
- **Server Core:** Embedded Nitro server engine bundled via Vite (TanStack Start compile pipeline)
- **AI SDK Core:** `ai` package — `streamText`, `generateText`, `generateObject`, `tool`
- **LLM Adapter:** `@ai-sdk/openai` — OpenAI-compatible provider access
- **Testing:** Vitest (unit + integration) + Playwright Test (E2E)

## Data Layer
- **Relational Database:** `better-sqlite3` — Synchronous embedded SQLite engine
- **Vector Engine:** `sqlite-vec` — Virtual vector table extension loaded at boot into SQLite
- **Embedding Model:** `@xenova/transformers` — `all-MiniLM-L6-v2` (unquantized, 384-dim, ~90 MB)
- **Model Runtime:** ONNX via CPU (no GPU assumed)

## PDF & Scraping
- **PDF Generator:** Playwright — Headless Chromium `page.pdf()` pipeline
- **Web Scraper:** Playwright — Task runner with evasion defaults (user-agent masking, request spacing)
- **Concurrency Control:** `p-limit` — Max 3 concurrent embedding jobs to prevent OOM

## Infrastructure
- **Containerization:** Docker with `node:22-slim` base image
  - *Deviation Note (2026-05-21):* Changed from `node:20-slim` to `node:22-slim` because the latest pnpm requires Node.js v22.13+. Multi-stage build with Playwright Chromium installed for PDF/scraping.
- **CI/CD:** GitHub Actions — Vitest on every commit, Playwright E2E nightly
- **Architecture:** Single-container local web application (monolithic)
- **Target Platforms:** Windows, macOS, Linux (cross-platform via Docker + Node.js)
- **Memory Budget:** 4 GB RAM allocated to container
- **Image Size Target:** ≤ 1 GB

## Development Tools
- **Package Manager:** pnpm (preferred, faster and more disk-efficient)
  - *Deviation Note (2026-05-21):* Original spec listed npm. Changed to pnpm per developer preference. All commands use `pnpm` instead of `npm`.
- **Build Tool:** Vite
- **Type Checking:** TypeScript (strict mode)
- **Linting:** ESLint + TypeScript-ESLint (flat config at `eslint.config.js`, excludes generated files)
- **Formatting:** Prettier (single quotes, trailing commas, print width 100, configured at `.prettierrc`)
- **Git Hooks:** Husky + lint-staged
  - Pre-commit: ESLint fix, Prettier format, file size check (≤ 500 lines per file)
  - Pre-push: TypeScript typecheck (`tsc --noEmit`), coverage threshold (`≥ 80%`)
- **Modularity Check:** Custom `scripts/check-file-size.mjs` enforces 500-line limit on `src/` and `scripts/` files
- **Combined Check:** `pnpm check:all` runs lint + format check + typecheck + tests with coverage in sequence
- **Test Coverage Exclusions:** Route files under `src/routes/api/cv*` are excluded from coverage as they are thin wiring wrappers around tested handler functions.

## Architecture Patterns

### Server-Client Code Separation

TanStack Start's `.server.ts` / `.functions.ts` convention is used to prevent server-only modules (e.g., `better-sqlite3`) from being bundled into the client:

- **`.server.ts`** files contain server-only logic (DatabaseManager, native module imports). Excluded from client bundles by TanStack Start's build process.
- **`.functions.ts`** files export `createServerFn` wrappers. Safe to import from client code — build process compiles them to fetch RPC stubs.
- **`src/lib/`** contains both `.server.ts` and `.functions.ts` files (shared directory per TanStack Start convention).

### Provider Settings State Management

A `ProviderSettingsContext` (React context) at the root level manages wizard/modal state without prop drilling through the component tree. No external dependencies.

### First-Run Wizard

The LLM provider configuration wizard auto-opens on first visit (no API key configured). It is non-dismissable until valid settings are saved. After configuration, the sidebar "Configure AI Provider" button opens a dismissable settings modal.

## Implementation Notes

- **Deviation Note (2026-05-21):** Track 'CV Profile & Version API' implements `POST /api/cv` which was not defined in the original TDD §4. This endpoint was added to provide the initial profile creation step required for the copy-on-write flow.
- **Deviation Note (2026-05-21):** The `PUT /api/cv/:cvProfileId/version/:versionId` response includes `versionLabel`, `createdAt`, and `full_cv_json` in addition to `id` and `versionNumber` specified in TDD §4. This reduces client round-trips.
- **Deviation Note (2026-05-21):** The `PUT /api/cv/:cvProfileId/version/:versionId` request accepts an optional `versionLabel` field beyond the `patch` field defined in TDD §4. This allows clients to label versions meaningfully.
- **Deviation Note (2026-05-22):** Track 'AI Provider Configuration' added `ai` (v6.0.190) and `@ai-sdk/openai` (v3.0.65) as production dependencies for LLM provider connectivity.
- **Deviation Note (2026-05-22):** Track 'AI Provider Configuration' implements provider settings stored under a `provider` key in `users.target_settings`: `{ provider: { apiKey: <encrypted>, baseUrl, modelId } }`.
- **Deviation Note (2026-05-22):** Track 'AI Provider Configuration' introduced the `.server.ts` / `.functions.ts` convention for server-client code separation. Previously all code was in `src/lib/server/`.
- **Deviation Note (2026-05-22):** Track 'Streaming Chat Endpoint' added `@ai-sdk/react` (v3.0.192) as a production dependency for the `useChat` hook used in the ChatPanel component.
- **Deviation Note (2026-05-22):** Track 'Streaming Chat Endpoint' uses the AI SDK v6 `useChat` API (`sendMessage({ text })` instead of the deprecated `handleSubmit`/`handleInputChange` pattern). The `useChat` hook returns `{ messages, sendMessage, status, error, clearError }` directly — input state is managed locally with `useState`.
- **Deviation Note (2026-05-22):** Track 'Streaming Chat Endpoint' uses `result.toUIMessageStreamResponse()` on the `streamText` result to return a streaming `Response`, instead of the lower-level `createUIMessageStreamResponse()` function specified in the spec. The result is equivalent — `toUIMessageStreamResponse()` is a convenience method on `StreamTextResult` that internally calls the same function.
- **Deviation Note (2026-05-22):** Track 'Streaming Chat Endpoint' uses a `createFileRoute` with `server.handlers.POST` for the chat endpoint (instead of `createServerFn`) because the endpoint returns a streaming `Response` object which cannot be serialized by `createServerFn`'s JSON serialization.
- **Deviation Note (2026-05-22):** Track 'Streaming Chat Endpoint' uses `loadSettings` directly in the handler (dynamic import of `DatabaseManager` and `loadSettings` in `handleChatRequest`), consistent with the server route pattern used by `cv.ts` and `provider-settings/index.ts`.
