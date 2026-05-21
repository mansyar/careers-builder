# Track Specification: AI Provider Configuration

## Track ID
`provider-config_20260522`

## Overview

This track implements the LLM provider configuration system — the foundation for all AI-powered features (chat interview, structured extraction, post-processing agent). Users configure their OpenAI-compatible provider via a first-run wizard and a settings modal, with the API key encrypted at rest using AES-256-GCM.

## Functional Requirements

### 1. Encryption Module (`src/lib/server/encryption.ts`)

- **Secret file generation:** On first use, generate a 64-byte random secret file at `{vault_data}/.secret` using `crypto.randomBytes(64)`.
- **Encryption:** AES-256-GCM via Node `crypto.createCipheriv`. Derive a 256-bit key from the secret file using HKDF (or a simple SHA-256 hash of the first 32 bytes).
- **Decryption:** AES-256-GCM via `crypto.createDecipheriv`. Store the auth tag and IV alongside the ciphertext.
- **Graceful degradation:** If the `.secret` file is missing, encryption/decryption throws a clear error. The caller must handle this and surface a "Configuration corrupted — please re-enter your API key" message.
- **Functions exposed:**
  - `function encrypt(plaintext: string): { encrypted: string; iv: string; tag: string }`
  - `function decrypt(encrypted: string, iv: string, tag: string): string`

### 2. Provider Settings Handler (`src/lib/server/provider-settings.ts`)

- **Load settings:** Read `users.target_settings` for user 1. Parse JSON. Return provider fields with the `apiKey` decrypted. If no settings exist, return defaults (`baseUrl: 'https://api.openai.com/v1'`, `modelId: 'gpt-4o'`, `apiKey: ''`).
- **Save settings:** Accept `{ apiKey, baseUrl, modelId }`. Encrypt `apiKey`. Merge into `users.target_settings` JSON. Update the row. Return the saved settings with `apiKey` masked.
- **Validate settings:** Accept a provider config. Construct an OpenAI client with the given base URL, model ID, and API key. Call `streamText({ model, prompt: 'Hello', maxTokens: 5 })`. If it succeeds, return `{ valid: true }`. If it throws, return `{ valid: false, error: '<message>' }`.
- **Mask helper:** `function maskApiKey(key: string): string` — returns first 4 chars + `...` + last 4 chars.

### 3. Provider Settings Server Function (`src/lib/server/provider-settings-server.ts`)

- `getProviderSettings` — TanStack Start `createServerFn`. Returns current settings with `apiKey` masked.
- `saveProviderSettings` — TanStack Start `createServerFn`. Accepts `{ apiKey, baseUrl, modelId }`. Validates, encrypts, saves. Returns saved settings with `apiKey` masked.
- `validateProviderSettings` — TanStack Start `createServerFn`. Accepts `{ apiKey, baseUrl, modelId }`. Makes a test `streamText` call. Returns `{ valid, error? }`.

### 4. First-Run Wizard Modal

- **Trigger:** On app start, if no API key is configured (load settings → `apiKey` is empty), the wizard modal auto-opens.
- **Steps (3-step wizard):**
  - **Step 1 — API Key:** Password-masked input with a "show" toggle (eye icon). User enters their OpenAI-compatible API key.
  - **Step 2 — Provider URL (optional):** Pre-filled with `https://api.openai.com/v1`. User can change it for custom endpoints.
  - **Step 3 — Model ID (optional):** Pre-filled with `gpt-4o`. User can change it.
- **Validation:** At Step 1, a "Test Connection" button calls `validateProviderSettings`. Shows inline success (green checkmark) or error (red message).
- **Completion:** On finish, calls `saveProviderSettings`. Closes modal. Shows a brief success toast ("AI provider configured successfully").
- **Dismissal:** Cannot be dismissed without configuring a valid key — no close button, backdrop click disabled. The only action is to configure a key.

### 5. Settings Modal (`/settings/provider` as modal)

- **Trigger:** A "Configure AI Provider" button in the sidebar (below navigation items).
- **Layout:** Same component as the wizard, but rendered in a regular modal (dismissable).
- **State:** Fields pre-filled from `getProviderSettings`. API key shown masked (`sk-...abc`).
- **Editing:** User clicks "Edit" next to a field to make it editable. Clicking "Save Changes" calls `saveProviderSettings`.
- **Validation:** Same "Test Connection" button available.
- **Cancel:** Discard changes and close modal.

### 6. Sidebar Integration

- Add a "Configure AI Provider" navigation item below the existing nav items in `Sidebar.tsx`.
- Uses a button (not a Link) that opens the settings modal.
- Styled as a secondary action (slightly muted, distinct from primary nav items).

## Non-Functional Requirements

- **Security:** API key never appears unencrypted in the database. Never logged or exposed to the client bundle.
- **Performance:** Test connection must respond within 5 seconds (network latency permitting).
- **Usability:** Wizard fits in under 3 steps as per PRD requirement. Each step is self-explanatory with minimal text.
- **Resilience:** If encryption fails (missing secret file), the wizard shows a clear error and allows re-entry.

## Acceptance Criteria

1. First app visit with no API key → wizard modal opens automatically and cannot be dismissed.
2. Entering an invalid API key in the wizard → "Test Connection" shows error. Cannot proceed.
3. Entering a valid API key → wizard completes → settings saved encrypted → sidebar button appears.
4. App restart → API key persists (encrypted in DB) → wizard does NOT re-open.
5. Opening settings from sidebar → modal shows masked API key, pre-filled URL and model ID.
6. Editing and saving settings → values update correctly. Restart → new values persist.
7. `encrypt`/`decrypt` round-trips correctly: `decrypt(encrypt('test-key'))` returns `'test-key'`.
8. Missing `.secret` file → encryption functions throw clear error → wizard shows recovery message.

## Out of Scope

- Multiple provider configurations (only one active provider at a time).
- Provider switching without re-entering the API key.
- OAuth-based provider authentication.
- Key rotation or expiry management.
