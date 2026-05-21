# Implementation Plan: AI Provider Configuration

**Dependencies to install first:** `ai`, `@ai-sdk/openai`

---

## Phase 1 — Encryption Module & Provider Settings Backend

Goal: Build the server-side encryption service, provider settings CRUD, validation via test `streamText` call, and TanStack Start server function wrappers.

**JSON structure note:** Per TDD §4, all provider settings are nested under a `provider` key: `{ provider: { apiKey, baseUrl, modelId } }`. The `users.target_settings` column already exists from Track 0.3 — no schema migration needed.

- [x] Task 1.1: Install AI SDK dependencies [5bebd79]
    - [x] Run `pnpm add ai @ai-sdk/openai`

- [ ] Task 1.2: Write tests for encryption module (Red phase)
    - [ ] Create `src/lib/server/encryption.spec.ts`
    - [ ] Mock `fs` operations for the secret file path (keep encryption/decryption logic real with injected key)
    - [ ] Write test: `encrypt` returns `{ encrypted, iv, tag }` for a given plaintext
    - [ ] Write test: `decrypt` with correct IV and tag returns original plaintext
    - [ ] Write test: `decrypt` with wrong IV/tag throws or returns wrong data (GCM auth tag verification)
    - [ ] Write test: missing secret file throws descriptive error
    - [ ] Run tests and confirm they fail (no implementation yet)

- [ ] Task 1.3: Implement encryption module (`src/lib/server/encryption.ts`)
    - [ ] Define `SECRET_FILE_PATH = path.join(process.cwd(), 'data', '.secret')`
    - [ ] Implement `generateOrLoadSecret(path)`: check if file exists, if not create with `crypto.randomBytes(64)`
    - [ ] Implement `deriveKey(secret)`: SHA-256 hash of first 32 bytes → 256-bit key
    - [ ] Implement `encrypt(plaintext, secretFilePath?)`: AES-256-GCM with random IV, return `{ encrypted (hex), iv (hex), tag (hex) }`
    - [ ] Implement `decrypt(encrypted, iv, tag, secretFilePath?)`: AES-256-GCM decrypt with auth tag verification
    - [ ] Handle missing secret file: throw descriptive error with recovery guidance
    - [ ] Run tests and confirm they pass

- [ ] Task 1.4: Write tests for provider settings handler (Red phase)
    - [ ] Create `src/lib/server/provider-settings.spec.ts`
    - [ ] Write test: `loadSettings` returns defaults when no settings exist (empty DB)
    - [ ] Write test: `loadSettings` decrypts and returns stored settings with nested `provider` key
    - [ ] Write test: `loadSettings` handles decryption failure gracefully — returns `apiKey: ''` with other fields intact (recovery mode)
    - [ ] Write test: `saveSettings` encrypts apiKey and stores as `{ provider: { apiKey, baseUrl, modelId } }`
    - [ ] Write test: `maskApiKey` returns correctly masked string (`sk-...xyz`)
    - [ ] Write test: `maskApiKey` handles short keys (≤8 chars) by returning `'****'`
    - [ ] Write test: `validateSettings` returns `{ valid: true }` on successful streamText call (mock `streamText`)
    - [ ] Write test: `validateSettings` returns `{ valid: false, error }` on failure (mock `streamText` throws)
    - [ ] Run tests and confirm they fail

- [ ] Task 1.5: Implement provider settings handler (`src/lib/server/provider-settings.ts`)
    - [ ] Implement `maskApiKey(key: string): string`
    - [ ] Implement `loadSettings(db)`: read `users.target_settings`, parse JSON, decrypt `provider.apiKey`, return config with nested structure
    - [ ] Implement `saveSettings(db, { apiKey, baseUrl, modelId })`: encrypt key, structure as `{ provider: { apiKey: <encrypted>, baseUrl, modelId } }`, write JSON to `users.target_settings`
    - [ ] Implement `loadSettings` decryption failure path: catch decrypt error, return `apiKey: ''` with `baseUrl` and `modelId` from stored JSON
    - [ ] Implement `validateSettings({ apiKey, baseUrl, modelId })`: construct `openai(modelId, { baseURL })`, call `streamText({ model, prompt: 'Hi', maxTokens: 5 })`, return result
    - [ ] Run tests and confirm they pass

- [ ] Task 1.6: Write tests for server functions (Red phase)
    - [ ] Create `src/lib/server/provider-settings-server.spec.ts`
    - [ ] Write test: `getProviderSettings` returns settings with masked apiKey
    - [ ] Write test: `saveProviderSettings` encrypts and persists
    - [ ] Write test: `validateProviderSettings` calls through to validateSettings
    - [ ] Run tests and confirm they fail

- [ ] Task 1.7: Implement server functions (`src/lib/server/provider-settings-server.ts`)
    - [ ] Implement `getProviderSettings` as `createServerFn({ type: 'server' })`
    - [ ] Implement `saveProviderSettings` as `createServerFn({ type: 'server' })`
    - [ ] Implement `validateProviderSettings` as `createServerFn({ type: 'server' })`
    - [ ] Follow the same decoupled pattern as `cv-loader-server.ts` (handler function + thin `createServerFn` wrapper)
    - [ ] Run tests and confirm they pass

- [ ] Task 1.8: Conductor — User Manual Verification 'Encryption Module & Provider Settings Backend' (Protocol in workflow.md)

---

## Phase 2 — First-Run Wizard & Settings Modal + App Integration

Goal: Build the client-side UI components (wizard, settings modal), create React context for shared state, integrate with sidebar and root app shell.

**Architecture:** A `ProviderSettingsContext` at the root level avoids prop drilling. The sidebar calls `openSettings()` from context. The first-run check happens in a `useEffect` at the root.

- [ ] Task 2.1: Create ProviderSettingsContext (`src/lib/provider-settings-context.tsx`)
    - [ ] Define context shape: `{ isWizardOpen, isSettingsOpen, openSettings, closeWizard, closeSettings }`
    - [ ] Create `ProviderSettingsProvider` component that manages state
    - [ ] Export `useProviderSettings` hook

- [ ] Task 2.2: Write tests for ProviderWizard component (Red phase)
    - [ ] Create `src/components/ProviderWizard.spec.tsx`
    - [ ] Write test: wizard renders 3 steps with step indicators
    - [ ] Write test: Step 1 shows API key input with password masking and show toggle
    - [ ] Write test: Step 2 shows base URL input pre-filled with default
    - [ ] Write test: Step 3 shows model ID input pre-filled with default
    - [ ] Write test: "Test Connection" button calls validateProviderSettings
    - [ ] Write test: invalid key shows error and blocks proceeding to next step
    - [ ] Write test: valid key shows success and allows next step
    - [ ] Write test: wizard mode (`dismissable={false}`) has no close button
    - [ ] Write test: settings mode (`dismissable={true}`) has close button
    - [ ] Write test: recovery mode pre-fills baseUrl and modelId from stored settings, autoFocus on API key
    - [ ] Run tests and confirm they fail

- [ ] Task 2.3: Implement ProviderWizard component (`src/components/ProviderWizard.tsx`)
    - [ ] Build 3-step wizard: API Key → Base URL → Model ID
    - [ ] Step 1: password-masked input with eye toggle, "Test Connection" button, inline success/error, `autoFocus`
    - [ ] Step 2: text input pre-filled with `https://api.openai.com/v1` (or stored value in recovery mode)
    - [ ] Step 3: text input pre-filled with `gpt-4o` (or stored value in recovery mode)
    - [ ] Step navigation: Next/Back buttons, disabled until current step valid
    - [ ] On completion: calls `saveProviderSettings`, shows success toast
    - [ ] Wizard mode: no close/backdrop dismiss (prop `dismissable={false}`)
    - [ ] Settings mode: close button and backdrop dismiss enabled (prop `dismissable={true}`)
    - [ ] Recovery mode: pre-fills baseUrl/modelId, skips to Step 2, API key blank + focused
    - [ ] Run tests and confirm they pass

- [ ] Task 2.4: Write tests for sidebar integration (Red phase)
    - [ ] Update `src/components/Sidebar.spec.tsx`
    - [ ] Write test: sidebar renders 4 items including "Configure AI Provider"
    - [ ] Write test: "Configure AI Provider" is a button (not a Link)
    - [ ] Write test: clicking button fires onOpenSettings callback
    - [ ] Run tests and confirm they fail

- [ ] Task 2.5: Implement sidebar integration
    - [ ] Add "Configure AI Provider" button to `Sidebar.tsx` below existing NAV_ITEMS
    - [ ] Style as secondary action (muted styling, smaller font, distinct from nav links)
    - [ ] Accept `onOpenSettings` callback prop
    - [ ] Update the NAV_ITEMS constant to 4 (existing tests check count)
    - [ ] Run tests and confirm they pass

- [ ] Task 2.6: Wire app-level wizard trigger and context (`src/routes/__root.tsx` and `_app.tsx`)
    - [ ] Wrap `<RootDocument>` children with `<ProviderSettingsProvider>`
    - [ ] In the provider, on mount call `getProviderSettings` server function
    - [ ] If `apiKey` is empty, set `isWizardOpen = true` (show non-dismissable wizard)
    - [ ] If `apiKey` is present, set `isWizardOpen = false` (user can open settings via sidebar)
    - [ ] In `_app.tsx`, wire sidebar button to `openSettings()` from context
    - [ ] Render `<ProviderWizard>` modals at the root level based on context state
    - [ ] Run tests and confirm they pass

- [ ] Task 2.7: Conductor — User Manual Verification 'First-Run Wizard & Settings Modal' (Protocol in workflow.md)

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
