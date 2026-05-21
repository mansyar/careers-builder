# Implementation Plan: AI Provider Configuration

**Dependencies to install first:** `ai`, `@ai-sdk/openai`

---

## Phase 1 — Encryption Module & Provider Settings Backend

Goal: Build the server-side encryption service, provider settings CRUD, validation via test `streamText` call, and TanStack Start server function wrappers.

- [ ] Task 1.1: Install AI SDK dependencies
    - [ ] Run `pnpm add ai @ai-sdk/openai`

- [ ] Task 1.2: Write tests for encryption module (Red phase)
    - [ ] Create `src/lib/server/encryption.spec.ts`
    - [ ] Write test: `encrypt` returns `{ encrypted, iv, tag }` for a given plaintext
    - [ ] Write test: `decrypt` with correct IV and tag returns original plaintext
    - [ ] Write test: `decrypt` with wrong IV throws or returns wrong data
    - [ ] Write test: calling encrypt/decrypt without `.secret` file throws clear error
    - [ ] Run tests and confirm they fail (no implementation yet)

- [ ] Task 1.3: Implement encryption module (`src/lib/server/encryption.ts`)
    - [ ] Implement `generateOrLoadSecret(path)`: check if `{vault_data}/.secret` exists, if not create with `crypto.randomBytes(64)`
    - [ ] Implement `deriveKey(secret)`: SHA-256 hash of first 32 bytes → 256-bit key
    - [ ] Implement `encrypt(plaintext)`: AES-256-GCM with random IV, return `{ encrypted (hex), iv (hex), tag (hex) }`
    - [ ] Implement `decrypt(encrypted, iv, tag)`: AES-256-GCM decrypt with auth tag verification
    - [ ] Handle missing secret file: throw descriptive error
    - [ ] Run tests and confirm they pass

- [ ] Task 1.4: Write tests for provider settings handler (Red phase)
    - [ ] Create `src/lib/server/provider-settings.spec.ts`
    - [ ] Write test: `loadSettings` returns defaults when no settings exist
    - [ ] Write test: `loadSettings` decrypts and returns stored settings
    - [ ] Write test: `saveSettings` encrypts apiKey and stores in DB
    - [ ] Write test: `maskApiKey` returns correctly masked string
    - [ ] Write test: `maskApiKey` handles short keys gracefully
    - [ ] Write test: `validateSettings` returns `{ valid: true }` on success (mock streamText)
    - [ ] Write test: `validateSettings` returns `{ valid: false, error }` on failure (mock streamText)
    - [ ] Run tests and confirm they fail

- [ ] Task 1.5: Implement provider settings handler (`src/lib/server/provider-settings.ts`)
    - [ ] Implement `maskApiKey(key: string): string`
    - [ ] Implement `loadSettings(db)`: read `users.target_settings`, parse JSON, decrypt key, return config
    - [ ] Implement `saveSettings(db, { apiKey, baseUrl, modelId })`: encrypt key, write JSON to DB
    - [ ] Implement `validateSettings({ apiKey, baseUrl, modelId })`: call `streamText({ model: openai(modelId, { baseURL }), prompt: 'Hi', maxTokens: 5 })`, return result
    - [ ] Run tests and confirm they pass

- [ ] Task 1.6: Write tests for server functions (Red phase)
    - [ ] Create `src/lib/server/provider-settings-server.spec.ts`
    - [ ] Write test: `getProviderSettings` returns settings with masked apiKey
    - [ ] Write test: `saveProviderSettings` encrypts and persists
    - [ ] Write test: `validateProviderSettings` calls through to validateSettings
    - [ ] Run tests and confirm they fail

- [ ] Task 1.7: Implement server functions (`src/lib/server/provider-settings-server.ts`)
    - [ ] Implement `getProviderSettings` as `createServerFn`
    - [ ] Implement `saveProviderSettings` as `createServerFn`
    - [ ] Implement `validateProviderSettings` as `createServerFn`
    - [ ] Run tests and confirm they pass

- [ ] Task 1.8: Conductor — User Manual Verification 'Encryption Module & Provider Settings Backend' (Protocol in workflow.md)

---

## Phase 2 — First-Run Wizard & Settings Modal

Goal: Build the client-side UI components (wizard, settings modal), integrate with sidebar, handle first-run auto-trigger.

- [ ] Task 2.1: Write tests for ProviderWizard component (Red phase)
    - [ ] Create `src/components/ProviderWizard.spec.tsx`
    - [ ] Write test: wizard renders 3 steps with step indicators
    - [ ] Write test: Step 1 shows API key input with password masking and show toggle
    - [ ] Write test: Step 2 shows base URL input pre-filled with default
    - [ ] Write test: Step 3 shows model ID input pre-filled with default
    - [ ] Write test: "Test Connection" button calls validateProviderSettings
    - [ ] Write test: invalid key shows error and blocks proceeding
    - [ ] Write test: valid key shows success and allows next step
    - [ ] Write test: wizard cannot be dismissed (no close button when in wizard mode)
    - [ ] Run tests and confirm they fail

- [ ] Task 2.2: Implement ProviderWizard component (`src/components/ProviderWizard.tsx`)
    - [ ] Build 3-step wizard: API Key → Base URL → Model ID
    - [ ] Step 1: password-masked input with eye toggle, "Test Connection" button, inline success/error
    - [ ] Step 2: text input pre-filled with `https://api.openai.com/v1`
    - [ ] Step 3: text input pre-filled with `gpt-4o`
    - [ ] Step navigation: Next/Back buttons, disabled until current step valid
    - [ ] On completion: calls `saveProviderSettings`, shows success toast
    - [ ] Wizard mode: no close/backdrop dismiss (prop `dismissable={false}`)
    - [ ] Settings mode: close button and backdrop dismiss enabled
    - [ ] Run tests and confirm they pass

- [ ] Task 2.3: Write tests for sidebar integration (Red phase)
    - [ ] Update `src/components/Sidebar.spec.tsx`
    - [ ] Write test: sidebar renders "Configure AI Provider" button
    - [ ] Write test: clicking button fires onOpenSettings callback
    - [ ] Run tests and confirm they fail

- [ ] Task 2.4: Implement sidebar integration
    - [ ] Add "Configure AI Provider" button to `Sidebar.tsx` below nav items
    - [ ] Style as secondary action (muted styling, distinct from nav links)
    - [ ] Pass `onOpenSettings` callback prop from parent
    - [ ] Run tests and confirm they pass

- [ ] Task 2.5: Implement app-level wizard trigger (`src/routes/__root.tsx`)
    - [ ] On root app mount, call `getProviderSettings` server function
    - [ ] If `apiKey` is empty, show the ProviderWizard in wizard mode (dismissable=false)
    - [ ] If `apiKey` is set, show nothing (user can open settings via sidebar)
    - [ ] Wire sidebar "Configure AI Provider" to open settings modal (dismissable=true)
    - [ ] Run tests and confirm they pass

- [ ] Task 2.6: Conductor — User Manual Verification 'First-Run Wizard & Settings Modal' (Protocol in workflow.md)

---

## Phase 3 — Verify Coverage & Finalize

- [ ] Task 3.1: Run full test suite and check coverage
    - [ ] Execute `pnpm test -- --coverage`
    - [ ] Verify all tests pass
    - [ ] Verify coverage ≥ 80%
    - [ ] Fix any failures

- [ ] Task 3.2: Document deviations (if any) in `tech-stack.md`
- [ ] Task 3.3: Conductor — User Manual Verification 'Verify Coverage & Finalize' (Protocol in workflow.md)
