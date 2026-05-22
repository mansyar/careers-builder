/**
 * Server function wrappers for provider settings.
 *
 * These are safe to import from client code. TanStack Start's build process
 * replaces server function implementations with RPC stubs on the client,
 * and the `.server.ts` imports are tree-shaken away.
 */
import { createServerFn } from '@tanstack/react-start';
import {
  getProviderSettingsHandler,
  saveProviderSettingsHandler,
  validateProviderSettingsHandler,
} from './provider-settings.server';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

/**
 * Load current provider settings with masked API key.
 */
export const getProviderSettings = createServerFn().handler(
  async (): Promise<ProviderConfig> => {
    return getProviderSettingsHandler();
  },
);

/**
 * Save provider settings (accepts ProviderConfig, returns with masked key).
 */
export const saveProviderSettings = createServerFn({ method: 'POST' }).handler(
  async (ctx: Record<string, unknown>): Promise<ProviderConfig> => {
    const data = (ctx as { data: ProviderConfig }).data;
    return saveProviderSettingsHandler(data);
  },
);

/**
 * Validate provider settings by making a test API call.
 */
export const validateProviderSettings = createServerFn({
  method: 'POST',
}).handler(
  async (
    ctx: Record<string, unknown>,
  ): Promise<{ valid: boolean; error?: string }> => {
    const data = (ctx as { data: ProviderConfig }).data;
    return validateProviderSettingsHandler(data);
  },
);
