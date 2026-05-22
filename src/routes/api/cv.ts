import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at POST /api/cv.
 * Creates a new CV profile with a first empty version.
 *
 * Uses dynamic import from .server.ts to avoid bundling
 * better-sqlite3 into the client bundle.
 */
export const Route = createFileRoute('/api/cv')({
  server: {
    handlers: {
      POST: async () => {
        const { DatabaseManager } = await import('../../lib/server/db');
        const { runStructuralMigrations } = await import('../../lib/server/migrations');
        const { createCvProfile } = await import('../../lib/server/cv-profiles');
        try {
          const db = DatabaseManager.getInstance();
          runStructuralMigrations(db);
          const result = createCvProfile(db);
          return Response.json(result, { status: 201 });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal server error';
          return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
        }
      },
    },
  },
});
