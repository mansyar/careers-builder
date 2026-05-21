import { createFileRoute } from '@tanstack/react-router';

/**
 * Health check handler — extracted for direct testability.
 * Returns JSON status for Docker container health checks.
 */
export function handleHealthCheck(): Response {
  return Response.json({ status: 'ok' });
}

/**
 * Server route at GET /api/health.
 */
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        return handleHealthCheck();
      },
    },
  },
});
