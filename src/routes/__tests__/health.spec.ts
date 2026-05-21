/**
 * Tests for the API health endpoint route.
 * The route handler is extracted and tested in isolation.
 */
import { describe, it, expect } from 'vitest';
import { getHealthStatus } from '../../lib/server/health';

describe('GET /api/health', () => {
  it('should return status ok', async () => {
    const result = getHealthStatus();
    expect(result).toEqual({ status: 'ok' });
  });
});
