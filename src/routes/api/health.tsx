import { createFileRoute } from '@tanstack/react-router'

/**
 * Health check route at GET /api/health.
 *
 * NOTE: The ideal TanStack Start pattern for this is a `.ts` server route with
 * `server: { handlers: { GET: ... } }`. However, in TanStack Start v1.168.x,
 * the handler code in `.ts` server routes is tree-shaken from the SSR bundle,
 * causing the endpoint to return HTTP 500 instead of 200.
 *
 * This `.tsx` workaround uses a component-based route with a loader, which
 * IS properly bundled. It renders JSON inside a `<pre>` tag and returns
 * HTTP 200 — sufficient for Docker `HEALTHCHECK` which only checks the
 * HTTP status code.
 *
 * Upgrade path: When a future version of TanStack Start properly bundles
 * server route handlers, switch to:
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
