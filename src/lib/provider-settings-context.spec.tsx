/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { act, render, screen, renderHook } from '@testing-library/react';
import { ProviderSettingsProvider, useProviderSettings } from './provider-settings-context';

describe('ProviderSettingsProvider', () => {
  it('renders children', () => {
    render(
      <ProviderSettingsProvider>
        <div data-testid="child">Hello</div>
      </ProviderSettingsProvider>,
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('provides context with default values', () => {
    const { result } = renderHook(() => useProviderSettings(), {
      wrapper: ({ children }) => (
        <ProviderSettingsProvider>{children}</ProviderSettingsProvider>
      ),
    });

    expect(result.current.isWizardOpen).toBe(true);
    expect(result.current.isSettingsOpen).toBe(false);
  });

  it('openSettings closes wizard and opens settings', () => {
    const { result } = renderHook(() => useProviderSettings(), {
      wrapper: ({ children }) => (
        <ProviderSettingsProvider>{children}</ProviderSettingsProvider>
      ),
    });

    act(() => {
      result.current.openSettings();
    });

    expect(result.current.isWizardOpen).toBe(false);
    expect(result.current.isSettingsOpen).toBe(true);
  });

  it('closeWizard closes the wizard', () => {
    const { result } = renderHook(() => useProviderSettings(), {
      wrapper: ({ children }) => (
        <ProviderSettingsProvider>{children}</ProviderSettingsProvider>
      ),
    });

    act(() => {
      result.current.closeWizard();
    });

    expect(result.current.isWizardOpen).toBe(false);
  });

  it('closeSettings closes the settings modal', () => {
    const { result } = renderHook(() => useProviderSettings(), {
      wrapper: ({ children }) => (
        <ProviderSettingsProvider>{children}</ProviderSettingsProvider>
      ),
    });

    act(() => {
      result.current.openSettings();
      result.current.closeSettings();
    });

    expect(result.current.isSettingsOpen).toBe(false);
  });
});

describe('useProviderSettings', () => {
  it('throws when used outside ProviderSettingsProvider', () => {
    expect(() => renderHook(() => useProviderSettings())).toThrow(
      'useProviderSettings must be used within a ProviderSettingsProvider',
    );
  });
});
