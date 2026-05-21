# Specification: UI Shell + Database Bootstrap

## Overview

This track establishes the foundational application layout (sidebar navigation) and database infrastructure (SQLite initialization, migrations, and a debug endpoint). It transforms the current single-page shell into a navigable two-mode application with local data persistence.

## Functional Requirements

### 1. Sidebar Navigation Layout

- **Sidebar replaces header nav:** The existing header's inline navigation links (Home, About, Features) are removed. The header retains only the brand logo/link ("Careers Builder") and the ThemeToggle.
- **Persistent left sidebar** with three navigation items:
  - **Home** — links back to the landing page (`/`)
  - **CV Builder** — links to `/cv-builder` (shows empty state initially)
  - **Job Search** — links to `/job-search` (shows empty state initially)
- **Sidebar behavior:**
  - Visible only when the user is on CV Builder or Job Search routes
  - Not rendered on the landing page (`/`) or the About page (`/about`)
  - Active route highlighted with a visual indicator
- **Route changes:**
  - Create new file routes: `src/routes/cv-builder.tsx` and `src/routes/job-search.tsx`
  - Both routes initially render an empty state component explaining the purpose of each view
  - A shared layout component wraps these routes with the sidebar
- **Empty states:**
  - CV Builder empty state: "No CV yet. Start the guided interview to build your CV." with a call-to-action button
  - Job Search empty state: "No job searches yet. Create a CV first to start searching." with appropriate messaging
- **Responsive behavior:** Sidebar collapses to a hamburger menu on mobile viewports (< 768px)

### 2. Database Initialization & Migrations

- **Dependencies to install:**
  - `better-sqlite3` — synchronous embedded SQLite engine
  - `sqlite-vec` — virtual vector table extension
  - `@types/better-sqlite3` (dev dependency)
- **Database initialization:** A `DatabaseManager` singleton class at `src/lib/server/db.ts` that:
  - Opens/creates the SQLite database file at a configurable path (default: `./data/local_vault.db`)
  - Loads the `sqlite-vec` extension at boot via `.loadExtension()`
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
- **Access:** No authentication (local-only app). Must be implemented as a TanStack Start server route (`.ts` with `server.handlers`), following the same pattern as `src/routes/api/health.ts`
- **Response:** JSON object with a `tables` array containing the name and column info of each table
- **Purpose:** Used by automated tests to verify database tables exist after boot

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
6. The landing page (`/`) renders unchanged with hero and feature cards — no sidebar visible
7. All database tables are confirmed to exist via the debug endpoint
8. Running migrations a second time succeeds without errors (idempotent)

## Out of Scope

- No CSS styling of the sidebar beyond functional layout (polish comes in later tracks)
- No Playwright fixtures or E2E tests — only Vitest unit tests for this track
- No data seeding or mock data
- No user creation flow
