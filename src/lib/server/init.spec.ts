import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseManager } from './db';

describe('database initialization integration', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('DatabaseManager should create an operational in-memory database', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const row = db.prepare('SELECT 1 as v').get() as { v: number };
    expect(row.v).toBe(1);
    db.close();
  });

  it('should be able to create and query tables after initialization', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    db.exec('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)');
    db.prepare('INSERT INTO test_table (name) VALUES (?)').run('hello');
    const result = db.prepare('SELECT name FROM test_table').get() as { name: string };
    expect(result.name).toBe('hello');
    db.close();
  });

  it('should persist data within the same singleton instance', () => {
    const db1 = DatabaseManager.getInstance({ path: ':memory:' });
    db1.exec('CREATE TABLE IF NOT EXISTS shared (val INTEGER)');
    db1.prepare('INSERT INTO shared (val) VALUES (?)').run(42);
    const db2 = DatabaseManager.getInstance({ path: ':memory:' });
    const row = db2.prepare('SELECT val FROM shared').get() as { val: number };
    expect(row.val).toBe(42);
    db1.close();
  });
});

describe('initDatabase', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
    vi.restoreAllMocks();
  });

  it('should initialize database without throwing when data directory exists', async () => {
    // initDatabase calls DatabaseManager.getInstance() and runMigrations()
    // with default path - should not throw
    const { initDatabase } = await import('./init');
    expect(() => initDatabase()).not.toThrow();
  });

  it('should handle errors gracefully when database path is invalid', async () => {
    // Temporarily break DatabaseManager to simulate failure
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalGetInstance = DatabaseManager.getInstance.bind(DatabaseManager);

    // Mock getInstance to throw
    DatabaseManager.getInstance = vi.fn().mockImplementation(() => {
      throw new Error('Mock database error');
    });

    const { initDatabase } = await import('./init');
    initDatabase();

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Failed to initialize database');

    // Restore
    DatabaseManager.getInstance = originalGetInstance;
    consoleSpy.mockRestore();
  });
});
