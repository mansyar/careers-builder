# Implementation Plan: Project Scaffold

## Phase 0.1 — Project Scaffold

### Task 1: Initialize TanStack Start project with TypeScript
- [ ] Create project scaffolding using `npm create tanstack-start@latest` with TypeScript template
- [ ] Configure `tsconfig.json` with strict mode enabled
- [ ] Install core dependencies: `@tanstack/react-router`, `@tanstack/start`, `react`, `react-dom`, `vinxi`, `vite`
- [ ] Verify the project structure follows the required layout (`src/routes/`, `src/components/`, `src/lib/`, `src/server/`)
- [ ] Run initial `npm run build` and verify zero errors
- [ ] Verify TypeScript compiles without type errors

### Task 2: Configure development toolchain
- [ ] Configure TanStack Router with file-based routing in `app.config.ts`
- [ ] Create default landing page at `src/routes/index.tsx` with a basic "Careers Builder" heading
- [ ] Verify Nitro server is correctly configured for API route handling
- [ ] Run `npm run dev` and confirm the landing page renders at localhost:3000

### Task 3: Set up Docker environment
- [ ] Create `Dockerfile` with multi-stage build using `node:20-slim`
- [ ] Install Playwright Chromium browsers in the Docker build stage
- [ ] Configure port 3000 exposure, volume mount at `/app/data/`, and health check
- [ ] Create `.dockerignore` to exclude unnecessary files (`node_modules`, `.git`, etc.)
- [ ] Verify Docker build succeeds with `docker build -t careers-builder .`
- [ ] Verify Docker container boots and is accessible at localhost:3000

### Task 4: Create health check endpoint
- [ ] Write a failing test for the health endpoint (Red phase)
    - [ ] Create test file that calls `GET /api/health`
    - [ ] Assert HTTP 200 response with body `{ "status": "ok" }`
    - [ ] Confirm the test fails (no implementation yet)
- [ ] Implement the health check Server Function
    - [ ] Create `src/routes/api/health.ts`
    - [ ] Return `{ "status": "ok" }` with HTTP 200 status
- [ ] Verify the test now passes (Green phase)
- [ ] Run full test suite and confirm no regressions
- [ ] Verify coverage meets >80% threshold

### Task 5: Project validation and cleanup
- [ ] Run TypeScript type checking across the entire project — zero errors
- [ ] Run linter — zero warnings
- [ ] Confirm Docker health check endpoint responds correctly inside container
- [ ] Verify `npm run build` produces a production build without errors
- [ ] Task: Conductor - User Manual Verification 'Phase 0.1 — Project Scaffold' (Protocol in workflow.md)
