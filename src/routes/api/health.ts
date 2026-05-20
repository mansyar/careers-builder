import { createFileRoute } from '@tanstack/react-router';

/**
 * Server route at GET /api/health.
 * Returns JSON status for Docker container health checks.
 */
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({ status: 'ok' });
      },
    },
  },
});
