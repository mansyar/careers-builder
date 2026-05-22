# Implementation Plan: Streaming Chat Endpoint

**Track ID:** `streaming-chat_20260522`
**Dependencies:** Track 2.1 (AI Provider Configuration — `ai`, `@ai-sdk/openai` already installed)

---

## Phase 1 — Chat API Endpoint

Goal: Build the decoupled chat handler and `POST /api/chat` server route that loads provider settings from DB and streams LLM responses.

- [ ] Task 0.0: Install new dependency
    - [ ] Run `pnpm add @ai-sdk/react` (provides `useChat` hook for ChatPanel in Phase 2)

- [ ] Task 1.1: Write tests for chat handler (Red phase)
    - [ ] Create `src/lib/server/chat.spec.ts`
    - [ ] Write test: `handleChatRequest` with valid provider settings returns a streaming Response
    - [ ] Write test: `handleChatRequest` with no API key returns 400 with `PROVIDER_NOT_CONFIGURED`
    - [ ] Write test: `handleChatRequest` when LLM provider is unreachable returns 502 with `PROVIDER_UNAVAILABLE`
    - [ ] Write test: handler loads settings from DB (mock `loadSettings` with injected `db`)
    - [ ] Write test: handler calls `streamText` with correct model, system prompt, and `convertToModelMessages()`
    - [ ] Run tests and confirm they fail (no implementation yet)

- [ ] Task 1.2: Implement chat handler (`src/lib/server/chat.ts`) + server route (`src/routes/api/chat.ts`)
    - [ ] Create `src/lib/server/chat.ts` with exported `handleChatRequest(messages, db?)` function
    - [ ] Import `loadSettings` from `./provider-settings` to get provider config (accepts injected `db` for testability)
    - [ ] If no API key configured, return `Response.json({ error, code }, { status: 400 })`
    - [ ] Construct OpenAI client: `createOpenAI({ apiKey, baseURL: baseUrl })` then use `openai(modelId)` as the model
    - [ ] Call `streamText({ model: openai(modelId), messages: convertToModelMessages(messages), system })` with the executive resume writer system prompt
    - [ ] Return streaming Response via `createUIMessageStreamResponse()` (AI SDK v6 API)
    - [ ] Catch LLM failures and return 502 with `PROVIDER_UNAVAILABLE`
    - [ ] Run tests and confirm they pass
    - [ ] Create `src/routes/api/chat.ts` — thin TanStack Start server route wrapping `handleChatRequest` with dynamic imports (following `cv.ts` / `provider-settings/index.ts` pattern)
    - [ ] Verify the route file exports a valid `Route` with `server.handlers.POST`

- [ ] Task 1.3: Conductor — User Manual Verification 'Chat API Endpoint' (Protocol in workflow.md)

---

## Phase 2 — Chat UI Component & CV Builder Integration

Goal: Build the ChatPanel component using `useChat` and integrate it into the `/cv-builder` route.

- [ ] Task 2.1: Write tests for ChatPanel component (Red phase)
    - [ ] Create `src/components/ChatPanel.spec.tsx` following project convention
    - [ ] Write test: renders welcome message when no messages exist
    - [ ] Write test: renders a list of messages (AI left-aligned, user right-aligned)
    - [ ] Write test: input field is disabled while AI is streaming
    - [ ] Write test: pressing Enter sends a message
    - [ ] Write test: error state shows "Connection lost" banner with Retry button
    - [ ] Write test: missing provider shows placeholder with link to settings
    - [ ] Write test: "Done — extract this section" button renders on AI messages (placeholder for Track 2.3)
    - [ ] Run tests and confirm they fail

- [ ] Task 2.2: Implement ChatPanel component (`src/components/ChatPanel.tsx`)
    - [ ] Implement chat message list with scrollable container
    - [ ] Implement streaming cursor animation on AI messages
    - [ ] Implement input field with send button (Enter to send, disabled while streaming)
    - [ ] Implement auto-scroll to latest message
    - [ ] Implement empty state with AI welcome message
    - [ ] Implement error state with "Connection lost" banner and Retry button
    - [ ] Implement missing provider placeholder with link to settings
    - [ ] Implement "Done — extract this section" placeholder button on AI messages
    - [ ] Run tests and confirm they pass

- [ ] Task 2.3: Write tests for CV Builder integration (Red phase)
    - [ ] Create new test file or extend `src/routes/__tests__/cv-builder.spec.tsx`
    - [ ] Add `vi.mock('@ai-sdk/react', ...)` to mock `useChat` hook (return `{ messages, input, handleInputChange, handleSubmit, isLoading, error, reload }`)
    - [ ] Write test: `/cv-builder` renders ChatPanel above the manual form
    - [ ] Write test: ChatPanel initializes with AI welcome message
    - [ ] Write test: manual form sections (Contact, Experience, etc.) still render correctly with ChatPanel present
    - [ ] Ensure existing 24 cv-builder tests still pass with the new mock
    - [ ] Run tests and confirm they fail (new tests fail, existing pass)

- [ ] Task 2.4: Integrate ChatPanel into `/cv-builder` route
    - [ ] Modify `src/routes/_app/cv-builder.tsx` to import and render `<ChatPanel />` above the existing form
    - [ ] Use a responsive split layout (flex/grid): ChatPanel on top for narrow viewports, side-by-side on wider screens
    - [ ] Keep the existing save/offline/sections functionality identical — no refactoring of existing code
    - [ ] Run tests and confirm they pass (both new integration tests and all 24 existing cv-builder tests)

- [ ] Task 2.4a: Manual testing of streaming flow
    - [ ] Start dev server with `pnpm dev`
    - [ ] Navigate to `/cv-builder` and verify ChatPanel renders
    - [ ] Type a message and verify the streaming response appears character-by-character
    - [ ] Verify error state shows connection banner when AI provider is unreachable
    - [ ] Verify the manual form saves and edits independently of the chat
    - [ ] (Note: Full E2E streaming verification requires a configured AI provider)

- [ ] Task 2.5: Conductor — User Manual Verification 'Chat UI Component & CV Builder Integration' (Protocol in workflow.md)

---

## Phase 3 — Verify Coverage, Finalize & Archive

- [ ] Task 3.1: Run full test suite and check coverage
    - [ ] Execute `pnpm test -- --coverage`
    - [ ] Verify all tests pass
    - [ ] Verify coverage ≥ 80% (update coverage exclusions in `vitest.config.ts` if needed)
    - [ ] Fix any failures

- [ ] Task 3.2: Document deviations in `tech-stack.md`
    - [ ] Note: Chat system prompt details and any deviations from spec
    - [ ] Note: Any architecture patterns introduced (e.g., server-side provider loading in chat route)

- [ ] Task 3.3: Archive track
    - [ ] Update `conductor/tracks.md`: mark track as complete with commit SHA
    - [ ] Update `metadata.json` status to "completed"
    - [ ] Commit plan update with message `conductor(plan): Mark Track 2.2 as complete`

- [ ] Task 3.4: Conductor — User Manual Verification 'Verify Coverage & Finalize' (Protocol in workflow.md)
