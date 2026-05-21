import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';
import { createCvProfile, listVersions, getVersion } from './cv-profiles';

// Helper to set up a fresh DB with a profile
function setupProfile(db: Database.Database): number {
  runStructuralMigrations(db);
  return createCvProfile(db).id;
}

describe('createCvProfile', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should auto-create default user (id=1) if missing', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    // Verify no users exist before
    const usersBefore = db.prepare('SELECT COUNT(*) as count FROM users').get() as {
      count: number;
    };
    expect(usersBefore.count).toBe(0);

    createCvProfile(db);

    const usersAfter = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    expect(usersAfter.count).toBe(1);

    const user = db.prepare('SELECT id FROM users').get() as { id: number };
    expect(user.id).toBe(1);
    db.close();
  });

  it('should create a cv_profiles row with user_id=1', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    createCvProfile(db);

    const profile = db.prepare('SELECT id, user_id, active_version_id FROM cv_profiles').get() as {
      id: number;
      user_id: number;
      active_version_id: number | null;
    };
    expect(profile).toBeDefined();
    expect(profile.user_id).toBe(1);
    db.close();
  });

  it('should auto-create first cv_profile_versions row (version_number=1, version_label=Initial, full_cv_json={})', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    createCvProfile(db);

    const version = db
      .prepare('SELECT version_number, version_label, full_cv_json FROM cv_profile_versions')
      .get() as { version_number: number; version_label: string; full_cv_json: string };
    expect(version).toBeDefined();
    expect(version.version_number).toBe(1);
    expect(version.version_label).toBe('Initial');
    expect(JSON.parse(version.full_cv_json)).toEqual({});
    db.close();
  });

  it('should return { id, activeVersionId }', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = createCvProfile(db);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('activeVersionId');
    expect(typeof result.id).toBe('number');
    expect(typeof result.activeVersionId).toBe('number');
    expect(result.activeVersionId).toBeGreaterThan(0);
    db.close();
  });

  it('should update cv_profiles.active_version_id to point to the new version', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    createCvProfile(db);

    const version = db.prepare('SELECT id FROM cv_profile_versions').get() as { id: number };
    const profile = db.prepare('SELECT active_version_id FROM cv_profiles').get() as {
      active_version_id: number;
    };

    expect(profile.active_version_id).toBe(version.id);
    db.close();
  });

  it('should be idempotent when user 1 already exists', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    // Pre-create user 1
    db.prepare('INSERT INTO users (id) VALUES (1)').run();

    const result = createCvProfile(db);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('activeVersionId');

    const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    expect(users.count).toBe(1);
    db.close();
  });

  it('should wrap all operations in a transaction (rollback on failure)', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    // Drop cv_profile_versions to force a failure
    db.exec('DROP TABLE cv_profile_versions');

    // Re-create cv_profiles without FK for test isolation
    db.exec(
      'CREATE TABLE IF NOT EXISTS cv_profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL)',
    );

    expect(() => createCvProfile(db)).toThrow();

    // Verify no partial state: no user was created
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    expect(users.count).toBe(0);
    db.close();
  });
});

describe('listVersions', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should return versions array ordered by version_number DESC', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);

    // Insert an additional version to test ordering
    db.prepare(
      `INSERT INTO cv_profile_versions (cv_profile_id, version_number, version_label, full_cv_json)
       VALUES (?, 2, 'V2', '{"name":"test"}')`,
    ).run(profileId);

    const result = listVersions(db, profileId);
    expect(result.versions).toHaveLength(2);
    expect(result.versions[0].versionNumber).toBe(2);
    expect(result.versions[1].versionNumber).toBe(1);
    db.close();
  });

  it('should return activeVersionId from cv_profiles', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);

    const result = listVersions(db, profileId);
    expect(result).toHaveProperty('activeVersionId');
    expect(typeof result.activeVersionId).toBe('number');
    db.close();
  });

  it('should return empty versions array for non-existent profile', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = listVersions(db, 999);
    expect(result.versions).toEqual([]);
    expect(result.activeVersionId).toBeNull();
    db.close();
  });
});

describe('getVersion', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should return full version object with all fields', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);

    const versionRow = db.prepare('SELECT id FROM cv_profile_versions').get() as { id: number };

    const result = getVersion(db, profileId, versionRow.id);
    expect(result).toBeDefined();
    expect(result!.id).toBe(versionRow.id);
    expect(result!.versionNumber).toBe(1);
    expect(result!.versionLabel).toBe('Initial');
    expect(result!.createdAt).toBeDefined();
    expect(result!.full_cv_json).toEqual({});
    db.close();
  });

  it('should return null when version does not exist', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = getVersion(db, 1, 999);
    expect(result).toBeNull();
    db.close();
  });

  it('should return null when version belongs to a different profile', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);

    // Create a second profile
    const profileId2 = createCvProfile(db).id;

    // Get the version from profile 1
    const versionRow = db
      .prepare('SELECT id FROM cv_profile_versions WHERE cv_profile_id = ?')
      .get(profileId) as { id: number };

    // Try to get it via profile 2
    const result = getVersion(db, profileId2, versionRow.id);
    expect(result).toBeNull();
    db.close();
  });
});
