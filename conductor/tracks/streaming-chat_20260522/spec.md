# Track 2.2 — Streaming Chat Endpoint

## Overview

Build the conversational AI chat interface for the CV Builder. Users interact with an AI executive resume writer via a streaming chat panel integrated into the `/cv-builder` route. The chat uses `POST /api/chat` server function powered by `streamText()` from the AI SDK, with the user's configured LLM provider loaded server-side from the database. Messages are managed in-memory via the `useChat` hook per browser session.

**Dependencies:** Track 2.1 (AI Provider Configuration) — the chat relies on the user's saved LLM provider settings (API key, base URL, model ID) to make streaming calls.

**New dependency required:** `@ai-sdk/react` — provides the `useChat` hook for the ChatPanel component (not yet installed).

---

## Functional Requirements

### FR1: Chat API Endpoint (`POST /api/chat`)

Following the project's decoupled handler pattern (as used by `health.ts` / `provider-settings.ts`), the business logic is extracted into a testable module, with a thin server route wrapping it.

#### Handler (`src/lib/server/chat.ts`)
- **Signature:** `handleChatRequest(messages: UIMessage[], db?: Database.Database)` — accepts optional DB injection for testability
- **Behavior:**
  1. Loads the user's AI provider settings from the database (via `loadSettings` in `src/lib/server/provider-settings.ts`)
  2. If no API key is configured, returns a 400 Response with `{ error: "AI provider not configured", code: "PROVIDER_NOT_CONFIGURED" }`
  3. Constructs an OpenAI-compatible client via `createOpenAI({ apiKey, baseURL: baseUrl })` from `@ai-sdk/openai`
  4. Calls `streamText({ model: openai(modelId), messages: convertToModelMessages(messages), system })` where:
     - `system`: "You are an executive resume writer helping a professional build their CV. Guide the user section by section — start with Contact, then Executive Summary, Experience, Education, Skills, and Projects. Ask one question at a time. Be encouraging and professional. After each section, suggest when to click 'Done — extract this section'."
     - `messages`: converted from `UIMessage[]` via `convertToModelMessages()` (AI SDK v6 API)
  5. Returns a streaming Response via `createUIMessageStreamResponse()` (AI SDK v6 API, replaces legacy `toUIMessageStreamResponse`)
- **Error handling:**
  - If provider settings are missing or invalid, return HTTP 400 Response with `PROVIDER_NOT_CONFIGURED`
  - If the LLM call fails (network, auth), return HTTP 502 Response with `PROVIDER_UNAVAILABLE`
  - All errors surface in the UI via the `useChat` hook's error state

#### Server Route (`src/routes/api/chat.ts`)
- Thin TanStack Start server route using `createFileRoute` with `server.handlers.POST`
- Uses dynamic `await import(...)` inside the handler to avoid bundling `better-sqlite3` into the client (following the existing pattern from `cv.ts`, `provider-settings/index.ts`)
- Delegates to `handleChatRequest` from `src/lib/server/chat.ts`

**Note on server route vs server function:** A `createFileRoute` with `server.handlers` is used instead of a `createServerFn` because the endpoint returns a streaming `Response` object (via `createUIMessageStreamResponse`), which is the standard Web API pattern for streaming. A `createServerFn` expects JSON serialization, making it unsuitable for streaming responses.

### FR2: Chat UI Component

- **Component:** `ChatPanel` in `src/components/ChatPanel.tsx`
- **AI SDK dependency:** Requires `@ai-sdk/react` (not yet installed) — provides the `useChat` hook
- **Integration:** Rendered inside `/cv-builder` above the existing manual CV editor form, matching the PRD's "adjacent form" pattern
- **Behavior:**
  - Uses `useChat` from `@ai-sdk/react` with `api: '/api/chat'`
  - Messages displayed in a scrollable container: AI messages left-aligned, user messages right-aligned
  - Streaming text appears character-by-character with a visible cursor animation
  - Input field at the bottom with send button (Enter to send)
  - Input disabled while AI is streaming
  - Auto-scroll to latest message on new content
- **Loading state:** Chat area shows a centered "Connecting to AI provider..." spinner while waiting for the first response
- **Empty state:** When no messages exist, show a welcome message from the AI: "Welcome! I'll be your executive resume writer. Let's start building your CV. First, what's your full name?"
- **Error state:** If `useChat` reports an error, show an inline banner above the chat: "Connection to the AI provider was lost." with a "Retry" button that calls `reload()` from the `useChat` hook
- **Section extraction trigger (placeholder):** A button under each AI message: "Done — extract this section". For now it's a placeholder that logs to console. Full extraction is implemented in Track 2.3.

### FR3: CV Builder Integration

- `/cv-builder` route renders a split layout:
  - **Left/top panel:** Chat panel (the conversational interface)
  - **Right/bottom panel:** Manual CV editor form (existing functionality)
- On first visit with no messages:
  - The chat panel shows the welcome message
  - The CV form shows the existing data (or empty state if no CV profile exists)
- If provider settings are missing:
  - The chat panel shows a placeholder: "Configure your AI provider in settings to start the guided interview." with a link to open settings
  - The manual form remains fully functional

---

## Non-Functional Requirements

- **Performance:** Chat response streaming must begin within 2 seconds of user input (excluding network latency), matching PRD §5.1
- **Security:** API key never leaves the server — loaded from DB inside the server function handler
- **Usability:** The chat panel must be keyboard-navigable (Enter to send, accessible input)
- **Accessibility:** Streaming output must be announced to screen readers as it updates (aria-live region)

---

## Acceptance Criteria

1. `POST /api/chat` returns a streaming response when valid provider settings are configured
2. `POST /api/chat` returns 400 when no API key is configured
3. `POST /api/chat` returns 502 when the LLM provider is unreachable
4. Chat UI renders a scrollable message list with left-aligned AI and right-aligned user messages
5. Typing a message and pressing Enter sends it to the API and displays the streaming response
6. Input is disabled while streaming is in progress
7. Error state shows inline "Connection lost" banner with a Retry button
8. Empty state shows the AI welcome message on first load
9. Missing provider settings shows a placeholder with link to settings
10. CV Builder shows chat panel integrated above the manual form

---

## Out of Scope

- Structured section extraction (Track 2.3 — `POST /api/chat/extract`)
- CV version history view in chat
- Multi-turn memory across page refreshes (in-memory only)
- Template preview rendering in chat
- Custom system prompt configuration
- Voice input or audio responses
