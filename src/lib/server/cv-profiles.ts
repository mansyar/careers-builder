import type Database from 'better-sqlite3';
import { deepMerge } from './deep-merge';

export interface CreateCvProfileResult {
  id: number;
  activeVersionId: number;
}

/** Result shape for the listVersions handler. */
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

export interface UpdateVersionResult {
  id: number;
  versionNumber: number;
  versionLabel: string | null;
  createdAt: string;
  full_cv_json: Record<string, unknown>;
}

/**
 * Updates a CV profile version with a partial deep merge.
 *
 * - Validates that the profile and version exist
 * - Validates that the version belongs to the specified profile
 * - Copy-on-write: If the version is the active version, creates a new version row
 * - In-place update: If the version is historical, mutates the existing row
 * - Deep merges the patch into full_cv_json
 * - All write operations wrapped in a transaction
 */
export function updateVersion(
  db: Database.Database,
  cvProfileId: number,
  versionId: number,
  patch: Record<string, unknown>,
  versionLabel?: string,
): UpdateVersionResult {
  const result = db.transaction(() => {
    // Validate profile exists
    const profile = db
      .prepare('SELECT active_version_id FROM cv_profiles WHERE id = ?')
      .get(cvProfileId) as { active_version_id: number | null } | undefined;

    if (!profile) {
      throw new Error('CV profile not found');
    }

    // Validate version exists and belongs to this profile
    const existingVersion = db
      .prepare(
        `SELECT id, version_number, version_label, created_at, full_cv_json, cv_profile_id
         FROM cv_profile_versions
         WHERE id = ?`,
      )
      .get(versionId) as
      | {
          id: number;
          version_number: number;
          version_label: string | null;
          created_at: string;
          full_cv_json: string;
          cv_profile_id: number;
        }
      | undefined;

    if (!existingVersion) {
      throw new Error('CV version not found');
    }

    if (existingVersion.cv_profile_id !== cvProfileId) {
      throw new Error('Version belongs to another profile');
    }

    // Parse existing full_cv_json and deep merge with patch
    const existingJson = JSON.parse(existingVersion.full_cv_json) as Record<string, unknown>;
    const mergedJson = deepMerge(existingJson, patch ?? {});

    const mergedJsonStr = JSON.stringify(mergedJson);
    const targetLabel = versionLabel ?? existingVersion.version_label;

    if (versionId === profile.active_version_id) {
      // Copy-on-write: create a new version
      const nextVersionNumber = existingVersion.version_number + 1;

      const insertResult = db
        .prepare(
          `INSERT INTO cv_profile_versions (cv_profile_id, version_number, version_label, full_cv_json)
           VALUES (?, ?, ?, ?)`,
        )
        .run(cvProfileId, nextVersionNumber, targetLabel, mergedJsonStr);

      const newVersionId = insertResult.lastInsertRowid as number;

      // Update active_version_id
      db.prepare('UPDATE cv_profiles SET active_version_id = ? WHERE id = ?').run(
        newVersionId,
        cvProfileId,
      );

      const newRow = db
        .prepare(
          `SELECT id, version_number, version_label, created_at, full_cv_json
           FROM cv_profile_versions
           WHERE id = ?`,
        )
        .get(newVersionId) as {
        id: number;
        version_number: number;
        version_label: string | null;
        created_at: string;
        full_cv_json: string;
      };

      return {
        id: newRow.id,
        versionNumber: newRow.version_number,
        versionLabel: newRow.version_label,
        createdAt: newRow.created_at,
        full_cv_json: JSON.parse(newRow.full_cv_json),
      };
    }

    // In-place mutation for historical versions
    db.prepare(
      `UPDATE cv_profile_versions
       SET full_cv_json = ?, version_label = ?
       WHERE id = ?`,
    ).run(mergedJsonStr, targetLabel, versionId);

    const updatedRow = db
      .prepare(
        `SELECT id, version_number, version_label, created_at, full_cv_json
         FROM cv_profile_versions
         WHERE id = ?`,
      )
      .get(versionId) as {
      id: number;
      version_number: number;
      version_label: string | null;
      created_at: string;
      full_cv_json: string;
    };

    return {
      id: updatedRow.id,
      versionNumber: updatedRow.version_number,
      versionLabel: updatedRow.version_label,
      createdAt: updatedRow.created_at,
      full_cv_json: JSON.parse(updatedRow.full_cv_json),
    };
  });

  return result();
}
