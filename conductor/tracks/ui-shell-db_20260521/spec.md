# Specification: UI Shell + Database Bootstrap

## Overview

This track establishes the foundational application layout (persistent sidebar navigation) and database infrastructure (SQLite initialization, migrations, and a debug endpoint). It transforms the current single-page shell into a navigable two-mode application with local data persistence.

## Functional Requirements

### 1. Sidebar Navigation Layout

- **Sidebar replaces header nav:** The existing header's inline navigation links (Home, About, Features) are removed. The header retains only the brand logo/link ("Careers Builder") and the ThemeToggle.
- **Persistent left sidebar** with three navigation items:
  - **Home** — links to the landing page (`/`)
  - **CV Builder** — links to `/cv-builder` (shows empty state initially)
  - **Job Search** — links to `/job-search` (shows empty state initially)
- **Sidebar behavior:**
  - **Persistent on all routes** — the sidebar is always visible, matching the PRD requirement ("Persistent sidebar navigation toggling between CV Builder View and Job Search Matrix")
  - Active route is highlighted with a visual indicator
  - Content area shifts right to accommodate the sidebar width
- **Route architecture:**
  - The sidebar is rendered via a TanStack Router layout route (`_app.tsx` route group) that nests the sidebar-wrapped routes
  - Routes under the `_app` layout: `/cv-builder` and `/job-search` (both render inside the sidebar layout)
  - Routes outside the `_app` layout: `/` (landing page) and `/about` remain un-nested children of the root
  - The `_app.tsx` layout renders the Sidebar component + `<Outlet />` for child content
- **Empty states:**
  - CV Builder empty state: "No CV yet. Start the guided interview to build your CV." with a call-to-action button
  - Job Search empty state: "No job searches yet. Create a CV first to start searching." with appropriate messaging
- **Responsive behavior:** Sidebar collapses to a hamburger menu on mobile viewports (< 768px)

### 2. Database Initialization & Migrations

- **Dependencies to install:**
  - `better-sqlite3` — synchronous embedded SQLite engine (native bindings; must be added to `pnpm.onlyBuiltDependencies`)
  - `sqlite-vec` — virtual vector table extension (native bindings; must be added to `pnpm.onlyBuiltDependencies`)
  - `@types/better-sqlite3` (dev dependency)
- **Database initialization:** A `DatabaseManager` singleton class at `src/lib/server/db.ts` that:
  - Opens/creates the SQLite database file at a configurable path (default: `./data/local_vault.db`)
  - Supports `:memory:` for unit testing
  - Loads the `sqlite-vec` extension at boot via `.loadExtension()` (mocked in unit tests)
  - Exposes the database instance to the rest of the application
- **Migration runner:** A `runMigrations(db)` function at `src/lib/server/migrations.ts` that applies all migrations sequentially
- **Migrations are idempotent:** All `CREATE TABLE` statements use `IF NOT EXISTS`
- **Structural tables (from TDD §3):**
  - `users` — id, created_at, target_settings (JSON)
  - `cv_profiles` — id, user_id (FK), active_version_id (nullable FK)
  - `cv_profile_versions` — id, cv_profile_id (FK), version_number, version_label, created_at, full_cv_json (JSON)
  - `job_postings` — id, source_url (UNIQUE), title, company, location, description_raw, scraped_at
- **Virtual vector tables (from TDD §3):**
  - `vec_cv_profile_versions` — cv_version_id (PK FK), biography_embedding (float[384])
  - `vec_job_postings` — job_id (PK FK), description_embedding (float[384])
- **Boot initialization:** The database is initialized and migrations are run when the server starts (inside a TanStack Start server function or server initialization hook)

### 3. Debug / Internal Endpoint

- **Route:** `GET /api/internal/debug/db-schema`
- **Architecture:** Decoupled into a handler function at `src/lib/server/db-schema.ts` and a thin route wrapper at `src/routes/api/internal/debug/db-schema.ts` — following the same pattern as `src/lib/server/health.ts` + `src/routes/api/health.ts`
- **Handler function (`getDbSchema(db)`):** Accepts a database instance, queries `sqlite_master` to list all tables and their column info
- **Response format:** `{ "tables": [ { "name": string, "columns": [{ "name": string, "type": string }] } ] }`
- **Purpose:** Used by automated tests to verify database tables exist after boot. The handler function is unit-testable without route infrastructure

## Non-Functional Requirements

- Database initialization must complete within 1 second on modern hardware
- Sidebar navigation must render in under 100ms (client-side navigation)
- All database operations use synchronous API (`better-sqlite3` is synchronous)
- No GPU or network required for database operations

## Acceptance Criteria

1. App boots successfully with `pnpm dev` — no database errors in console
2. Navigating to `/cv-builder` shows empty state with sidebar visible
3. Navigating to `/job-search` shows empty state with sidebar visible
4. The sidebar highlights the active route
5. `GET /api/internal/debug/db-schema` returns a JSON response listing all 6 tables (4 structural + 2 vector)
6. The landing page (`/`) renders unchanged with hero and feature cards — sidebar is visible (persistent layout)
7. All database tables are confirmed to exist via the debug endpoint
8. Running migrations a second time succeeds without errors (idempotent)

## Out of Scope

- No CSS styling of the sidebar beyond functional layout (polish comes in later tracks)
- No Playwright fixtures or E2E tests — only Vitest unit tests for this track
- No data seeding or mock data
- No user creation flow
- The TDD §4 defines a separate `GET /api/internal/debug/latest-cv` endpoint for E2E CV data verification — that endpoint is out of scope for this track and will be implemented in a later track (Track 1.1 or Track 6.x)
