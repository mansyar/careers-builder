import { describe, it, expect } from 'vitest';
import { deepMerge } from './deep-merge';

describe('deepMerge', () => {
  it('should merge nested objects (existing keys preserved, new keys added)', () => {
    const target = { contact: { name: 'John', email: 'john@test.com' } };
    const source = { contact: { name: 'Jane' }, experience: [{ company: 'Acme' }] };
    const result = deepMerge(target, source);
    expect(result).toEqual({
      contact: { name: 'Jane', email: 'john@test.com' },
      experience: [{ company: 'Acme' }],
    });
  });

  it('should replace (not merge) arrays in source', () => {
    const target = { skills: ['a', 'b'] };
    const source = { skills: ['c', 'd'] };
    const result = deepMerge(target, source);
    expect(result.skills).toEqual(['c', 'd']);
  });

  it('should not throw on null/undefined patch values', () => {
    const target = { name: 'John' };
    expect(() => deepMerge(target, { name: null })).not.toThrow();
    expect(() => deepMerge(target, { name: undefined })).not.toThrow();
  });

  it('should replace primitive values in source over target', () => {
    const target = { name: 'John', age: 30 };
    const source = { name: 'Jane' };
    const result = deepMerge(target, source);
    expect(result).toEqual({ name: 'Jane', age: 30 });
  });

  it('should handle empty source gracefully', () => {
    const target = { name: 'John' };
    const result = deepMerge(target, {});
    expect(result).toEqual({ name: 'John' });
  });

  it('should handle null target gracefully', () => {
    const source = { name: 'John' };
    const result = deepMerge(null, source);
    expect(result).toEqual({ name: 'John' });
  });

  it('should handle undefined target gracefully', () => {
    const source = { name: 'John' };
    const result = deepMerge(undefined, source);
    expect(result).toEqual({ name: 'John' });
  });

  it('should deeply merge multiple levels of nesting', () => {
    const target = { a: { b: { c: 1, d: 2 } } };
    const source = { a: { b: { c: 10 } } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { b: { c: 10, d: 2 } } });
  });
});
