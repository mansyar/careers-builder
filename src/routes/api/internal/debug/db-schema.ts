import { createFileRoute } from '@tanstack/react-router';
import { DatabaseManager } from '../../../../lib/server/db';
import { getDbSchema } from '../../../../lib/server/db-schema';
import type Database from 'better-sqlite3';

/**
 * Debug DB schema handler — extracted for direct testability.
 * Returns a JSON response listing all database tables and their columns.
 */
export function handleDbSchema(db?: Database.Database): Response {
  const database = db ?? DatabaseManager.getInstance();
  const schema = getDbSchema(database);
  return Response.json(schema);
}

/**
 * Internal debug route at GET /api/internal/debug/db-schema.
 * Returns the list of all database tables and their columns.
 * Used by automated tests to verify database tables exist after boot.
 */
export const Route = createFileRoute('/api/internal/debug/db-schema')({
  server: {
    handlers: {
      GET: async () => {
        return handleDbSchema();
      },
    },
  },
});
