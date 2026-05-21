import type Database from 'better-sqlite3';
import { runStructuralMigrations } from './migrations';
import { createCvProfile, getVersion } from './cv-profiles';

export interface LoadOrCreateProfileResult {
  profileId: number;
  activeVersionId: number;
  full_cv_json: Record<string, unknown>;
}

/**
 * Loads an existing CV profile or creates a new one.
 *
 * If `profileId` is provided, attempts to look up the profile's active version.
 * Falls back to a broad DB query if the profile ID is not found,
 * or creates a brand-new profile as a last resort.
 *
 * If `profileId` is NOT provided, checks for any existing profile for user 1.
 * If one exists, returns its data. Otherwise, creates a new profile.
 */
export function loadOrCreateProfile(
  db: Database.Database,
  profileId?: number,
): LoadOrCreateProfileResult {
  runStructuralMigrations(db);

  if (profileId) {
    // Look up the specified profile
    const profile = db
      .prepare('SELECT id, active_version_id FROM cv_profiles WHERE id = ?')
      .get(profileId) as { id: number; active_version_id: number | null } | undefined;

    if (profile && profile.active_version_id) {
      const version = getVersion(db, profile.id, profile.active_version_id);
      if (version) {
        return {
          profileId: profile.id,
          activeVersionId: profile.active_version_id,
          full_cv_json: version.full_cv_json,
        };
      }
    }

    // Profile ID not found or has no active version — fall through to create new
  }

  // Check for an existing profile for user 1
  const existingProfile = db
    .prepare(
      'SELECT id, active_version_id FROM cv_profiles WHERE user_id = 1 ORDER BY id DESC LIMIT 1',
    )
    .get() as { id: number; active_version_id: number | null } | undefined;

  if (existingProfile && existingProfile.active_version_id) {
    const version = getVersion(db, existingProfile.id, existingProfile.active_version_id);
    if (version) {
      return {
        profileId: existingProfile.id,
        activeVersionId: existingProfile.active_version_id,
        full_cv_json: version.full_cv_json,
      };
    }
  }

  // No profile exists — create one
  const newProfile = createCvProfile(db);
  const newVersion = getVersion(db, newProfile.id, newProfile.activeVersionId);

  return {
    profileId: newProfile.id,
    activeVersionId: newProfile.activeVersionId,
    full_cv_json: newVersion?.full_cv_json ?? {},
  };
}
