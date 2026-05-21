import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';
import { createCvProfile, listVersions, getVersion, updateVersion } from './cv-profiles';

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

describe('updateVersion', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should deep merge patch into existing full_cv_json', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);

    // Add initial data
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    // First PUT on active version creates a new version (copy-on-write)
    const result1 = updateVersion(db, profileId, profile.active_version_id, {
      contact: { name: 'John' },
    });
    expect(result1.full_cv_json).toEqual({ contact: { name: 'John' } });

    // Second PUT merges
    const result2 = updateVersion(db, profileId, result1.id, {
      contact: { email: 'john@test.com' },
    });
    expect(result2.full_cv_json).toEqual({
      contact: { name: 'John', email: 'john@test.com' },
    });
    db.close();
  });

  it('should replace (not merge) arrays in patch', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    const result1 = updateVersion(db, profileId, profile.active_version_id, {
      skills: ['a', 'b'],
    });

    const result2 = updateVersion(db, profileId, result1.id, {
      skills: ['c'],
    });

    expect(result2.full_cv_json.skills).toEqual(['c']);
    db.close();
  });

  it('should create new version row (copy-on-write) when updating active version', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    const result = updateVersion(db, profileId, profile.active_version_id, {
      contact: { name: 'Jane' },
    });

    // Should be a new version
    expect(result.id).not.toBe(profile.active_version_id);
    expect(result.versionNumber).toBe(2);

    // Original version should still have empty JSON
    const original = db
      .prepare('SELECT full_cv_json FROM cv_profile_versions WHERE id = ?')
      .get(profile.active_version_id) as { full_cv_json: string };
    expect(JSON.parse(original.full_cv_json)).toEqual({});
    db.close();
  });

  it('should update cv_profiles.active_version_id after copy-on-write', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    const result = updateVersion(db, profileId, profile.active_version_id, {
      contact: { name: 'Jane' },
    });

    const updatedProfile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    expect(updatedProfile.active_version_id).toBe(result.id);
    db.close();
  });

  it('should copy version_label from previous version when not provided', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    const result = updateVersion(db, profileId, profile.active_version_id, {
      contact: { name: 'Jane' },
    });

    expect(result.versionLabel).toBe('Initial');
    db.close();
  });

  it('should use provided versionLabel when given', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    const result = updateVersion(
      db,
      profileId,
      profile.active_version_id,
      { contact: { name: 'Jane' } },
      'Software Engineer V2',
    );

    expect(result.versionLabel).toBe('Software Engineer V2');
    db.close();
  });

  it('should mutate in-place when updating historical (non-active) version', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    // Create v2 (copy-on-write)
    const v2 = updateVersion(db, profileId, profile.active_version_id, {
      contact: { name: 'Jane' },
    });

    // Update the historical v1 in-place
    updateVersion(db, profileId, profile.active_version_id, {
      contact: { name: 'Original' },
    });

    // The version count should still be 2 (no new version created since
    // profile.active_version_id is the original v1, which is now historical)
    const allVersions = db
      .prepare(
        'SELECT version_number FROM cv_profile_versions WHERE cv_profile_id = ? ORDER BY version_number',
      )
      .all(profileId) as Array<{ version_number: number }>;
    expect(allVersions).toHaveLength(2);

    // active version should still point to v2
    const updatedProfile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };
    expect(updatedProfile.active_version_id).toBe(v2.id);
    db.close();
  });

  it('should handle null/undefined in patch gracefully', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    expect(() =>
      updateVersion(
        db,
        profileId,
        profile.active_version_id,
        null as unknown as Record<string, unknown>,
      ),
    ).not.toThrow();

    expect(() =>
      updateVersion(
        db,
        profileId,
        profile.active_version_id,
        undefined as unknown as Record<string, unknown>,
      ),
    ).not.toThrow();
    db.close();
  });

  it('should return full version object with merged data', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { active_version_id: number };

    const result = updateVersion(
      db,
      profileId,
      profile.active_version_id,
      { experience: [{ company: 'Acme' }] },
      'Engineer V1',
    );

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('versionNumber');
    expect(result).toHaveProperty('versionLabel');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('full_cv_json');
    expect(result.versionNumber).toBe(2);
    expect(result.versionLabel).toBe('Engineer V1');
    expect(result.full_cv_json).toEqual({ experience: [{ company: 'Acme' }] });
    db.close();
  });

  it('should throw 404-style error when profile does not exist', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    expect(() => updateVersion(db, 999, 1, { name: 'test' })).toThrow(/not found/i);
    db.close();
  });

  it('should throw 404-style error when version does not exist', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId = setupProfile(db);

    expect(() => updateVersion(db, profileId, 999, { name: 'test' })).toThrow(/not found/i);
    db.close();
  });

  it('should throw 409-style error when version belongs to a different profile', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    const profileId1 = setupProfile(db);
    const profileId2 = createCvProfile(db).id;

    const version1 = db
      .prepare('SELECT id FROM cv_profile_versions WHERE cv_profile_id = ?')
      .get(profileId1) as { id: number };

    expect(() => updateVersion(db, profileId2, version1.id, { name: 'test' })).toThrow(
      /belongs to another profile/i,
    );
    db.close();
  });
});
