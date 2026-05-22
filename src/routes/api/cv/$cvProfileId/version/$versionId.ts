import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at GET /api/cv/:cvProfileId/version/:versionId.
 * Returns a single CV version with full_cv_json.
 *
 * Server route at PUT /api/cv/:cvProfileId/version/:versionId.
 * Updates a CV version with deep merge + copy-on-write.
 */
export const Route = createFileRoute('/api/cv/$cvProfileId/version/$versionId')({
  server: {
    handlers: {
      GET: async ({ params: { cvProfileId, versionId } }) => {
        const { DatabaseManager } = await import('../../../../../lib/server/db');
        const { runStructuralMigrations } = await import('../../../../../lib/server/migrations');
        const { getVersion } = await import('../../../../../lib/server/cv-profiles');
        try {
          const db = DatabaseManager.getInstance();
          runStructuralMigrations(db);
          const result = getVersion(db, Number(cvProfileId), Number(versionId));
          if (!result) {
            return Response.json(
              { error: 'CV version not found', code: 'NOT_FOUND' },
              { status: 404 },
            );
          }
          return Response.json(result, { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal server error';
          return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
        }
      },
      PUT: async ({ params: { cvProfileId, versionId }, request }) => {
        const { DatabaseManager } = await import('../../../../../lib/server/db');
        const { runStructuralMigrations } = await import('../../../../../lib/server/migrations');
        const { updateVersion } = await import('../../../../../lib/server/cv-profiles');
        try {
          const body = (await request.json()) as {
            patch?: Record<string, unknown>;
            versionLabel?: string;
          };
          if (!body.patch) {
            return Response.json(
              { error: 'Missing required field: patch', code: 'BAD_REQUEST' },
              { status: 400 },
            );
          }
          const db = DatabaseManager.getInstance();
          runStructuralMigrations(db);
          const result = updateVersion(
            db,
            Number(cvProfileId),
            Number(versionId),
            body.patch,
            body.versionLabel,
          );
          return Response.json(result, { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal server error';
          if (message === 'CV profile not found' || message === 'CV version not found') {
            return Response.json({ error: message, code: 'NOT_FOUND' }, { status: 404 });
          }
          if (message === 'Version belongs to another profile') {
            return Response.json({ error: message, code: 'CONFLICT' }, { status: 409 });
          }
          return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
        }
      },
    },
  },
});
