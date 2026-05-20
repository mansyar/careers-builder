# Track Specification: Project Scaffold

## Track ID
`project_scaffold_20260521`

## Description
Initialize the TanStack Start project with TypeScript, configure the full development toolchain (Vite, Nitro, TanStack Router), set up the Docker environment, and create a health check endpoint to verify the app boots correctly.

## Requirements

### 1. Project Initialization
- Initialize a TanStack Start project using TypeScript as the primary language.
- Project must follow the standard TanStack Start file structure:
  - `src/routes/` for file-based routing
  - `src/components/` for shared React components
  - `src/lib/` for shared utilities and helpers
  - `src/server/` for server-side logic
  - `app.config.ts` for TanStack Start configuration
- Configure `tsconfig.json` with strict mode enabled.

### 2. Development Toolchain
- **Vite:** Must build the project without errors. Configured as the bundler via TanStack Start.
- **Nitro:** Embedded Nitro server must be correctly configured to handle server functions and API routes.
- **TanStack Router:** File-based routing must be properly configured. Create a default `src/routes/index.tsx` that renders a basic landing page.
- **Package manager:** npm with a `package.json` containing all required dependencies.
- **Type checking:** TypeScript strict mode with no type errors.

### 3. Docker Environment
- Create a `Dockerfile` using `node:20-slim` as the base image.
- Must include:
  - Multi-stage build (dev dependencies in build stage, production dependencies in final stage)
  - Playwright Chromium browser installation for PDF generation and scraping
  - Port 3000 exposed for the web UI
  - Volume mount point at `/app/data/` for persistent data
  - Health check instruction
- Create a `.dockerignore` file excluding unnecessary build artifacts.

### 4. Health Check Endpoint
- Endpoint: `GET /api/health`
- Must return HTTP 200 with JSON body: `{ "status": "ok" }`
- Must be implemented as a TanStack Start Server Function at `src/routes/api/health.ts`
- Test must verify the endpoint works both within the Docker container and during development.

### 5. Testing
- First tests should be written for the health check endpoint (TDD red-green cycle).
- Verify the project builds without errors.
- Coverage target: >80% for all newly created code.

## Acceptance Criteria
- [ ] Project boots successfully with `npm run dev`
- [ ] `GET /api/health` returns `{ "status": "ok" }` with HTTP 200
- [ ] Docker build completes successfully
- [ ] Docker container boots and health check passes
- [ ] TypeScript compiles without errors (strict mode)
- [ ] All tests pass
