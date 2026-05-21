import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from './db';
import { getDbSchema } from './db-schema';
import { runStructuralMigrations } from './migrations';

describe('getDbSchema', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should return a tables array', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const result = getDbSchema(db);
    expect(result).toHaveProperty('tables');
    expect(Array.isArray(result.tables)).toBe(true);
    db.close();
  });

  it('should include migrated tables after running migrations', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = getDbSchema(db);
    const tableNames = result.tables.map((t) => t.name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('cv_profiles');
    expect(tableNames).toContain('cv_profile_versions');
    expect(tableNames).toContain('job_postings');
    db.close();
  });

  it('should return column info for each table', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = getDbSchema(db);
    const usersTable = result.tables.find((t) => t.name === 'users');
    expect(usersTable).toBeDefined();
    expect(usersTable!.columns.length).toBeGreaterThan(0);

    const idColumn = usersTable!.columns.find((c) => c.name === 'id');
    expect(idColumn).toBeDefined();
    expect(idColumn!.type).toMatch(/INT/i);
    db.close();
  });
});
