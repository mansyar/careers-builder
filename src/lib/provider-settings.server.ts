/**
 * Server-only helpers for provider settings.
 *
 * `.server.ts` files are excluded from client bundles by TanStack Start's
 * build process. This file contains all the DatabaseManager logic that
 * would otherwise pull better-sqlite3 into the client bundle.
 */

import { DatabaseManager } from './server/db';
import { loadSettings, saveSettings, validateSettings, maskApiKey } from './server/provider-settings';
import type { ProviderConfig } from './server/provider-settings';

/**
 * Get the current provider settings with the API key masked.
 */
export function getProviderSettingsHandler(
  db?: ReturnType<typeof DatabaseManager.getInstance>,
): ProviderConfig {
  const database = db ?? DatabaseManager.getInstance();
  const settings = loadSettings(database);
  return {
    ...settings,
    apiKey: maskApiKey(settings.apiKey),
  };
}

/**
 * Save provider settings (encrypts API key, persists to DB).
 */
export function saveProviderSettingsHandler(
  config: ProviderConfig,
  db?: ReturnType<typeof DatabaseManager.getInstance>,
): ProviderConfig {
  const database = db ?? DatabaseManager.getInstance();
  return saveSettings(database, config);
}

/**
 * Validate provider settings by making a test API call.
 */
export async function validateProviderSettingsHandler(
  config: ProviderConfig,
): Promise<{ valid: boolean; error?: string }> {
  return validateSettings(config);
}
