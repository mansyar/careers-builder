# Implementation Plan: UI Shell + Database Bootstrap

Implementation order: UI Shell first (faster visible progress, no database dependency), Database second (plumbing layer).

---

## Phase 1 - Sidebar Navigation & Routes [checkpoint: 408f4b1]

Goal: Create the persistent sidebar navigation component, update Header, use TanStack Router route nesting (`_app.tsx` layout), add CV Builder and Job Search routes with empty states, and implement responsive mobile behavior.

- [x] Task 1.1: Update Header - remove nav links [08941d8]
    - [x] Remove Home, About, Features inline nav links from Header
    - [x] Keep only the brand logo/link and ThemeToggle
    - [x] Update tests
- [x] Task 1.2: Create persistent Sidebar component (`src/components/Sidebar.tsx`) [c7277e6]
    - [x] Write failing test: sidebar renders with three nav items
    - [x] Write failing test: active route is highlighted
    - [x] Implement Sidebar with Link and activeProps
    - [x] Style with Tailwind: vertical left panel, fixed width
    - [x] Verify tests pass
- [x] Task 1.3: Create `_app.tsx` layout route with sidebar (`src/routes/_app.tsx`) [0fc2a61]
    - [x] Write failing test: layout renders Sidebar and Outlet
    - [x] Implement layout route using createFileRoute('/_app')
    - [x] Layout renders Sidebar on left, Outlet on right
    - [x] Nested routes are children of this layout
    - [x] Verify tests pass
- [x] Task 1.4: Create CV Builder route (`src/routes/_app/cv-builder.tsx`) [5883814]
    - [x] Write failing test: route renders empty state
    - [x] Implement route with empty state and disabled CTA
    - [x] Verify tests pass
- [x] Task 1.5: Create Job Search route (`src/routes/_app/job-search.tsx`) [5883814]
    - [x] Write failing test: route renders empty state
    - [x] Implement route with empty state message
    - [x] Verify tests pass
- [x] Task 1.6: Implement responsive sidebar behavior [923722c]
    - [x] Write failing test: hamburger on mobile viewport
    - [x] Write failing test: toggle opens/closes sidebar
    - [x] Implement mobile toggle with backdrop overlay
    - [x] Verify tests pass
- [x] Task 1.7: User Manual Verification (Protocol in workflow.md)

---

## Phase 2 - Database & Debug Endpoint [checkpoint: 0bf2d8c]

Goal: Install database dependencies, create the DatabaseManager singleton, implement idempotent migrations for all 6 tables, and expose a decoupled debug endpoint for test verification.

- [x] Task 2.1: Install database dependencies [c77c5ce]
    - [x] Add better-sqlite3 and sqlite-vec to pnpm.onlyBuiltDependencies
    - [x] Install better-sqlite3, sqlite-vec, and @types/better-sqlite3
    - [x] Verify packages install correctly
    - [x] Update vitest coverage exclusion
- [x] Task 2.2: Create DatabaseManager singleton (`src/lib/server/db.ts`) [e26e138]
    - [x] Write failing test: opens in-memory database
    - [x] Write failing test: singleton returns same instance
    - [x] Implement singleton with :memory: and configurable path
    - [x] Verify tests pass
- [x] Task 2.3: Create migration runner (`src/lib/server/migrations.ts`) [2c89037]
    - [x] Write failing test: structural migrations create 4 tables
    - [x] Write failing test: migrations are idempotent
    - [x] Implement runStructuralMigrations() and runVectorMigrations()
    - [x] Define all 6 table DDL with IF NOT EXISTS
    - [x] Verify all tests pass
- [x] Task 2.4: Create debug schema handler + route (decoupled pattern) [2c89037]
    - [x] Write failing test: getDbSchema() returns table info
    - [x] Implement handler at src/lib/server/db-schema.ts
    - [x] Create route wrapper at src/routes/api/internal/debug/db-schema.ts
    - [x] Verify tests pass
- [x] Task 2.5: Integrate database init at server boot [0bf2d8c]
    - [x] Initialize DatabaseManager on server startup
    - [x] Ensure initialization errors are logged
    - [x] Verify app boots cleanly
- [x] Task 2.6: User Manual Verification (Protocol in workflow.md)
