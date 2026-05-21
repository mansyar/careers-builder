import type Database from 'better-sqlite3';

export interface CreateCvProfileResult {
  id: number;
  activeVersionId: number;
}

/**
 * Creates a new CV profile with a first empty version.
 *
 * - Auto-creates default user (id=1) if missing
 * - Creates a cv_profiles row for the user
 * - Auto-creates first cv_profile_versions row (version_number=1, version_label='Initial', full_cv_json='{}')
 * - Updates cv_profiles.active_version_id to point to the new version
 * - All operations wrapped in a transaction
 */
export function createCvProfile(db: Database.Database): CreateCvProfileResult {
  const result = db.transaction(() => {
    // Ensure default user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE id = 1').get() as
      | { id: number }
      | undefined;

    if (!existingUser) {
      db.prepare('INSERT INTO users (id) VALUES (1)').run();
    }

    // Create the cv_profile
    const profileResult = db
      .prepare('INSERT INTO cv_profiles (user_id, active_version_id) VALUES (1, NULL)')
      .run();

    const cvProfileId = profileResult.lastInsertRowid as number;

    // Create first empty version
    const versionResult = db
      .prepare(
        `INSERT INTO cv_profile_versions (cv_profile_id, version_number, version_label, full_cv_json)
         VALUES (?, 1, 'Initial', '{}')`,
      )
      .run(cvProfileId);

    const versionId = versionResult.lastInsertRowid as number;

    // Update the profile's active_version_id
    db.prepare('UPDATE cv_profiles SET active_version_id = ? WHERE id = ?').run(
      versionId,
      cvProfileId,
    );

    return { id: cvProfileId as number, activeVersionId: versionId as number };
  });

  return result();
}
