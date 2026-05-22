import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at GET /api/cv/:cvProfileId/versions.
 * Returns all versions for a CV profile.
 */
export const Route = createFileRoute('/api/cv/$cvProfileId/versions')({
  server: {
    handlers: {
      GET: async ({ params: { cvProfileId } }) => {
        const { DatabaseManager } = await import('../../../../lib/server/db');
        const { runStructuralMigrations } = await import('../../../../lib/server/migrations');
        const { listVersions } = await import('../../../../lib/server/cv-profiles');
        try {
          const db = DatabaseManager.getInstance();
          runStructuralMigrations(db);
          const result = listVersions(db, Number(cvProfileId));
          return Response.json(result, { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal server error';
          return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
        }
      },
    },
  },
});
