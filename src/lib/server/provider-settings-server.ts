import { createServerFn } from '@tanstack/react-start';
import { DatabaseManager } from './db';
import { loadSettings, saveSettings, validateSettings, maskApiKey } from './provider-settings';
import type { ProviderConfig } from './provider-settings';

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

/**
 * Server function that returns current provider settings with masked API key.
 */
export const getProviderSettings = createServerFn().handler(async (): Promise<ProviderConfig> => {
  return getProviderSettingsHandler();
});

/**
 * Server function that saves provider settings.
 * Accepts ProviderConfig via the context data property.
 */
export const saveProviderSettings = createServerFn({ method: 'POST' }).handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (ctx: any): Promise<ProviderConfig> => {
    return saveProviderSettingsHandler(ctx.data as ProviderConfig);
  },
);

/**
 * Server function that validates provider settings.
 * Accepts ProviderConfig via the context data property.
 */
export const validateProviderSettings = createServerFn({ method: 'POST' }).handler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (ctx: any): Promise<{ valid: boolean; error?: string }> => {
    return validateProviderSettingsHandler(ctx.data as ProviderConfig);
  },
);
