/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type Database from 'better-sqlite3';
import { DatabaseManager } from './db';
import { runStructuralMigrations } from './migrations';
import type { ProviderConfig } from './provider-settings';

// Mock dependencies
vi.mock('./provider-settings', () => ({
  loadSettings: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(),
}));

const mockLoadSettings = (await import('./provider-settings')).loadSettings as ReturnType<
  typeof vi.fn
>;
const mockCreateOpenAI = (await import('@ai-sdk/openai')).createOpenAI as ReturnType<typeof vi.fn>;
const mockStreamText = (await import('ai')).streamText as ReturnType<typeof vi.fn>;
const mockConvertToModelMessages = (await import('ai')).convertToModelMessages as ReturnType<
  typeof vi.fn
>;

function setupUser(db: Database.Database): void {
  runStructuralMigrations(db);
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(1) as
    | { id: number }
    | undefined;
  if (!existingUser) {
    db.prepare('INSERT INTO users (id) VALUES (1)').run();
  }
}

const validProviderConfig: ProviderConfig = {
  apiKey: 'sk-valid-key-12345',
  baseUrl: 'https://api.openai.com/v1',
  modelId: 'gpt-4o',
};

const mockMessages = [{ id: '1', role: 'user' as const, content: 'Hello', parts: [] }];

describe('handleChatRequest', () => {
  beforeEach(() => {
    DatabaseManager.resetInstance();
    vi.clearAllMocks();
  });

  it('returns a streaming Response when valid provider settings are configured', async () => {
    const { handleChatRequest } = await import('./chat');
    mockLoadSettings.mockReturnValue(validProviderConfig);
    mockCreateOpenAI.mockReturnValue(vi.fn(() => ({ modelId: 'gpt-4o' })) as never);
    mockConvertToModelMessages.mockReturnValue([{ role: 'user', content: 'Hello' }]);

    const mockStreamResponse = new Response('streaming data', {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => mockStreamResponse,
    });

    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);
    const result = await handleChatRequest(mockMessages, db);

    expect(mockLoadSettings).toHaveBeenCalledWith(db);
    expect(mockCreateOpenAI).toHaveBeenCalledWith({
      apiKey: 'sk-valid-key-12345',
      baseURL: 'https://api.openai.com/v1',
    });
    expect(mockConvertToModelMessages).toHaveBeenCalledWith(mockMessages);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        messages: expect.any(Array),
        system: expect.stringContaining('executive resume writer'),
      }),
    );
    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toBe('text/event-stream');
    db.close();
  });

  it('returns 400 with PROVIDER_NOT_CONFIGURED when no API key is configured', async () => {
    const { handleChatRequest } = await import('./chat');
    mockLoadSettings.mockReturnValue({
      ...validProviderConfig,
      apiKey: '',
    });

    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);
    const result = await handleChatRequest(mockMessages, db);

    expect(result.status).toBe(400);
    const body = await result.json();
    expect(body).toEqual({
      error: 'AI provider not configured',
      code: 'PROVIDER_NOT_CONFIGURED',
    });
    expect(mockStreamText).not.toHaveBeenCalled();
    db.close();
  });

  it('returns 502 with PROVIDER_UNAVAILABLE when the LLM provider is unreachable', async () => {
    const { handleChatRequest } = await import('./chat');
    mockLoadSettings.mockReturnValue(validProviderConfig);
    mockCreateOpenAI.mockReturnValue(vi.fn(() => ({ modelId: 'gpt-4o' })) as never);
    mockConvertToModelMessages.mockReturnValue([{ role: 'user', content: 'Hello' }]);
    mockStreamText.mockImplementation(() => {
      throw new Error('Network error: connection refused');
    });

    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);
    const result = await handleChatRequest(mockMessages, db);

    expect(result.status).toBe(502);
    const body = await result.json();
    expect(body).toEqual({
      error: 'AI provider is currently unavailable',
      code: 'PROVIDER_UNAVAILABLE',
    });
    db.close();
  });

  it('loads settings from the database using injected db instance', async () => {
    const { handleChatRequest } = await import('./chat');
    mockLoadSettings.mockReturnValue(validProviderConfig);
    mockCreateOpenAI.mockReturnValue(vi.fn(() => ({ modelId: 'gpt-4o' })) as never);
    mockConvertToModelMessages.mockReturnValue([{ role: 'user', content: 'Hello' }]);
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response(null, { status: 200 }),
    });

    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);

    await handleChatRequest(mockMessages, db);

    expect(mockLoadSettings).toHaveBeenCalledWith(db);
    db.close();
  });

  it('calls streamText with the correct model, system prompt, and converted messages', async () => {
    const { handleChatRequest } = await import('./chat');
    mockLoadSettings.mockReturnValue(validProviderConfig);
    const mockOpenAIProvider = vi.fn((modelId: string) => ({ modelId }));
    mockCreateOpenAI.mockReturnValue(mockOpenAIProvider);
    mockConvertToModelMessages.mockReturnValue([{ role: 'user', content: 'Hello from test' }]);
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response(null, { status: 200 }),
    });

    const db = DatabaseManager.getInstance({ path: ':memory:' });
    setupUser(db);

    await handleChatRequest(mockMessages, db);

    expect(mockCreateOpenAI).toHaveBeenCalledWith({
      apiKey: 'sk-valid-key-12345',
      baseURL: 'https://api.openai.com/v1',
    });

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        messages: [{ role: 'user', content: 'Hello from test' }],
        system: expect.stringContaining('executive resume writer'),
      }),
    );
    db.close();
  });
});
