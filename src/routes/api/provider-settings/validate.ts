import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at POST /api/provider-settings/validate.
 * Tests provider connection by making a minimal LLM call.
 * Accepts JSON body: { apiKey, baseUrl, modelId }
 *
 * Uses dynamic import inside the handler to avoid bundling
 * better-sqlite3 and other Node.js modules into the client.
 */
export const Route = createFileRoute('/api/provider-settings/validate')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { validateSettings } = await import('../../../lib/server/provider-settings');
        try {
          const body = await request.json();
          const result = await validateSettings(body);
          return Response.json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Validation failed';
          return Response.json({ valid: false, error: message });
        }
      },
    },
  },
});
