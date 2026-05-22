/**
 * Client-safe wrapper for provider settings server functions.
 *
 * These are thin wrappers using dynamic import to avoid pulling
 * server-only dependencies (better-sqlite3, DatabaseManager) into
 * the client bundle.
 */

import type { ProviderConfig } from './server/provider-settings';

/**
 * Load provider settings from the server with masked API key.
 */
export async function loadProviderSettings(): Promise<ProviderConfig> {
  const mod = await import('./server/provider-settings-server');
  return mod.getProviderSettings();
}

/**
 * Save provider settings to the server.
 */
export async function persistProviderSettings(settings: ProviderConfig): Promise<ProviderConfig> {
  const mod = await import('./server/provider-settings-server');
  return mod.saveProviderSettings(settings);
}

/**
 * Validate provider settings by making a test API call.
 */
export async function checkProviderSettings(
  config: ProviderConfig,
): Promise<{ valid: boolean; error?: string }> {
  const mod = await import('./server/provider-settings-server');
  return mod.validateProviderSettings(config);
}
