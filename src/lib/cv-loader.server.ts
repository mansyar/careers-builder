/**
 * Server-only helper for CV profile loading.
 * Uses .server.ts convention — excluded from client bundles by TanStack Start.
 */
import { DatabaseManager } from './server/db';
import { loadOrCreateProfile } from './server/cv-loader';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface CvProfileData {
  profileId: number;
  activeVersionId: number;
  full_cv_json: Record<string, JsonValue>;
}

/**
 * Loads or creates a CV profile from the database.
 */
export function loadCvProfileData(
  db?: ReturnType<typeof DatabaseManager.getInstance>,
): CvProfileData {
  const database = db ?? DatabaseManager.getInstance();
  const result = loadOrCreateProfile(database);
  return {
    profileId: result.profileId,
    activeVersionId: result.activeVersionId,
    full_cv_json: result.full_cv_json as Record<string, JsonValue>,
  };
}
