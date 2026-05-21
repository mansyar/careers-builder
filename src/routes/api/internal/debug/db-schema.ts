import { createFileRoute } from '@tanstack/react-router';
import { DatabaseManager } from '../../../../lib/server/db';
import { getDbSchema } from '../../../../lib/server/db-schema';

/**
 * Internal debug route at GET /api/internal/debug/db-schema.
 * Returns the list of all database tables and their columns.
 * Used by automated tests to verify database tables exist after boot.
 */
export const Route = createFileRoute('/api/internal/debug/db-schema')({
  server: {
    handlers: {
      GET: async () => {
        const db = DatabaseManager.getInstance();
        const schema = getDbSchema(db);
        return Response.json(schema);
      },
    },
  },
});
