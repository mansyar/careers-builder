import { describe, it, expect } from 'vitest';
import { getHealthStatus } from './health';

describe('Health endpoint', () => {
  it('should return status ok', () => {
    const result = getHealthStatus();
    expect(result).toEqual({ status: 'ok' });
  });
});
