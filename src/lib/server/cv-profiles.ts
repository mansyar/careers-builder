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
export interface ListVersionsResult {
  versions: Array<{
    id: number;
    versionNumber: number;
    versionLabel: string | null;
    createdAt: string;
  }>;
  activeVersionId: number | null;
}

/**
 * Lists all versions for a CV profile, ordered by version_number DESC.
 * Returns null activeVersionId if the profile does not exist.
 */
export function listVersions(db: Database.Database, cvProfileId: number): ListVersionsResult {
  const profile = db
    .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
    .get(cvProfileId) as { active_version_id: number | null } | undefined;

  if (!profile) {
    return { versions: [], activeVersionId: null };
  }

  const rows = db
    .prepare(
      `SELECT id, version_number, version_label, created_at
       FROM cv_profile_versions
       WHERE cv_profile_id = ?
       ORDER BY version_number DESC`,
    )
    .all(cvProfileId) as Array<{
    id: number;
    version_number: number;
    version_label: string | null;
    created_at: string;
  }>;

  const versions = rows.map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    versionLabel: row.version_label,
    createdAt: row.created_at,
  }));

  return { versions, activeVersionId: profile.active_version_id };
}

export interface GetVersionResult {
  id: number;
  versionNumber: number;
  versionLabel: string | null;
  createdAt: string;
  full_cv_json: Record<string, unknown>;
}

/**
 * Fetches a single CV profile version with full_cv_json.
 * Returns null if the version does not exist or does not belong to the specified profile.
 */
export function getVersion(
  db: Database.Database,
  cvProfileId: number,
  versionId: number,
): GetVersionResult | null {
  const row = db
    .prepare(
      `SELECT id, version_number, version_label, created_at, full_cv_json
       FROM cv_profile_versions
       WHERE id = ? AND cv_profile_id = ?`,
    )
    .get(versionId, cvProfileId) as
    | {
        id: number;
        version_number: number;
        version_label: string | null;
        created_at: string;
        full_cv_json: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    versionNumber: row.version_number,
    versionLabel: row.version_label,
    createdAt: row.created_at,
    full_cv_json: JSON.parse(row.full_cv_json),
  };
}

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
