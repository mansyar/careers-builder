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
