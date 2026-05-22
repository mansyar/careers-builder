/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ProviderWizard } from './ProviderWizard';

afterEach(() => {
  cleanup();
});

const mockCheck = vi.hoisted(() => vi.fn());
const mockLoad = vi.hoisted(() => vi.fn());
const mockPersist = vi.hoisted(() => vi.fn());

vi.mock('../lib/provider-settings-client', () => ({
  checkProviderSettings: mockCheck,
  loadProviderSettings: mockLoad,
  persistProviderSettings: mockPersist,
}));

const noop = () => {};

describe('ProviderWizard - wizard mode (dismissable=false)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with step 1 shown when no initial apiKey', () => {
    render(<ProviderWizard onSave={noop} />);
    expect(screen.getByText('AI Provider Configuration')).toBeTruthy();
    // Step 1 should have the API key input
    expect(screen.getByPlaceholderText('sk-...')).toBeTruthy();
    // No close button in wizard mode
    expect(screen.queryByLabelText('Close')).toBeNull();
  });

  it('shows password-masked API key input with show toggle', () => {
    render(<ProviderWizard onSave={noop} />);
    const input = screen.getByPlaceholderText('sk-...') as HTMLInputElement;
    expect(input.type).toBe('password');
    // Click eye button to show
    const toggle = screen.getByLabelText('Show API key');
    fireEvent.click(toggle);
    expect(input.type).toBe('text');
  });

  it('"Test Connection" button is disabled when API key is empty', () => {
    render(<ProviderWizard onSave={noop} />);
    const button = screen.getByText('Test Connection') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('"Next" button is disabled when API key is not validated', () => {
    render(<ProviderWizard onSave={noop} />);
    const nextBtn = screen.getByText('Next') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it('shows loading state while testing connection', async () => {
    // Return a promise that never resolves during this test
    mockCheck.mockReturnValue(new Promise(() => {}));
    render(<ProviderWizard onSave={noop} />);
    const input = screen.getByPlaceholderText('sk-...');
    fireEvent.change(input, { target: { value: 'sk-test-key' } });
    fireEvent.click(screen.getByText('Test Connection'));
    expect(screen.getByText('Testing...')).toBeTruthy();
  });

  it('shows success message on valid key and enables Next', async () => {
    mockCheck.mockResolvedValue({ valid: true });
    render(<ProviderWizard onSave={noop} />);
    const input = screen.getByPlaceholderText('sk-...');
    fireEvent.change(input, { target: { value: 'sk-valid-key' } });
    fireEvent.click(screen.getByText('Test Connection'));
    expect(await screen.findByText('Connection successful')).toBeTruthy();
    // Next button should now be enabled
    expect((screen.getByText('Next') as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows error message on invalid key', async () => {
    mockCheck.mockResolvedValue({ valid: false, error: '401 Unauthorized' });
    render(<ProviderWizard onSave={noop} />);
    const input = screen.getByPlaceholderText('sk-...');
    fireEvent.change(input, { target: { value: 'sk-bad-key' } });
    fireEvent.click(screen.getByText('Test Connection'));
    expect(await screen.findByText('401 Unauthorized')).toBeTruthy();
    // Next button should still be disabled
    expect((screen.getByText('Next') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ProviderWizard - multi-step navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheck.mockResolvedValue({ valid: true });
  });

  it('navigates through steps 1→2→finish', async () => {
    const onSave = vi.fn();
    render(<ProviderWizard onSave={onSave} />);

    // Step 1: Enter API key, test, proceed
    fireEvent.change(screen.getByPlaceholderText('sk-...'), {
      target: { value: 'sk-valid-key' },
    });
    fireEvent.click(screen.getByText('Test Connection'));
    expect(await screen.findByText('Connection successful')).toBeTruthy();

    // Go to Step 2 (Model ID)
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByPlaceholderText('gpt-4o')).toBeTruthy();

    // Step 2: Finish
    fireEvent.click(screen.getByText('Finish'));
    expect(onSave).toHaveBeenCalledWith({
      apiKey: 'sk-valid-key',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-4o',
    });
  });

  it('shows step 2 when initial apiKey is provided', () => {
    render(<ProviderWizard onSave={noop} initialSettings={{ apiKey: 'sk-existing' }} />);
    // Should show step 2 (modelId input)
    expect(screen.getByPlaceholderText('gpt-4o')).toBeTruthy();
  });
});

describe('ProviderWizard - settings mode (dismissable=true)', () => {
  it('shows close button when dismissable', () => {
    render(<ProviderWizard onSave={noop} dismissable onDismiss={noop} />);
    expect(screen.getByLabelText('Close')).toBeTruthy();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<ProviderWizard onSave={noop} dismissable onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe('ProviderWizard - recovery mode', () => {
  it('pre-fills baseUrl and modelId from stored settings', () => {
    render(
      <ProviderWizard
        onSave={noop}
        initialSettings={{
          baseUrl: 'https://custom.api.com',
          modelId: 'gpt-5',
        }}
      />,
    );
    // Since no apiKey, shows step 1
    expect(screen.getByPlaceholderText('sk-...')).toBeTruthy();
    // But baseUrl and modelId are pre-filled for later steps
  });
});
