import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at GET /api/provider-settings.
 * Returns current provider settings with masked API key.
 *
 * Uses dynamic import inside the handler to avoid bundling
 * better-sqlite3 and other Node.js modules into the client.
 */
export const Route = createFileRoute('/api/provider-settings/')({
  server: {
    handlers: {
      GET: async () => {
        const { DatabaseManager } = await import('../../../lib/server/db');
        const { runStructuralMigrations } = await import('../../../lib/server/migrations');
        const { loadSettings, maskApiKey } = await import('../../../lib/server/provider-settings');
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
