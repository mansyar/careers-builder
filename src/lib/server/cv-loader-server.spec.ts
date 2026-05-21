/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';
import { loadCvProfileData } from './cv-loader-server';

describe('loadCvProfileData', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should create a new profile when no profile exists', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = loadCvProfileData(db);

    expect(result).toHaveProperty('profileId');
    expect(result).toHaveProperty('activeVersionId');
    expect(result).toHaveProperty('full_cv_json');
    expect(typeof result.profileId).toBe('number');
    expect(typeof result.activeVersionId).toBe('number');
    expect(result.profileId).toBeGreaterThan(0);
    expect(result.activeVersionId).toBeGreaterThan(0);
    db.close();
  });

  it('should return existing profile data', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    // Call twice — second call should find the existing profile
    const first = loadCvProfileData(db);
    const second = loadCvProfileData(db);

    expect(second.profileId).toBe(first.profileId);
    db.close();
  });

  it('should export getCvProfileData as a module function', async () => {
    const mod = await import('./cv-loader-server');
    expect(typeof mod.getCvProfileData).toBe('function');
  });
});
