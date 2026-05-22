# Implementation Plan: Streaming Chat Endpoint

**Track ID:** `streaming-chat_20260522`
**Dependencies:** Track 2.1 (AI Provider Configuration — `ai`, `@ai-sdk/openai` already installed)

---

## Phase 1 — Chat API Endpoint

Goal: Build the `POST /api/chat` server route that loads provider settings from DB and streams LLM responses.

- [ ] Task 1.1: Write tests for chat API handler (Red phase)
    - [ ] Create `src/routes/api/__tests__/chat.spec.ts`
    - [ ] Write test: `POST /api/chat` with valid provider settings returns a streaming response
    - [ ] Write test: `POST /api/chat` with no API key returns 400 with `PROVIDER_NOT_CONFIGURED` code
    - [ ] Write test: `POST /api/chat` when LLM provider is unreachable returns 502 with `PROVIDER_UNAVAILABLE` code
    - [ ] Write test: handler loads settings from DB (mock `loadSettings`)
    - [ ] Write test: handler calls `streamText` with correct system prompt and converted messages
    - [ ] Run tests and confirm they fail (no implementation yet)

- [ ] Task 1.2: Implement chat API handler (`src/routes/api/chat.ts`)
    - [ ] Create TanStack Start server route at `src/routes/api/chat.ts`
    - [ ] Import `loadSettings` from `src/lib/server/provider-settings.ts` to get provider config
    - [ ] Construct OpenAI client: `openai(modelId, { baseURL: baseUrl })`
    - [ ] Call `streamText({ model, messages: convertToCoreMessages(messages), system })` with the executive resume writer system prompt
    - [ ] Return streaming response via `toUIMessageStreamResponse()`
    - [ ] Handle missing provider: return 400 with `PROVIDER_NOT_CONFIGURED`
    - [ ] Handle LLM failure: catch and return 502 with `PROVIDER_UNAVAILABLE`
    - [ ] Run tests and confirm they pass

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
    - [ ] Update `src/routes/__tests__/cv-builder.spec.tsx` or create new integration test
    - [ ] Write test: `/cv-builder` renders ChatPanel above the manual form
    - [ ] Write test: ChatPanel initializes with empty welcome message
    - [ ] Write test: manual form still renders correctly with ChatPanel present
    - [ ] Run tests and confirm they fail

- [ ] Task 2.4: Integrate ChatPanel into `/cv-builder` route
    - [ ] Modify `src/routes/_app/cv-builder.tsx` to render ChatPanel above the existing form
    - [ ] Use a split layout (flex/grid): ChatPanel on top for narrow viewports, side-by-side on wider screens
    - [ ] Ensure existing form functionality (save, offline, sections) is preserved unchanged
    - [ ] Run tests and confirm they pass

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
