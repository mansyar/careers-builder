# Track Specification: AI Provider Configuration

## Track ID
`provider-config_20260522`

## Overview

This track implements the LLM provider configuration system — the foundation for all AI-powered features (chat interview, structured extraction, post-processing agent). Users configure their OpenAI-compatible provider via a first-run wizard and a settings modal, with the API key encrypted at rest using AES-256-GCM.

**Database note:** The `users` table already has a `target_settings TEXT` column from Track 0.3. No schema changes are required — this track stores provider configuration in that existing column as a JSON blob nested under a `provider` key, matching the TDD §4 specification.

## Functional Requirements

### 1. Encryption Module (`src/lib/server/encryption.ts`)

- **Secret file location:** `const SECRET_FILE_PATH = path.join(process.cwd(), 'data', '.secret')` — resolves to `./data/.secret` in development, which maps to `/app/data/.secret` inside the Docker container (matching the TDD §9 data sandboxing specification).
- **Secret file generation:** On first use, generate a 64-byte random secret file using `crypto.randomBytes(64)`.
- **Encryption:** AES-256-GCM via Node `crypto.createCipheriv`. Derive a 256-bit key from the secret file using SHA-256 hash of the first 32 bytes.
- **Decryption:** AES-256-GCM via `crypto.createDecipheriv`. Store the auth tag and IV alongside the ciphertext.
- **Graceful degradation:** If the `.secret` file is missing, encryption/decryption throws a clear error. The caller must handle this and surface a recovery flow (see §7).
- **Testability:** The module should support dependency injection of the secret file path for testing. Encryption/decryption logic (with key injected) should be testable without touching the filesystem — mock `fs` operations in unit tests.
- **Functions exposed:**
  - `function encrypt(plaintext: string, secretFilePath?: string): { encrypted: string; iv: string; tag: string }`
  - `function decrypt(encrypted: string, iv: string, tag: string, secretFilePath?: string): string`

### 2. Provider Settings Handler (`src/lib/server/provider-settings.ts`)

- **JSON structure (nested under `provider` key, per TDD §4):**
  ```json
  {
    "provider": {
      "apiKey": "<encrypted blob>",
      "baseUrl": "https://api.openai.com/v1",
      "modelId": "gpt-4o"
    }
  }
  ```
- **Load settings:** Read `users.target_settings` for user 1. Parse JSON. Return provider fields with the `apiKey` decrypted. If no settings exist, return defaults (`baseUrl: 'https://api.openai.com/v1'`, `modelId: 'gpt-4o'`, `apiKey: ''`).
- **Save settings:** Accept `{ apiKey, baseUrl, modelId }`. Encrypt `apiKey`. Store as `{ provider: { apiKey: <encrypted>, baseUrl, modelId } }` in `users.target_settings`. Update the row. Return the saved settings with `apiKey` masked.
- **Decryption failure handling:** If `decrypt` throws (missing/corrupt `.secret`), `loadSettings` still returns `baseUrl` and `modelId` from the stored JSON but sets `apiKey` to `''`. This triggers the recovery flow (see §7).
- **Validate settings:** Accept a provider config. Construct an OpenAI client with the given base URL, model ID, and API key. Call `streamText({ model, prompt: 'Hello', maxTokens: 5 })`. If it succeeds, return `{ valid: true }`. If it throws, return `{ valid: false, error: '<message>' }`.
- **Mask helper:** `function maskApiKey(key: string): string` — returns first 4 chars + `...` + last 4 chars. Handles short keys (≤8 chars) by returning `'****'`.

### 3. Provider Settings Server Functions (`src/lib/server/provider-settings-server.ts`)

- `getProviderSettings` — TanStack Start `createServerFn({ type: 'server' })`. Returns current settings with `apiKey` masked.
- `saveProviderSettings` — TanStack Start `createServerFn({ type: 'server' })`. Accepts `{ apiKey, baseUrl, modelId }`. Validates, encrypts, saves. Returns saved settings with `apiKey` masked.
- `validateProviderSettings` — TanStack Start `createServerFn({ type: 'server' })`. Accepts `{ apiKey, baseUrl, modelId }`. Makes a test `streamText` call. Returns `{ valid, error? }`.

### 4. Architectural Pattern: React Context for Modal State

To avoid prop-drilling through the component tree (`__root.tsx` → `_app.tsx` → `Sidebar`), a React context provides shared state:

- **`ProviderSettingsContext`** exposes: `{ isWizardOpen, isSettingsOpen, openSettings, closeWizard, closeSettings }`
- Wrapped at the `__root.tsx` level so the wizard can show on any page.
- The first-run wizard trigger checks provider config on mount and sets `isWizardOpen`.
- The sidebar button calls `openSettings()` from the context to open the settings modal.
- This is a lightweight, React-idiomatic pattern with no external dependencies.

### 5. First-Run Wizard Modal

- **Trigger:** On any app page, if no API key is configured (see §2 — `apiKey` is empty after loading), the wizard modal auto-opens.
- **Recovery mode:** If decryption failed (corrupt/missing `.secret`), the wizard opens with `baseUrl` and `modelId` pre-filled from stored settings. The API key field is blank and receives `autoFocus`.
- **Steps (3-step wizard):**
  - **Step 1 — API Key:** Password-masked input with a "show" toggle (eye icon). User enters their OpenAI-compatible API key. Input receives `autoFocus` when wizard opens.
  - **Step 2 — Provider URL (optional):** Pre-filled with `https://api.openai.com/v1` (or stored value in recovery mode). User can change it for custom endpoints.
  - **Step 3 — Model ID (optional):** Pre-filled with `gpt-4o` (or stored value in recovery mode). User can change it.
- **Validation:** At Step 1, a "Test Connection" button calls `validateProviderSettings`. Shows inline success (green checkmark) or error (red message).
- **Completion:** On finish, calls `saveProviderSettings`. Closes modal. Shows a brief success toast ("AI provider configured successfully").
- **Dismissal (wizard mode):** Cannot be dismissed without configuring a valid key — no close button, backdrop click disabled. The only action is to configure a key.

### 6. Settings Modal

- **Trigger:** A "Configure AI Provider" button in the sidebar (below navigation items).
- **Layout:** Same component as the wizard, but rendered in a regular modal (dismissable).
- **State:** Fields pre-filled from `getProviderSettings`. API key shown masked (`sk-...abc`).
- **Editing:** User clicks "Edit" next to a field to make it editable. Clicking "Save Changes" calls `saveProviderSettings`.
- **Validation:** Same "Test Connection" button available.
- **Cancel:** Discard changes and close modal.

### 7. Sidebar Integration

- Add a "Configure AI Provider" navigation item below the existing nav items in `Sidebar.tsx`.
- Uses a button (not a Link) that calls `openSettings()` from `ProviderSettingsContext`.
- Styled as a secondary action (slightly muted, distinct from primary nav items).
- This is a breaking change to the Sidebar's interface — it now consumes the context instead of being fully self-contained.

### 8. Recovery Flow (PRD §6 KPI Compliance)

- **Trigger:** On settings load, if `decrypt` throws (missing `.secret` file or corrupted data), `loadSettings` returns `apiKey: ''` with `baseUrl` and `modelId` still populated from the stored JSON.
- **Behavior:** The first-run wizard auto-opens (same path as initial setup) with `baseUrl` and `modelId` pre-filled from the database. Only the API key field is blank and receives `autoFocus`.
- **KPI target:** ≤ 30 seconds from error detection to wizard display with pre-focused API key field (PRD §6).

### 9. Future Compatibility Note

The first-run wizard currently blocks the entire app until configured. When Track 2.2 (Streaming Chat) is implemented, this should be refined so the wizard only blocks chat-related features — CV editing and other offline features remain accessible without an API key.

## Non-Functional Requirements

- **Security:** API key never appears unencrypted in the database. Never logged or exposed to the client bundle.
- **Performance:** Test connection must respond within 5 seconds (network latency permitting).
- **Usability:** Wizard fits in under 3 steps as per PRD requirement. Each step is self-explanatory with minimal text.
- **Resilience:** If encryption fails (missing secret file), the wizard shows a clear error and allows re-entry with pre-filled fields.

## Acceptance Criteria

1. First app visit with no API key → wizard modal opens automatically and cannot be dismissed.
2. Entering an invalid API key in the wizard → "Test Connection" shows error. Cannot proceed.
3. Entering a valid API key → wizard completes → settings saved encrypted under `provider` key → sidebar button appears.
4. App restart → API key persists (encrypted in DB) → wizard does NOT re-open.
5. Opening settings from sidebar → modal shows masked API key, pre-filled URL and model ID.
6. Editing and saving settings → values update correctly. Restart → new values persist.
7. `encrypt`/`decrypt` round-trips correctly: `decrypt(encrypt('test-key'))` returns `'test-key'`.
8. Missing `.secret` file → decryption fails → `loadSettings` returns `apiKey: ''` with other fields intact → recovery wizard auto-opens with pre-filled URL/model ID and `autoFocus` on API key input.
9. Settings JSON is nested under `provider` key: `{ provider: { apiKey, baseUrl, modelId } }`.
10. Sidebar renders "Configure AI Provider" button and clicking it opens the settings modal.

## Out of Scope

- Multiple provider configurations (only one active provider at a time).
- Provider switching without re-entering the API key.
- OAuth-based provider authentication.
- Key rotation or expiry management.
