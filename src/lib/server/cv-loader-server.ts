import { createServerFn } from '@tanstack/react-start';
import { DatabaseManager } from './db';
import { loadOrCreateProfile } from './cv-loader';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface CvProfileData {
  profileId: number;
  activeVersionId: number;
  full_cv_json: Record<string, JsonValue>;
}

/**
 * Loads or creates a CV profile — the core handler logic.
 *
 * Extracted from the server function so it can be unit tested directly.
 * Accepts an optional Database parameter for testability with in-memory DB.
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

/**
 * Server function that loads or creates a CV profile.
 *
 * Checks for an existing profile for user 1 and returns its data.
 * If no profile exists yet, creates one with an empty first version.
 *
 * This is the server-side entry point for the cv-builder route loader.
 */
export const getCvProfileData = createServerFn().handler(async (): Promise<CvProfileData> => {
  return loadCvProfileData();
});
