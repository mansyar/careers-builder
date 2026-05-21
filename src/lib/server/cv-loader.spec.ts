/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';
import { createCvProfile } from './cv-profiles';
import { loadOrCreateProfile } from './cv-loader';

describe('loadOrCreateProfile', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should create a new profile when no profile exists', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = loadOrCreateProfile(db);

    expect(result).toHaveProperty('profileId');
    expect(result).toHaveProperty('activeVersionId');
    expect(result).toHaveProperty('full_cv_json');
    expect(typeof result.profileId).toBe('number');
    expect(typeof result.activeVersionId).toBe('number');
    expect(result.full_cv_json).toEqual({});
    db.close();
  });

  it('should return existing profile data from the database when a profile exists', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    // Pre-create a profile with data
    const profile = createCvProfile(db);

    // Manually set some CV data
    const versionRow = db
      .prepare('SELECT id FROM cv_profile_versions WHERE cv_profile_id = ?')
      .get(profile.id) as { id: number };
    db.prepare('UPDATE cv_profile_versions SET full_cv_json = ? WHERE id = ?').run(
      JSON.stringify({ contact: { name: 'John' } }),
      versionRow.id,
    );

    const result = loadOrCreateProfile(db);

    expect(result.profileId).toBe(profile.id);
    expect(result.activeVersionId).toBeGreaterThan(0);
    expect(result.full_cv_json).toEqual({ contact: { name: 'John' } });
    db.close();
  });

  it('should use the provided profileId if it exists in the database', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const profile = createCvProfile(db);

    const result = loadOrCreateProfile(db, profile.id);

    expect(result.profileId).toBe(profile.id);
    db.close();
  });

  it('should fall back to the user 1 profile when the requested profileId does not exist', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    // Pre-create a profile for user 1
    const existingProfile = createCvProfile(db);

    // Request a non-existent profileId — should fall back to user 1's profile
    const result = loadOrCreateProfile(db, 999);

    expect(result.profileId).toBe(existingProfile.id);
    expect(result.full_cv_json).toEqual({});
    db.close();
  });

  it('should create a new profile when no profile exists at all', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    // Request a non-existent profileId and no user 1 profile exists
    const result = loadOrCreateProfile(db, 999);

    expect(result.profileId).toBeGreaterThan(0);
    expect(result.full_cv_json).toEqual({});
    db.close();
  });

  it('should return GetVersionResult shape with full_cv_json', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = loadOrCreateProfile(db);

    expect(result).toHaveProperty('profileId');
    expect(result).toHaveProperty('activeVersionId');
    expect(result).toHaveProperty('full_cv_json');
    expect(typeof result.full_cv_json).toBe('object');
    db.close();
  });

  it('should not throw when database has existing profile with data', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const profile = createCvProfile(db);
    const versionRow = db
      .prepare('SELECT id FROM cv_profile_versions WHERE cv_profile_id = ?')
      .get(profile.id) as { id: number };
    db.prepare('UPDATE cv_profile_versions SET full_cv_json = ? WHERE id = ?').run(
      JSON.stringify({
        contact: { name: 'Jane', email: 'jane@test.com', phone: '555-0100', location: 'NYC' },
        summary: 'Experienced developer',
        experience: [
          { company: 'Acme Corp', role: 'Engineer', startDate: '2020-01', current: true },
        ],
      }),
      versionRow.id,
    );

    const result = loadOrCreateProfile(db, profile.id);

    expect(result.profileId).toBe(profile.id);
    expect(result.full_cv_json).toHaveProperty('contact');
    expect(result.full_cv_json.contact).toHaveProperty('name', 'Jane');
    db.close();
  });
});
