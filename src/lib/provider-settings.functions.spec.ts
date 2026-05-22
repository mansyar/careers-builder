/**
 * @vitest-environment node
 *
 * Tests for provider-settings.functions.ts server function wrappers.
 * These are createServerFn factories that build the RPC endpoints.
 * Importing the module triggers the factory calls.
 */
import { describe, it, expect } from 'vitest';

describe('provider-settings.functions module', () => {
  it('exports server function wrappers with correct shape', async () => {
    const mod = await import('./provider-settings.functions');
    expect(typeof mod.getProviderSettings).toBe('function');
    expect(typeof mod.saveProviderSettings).toBe('function');
    expect(typeof mod.validateProviderSettings).toBe('function');
    // ProviderConfig is a type-only export, not available at runtime
    expect((mod as Record<string, unknown>).ProviderConfig).toBeUndefined();
  });
});
