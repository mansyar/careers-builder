/**
 * Full-flow acceptance test for the CV Profile & Version API.
 *
 * Tests the handler functions directly (business logic) since TanStack Start
 * server routes require the full SSR runtime to execute. This is consistent
 * with the project pattern (see: routes/__tests__/health.spec.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from '../../../lib/server/db';
import { runStructuralMigrations } from '../../../lib/server/migrations';
import {
  createCvProfile,
  listVersions,
  getVersion,
  updateVersion,
} from '../../../lib/server/cv-profiles';

describe('CV API — Full Flow Acceptance', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('should create profile and return { id, activeVersionId }', () => {
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

  it('should add CV data via PUT and verify merged full_cv_json', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const { id: profileId, activeVersionId } = createCvProfile(db);

    const result = updateVersion(db, profileId, activeVersionId, {
      contact: { name: 'John Doe', email: 'john@example.com' },
    });

    expect(result.full_cv_json).toEqual({
      contact: { name: 'John Doe', email: 'john@example.com' },
    });
    db.close();
  });

  it('should verify data via GET single version matches PUT response', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const { id: profileId, activeVersionId } = createCvProfile(db);

    const putResult = updateVersion(db, profileId, activeVersionId, {
      contact: { name: 'John Doe' },
    });

    const getResult = getVersion(db, profileId, putResult.id);

    expect(getResult).not.toBeNull();
    expect(getResult!.full_cv_json).toEqual(putResult.full_cv_json);
    expect(getResult!.id).toBe(putResult.id);
    expect(getResult!.versionNumber).toBe(putResult.versionNumber);
    db.close();
  });

  it('should trigger copy-on-write on second PUT and verify new version_number', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const { id: profileId, activeVersionId } = createCvProfile(db);

    // First update (copy-on-write: creates v2)
    const v2 = updateVersion(db, profileId, activeVersionId, {
      contact: { name: 'Jane' },
    });
    expect(v2.versionNumber).toBe(2);

    // Second update (copy-on-write: creates v3)
    const v3 = updateVersion(db, profileId, v2.id, {
      contact: { email: 'jane@test.com' },
    });
    expect(v3.versionNumber).toBe(3);
    db.close();
  });

  it('should update activeVersionId after copy-on-write', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const { id: profileId, activeVersionId } = createCvProfile(db);

    const result = updateVersion(db, profileId, activeVersionId, {
      contact: { name: 'Jane' },
    });

    const { activeVersionId: newActiveId } = listVersions(db, profileId);
    expect(newActiveId).toBe(result.id);
    db.close();
  });

  it('should return old data for historical version (immutability)', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const { id: profileId, activeVersionId } = createCvProfile(db);

    // Update to create v2
    const v2 = updateVersion(db, profileId, activeVersionId, {
      contact: { name: 'Jane' },
    });

    // Verify original v1 still has empty JSON
    const v1 = getVersion(db, profileId, activeVersionId);
    expect(v1).not.toBeNull();
    expect(v1!.full_cv_json).toEqual({});

    // Verify v2 has new data
    expect(v2.full_cv_json).toEqual({ contact: { name: 'Jane' } });
    db.close();
  });

  it('should pass all handler unit tests', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const { id: profileId, activeVersionId } = createCvProfile(db);

    // listVersions returns versions
    const versionsResult = listVersions(db, profileId);
    expect(versionsResult.versions).toHaveLength(1);
    expect(versionsResult.activeVersionId).toBe(activeVersionId);

    // getVersion returns version
    const version = getVersion(db, profileId, activeVersionId);
    expect(version).not.toBeNull();

    // updateVersion with deep merge
    const updated = updateVersion(db, profileId, activeVersionId, {
      experience: [{ company: 'Acme' }],
    });
    expect(updated.versionNumber).toBe(2);
    expect(updated.full_cv_json).toEqual({ experience: [{ company: 'Acme' }] });

    db.close();
  });
});
