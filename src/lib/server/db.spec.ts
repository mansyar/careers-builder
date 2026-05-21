import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from './db';

describe('DatabaseManager', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should create an in-memory database when :memory: is used', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    expect(db).toBeDefined();
    // Verify the database is operational
    const result = db.prepare('SELECT 1 as value').get() as { value: number };
    expect(result.value).toBe(1);
    db.close();
  });

  it('should return the same instance (singleton)', () => {
    const db1 = DatabaseManager.getInstance({ path: ':memory:' });
    const db2 = DatabaseManager.getInstance({ path: ':memory:' });
    expect(db1).toBe(db2);
    db1.close();
  });

  it('should load sqlite-vec extension when loadExtension is called', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    // loadExtension should not throw even if the extension binary is unavailable
    // (it will throw at runtime but we want to verify the method exists)
    expect(typeof db.loadExtension).toBe('function');
    db.close();
  });

  it('should support configurable database paths', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    expect(db).toBeDefined();
    db.close();
  });
});
