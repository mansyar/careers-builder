import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from './db';
import { runMigrations, runStructuralMigrations, runVectorMigrations } from './migrations';

describe('runStructuralMigrations', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should create all 4 structural tables', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('cv_profiles');
    expect(tableNames).toContain('cv_profile_versions');
    expect(tableNames).toContain('job_postings');

    db.close();
  });

  it('should be idempotent (running twice produces no error)', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);
    expect(() => runStructuralMigrations(db)).not.toThrow();
    db.close();
  });
});

describe('runVectorMigrations', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should throw if sqlite-vec extension is not loaded', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    // Without the native sqlite-vec extension, vec0 module is unavailable
    expect(() => runVectorMigrations(db)).toThrow();
    db.close();
  });
});

describe('runMigrations', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should apply structural tables when called (vector may fail if extension not loaded)', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    try {
      runMigrations(db);
    } catch {
      // Vector migration may fail — that's expected without the extension
    }

    // Structural tables should always exist
    const tableNames = (
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'vec_%' ORDER BY name",
        )
        .all() as { name: string }[]
    ).map((t) => t.name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('cv_profiles');
    expect(tableNames).toContain('cv_profile_versions');
    expect(tableNames).toContain('job_postings');

    db.close();
  });
});
