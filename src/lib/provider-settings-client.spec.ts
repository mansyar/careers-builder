/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';

// Shared mock functions
const mockGet = vi.hoisted(() => vi.fn());
const mockSave = vi.hoisted(() => vi.fn());
const mockValidate = vi.hoisted(() => vi.fn());

vi.mock('./provider-settings.functions', () => ({
  getProviderSettings: mockGet,
  saveProviderSettings: mockSave,
  validateProviderSettings: mockValidate,
}));

describe('provider-settings-client', () => {
  it('loadProviderSettings calls getProviderSettings', async () => {
    mockGet.mockResolvedValue({
      apiKey: 'sk-...abcd',
      baseUrl: 'https://test.com',
      modelId: 'gpt-4',
    });

    const { loadProviderSettings } = await import('./provider-settings-client');
    const result = await loadProviderSettings();

    expect(mockGet).toHaveBeenCalledOnce();
    expect(result.apiKey).toBe('sk-...abcd');
  });

  it('persistProviderSettings calls saveProviderSettings with data wrapper', async () => {
    mockSave.mockResolvedValue({
      apiKey: 'sk-n...2345',
      baseUrl: 'https://test.com',
      modelId: 'gpt-4',
    });

    const { persistProviderSettings } = await import('./provider-settings-client');
    const result = await persistProviderSettings({
      apiKey: 'sk-new-key-12345',
      baseUrl: 'https://test.com',
      modelId: 'gpt-4',
    });

    expect(mockSave).toHaveBeenCalledWith({
      data: {
        apiKey: 'sk-new-key-12345',
        baseUrl: 'https://test.com',
        modelId: 'gpt-4',
      },
    });
    expect(result.apiKey).toBe('sk-n...2345');
  });

  it('checkProviderSettings calls validateProviderSettings with data wrapper', async () => {
    mockValidate.mockResolvedValue({ valid: true });

    const { checkProviderSettings } = await import('./provider-settings-client');
    const result = await checkProviderSettings({
      apiKey: 'sk-valid-key',
      baseUrl: 'https://test.com',
      modelId: 'gpt-4',
    });

    expect(mockValidate).toHaveBeenCalledWith({
      data: {
        apiKey: 'sk-valid-key',
        baseUrl: 'https://test.com',
        modelId: 'gpt-4',
      },
    });
    expect(result).toEqual({ valid: true });
  });
});
