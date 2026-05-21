import { createFileRoute } from '@tanstack/react-router';
import { DatabaseManager } from '../../lib/server/db';
import { runStructuralMigrations } from '../../lib/server/migrations';
import { createCvProfile } from '../../lib/server/cv-profiles';

/**
 * Server route at POST /api/cv.
 * Creates a new CV profile with a first empty version.
 */
export const Route = createFileRoute('/api/cv')({
  server: {
    handlers: {
      POST: async () => {
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
