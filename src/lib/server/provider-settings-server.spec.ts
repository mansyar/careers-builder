/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type Database from 'better-sqlite3';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';

// Mock the settings module — keep maskApiKey real since it's a pure utility
vi.mock('./provider-settings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./provider-settings')>();
  return {
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    validateSettings: vi.fn(),
    maskApiKey: actual.maskApiKey,
  };
});

const mockLoadSettings = (await import('./provider-settings')).loadSettings as ReturnType<
  typeof vi.fn
>;
const mockSaveSettings = (await import('./provider-settings')).saveSettings as ReturnType<
  typeof vi.fn
>;
const mockValidateSettings = (await import('./provider-settings')).validateSettings as ReturnType<
  typeof vi.fn
>;

const { getProviderSettingsHandler, saveProviderSettingsHandler, validateProviderSettingsHandler } =
  await import('./provider-settings-server');

function setupUser(db: Database.Database): void {
  runStructuralMigrations(db);
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(1) as
    | { id: number }
    | undefined;
  if (!existingUser) {
    db.prepare('INSERT INTO users (id) VALUES (1)').run();
  }
}

describe('getProviderSettingsHandler', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
    vi.clearAllMocks();
  });

  it('returns settings with masked apiKey', () => {
    mockLoadSettings.mockReturnValue({
      apiKey: 'sk-test-key-123456',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });

    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);

    const result = getProviderSettingsHandler(db);

    expect(mockLoadSettings).toHaveBeenCalledWith(db);
    expect(result).toEqual({
      apiKey: 'sk-t...3456',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });
    db.close();
  });
});

describe('saveProviderSettingsHandler', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
    vi.clearAllMocks();
  });

  it('encrypts and persists provider settings', () => {
    mockSaveSettings.mockReturnValue({
      apiKey: 'sk-n...2345',
      baseUrl: 'https://api.custom.com',
      modelId: 'gpt-5',
    });

    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);

    const result = saveProviderSettingsHandler(
      {
        apiKey: 'sk-new-key-12345',
        baseUrl: 'https://api.custom.com',
        modelId: 'gpt-5',
      },
      db,
    );

    expect(mockSaveSettings).toHaveBeenCalledWith(db, {
      apiKey: 'sk-new-key-12345',
      baseUrl: 'https://api.custom.com',
      modelId: 'gpt-5',
    });
    expect(result).toEqual({
      apiKey: 'sk-n...2345',
      baseUrl: 'https://api.custom.com',
      modelId: 'gpt-5',
    });
    db.close();
  });
});

describe('validateProviderSettingsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls through to validateSettings', async () => {
    mockValidateSettings.mockResolvedValue({ valid: true });

    const result = await validateProviderSettingsHandler({
      apiKey: 'sk-valid-key',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });

    expect(mockValidateSettings).toHaveBeenCalledWith({
      apiKey: 'sk-valid-key',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });
    expect(result).toEqual({ valid: true });
  });

  it('passes through error from validateSettings', async () => {
    mockValidateSettings.mockResolvedValue({ valid: false, error: 'Unauthorized' });

    const result = await validateProviderSettingsHandler({
      apiKey: 'sk-bad-key',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });

    expect(result).toEqual({ valid: false, error: 'Unauthorized' });
  });

  it('exports getProviderSettings as a module function', async () => {
    const mod = await import('./provider-settings-server');
    expect(typeof mod.getProviderSettings).toBe('function');
  });

  it('exports saveProviderSettings as a module function', async () => {
    const mod = await import('./provider-settings-server');
    expect(typeof mod.saveProviderSettings).toBe('function');
  });

  it('exports validateProviderSettings as a module function', async () => {
    const mod = await import('./provider-settings-server');
    expect(typeof mod.validateProviderSettings).toBe('function');
  });
});
