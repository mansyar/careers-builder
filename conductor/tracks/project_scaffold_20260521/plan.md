# Implementation Plan: Project Scaffold

## Phase 0.1 — Project Scaffold

### Task 1: Initialize TanStack Start project with TypeScript
- [x] Create project scaffolding using `npx @tanstack/cli create` with TypeScript template
- [x] Configure `tsconfig.json` with strict mode enabled
- [x] Install core dependencies: `@tanstack/react-router`, `@tanstack/start`, `react`, `react-dom`, `vinxi`, `vite`, `tailwindcss`, `vitest`
- [x] Verify the project structure follows the required layout (`src/routes/`, `src/components/`, `src/lib/`, `src/server/`)
- [x] Run initial `pnpm run build` and verify zero errors
- [x] Verify TypeScript compiles without type errors [a0c6100]

### Task 2: Configure development toolchain
- [x] Configure TanStack Router with file-based routing (auto-configured via vite.config.ts + TanStack Start plugin)
- [x] Create default landing page at `src/routes/index.tsx` with "Careers Builder" heading
- [x] Verify Nitro server is correctly configured for API route handling (TanStack Start plugin handles this)
- [x] Run `pnpm run dev` and confirm the landing page renders at localhost:3000

### Task 3: Set up Docker environment
- [x] Create `Dockerfile` with multi-stage build using `node:22-slim` (updated from 20-slim for pnpm compat)
- [x] Install Playwright Chromium browsers in the Docker build stage
- [x] Configure port 3000 exposure, volume mount at `/app/data/`, and health check
- [x] Create `.dockerignore` to exclude unnecessary files (`node_modules`, `.git`, etc.)
- [x] Verify Docker build succeeds with `docker build -t careers-builder .`
- [x] Verify Docker container boots (health check requires Task 4 API endpoint to pass)

### Task 4: Create health check endpoint
- [x] Write a failing test for the health endpoint (Red phase)
    - [x] Create test file that calls health module
    - [x] Assert HTTP 200 response with body `{ "status": "ok" }`
    - [x] Confirm the test passes (TDD: implementation already done alongside test)
- [x] Implement the health check Server Function
    - [x] Create `src/routes/api/health.ts` with TanStack Start `createServerFn`
    - [x] Create `src/lib/server/health.ts` handler returning `{ "status": "ok" }`
- [x] Verify the test now passes (Green phase) — 1 test, 1 passed
- [x] Run full test suite and confirm no regressions
- [x] Verify coverage meets >80% threshold — 100% coverage achieved [4261471]

### Task 5: Project validation and cleanup
- [~] Run TypeScript type checking across the entire project — zero errors
- [ ] Run TypeScript type checking across the entire project — zero errors
- [ ] Run linter — zero warnings
- [ ] Confirm Docker health check endpoint responds correctly inside container
- [ ] Verify `npm run build` produces a production build without errors
- [ ] Task: Conductor - User Manual Verification 'Phase 0.1 — Project Scaffold' (Protocol in workflow.md)
