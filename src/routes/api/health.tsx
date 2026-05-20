import { createFileRoute } from '@tanstack/react-router'

/**
 * Health check route at GET /api/health.
 *
 * The TanStack Start docs describe a `server.handlers` pattern for pure API
 * routes (.ts files with server: { handlers: { GET: ... } }). However, the
 * `server` property is not yet defined in the `@tanstack/router-core`
 * route options interface (v1.171.4). Without the type-level support, the
 * handler code gets tree-shaken from the SSR bundle, returning HTTP 500.
 *
 * This .tsx workaround uses a component-based route with a loader, which
 * IS properly bundled. It renders JSON inside a `<pre>` tag and returns
 * HTTP 200 — sufficient for Docker HEALTHCHECK (which only checks status).
 *
 * Upgrade path: When @tanstack/router-core adds the `server` property to
 * FilebaseRouteOptionsInterface, switch to:
 *
 *   export const Route = createFileRoute('/api/health')({
 *     server: { handlers: { GET: async () => Response.json({ status: 'ok' }) } },
 *   })
 */
export const Route = createFileRoute('/api/health')({
  loader: () => {
    return { status: 'ok' }
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
