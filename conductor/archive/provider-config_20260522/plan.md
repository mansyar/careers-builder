# Implementation Plan: AI Provider Configuration

**Dependencies to install first:** `ai`, `@ai-sdk/openai`

---

## Phase 1 — Encryption Module & Provider Settings Backend [checkpoint: 50c5d43]

Goal: Build the server-side encryption service, provider settings CRUD, validation via test `streamText` call, and TanStack Start server function wrappers.

**JSON structure note:** Per TDD §4, all provider settings are nested under a `provider` key: `{ provider: { apiKey, baseUrl, modelId } }`. The `users.target_settings` column already exists from Track 0.3 — no schema migration needed.

- [x] Task 1.1: Install AI SDK dependencies [5bebd79]
    - [x] Run `pnpm add ai @ai-sdk/openai`

- [x] Task 1.2: Write tests for encryption module (Red phase) [9e04c26]
    - [x] Create `src/lib/server/encryption.spec.ts`
    - [x] Mock `fs` operations for the secret file path (keep encryption/decryption logic real with injected key)
    - [x] Write test: `encrypt` returns `{ encrypted, iv, tag }` for a given plaintext
    - [x] Write test: `decrypt` with correct IV and tag returns original plaintext
    - [x] Write test: `decrypt` with wrong IV/tag throws or returns wrong data (GCM auth tag verification)
    - [x] Write test: missing secret file throws descriptive error
    - [x] Run tests and confirm they fail (no implementation yet)

- [x] Task 1.3: Implement encryption module (`src/lib/server/encryption.ts`) [9e04c26]
    - [x] Define `SECRET_FILE_PATH = path.join(process.cwd(), 'data', '.secret')`
    - [x] Implement `generateOrLoadSecret(path)`: check if file exists, if not create with `crypto.randomBytes(64)`
    - [x] Implement `deriveKey(secret)`: SHA-256 hash of first 32 bytes → 256-bit key
    - [x] Implement `encrypt(plaintext, secretFilePath?)`: AES-256-GCM with random IV, return `{ encrypted (hex), iv (hex), tag (hex) }`
    - [x] Implement `decrypt(encrypted, iv, tag, secretFilePath?)`: AES-256-GCM decrypt with auth tag verification
    - [x] Handle missing secret file: throw descriptive error with recovery guidance
    - [x] Run tests and confirm they pass

- [x] Task 1.4: Write tests for provider settings handler (Red phase)
    - [x] Create `src/lib/server/provider-settings.spec.ts`
    - [x] Write test: `loadSettings` returns defaults when no settings exist (empty DB)
    - [x] Write test: `loadSettings` decrypts and returns stored settings with nested `provider` key
    - [x] Write test: `loadSettings` handles decryption failure gracefully — returns `apiKey: ''` with other fields intact (recovery mode)
    - [x] Write test: `saveSettings` encrypts apiKey and stores as `{ provider: { apiKey, baseUrl, modelId } }`
    - [x] Write test: `maskApiKey` returns correctly masked string (`sk-...xyz`)
    - [x] Write test: `maskApiKey` handles short keys (≤8 chars) by returning `'****'`
    - [x] Write test: `validateSettings` returns `{ valid: true }` on successful streamText call (mock `streamText`)
    - [x] Write test: `validateSettings` returns `{ valid: false, error }` on failure (mock `streamText` throws)
    - [x] Run tests and confirm they fail

- [x] Task 1.5: Implement provider settings handler (`src/lib/server/provider-settings.ts`) [33ac9ea]
    - [x] Implement `maskApiKey(key: string): string`
    - [x] Implement `loadSettings(db)`: read `users.target_settings`, parse JSON, decrypt `provider.apiKey`, return config with nested structure
    - [x] Implement `saveSettings(db, { apiKey, baseUrl, modelId })`: encrypt key, structure as `{ provider: { apiKey: <encrypted>, baseUrl, modelId } }`, write JSON to `users.target_settings`
    - [x] Implement `loadSettings` decryption failure path: catch decrypt error, return `apiKey: ''` with `baseUrl` and `modelId` from stored JSON
    - [x] Implement `validateSettings({ apiKey, baseUrl, modelId })`: construct `openai(modelId, { baseURL })`, call `streamText({ model, prompt: 'Hi', maxTokens: 5 })`, return result
    - [x] Run tests and confirm they pass

- [x] Task 1.6: Write tests for server functions (Red phase) [03fb768]
    - [x] Create `src/lib/server/provider-settings-server.spec.ts`
    - [x] Write test: `getProviderSettings` returns settings with masked apiKey
    - [x] Write test: `saveProviderSettings` encrypts and persists
    - [x] Write test: `validateProviderSettings` calls through to validateSettings
    - [x] Run tests and confirm they fail

- [x] Task 1.7: Implement server functions (`src/lib/server/provider-settings-server.ts`) [03fb768]
    - [x] Implement `getProviderSettings` as `createServerFn`
    - [x] Implement `saveProviderSettings` as `createServerFn`
    - [x] Implement `validateProviderSettings` as `createServerFn`
    - [x] Follow the same decoupled pattern as `cv-loader-server.ts` (handler function + thin `createServerFn` wrapper)
    - [x] Run tests and confirm they pass

- [x] Task 1.8: Conductor — User Manual Verification 'Encryption Module & Provider Settings Backend' (Protocol in workflow.md) [50c5d43]

---

## Phase 2 — First-Run Wizard & Settings Modal + App Integration

Goal: Build the client-side UI components (wizard, settings modal), create React context for shared state, integrate with sidebar and root app shell.

**Architecture:** A `ProviderSettingsContext` at the root level avoids prop drilling. The sidebar calls `openSettings()` from context. The first-run check happens in a `useEffect` at the root.

- [x] Task 2.1: Create ProviderSettingsContext (`src/lib/provider-settings-context.tsx`)
    - [x] Define context shape: `{ isWizardOpen, isSettingsOpen, openSettings, closeWizard, closeSettings }`
    - [x] Create `ProviderSettingsProvider` component that manages state
    - [x] Export `useProviderSettings` hook

- [x] Task 2.2: Write tests for ProviderWizard component (Red phase)
    - [x] Create `src/components/ProviderWizard.spec.tsx`
    - [x] Write test: wizard renders 3 steps with step indicators
    - [x] Write test: Step 1 shows API key input with password masking and show toggle
    - [x] Write test: Step 2 shows base URL input pre-filled with default
    - [x] Write test: Step 3 shows model ID input pre-filled with default
    - [x] Write test: "Test Connection" button calls validateProviderSettings
    - [x] Write test: invalid key shows error and blocks proceeding to next step
    - [x] Write test: valid key shows success and allows next step
    - [x] Write test: wizard mode (`dismissable={false}`) has no close button
    - [x] Write test: settings mode (`dismissable={true}`) has close button
    - [x] Write test: recovery mode pre-fills baseUrl and modelId from stored settings, autoFocus on API key
    - [x] Run tests and confirm they fail

- [x] Task 2.3: Implement ProviderWizard component (`src/components/ProviderWizard.tsx`)
    - [x] Build 2-step wizard: API Key + Base URL → Model ID
    - [x] Step 1: password-masked API key input + Base URL + "Test Connection", inline success/error, `autoFocus`
    - [x] Step 2: text input pre-filled with `gpt-4o` (or stored value in recovery mode)
    - [x] Step navigation: Next/Back buttons, disabled until current step valid
    - [x] On completion: calls `saveProviderSettings` via server function
    - [x] Wizard mode: no close/backdrop dismiss (prop `dismissable={false}`)
    - [x] Settings mode: close button and backdrop dismiss enabled (prop `dismissable={true}`)
    - [x] Recovery mode: pre-fills baseUrl/modelId, API key blank + focused
    - [x] Run tests and confirm they pass

- [x] Task 2.4: Write tests for sidebar integration (Red phase) [8a247ca]
- [x] Task 2.5: Implement sidebar integration [8a247ca]
- [x] Task 2.6: Wire app-level wizard trigger and context [8a247ca]

- [x] Task 2.7: Manual verification complete — wizard, save, and connection test all working

## Phase 2 — Complete [checkpoint: UNVERIFIED]

---

## Phase 3 — Verify Coverage, Finalize & Archive

- [ ] Task 3.1: Run full test suite and check coverage
    - [ ] Execute `pnpm test -- --coverage`
    - [ ] Verify all tests pass
    - [ ] Verify coverage ≥ 80% (update thresholds in `vitest.config.ts` if needed)
    - [ ] Verify coverage exclusions in `vitest.config.ts` cover any new API route files (e.g., `src/routes/api/provider*`)
    - [ ] Fix any failures

- [ ] Task 3.2: Document deviations in `tech-stack.md`
    - [ ] Note: `ai` and `@ai-sdk/openai` added as production dependencies (confirm versions)
    - [ ] Note: `ProviderSettingsContext` pattern added for cross-component state
    - [ ] Note: Provider settings stored under `provider` key in `users.target_settings`

- [ ] Task 3.3: Archive track in Conductor
    - [ ] Update `conductor/tracks.md`: mark track as complete with commit SHA
    - [ ] Move track directory to `conductor/archive/` if archival is the convention
    - [ ] Or mark status as "complete" in `metadata.json` and leave in place
    - [ ] Commit plan update with message `conductor(plan): Mark Track 2.1 as complete`

- [ ] Task 3.4: Conductor — User Manual Verification 'Verify Coverage & Finalize' (Protocol in workflow.md)
