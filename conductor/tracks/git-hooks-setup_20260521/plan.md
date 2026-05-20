# Implementation Plan: Pre-Commit & Pre-Push Checks

## Phase 1 — Linter & Formatter Configuration

### Task 1.1: Install ESLint, Prettier, and related dev dependencies
- [x] Install `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react`, `prettier`, `eslint-config-prettier` as dev dependencies

### Task 1.2: Create ESLint flat configuration
- [x] Create `eslint.config.js` with TypeScript-ESLint parser and plugin
- [x] Include recommended rulesets for TypeScript and React
- [x] Add ignore patterns for `src/routeTree.gen.ts`, `dist/`, `coverage/`, `node_modules/`
- [x] Integrate Prettier config via `eslint-config-prettier` to avoid rule conflicts

### Task 1.3: Create Prettier configuration
- [x] Create `.prettierrc` with single quotes, trailing commas, print width 100
- [x] Create `.prettierignore` excluding generated files

### Task 1.4: Add PNPM scripts for linting and formatting
- [x] Add script: `"lint": "eslint src/"`
- [x] Add script: `"format": "prettier --write src/"`
- [x] Add script: `"format:check": "prettier --check src/"`

### Task 1.5: Test the ESLint and Prettier configuration
- [x] **Write test:** Create `src/lib/__tests__/lint-config.spec.ts` that verifies the ESLint config loads without errors
- [x] **Write test:** Verify `.prettierrc` is valid JSON and contains expected settings
- [x] **Implement:** Run `pnpm lint` to confirm zero errors on current codebase
- [x] **Implement:** Run `pnpm format:check` to confirm all files are already formatted

- [ ] Task: Conductor - User Manual Verification 'Phase 1 — Linter & Formatter Configuration' (Protocol in workflow.md)

---

## Phase 2 — File Size Check & Pre-Commit Hooks

### Task 2.1: Create file size check script
- [ ] Create `scripts/check-file-size.mjs` that reads a file path and exits with error if lines > 500
- [ ] Skip files matching exclusion patterns (`routeTree.gen.ts`, `dist/`, `coverage/`, `node_modules/`)

### Task 2.2: Write tests for the file size check script
- [ ] **Write test:** Create `scripts/__tests__/check-file-size.spec.mjs`
- [ ] Test: small file (< 500 lines) exits with code 0
- [ ] Test: large file (> 500 lines) exits with code 1 and prints error
- [ ] Test: excluded files are skipped regardless of size
- [ ] **Implement:** Run tests and confirm they pass

### Task 2.3: Install and configure Husky
- [ ] Install `husky` as dev dependency
- [ ] Run `npx husky init` to create `.husky/` directory
- [ ] Add `pnpm dlx husky` as a `prepare` script in `package.json`

### Task 2.4: Configure lint-staged
- [ ] Install `lint-staged` as dev dependency
- [ ] Add `lint-staged` configuration to `package.json`:
  - `src/**/*.{ts,tsx}`: ESLint fix + Prettier write
  - `src/**/*.{css,json,md}`: Prettier write
  - `*`: File size check script

### Task 2.5: Create pre-commit hook
- [ ] Create `.husky/pre-commit` that runs `npx lint-staged`
- [ ] Verify the hook is executable

### Task 2.6: Test pre-commit hook end-to-end
- [ ] **Write test:** Stage a file with a lint error → verify commit is blocked
- [ ] **Write test:** Stage a file that exceeds 500 lines → verify commit is blocked
- [ ] **Write test:** Stage a clean file → verify commit succeeds

- [ ] Task: Conductor - User Manual Verification 'Phase 2 — File Size Check & Pre-Commit Hooks' (Protocol in workflow.md)

---

## Phase 3 — Pre-Push Checks

### Task 3.1: Configure TypeScript type check script
- [ ] Verify `tsc --noEmit` works without errors on the current codebase
- [ ] Add script: `"typecheck": "tsc --noEmit"`

### Task 3.2: Configure coverage threshold in Vitest
- [ ] Update `vitest.config.ts` to include coverage config with 80% threshold:
  ```ts
  coverage: {
    enabled: true,
    thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/routeTree.gen.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
  }
  ```

### Task 3.3: Test coverage threshold
- [ ] **Write test:** Create a test that verifies coverage configuration is loaded correctly
- [ ] **Implement:** Run `pnpm test -- --coverage` and confirm it reports coverage

### Task 3.4: Create pre-push hook
- [ ] Create `.husky/pre-push` that runs `pnpm typecheck && pnpm test -- --coverage`
- [ ] Verify the hook is executable

### Task 3.5: Create combined check script
- [ ] Add script: `"check:all": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test -- --coverage"`

### Task 3.6: Test pre-push hook end-to-end
- [ ] **Write test:** Simulate a push with a type error → verify push is blocked
- [ ] **Write test:** Simulate a push with low coverage → verify push is blocked
- [ ] **Write test:** Simulate a push with all clean → verify push succeeds

- [ ] Task: Conductor - User Manual Verification 'Phase 3 — Pre-Push Checks' (Protocol in workflow.md)
