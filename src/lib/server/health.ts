/**
 * Health check handler — returns a simple status response.
 * Used by the /api/health route and Docker health check.
 */
export function getHealthStatus(): { status: string } {
  return { status: 'ok' };
}
