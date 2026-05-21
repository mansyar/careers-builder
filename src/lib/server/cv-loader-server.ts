import { createServerFn } from '@tanstack/react-start';
import { DatabaseManager } from './db';
import { loadOrCreateProfile } from './cv-loader';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface CvProfileData {
  profileId: number;
  activeVersionId: number;
  full_cv_json: Record<string, JsonValue>;
}

/**
 * Server function that loads or creates a CV profile.
 *
 * Checks for an existing profile for user 1 and returns its data.
 * If no profile exists yet, creates one with an empty first version.
 *
 * This is the server-side entry point for the cv-builder route loader.
 */
export const getCvProfileData = createServerFn().handler(async (): Promise<CvProfileData> => {
  const db = DatabaseManager.getInstance();
  const result = loadOrCreateProfile(db);
  return {
    profileId: result.profileId,
    activeVersionId: result.activeVersionId,
    full_cv_json: result.full_cv_json as Record<string, JsonValue>,
  };
});
