# Implementation Plan: UI Shell + Database Bootstrap

## Phase 1 — Database & Debug Endpoint

Goal: Install database dependencies, create the DatabaseManager singleton, implement idempotent migrations for all 6 tables, and expose a debug endpoint for test verification.

- [ ] Task 1.1: Install database dependencies
    - [ ] Install `better-sqlite3` and `sqlite-vec` as production dependencies
    - [ ] Install `@types/better-sqlite3` as a dev dependency
    - [ ] Verify the packages install correctly with `pnpm install`
- [ ] Task 1.2: Create DatabaseManager singleton (`src/lib/server/db.ts`)
    - [ ] Write failing test: assert DatabaseManager opens/creates a SQLite database file
    - [ ] Implement `DatabaseManager` class with `.getInstance()` singleton pattern
    - [ ] Support configurable database path (default: `./data/local_vault.db`)
    - [ ] Load `sqlite-vec` extension at boot via `.loadExtension()`
    - [ ] Verify test passes
- [ ] Task 1.3: Create migration runner (`src/lib/server/migrations.ts`)
    - [ ] Write failing test: assert `runMigrations()` creates all 6 tables (4 structural + 2 vector)
    - [ ] Write failing test: assert `runMigrations()` is idempotent (running twice produces no error)
    - [ ] Implement `runMigrations(db)` function
    - [ ] Define structural table DDL (users, cv_profiles, cv_profile_versions, job_postings) with `IF NOT EXISTS`
    - [ ] Define virtual vector table DDL (vec_cv_profile_versions, vec_job_postings) with `IF NOT EXISTS`
    - [ ] Verify all tests pass
- [ ] Task 1.4: Create debug schema endpoint (`src/routes/api/internal/debug/db-schema.ts`)
    - [ ] Write failing test: assert `GET /api/internal/debug/db-schema` returns JSON with tables array
    - [ ] Implement TanStack Start server route with `server.handlers.GET`
    - [ ] The handler queries SQLite `sqlite_master` to list all tables and their column info
    - [ ] Response format: `{ "tables": [ { "name": string, "columns": [{ "name": string, "type": string }] } ] }`
    - [ ] Verify test passes
- [ ] Task 1.5: Integrate database init at server boot
    - [ ] Initialize DatabaseManager and run migrations when the Nitro server starts
    - [ ] Ensure initialization errors are logged clearly
    - [ ] Verify the app boots cleanly with `pnpm dev`
- [ ] Task 1.6: Write comprehensive tests for Phase 1
    - [ ] Test: DB file is created at the configured path
    - [ ] Test: All 6 tables exist after migrations (verified via debug endpoint response)
    - [ ] Test: Running migrations twice does not throw an error
    - [ ] Test: `sqlite-vec` extension is loaded and vector tables accept 384-dim embeddings
    - [ ] Test: Debug endpoint returns valid JSON with expected table names
- [ ] Task 1.7: Conductor — User Manual Verification 'Phase 1 — Database & Debug Endpoint' (Protocol in workflow.md)

## Phase 2 — Sidebar Navigation & Routes

Goal: Create the sidebar navigation component, new CV Builder and Job Search routes, a shared layout wrapper, empty states, and responsive behavior.

- [ ] Task 2.1: Update Header — remove nav links
    - [ ] Remove Home, About, Features inline nav links from `src/components/Header.tsx`
    - [ ] Keep only the brand logo/link and ThemeToggle
    - [ ] Update any tests that check for the removed links
- [ ] Task 2.2: Create Sidebar component (`src/components/Sidebar.tsx`)
    - [ ] Write failing test: sidebar renders with three nav items (Home, CV Builder, Job Search)
    - [ ] Write failing test: active route is highlighted
    - [ ] Implement `Sidebar` component using TanStack Router's `<Link>` with `activeProps`
    - [ ] Home links to `/`, CV Builder links to `/cv-builder`, Job Search links to `/job-search`
    - [ ] Style with Tailwind: vertical left panel, fixed width (~240px on desktop)
- [ ] Task 2.3: Create app layout component with sidebar (`src/components/AppLayout.tsx`)
    - [ ] Write failing test: layout renders children alongside Sidebar
    - [ ] Implement layout: sidebar on the left, content area on the right
    - [ ] Layout does NOT render on `/` or `/about` routes
- [ ] Task 2.4: Create CV Builder route (`src/routes/cv-builder.tsx`)
    - [ ] Write failing test: route renders empty state message
    - [ ] Implement file route using `createFileRoute('/cv-builder')`
    - [ ] Render empty state: "No CV yet. Start the guided interview to build your CV."
    - [ ] Include a styled CTA button (link to future chat route or disabled with "Coming soon")
- [ ] Task 2.5: Create Job Search route (`src/routes/job-search.tsx`)
    - [ ] Write failing test: route renders empty state message
    - [ ] Implement file route using `createFileRoute('/job-search')`
    - [ ] Render empty state: "No job searches yet. Create a CV first to start searching."
    - [ ] Include relevant messaging and placeholder UI
- [ ] Task 2.6: Implement responsive sidebar behavior
    - [ ] Sidebar collapses to a hamburger toggle on viewports < 768px
    - [ ] Write failing test: hamburger button visible on mobile viewport
    - [ ] Implement mobile toggle with state management (open/closed)
    - [ ] Overlay backdrop on mobile when sidebar is open
- [ ] Task 2.7: Write comprehensive tests for Phase 2
    - [ ] Test: Sidebar renders all three nav items with correct links
    - [ ] Test: Active route is visually highlighted
    - [ ] Test: AppLayout renders sidebar + children
    - [ ] Test: Landing page (`/`) does NOT render sidebar
    - [ ] Test: `/about` route does NOT render sidebar
    - [ ] Test: `/cv-builder` route renders sidebar + empty state
    - [ ] Test: `/job-search` route renders sidebar + empty state
    - [ ] Test: Mobile viewport shows hamburger button
    - [ ] Test: Clicking hamburger toggles sidebar visibility on mobile
    - [ ] Test: Running `pnpm dev` after route changes — app boots without errors
- [ ] Task 2.8: Conductor — User Manual Verification 'Phase 2 — Sidebar Navigation & Routes' (Protocol in workflow.md)
