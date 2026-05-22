import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at POST /api/chat.
 * Accepts a JSON body with `messages` (UIMessage[]) and returns a streaming
 * chat response from the configured AI provider.
 *
 * Uses dynamic import inside the handler to avoid bundling
 * better-sqlite3 and other Node.js modules into the client.
 */
export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { handleChatRequest } = await import('../../lib/server/chat');
        try {
          const body = await request.json();
          const messages = body.messages ?? [];
          return handleChatRequest(messages);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal server error';
          return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
        }
      },
    },
  },
});
