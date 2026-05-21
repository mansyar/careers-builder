import type Database from 'better-sqlite3';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { encrypt, decrypt } from './encryption';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

interface EncryptedPayload {
  encrypted: string;
  iv: string;
  tag: string;
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL_ID = 'gpt-4o';

/**
 * Mask an API key for display purposes.
 * Shows first 4 chars, then `...`, then last 4 chars.
 * Returns `'****'` for keys ≤ 8 chars.
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) {
    return '****';
  }
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Load provider settings from the database for user 1.
 * Decrypts the stored API key. If decryption fails, returns an empty apiKey
 * but retains the other fields (recovery mode).
 */
export function loadSettings(db: Database.Database): ProviderConfig {
  const row = db.prepare('SELECT target_settings FROM users WHERE id = 1').get() as
    | { target_settings: string | null }
    | undefined;

  if (!row?.target_settings) {
    return { apiKey: '', baseUrl: DEFAULT_BASE_URL, modelId: DEFAULT_MODEL_ID };
  }

  let parsed: { provider?: { apiKey?: EncryptedPayload; baseUrl?: string; modelId?: string } };
  try {
    parsed = JSON.parse(row.target_settings);
  } catch {
    return { apiKey: '', baseUrl: DEFAULT_BASE_URL, modelId: DEFAULT_MODEL_ID };
  }

  const provider = parsed.provider;
  if (!provider) {
    return { apiKey: '', baseUrl: DEFAULT_BASE_URL, modelId: DEFAULT_MODEL_ID };
  }

  const baseUrl = provider.baseUrl ?? DEFAULT_BASE_URL;
  const modelId = provider.modelId ?? DEFAULT_MODEL_ID;

  // Attempt decryption
  if (provider.apiKey && typeof provider.apiKey === 'object') {
    try {
      const apiKey = decrypt(provider.apiKey.encrypted, provider.apiKey.iv, provider.apiKey.tag);
      return { apiKey, baseUrl, modelId };
    } catch {
      // Decryption failed — return apiKey empty with other fields intact (recovery mode)
      return { apiKey: '', baseUrl, modelId };
    }
  }

  // No apiKey stored
  return { apiKey: '', baseUrl, modelId };
}

/**
 * Save provider settings to the database.
 * Encrypts the API key before storing.
 * Returns the settings with the API key masked.
 */
export function saveSettings(db: Database.Database, config: ProviderConfig): ProviderConfig {
  const encryptedPayload = encrypt(config.apiKey);
  const payload: { provider: { apiKey: EncryptedPayload; baseUrl: string; modelId: string } } = {
    provider: {
      apiKey: encryptedPayload,
      baseUrl: config.baseUrl,
      modelId: config.modelId,
    },
  };

  db.prepare('UPDATE users SET target_settings = ? WHERE id = 1').run(JSON.stringify(payload));

  return {
    apiKey: maskApiKey(config.apiKey),
    baseUrl: config.baseUrl,
    modelId: config.modelId,
  };
}

/**
 * Validate provider settings by making a test API call.
 * Uses streamText to send a minimal prompt and checks for success.
 */
export async function validateSettings(
  config: ProviderConfig,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    await streamText({
      model: openai(config.modelId),
      prompt: 'Hi',
      maxTokens: 5,
    });
    return { valid: true };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}
