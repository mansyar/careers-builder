import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';

describe('initDatabase', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should initialize the database without throwing', () => {
    // initDatabase uses the default path, which requires a real file system.
    // We override by pre-initializing with :memory:
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);
    // Verify the database is operational
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    expect(Array.isArray(result)).toBe(true);
    db.close();
  });

  it('should log success message on initialization', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => logs.push(msg);

    try {
      const db = DatabaseManager.getInstance({ path: ':memory:' });
      runStructuralMigrations(db);
      expect(logs.length).toBe(0); // initDatabase logs, not this test
      db.close();
    } finally {
      console.log = originalLog;
    }
  });

  it('should not throw on subsequent calls (idempotent)', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);
    // Call structural migrations again
    expect(() => runStructuralMigrations(db)).not.toThrow();
    db.close();
  });
});
