import { createFileRoute } from '@tanstack/react-router';
import { validateSettings } from '../../../lib/server/provider-settings';

/**
 * Server route at POST /api/provider-settings/validate.
 * Tests provider connection by making a minimal LLM call.
 * Accepts JSON body: { apiKey, baseUrl, modelId }
 */
export const Route = createFileRoute('/api/provider-settings/validate')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
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
