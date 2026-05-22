/**
 * @vitest-environment node
 *
 * Tests for provider-settings.server.ts handler functions.
 * These functions wrap DatabaseManager operations.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from './server/db';
import { runStructuralMigrations } from './server/migrations';
import { getProviderSettingsHandler, saveProviderSettingsHandler } from './provider-settings.server';

describe('getProviderSettingsHandler', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('returns defaults when no user exists', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);

    const result = getProviderSettingsHandler(db);

    expect(result.apiKey).toBe('****'); // empty key is masked
    expect(result.baseUrl).toBe('https://api.openai.com/v1');
    expect(result.modelId).toBe('gpt-4o');
    db.close();
  });

  it('returns saved settings with masked apiKey', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);
    // Create a user
    db.prepare('INSERT INTO users (id) VALUES (1)').run();

    saveProviderSettingsHandler(
      { apiKey: 'sk-my-secret-key', baseUrl: 'https://custom.api.com', modelId: 'gpt-5' },
      db,
    );

    const result = getProviderSettingsHandler(db);

    expect(result.apiKey).toContain('...');
    expect(result.apiKey).not.toContain('sk-my-secret-key');
    expect(result.baseUrl).toBe('https://custom.api.com');
    expect(result.modelId).toBe('gpt-5');
    db.close();
  });
});

describe('saveProviderSettingsHandler', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
  });

  it('encrypts and stores provider settings', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    runStructuralMigrations(db);
    db.prepare('INSERT INTO users (id) VALUES (1)').run();

    saveProviderSettingsHandler(
      { apiKey: 'sk-new-key', baseUrl: 'https://api.test.com', modelId: 'gpt-4o-mini' },
      db,
    );

    const stored = db.prepare('SELECT target_settings FROM users WHERE id = 1').get() as {
      target_settings: string;
    };
    const parsed = JSON.parse(stored.target_settings);
    expect(parsed.provider.apiKey).toHaveProperty('encrypted');
    expect(parsed.provider.apiKey).toHaveProperty('iv');
    expect(parsed.provider.apiKey).toHaveProperty('tag');
    expect(parsed.provider.baseUrl).toBe('https://api.test.com');
    expect(parsed.provider.modelId).toBe('gpt-4o-mini');
    db.close();
  });
});
