import { createFileRoute } from '@tanstack/react-router'
import { getHealthStatus } from '../../lib/server/health'

/**
 * Health check route at GET /api/health.
 * Renders JSON status for Docker container health checks and system monitoring.
 */
export const Route = createFileRoute('/api/health')({
  loader: () => {
    return getHealthStatus()
  },
  component: HealthRoute,
})

function HealthRoute() {
  const data = Route.useLoaderData()
  // Render JSON inside a pre tag — Docker wget --spider checks HTTP 200 only
  return (
    <pre
      style={{
        fontFamily: 'monospace',
        padding: '1rem',
        background: '#f5f5f5',
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
