/**
 * Client-safe API for provider settings.
 *
 * Uses TanStack Start server functions from provider-settings.functions.ts.
 * These are safe to import from client code because the build process
 * replaces the implementations with fetch RPC stubs.
 */
import {
  getProviderSettings,
  saveProviderSettings,
  validateProviderSettings,
} from './provider-settings.functions';
import type { ProviderConfig } from './provider-settings.functions';

export type { ProviderConfig };

/**
 * Load provider settings from the server with masked API key.
 */
export async function loadProviderSettings(): Promise<ProviderConfig> {
  return getProviderSettings();
}

/**
 * Save provider settings to the server.
 */
export async function persistProviderSettings(
  settings: ProviderConfig,
): Promise<ProviderConfig> {
  return saveProviderSettings({ data: settings });
}

/**
 * Validate provider settings by making a test API call.
 */
export async function checkProviderSettings(
  config: ProviderConfig,
): Promise<{ valid: boolean; error?: string }> {
  return validateProviderSettings({ data: config });
}
