# Implementation Plan: Streaming Chat Endpoint

**Track ID:** `streaming-chat_20260522`
**Dependencies:** Track 2.1 (AI Provider Configuration — `ai`, `@ai-sdk/openai` already installed)

---

## Phase 1 — Chat API Endpoint [checkpoint: 4a7647a]

Goal: Build the decoupled chat handler and `POST /api/chat` server route that loads provider settings from DB and streams LLM responses.

- [x] Task 0.0: Install new dependency [1901fe6]
    - [x] Run `pnpm add @ai-sdk/react` (provides `useChat` hook for ChatPanel in Phase 2)

- [x] Task 1.1: Write tests for chat handler (Red phase)
    - [x] Create `src/lib/server/chat.spec.ts`
    - [x] Write test: `handleChatRequest` with valid provider settings returns a streaming Response
    - [x] Write test: `handleChatRequest` with no API key returns 400 with `PROVIDER_NOT_CONFIGURED`
    - [x] Write test: `handleChatRequest` when LLM provider is unreachable returns 502 with `PROVIDER_UNAVAILABLE`
    - [x] Write test: handler loads settings from DB (mock `loadSettings` with injected `db`)
    - [x] Write test: handler calls `streamText` with correct model, system prompt, and `convertToModelMessages()`
    - [x] Run tests and confirm they fail (no implementation yet)
    - [ ] Create `src/lib/server/chat.spec.ts`
    - [ ] Write test: `handleChatRequest` with valid provider settings returns a streaming Response
    - [ ] Write test: `handleChatRequest` with no API key returns 400 with `PROVIDER_NOT_CONFIGURED`
    - [ ] Write test: `handleChatRequest` when LLM provider is unreachable returns 502 with `PROVIDER_UNAVAILABLE`
    - [ ] Write test: handler loads settings from DB (mock `loadSettings` with injected `db`)
    - [ ] Write test: handler calls `streamText` with correct model, system prompt, and `convertToModelMessages()`
    - [ ] Run tests and confirm they fail (no implementation yet)

- [x] Task 1.2: Implement chat handler (`src/lib/server/chat.ts`) + server route (`src/routes/api/chat.ts`) [faa77f0]
    - [x] Create `src/lib/server/chat.ts` with exported `handleChatRequest(messages, db?)` function
    - [x] Import `loadSettings` from `./provider-settings` to get provider config (accepts injected `db` for testability)
    - [x] If no API key configured, return `Response.json({ error, code }, { status: 400 })`
    - [x] Construct OpenAI client: `createOpenAI({ apiKey, baseURL: baseUrl })` then use `openai(modelId)` as the model
    - [x] Call `streamText({ model: openai(modelId), messages: convertToModelMessages(messages), system })` with the executive resume writer system prompt
    - [x] Return streaming Response via `result.toUIMessageStreamResponse()` (AI SDK v6 API)
    - [x] Catch LLM failures and return 502 with `PROVIDER_UNAVAILABLE`
    - [x] Run tests and confirm they pass
    - [x] Create `src/routes/api/chat.ts` — thin TanStack Start server route wrapping `handleChatRequest` with dynamic imports (following `cv.ts` / `provider-settings/index.ts` pattern)
    - [x] Verify the route file exports a valid `Route` with `server.handlers.POST`

- [x] Task 1.3: Conductor — User Manual Verification 'Chat API Endpoint' (Protocol in workflow.md)

---

## Phase 2 — Chat UI Component & CV Builder Integration [checkpoint: 3d99065]

Goal: Build the ChatPanel component using `useChat` and integrate it into the `/cv-builder` route.

- [x] Task 2.1: Write tests for ChatPanel component (Red phase)
    - [x] Create `src/components/ChatPanel.spec.tsx` following project convention
    - [x] Write test: renders welcome message when no messages exist
    - [x] Write test: renders a list of messages (AI left-aligned, user right-aligned)
    - [x] Write test: input field is disabled while AI is streaming
    - [x] Write test: pressing Enter sends a message
    - [x] Write test: error state shows "Connection lost" banner with Retry button
    - [x] Write test: missing provider shows placeholder with link to settings
    - [x] Write test: "Done — extract this section" button renders on AI messages (placeholder for Track 2.3)
    - [x] Run tests and confirm they fail
- [x] Task 2.2: Implement ChatPanel component (`src/components/ChatPanel.tsx`) [09bdeb1]
    - [x] Implement chat message list with scrollable container
    - [x] Implement streaming cursor animation on AI messages
    - [x] Implement input field with send button (Enter to send, disabled while streaming)
    - [x] Implement auto-scroll to latest message
    - [x] Implement empty state with AI welcome message
    - [x] Implement error state with "Connection lost" banner and Retry button
    - [x] Implement missing provider placeholder with link to settings
    - [x] Implement "Done — extract this section" placeholder button on AI messages
    - [x] Run tests and confirm they pass

- [x] Task 2.3: Write tests for CV Builder integration (Red phase)
    - [x] Extend `src/routes/__tests__/cv-builder.spec.tsx` with `@ai-sdk/react` mock
    - [x] Add `vi.mock('@ai-sdk/react', ...)` to mock `useChat` hook
    - [x] Write test: `/cv-builder` renders ChatPanel above the manual form
    - [x] Write test: ChatPanel initializes with AI welcome message
    - [x] Write test: manual form sections still render correctly with ChatPanel present
    - [x] Ensure existing 25 cv-builder tests still pass with the new mock
    - [x] Run tests and confirm they fail (new tests fail, existing pass)
- [x] Task 2.4: Integrate ChatPanel into `/cv-builder` route [ff5529b]
    - [x] Modify `src/routes/_app/cv-builder.tsx` to import and render `<ChatPanel />` above the existing form
    - [x] Use a responsive split layout (flex/grid): ChatPanel on top for narrow viewports, side-by-side on wider screens
    - [x] Keep the existing save/offline/sections functionality identical — no refactoring of existing code
    - [x] Run tests and confirm they pass (both new integration tests and all 25 existing cv-builder tests)

- [x] Task 2.4a: Manual testing of streaming flow
    - [x] Start dev server with `pnpm dev`
    - [x] Navigate to `/cv-builder` and verify ChatPanel renders
    - [x] Type a message and verify the streaming response appears character-by-character
    - [x] Verify error state shows connection banner when AI provider is unreachable
    - [x] Verify the manual form saves and edits independently of the chat
    - [x] (Note: Full E2E streaming verification requires a configured AI provider)

- [x] Task 2.5: Conductor — User Manual Verification 'Chat UI Component & CV Builder Integration' (Protocol in workflow.md)

---

## Phase 3 — Verify Coverage, Finalize & Archive

- [x] Task 3.1: Run full test suite and check coverage
    - [x] Execute `pnpm test -- --coverage`
    - [x] Verify all tests pass
    - [x] Verify coverage ≥ 80% (update coverage exclusions in `vitest.config.ts` if needed)
    - [x] Fix any failures

- [x] Task 3.2: Document deviations in `tech-stack.md`
    - [x] Note: Chat system prompt details and any deviations from spec
    - [x] Note: Any architecture patterns introduced (e.g., server-side provider loading in chat route)

- [ ] Task 3.3: Conductor — User Manual Verification 'Verify Coverage & Finalize' (Protocol in workflow.md)
