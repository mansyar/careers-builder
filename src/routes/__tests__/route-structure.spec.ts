/**
 * @vitest-environment node
 *
 * Structural and handler tests for API route files.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from '../../lib/server/db';
import { runStructuralMigrations } from '../../lib/server/migrations';

describe('Health route handlers', () => {
  it('handleHealthCheck should return status ok', async () => {
    const { handleHealthCheck } = await import('../api/health');
    const response = handleHealthCheck();
    const data = await response.json();
    expect(data).toEqual({ status: 'ok' });
    expect(response.status).toBe(200);
  });

  it('health route should export a Route', async () => {
    const mod = await import('../api/health');
    expect(mod).toHaveProperty('Route');
    // @ts-expect-error - server.handlers is a TanStack Start internal
    expect(mod.Route.options?.server?.handlers?.GET).toBeDefined();
  });
});

describe('DbSchema route handlers', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('handleDbSchema should return tables array', async () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const { handleDbSchema } = await import('../../lib/db-schema.server');
    const response = handleDbSchema(db);
    const data = await response.json();
    expect(data).toHaveProperty('tables');
    expect(Array.isArray(data.tables)).toBe(true);
    expect(data.tables.length).toBeGreaterThan(0);
    const tableNames = data.tables.map((t: { name: string }) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('cv_profiles');
    db.close();
  });

  it('db-schema route should export a Route', async () => {
    const mod = await import('../api/internal/debug/db-schema');
    expect(mod).toHaveProperty('Route');
    // @ts-expect-error - server.handlers is a TanStack Start internal
    expect(mod.Route.options?.server?.handlers?.GET).toBeDefined();
  });
});
