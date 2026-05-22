import { createFileRoute } from '@tanstack/react-router';
import { DatabaseManager } from '../../../lib/server/db';
import { runStructuralMigrations } from '../../../lib/server/migrations';
import { loadSettings, maskApiKey } from '../../../lib/server/provider-settings';

/**
 * Server route at GET /api/provider-settings.
 * Returns current provider settings with masked API key.
 */
export const Route = createFileRoute('/api/provider-settings/')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = DatabaseManager.getInstance();
          runStructuralMigrations(db);
          const settings = loadSettings(db);
          return Response.json({
            apiKey: maskApiKey(settings.apiKey),
            baseUrl: settings.baseUrl,
            modelId: settings.modelId,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal server error';
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
