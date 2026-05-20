import { createServerFn } from '@tanstack/react-start'
import { getHealthStatus } from '../../lib/server/health'

/**
 * Health check endpoint — returns `{ "status": "ok" }` with HTTP 200.
 * Used by the Docker container health check and system monitoring.
 */
export const healthHandler = createServerFn({ method: 'GET' })
  .handler(async () => {
    return getHealthStatus()
  })
