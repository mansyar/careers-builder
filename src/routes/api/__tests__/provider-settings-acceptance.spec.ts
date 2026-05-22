/**
 * @vitest-environment node
 *
 * Integration tests for the provider-settings API routes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from '../../../lib/server/db';

describe('GET /api/provider-settings', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should export a Route', async () => {
    const mod = await import('../provider-settings/index');
    expect(mod).toHaveProperty('Route');
    // @ts-expect-error - server.handlers is a TanStack Start internal
    expect(mod.Route.options?.server?.handlers?.GET).toBeDefined();
  });

  it('route options are configured correctly', async () => {
    const mod = await import('../provider-settings/index');
    // @ts-expect-error - server.handlers is a TanStack Start internal
    const handler = mod.Route.options?.server?.handlers?.GET;
    expect(typeof handler).toBe('function');
  });
});

describe('POST /api/provider-settings/validate', () => {
  it('should export a Route', async () => {
    const mod = await import('../provider-settings/validate');
    expect(mod).toHaveProperty('Route');
    // @ts-expect-error - server.handlers is a TanStack Start internal
    expect(mod.Route.options?.server?.handlers?.POST).toBeDefined();
  });

  it('route options are configured correctly', async () => {
    const mod = await import('../provider-settings/validate');
    // @ts-expect-error - server.handlers is a TanStack Start internal
    const handler = mod.Route.options?.server?.handlers?.POST;
    expect(typeof handler).toBe('function');
  });
});
