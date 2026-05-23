import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';

const WELCOME_MESSAGE =
  "Welcome! I'll be your executive resume writer. Let's start building your CV. First, what's your full name?";

/**
 * Extract plain text content from a UIMessage's parts array.
 * Concatenates all text-type parts together.
 */
function getMessageText(msg: { parts: Array<{ type: string; text?: string }> }): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && p.text !== undefined)
    .map((p) => p.text)
    .join('');
}

/**
 * ChatPanel — Conversational AI chat interface for the CV Builder.
 *
 * Uses the useChat hook from @ai-sdk/react to manage messages and streaming.
 * Integrates with POST /api/chat for the AI provider connection.
 *
 * @param onOpenSettings - Optional callback to open the provider settings modal.
 */
export function ChatPanel({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isStreaming = status === 'submitted' || status === 'streaming';
  const hasProviderError = error?.message?.includes('AI provider not configured') ?? false;

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleRetry = () => {
    clearError();
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (lastUserMessage) {
      const text = getMessageText(lastUserMessage);
      sendMessage({ text });
    }
  };

  // If provider is not configured, show a placeholder
  if (hasProviderError) {
    return (
      <div className="rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] p-6 text-center">
        <p className="mb-2 text-sm text-[var(--sea-ink-soft)]">
          Configure your AI provider in settings to start the guided interview.
        </p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full bg-[var(--sea-ink)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Open Settings
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--chip-line)] bg-white">
      {/* Chat Header */}
      <div className="border-b border-[var(--chip-line)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--sea-ink)]">AI Resume Writer</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" role="log">
        {messages.length === 0 ? (
          /* Empty State: Welcome message */
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sea-ink)] text-xs font-bold text-white">
              AI
            </div>
            <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-3">
              <p className="text-sm leading-relaxed text-gray-800">{WELCOME_MESSAGE}</p>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  msg.role === 'user' ? 'bg-blue-500' : 'bg-[var(--sea-ink)]'
                }`}
              >
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm leading-relaxed">
                  {getMessageText(msg)}
                  {msg.role === 'assistant' && isStreaming && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-gray-500" />
                  )}
                </p>
                {/* Section extraction placeholder button (AI messages only) */}
                {msg.role === 'assistant' && !isStreaming && (
                  <button
                    type="button"
                    className="mt-2 rounded-md bg-[var(--sea-ink)] px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    onClick={() => {
                      console.log('Extract section:', getMessageText(msg));
                    }}
                  >
                    Done — extract this section
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator while waiting for response */}
        {messages.length > 0 && isStreaming && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-xs text-[var(--sea-ink-soft)]">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--sea-ink)] border-t-transparent" />
              Connecting to AI provider...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && !hasProviderError && (
        <div className="mx-4 mb-2 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">
            Connection to the AI provider was lost. Your chat progress is saved. You can retry or
            come back later.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="ml-auto rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-[var(--chip-line)] px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm outline-none transition-colors focus:border-[var(--sea-ink)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Chat message input"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isStreaming || !input.trim()}
            className="rounded-full bg-[var(--sea-ink)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
