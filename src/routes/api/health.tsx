import { createFileRoute } from '@tanstack/react-router'
import { getHealthStatus } from '../../lib/server/health'

/**
 * Health check route at /api/health.
 * Returns JSON with status for Docker container health checks.
 */
export const Route = createFileRoute('/api/health')({
  loader: () => {
    return getHealthStatus()
  },
  component: HealthRoute,
})

function HealthRoute() {
  const data = Route.useLoaderData()
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
