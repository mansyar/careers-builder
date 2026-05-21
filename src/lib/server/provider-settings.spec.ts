/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type Database from 'better-sqlite3';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';
import { maskApiKey, loadSettings, saveSettings, validateSettings } from './provider-settings';

// Mock streamText from the 'ai' package
vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

// Mock encryption module
vi.mock('./encryption', () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
}));

const mockEncrypt = (await import('./encryption')).encrypt as ReturnType<typeof vi.fn>;
const mockDecrypt = (await import('./encryption')).decrypt as ReturnType<typeof vi.fn>;
const mockStreamText = (await import('ai')).streamText as ReturnType<typeof vi.fn>;

function setupUser(db: Database.Database): void {
  runStructuralMigrations(db);
  // Ensure user 1 exists
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(1) as
    | { id: number }
    | undefined;
  if (!existingUser) {
    db.prepare('INSERT INTO users (id) VALUES (1)').run();
  }
}

describe('maskApiKey', () => {
  it('returns first 4 chars + ... + last 4 chars for normal keys', () => {
    expect(maskApiKey('sk-abc12345xyz')).toBe('sk-a...5xyz');
  });

  it('returns first 4 chars + ... + last 4 chars for long keys', () => {
    const key = 'sk-proj-abcdefghijklmnopqrstuvwxyz123456';
    const result = maskApiKey(key);
    expect(result).toBe('sk-p...3456');
  });

  it('returns **** for keys <= 8 chars', () => {
    expect(maskApiKey('short')).toBe('****');
    expect(maskApiKey('12345678')).toBe('****');
  });

  it('handles empty string', () => {
    expect(maskApiKey('')).toBe('****');
  });
});

describe('loadSettings', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
    vi.clearAllMocks();
  });

  it('returns defaults when no settings exist', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);

    const result = loadSettings(db);

    expect(result).toEqual({
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });
    db.close();
  });

  it('returns defaults when target_settings is NULL', () => {
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);
    db.prepare('UPDATE users SET target_settings = NULL WHERE id = 1').run();

    const result = loadSettings(db);

    expect(result).toEqual({
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });
    db.close();
  });

  it('decrypts and returns stored settings with nested provider key', () => {
    mockDecrypt.mockReturnValue('sk-decrypted-key-789');
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);
    // Store the encrypted apiKey as a JSON object matching encrypt() output format
    const encryptedApiKey = JSON.stringify({
      encrypted: 'abc123',
      iv: 'iv123',
      tag: 'tag123',
    });
    db.prepare(
      `UPDATE users SET target_settings = '{"provider":{"apiKey":${encryptedApiKey},"baseUrl":"https://custom.api.com","modelId":"gpt-4o-mini"}}' WHERE id = 1`,
    ).run();

    const result = loadSettings(db);

    expect(mockDecrypt).toHaveBeenCalledWith('abc123', 'iv123', 'tag123');
    expect(result).toEqual({
      apiKey: 'sk-decrypted-key-789',
      baseUrl: 'https://custom.api.com',
      modelId: 'gpt-4o-mini',
    });
    db.close();
  });

  it('handles decryption failure gracefully — returns apiKey empty with other fields intact', () => {
    mockDecrypt.mockImplementation(() => {
      throw new Error('decryption failed');
    });
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);
    const encryptedApiKey = JSON.stringify({
      encrypted: 'bad',
      iv: 'ivbad',
      tag: 'tagbad',
    });
    db.prepare(
      `UPDATE users SET target_settings = '{"provider":{"apiKey":${encryptedApiKey},"baseUrl":"https://custom.api.com","modelId":"gpt-4o"}}' WHERE id = 1`,
    ).run();

    const result = loadSettings(db);

    expect(result).toEqual({
      apiKey: '',
      baseUrl: 'https://custom.api.com',
      modelId: 'gpt-4o',
    });
    db.close();
  });
});

describe('saveSettings', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
    vi.clearAllMocks();
  });

  it('encrypts apiKey and stores under provider key', () => {
    mockEncrypt.mockReturnValue({
      encrypted: 'hexencrypted',
      iv: 'hexiv',
      tag: 'hextag',
    });
    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);

    const result = saveSettings(db, {
      apiKey: 'sk-new-key-12345',
      baseUrl: 'https://api.custom.com',
      modelId: 'gpt-5',
    });

    expect(mockEncrypt).toHaveBeenCalledWith('sk-new-key-12345');

    const stored = db.prepare('SELECT target_settings FROM users WHERE id = 1').get() as {
      target_settings: string;
    };
    const parsed = JSON.parse(stored.target_settings);
    expect(parsed).toEqual({
      provider: {
        apiKey: { encrypted: 'hexencrypted', iv: 'hexiv', tag: 'hextag' },
        baseUrl: 'https://api.custom.com',
        modelId: 'gpt-5',
      },
    });

    // Result has masked apiKey
    expect(result.apiKey).toContain('...');
    expect(result.baseUrl).toBe('https://api.custom.com');
    expect(result.modelId).toBe('gpt-5');
    db.close();
  });
});

describe('validateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { valid: true } on successful streamText call', async () => {
    mockStreamText.mockResolvedValue({ text: 'Hello' });

    const result = await validateSettings({
      apiKey: 'sk-valid-key',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });

    expect(mockStreamText).toHaveBeenCalled();
    expect(result).toEqual({ valid: true });
  });

  it('returns { valid: false, error } on streamText failure', async () => {
    mockStreamText.mockRejectedValue(new Error('401 Unauthorized'));

    const result = await validateSettings({
      apiKey: 'sk-bad-key',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });

    expect(result).toEqual({
      valid: false,
      error: '401 Unauthorized',
    });
  });
});
