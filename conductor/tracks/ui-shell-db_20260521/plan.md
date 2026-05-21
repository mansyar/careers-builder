# Implementation Plan: UI Shell + Database Bootstrap

Implementation order: UI Shell first (faster visible progress, no database dependency), Database second (plumbing layer).

---

## Phase 1 — Sidebar Navigation & Routes [checkpoint: 408f4b1]

Goal: Create the persistent sidebar navigation component, update Header, use TanStack Router route nesting (`_app.tsx` layout), add CV Builder and Job Search routes with empty states, and implement responsive mobile behavior.

- [x] Task 1.1: Update Header — remove nav links [08941d8]
    - [ ] Remove Home, About, Features inline nav links from `src/components/Header.tsx` (note: "Features" link is a bug — it points to `/about`)
    - [ ] Keep only the brand logo/link and ThemeToggle
    - [ ] Update any tests that check for the removed links
- [x] Task 1.2: Create persistent Sidebar component (`src/components/Sidebar.tsx`) [c7277e6]
    - [ ] Write failing test (jsdom env): sidebar renders with three nav items (Home, CV Builder, Job Search)
    - [ ] Write failing test (jsdom env): active route is highlighted
    - [ ] Implement `Sidebar` component using TanStack Router's `<Link>` with `activeProps`
    - [ ] Home links to `/`, CV Builder links to `/cv-builder`, Job Search links to `/job-search`
    - [ ] Style with Tailwind: vertical left panel, fixed width (~240px on desktop), full viewport height
    - [ ] Ensure all type-only imports use `import type` (matching `verbatimModuleSyntax` strict mode)
    - [ ] Verify tests pass
- [x] Task 1.3: Create `_app.tsx` layout route with sidebar (`src/routes/_app.tsx`) [0fc2a61]
    - [ ] Write failing test (jsdom env): layout route renders Sidebar alongside child content via `<Outlet />`
    - [ ] Implement TanStack Router layout route using `createFileRoute('/_app')` (route group convention with `_` prefix)
    - [ ] Layout renders: `<Sidebar />` on the left, `<div className="flex-1 ..."><Outlet /></div>` on the right
    - [ ] Nested routes (`/cv-builder`, `/job-search`) are children of this layout; `/` and `/about` remain direct children of root
    - [ ] Verify tests pass
- [x] Task 1.4: Create CV Builder route (`src/routes/_app/cv-builder.tsx`) [5883814]
    - [x] Write failing test (jsdom env): route renders empty state message
    - [x] Implement file route using `createFileRoute('/_app/cv-builder')` — nested under `_app` layout
    - [x] Render empty state: "No CV yet. Start the guided interview to build your CV."
    - [x] Include a styled CTA button (link to future chat route or disabled with "Coming soon")
    - [x] Verify tests pass
- [x] Task 1.5: Create Job Search route (`src/routes/_app/job-search.tsx`) [5883814]
    - [x] Write failing test (jsdom env): route renders empty state message
    - [x] Implement file route using `createFileRoute('/_app/job-search')` — nested under `_app` layout
    - [x] Render empty state: "No job searches yet. Create a CV first to start searching."
    - [x] Include relevant messaging and placeholder UI
    - [x] Verify tests pass
- [x] Task 1.6: Implement responsive sidebar behavior [923722c]
    - [x] Write failing test (jsdom env): hamburger button visible on mobile viewport (< 768px)
    - [x] Write failing test (jsdom env): clicking hamburger toggles sidebar visibility
    - [x] Implement mobile toggle with state management (open/closed)
    - [x] Overlay backdrop on mobile when sidebar is open
    - [x] Sidebar collapses off-screen on mobile, slides in when toggled
    - [x] Verify tests pass
- [ ] Task 1.7: Conductor — User Manual Verification 'Phase 1 — Sidebar Navigation & Routes' (Protocol in workflow.md)
    - [ ] Verify: `pnpm dev` boots without errors
    - [ ] Verify: Landing page loads with sidebar visible (persistent)
    - [ ] Verify: `/cv-builder` shows empty state with active sidebar highlight
    - [ ] Verify: `/job-search` shows empty state with active sidebar highlight
    - [ ] Verify: Mobile viewport < 768px shows hamburger, sidebar toggles

---

## Phase 2 — Database & Debug Endpoint

Goal: Install database dependencies (with `onlyBuiltDependencies` fix), create the DatabaseManager singleton with `:memory:` test support, implement idempotent migrations for all 6 tables, and expose a decoupled debug endpoint for test verification.

- [ ] Task 2.1: Install database dependencies
    - [ ] Add `better-sqlite3` and `sqlite-vec` to `pnpm.onlyBuiltDependencies` in `package.json` (both have native C++ bindings that require node-gyp compilation; pnpm blocks build scripts by default)
    - [ ] Install `better-sqlite3` and `sqlite-vec` as production dependencies
    - [ ] Install `@types/better-sqlite3` as a dev dependency
    - [ ] Verify the packages install correctly with `pnpm install`
    - [ ] Update `vitest.config.ts` to narrow coverage exclusion: remove `src/routes/**` from exclude so route code contributes to coverage (exclude only `routeTree.gen.ts` and `router.tsx`)
- [ ] Task 2.2: Create DatabaseManager singleton (`src/lib/server/db.ts`)
    - [ ] Write failing test (node env, `:memory:` database): DatabaseManager opens an in-memory SQLite database
    - [ ] Write failing test (node env, `:memory:` database): accessing `.instance` returns the same instance (singleton)
    - [ ] Implement `DatabaseManager` class with `.getInstance()` singleton pattern
    - [ ] Support configurable database path (default: `./data/local_vault.db`) and `:memory:` for testing
    - [ ] `loadExtension()` method — called in production, mocked/stubbed in unit tests (native binary may not exist in CI)
    - [ ] Ensure type-only imports use `import type` (matching `verbatimModuleSyntax`)
    - [ ] Verify tests pass
- [ ] Task 2.3: Create migration runner (`src/lib/server/migrations.ts`)
    - [ ] Write failing test (node env, `:memory:` database): `runMigrations()` creates all 6 tables (4 structural + 2 vector)
    - [ ] Write failing test (node env, `:memory:` database): `runMigrations()` is idempotent (running twice produces no error)
    - [ ] Implement `runMigrations(db)` function
    - [ ] Define structural table DDL (users, cv_profiles, cv_profile_versions, job_postings) with `IF NOT EXISTS`
    - [ ] Define virtual vector table DDL (vec_cv_profile_versions, vec_job_postings) with `IF NOT EXISTS`
    - [ ] Verify all tests pass
- [ ] Task 2.4: Create debug schema handler + route (decoupled pattern)
    - [ ] Write failing test: `getDbSchema(db)` handler returns array of table objects with name + columns
    - [ ] Implement handler function at `src/lib/server/db-schema.ts` — queries `sqlite_master` and `pragma_table_info`
    - [ ] Response shape: `{ tables: Array<{ name: string, columns: Array<{ name: string, type: string }> }> }`
    - [ ] Create thin route wrapper at `src/routes/api/internal/debug/db-schema.ts` using `createFileRoute` + `server.handlers.GET`
    - [ ] Route calls `getDbSchema(dbInstance)` and returns `Response.json(result)`
    - [ ] Verify tests pass
- [ ] Task 2.5: Integrate database init at server boot
    - [ ] Initialize DatabaseManager singleton and run migrations when the Nitro server starts
    - [ ] Ensure initialization errors are logged clearly (console.error with descriptive message)
    - [ ] Verify the app boots cleanly with `pnpm dev`
    - [ ] Manual smoke test: `pnpm dev` → no DB errors → `curl http://localhost:3000/api/internal/debug/db-schema` returns 6 tables
- [ ] Task 2.6: Conductor — User Manual Verification 'Phase 2 — Database & Debug Endpoint' (Protocol in workflow.md)
    - [ ] Verify: App boots with `pnpm dev` — no DB errors
    - [ ] Verify: `GET /api/internal/debug/db-schema` returns all 6 tables
    - [ ] Verify: Stopping and restarting `pnpm dev` — migrations run again without error (idempotent)
