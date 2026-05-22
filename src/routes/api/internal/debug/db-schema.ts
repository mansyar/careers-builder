import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at GET /api/internal/debug/db-schema.
 * Returns the list of all database tables and their columns.
 */
export const Route = createFileRoute('/api/internal/debug/db-schema')({
  server: {
    handlers: {
      GET: async () => {
        const { DatabaseManager } = await import('../../../../lib/server/db');
        const { getDbSchema } = await import('../../../../lib/server/db-schema');
        try {
          const db = DatabaseManager.getInstance();
          const schema = getDbSchema(db);
          return Response.json(schema);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal server error';
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
