/**
 * Client-safe API for provider settings.
 *
 * Uses fetch() to call API routes instead of importing server functions
 * directly, avoiding bundling Node.js modules (better-sqlite3) into the client.
 */

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

/**
 * Load provider settings from the server with masked API key.
 */
export async function loadProviderSettings(): Promise<ProviderConfig> {
  const res = await fetch('/api/provider-settings');
  if (!res.ok) {
    throw new Error(`Failed to load provider settings: ${res.status}`);
  }
  return res.json() as Promise<ProviderConfig>;
}

/**
 * Save provider settings to the server.
 */
export async function persistProviderSettings(
  settings: ProviderConfig,
): Promise<ProviderConfig> {
  const res = await fetch('/api/provider-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    throw new Error(`Failed to save provider settings: ${res.status}`);
  }
  return res.json() as Promise<ProviderConfig>;
}

/**
 * Validate provider settings by making a test API call.
 * Returns { valid: true } or { valid: false, error }.
 */
export async function checkProviderSettings(
  config: ProviderConfig,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('/api/provider-settings/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      return { valid: false, error: `Server returned ${res.status}` };
    }
    return (await res.json()) as { valid: boolean; error?: string };
  } catch {
    return { valid: false, error: 'Connection test failed' };
  }
}
