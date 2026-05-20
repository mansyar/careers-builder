# Track Specification: Pre-Commit & Pre-Push Checks

## Track ID
`git-hooks-setup_20260521`

## Description
Set up automated Git hooks to enforce code quality gates. Pre-commit checks run on staged files (lint, format, file-size modularity check). Pre-push checks run project-wide (TypeScript type checking, test coverage threshold).

## Requirements

### 1. Pre-Commit Hooks
Triggered via `husky` + `lint-staged` when files are staged for commit. Only staged files are checked.

#### 1.1 ESLint
- Run ESLint with TypeScript-ESLint rules on staged `.ts` and `.tsx` files in `src/`.
- Exclude: `src/routeTree.gen.ts`, `dist/`, `coverage/`, `node_modules/`.
- Fail the commit if any lint errors are found.

#### 1.2 Prettier
- Run Prettier on staged `.ts`, `.tsx`, `.css`, `.json`, `.md` files.
- Exclude: `src/routeTree.gen.ts`, `dist/`, `coverage/`, `node_modules/`.
- Auto-format files in-place (staged changes include formatting).

#### 1.3 Modularity Check (File Size Limit)
- Check that no staged file in `src/` or test directories exceeds **500 lines**.
- Exclude: `src/routeTree.gen.ts`, `dist/`, `coverage/`, `node_modules/`.
- Fail the commit if any file exceeds the limit.

### 2. Pre-Push Hooks
Triggered via `husky` when pushing to any remote.

#### 2.1 TypeScript Type Check
- Run `tsc --noEmit` across the entire project.
- Exclude: `node_modules/`, `dist/`, `coverage/`.
- Fail the push if any type errors are found.

#### 2.2 Test Coverage Threshold
- Run `pnpm test -- --coverage`.
- Enforce a minimum **80% code coverage** threshold.
- Fail the push if coverage falls below 80%.

### 3. Configuration Files

#### 3.1 ESLint Config (`eslint.config.js`)
- Flat config format (ESLint v9+ compatible).
- TypeScript-ESLint parser and plugin.
- Ignore patterns for generated files.
- Extends recommended rulesets.

#### 3.2 Prettier Config (`.prettierrc`)
- Single quotes, trailing commas, 100 print width.
- Consistent with style guide in `conductor/code_styleguides/`.

#### 3.3 Husky
- `.husky/pre-commit`: Run `npx lint-staged`.
- `.husky/pre-push`: Run `pnpm typecheck && pnpm test -- --coverage`.

#### 3.4 lint-staged Config (in `package.json`)
```
"lint-staged": {
  "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "src/**/*.{css,json,md}": ["prettier --write"],
  "*": ["node scripts/check-file-size.mjs"]
}
```

#### 3.5 PNPM Scripts
- Add script: `"lint": "eslint src/"`
- Add script: `"format": "prettier --write src/"`
- Add script: `"format:check": "prettier --check src/"`
- Add script: `"typecheck": "tsc --noEmit"`
- Add script: `"check:all": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test -- --coverage"`

### 4. File Size Check Script
Create `scripts/check-file-size.mjs`:
- Reads the file path from command-line argument (or stdin from lint-staged).
- Counts lines in the file.
- If lines > 500, exits with error code 1 and prints the file path and line count.
- Skips files matching exclusion patterns.

## Acceptance Criteria
- [ ] `git commit` with a lint error → commit is blocked with ESLint error message
- [ ] `git commit` with an unformatted file → file is auto-formatted before commit
- [ ] `git commit` with a file exceeding 500 lines → commit is blocked with size error
- [ ] `git push` with a type error → push is blocked with TypeScript error
- [ ] `git push` with coverage < 80% → push is blocked with coverage warning
- [ ] `pnpm run check:all` runs all checks successfully on a clean project
- [ ] Generated files (`routeTree.gen.ts`, `dist/`, `coverage/`, `node_modules/`) are excluded from all checks

## Out of Scope
- CI/CD pipeline integration (GitHub Actions) — covered in Phase 6 of the roadmap
- Custom ESLint rules or plugins beyond the recommended config
- Commit message linting (commitlint)
