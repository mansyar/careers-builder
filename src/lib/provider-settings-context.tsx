import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface ProviderSettingsContextValue {
  isWizardOpen: boolean;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeWizard: () => void;
  closeSettings: () => void;
}

const ProviderSettingsContext = createContext<ProviderSettingsContextValue | null>(null);

export function ProviderSettingsProvider({ children }: { children: ReactNode }) {
  const [isWizardOpen, setIsWizardOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Use dynamic import to avoid pulling server-only modules into the client bundle
  useEffect(() => {
    let cancelled = false;
    import('./provider-settings-client')
      .then((mod) => mod.loadProviderSettings())
      .then((settings) => {
        if (cancelled) return;
        // If there's a valid (non-empty, non-masked) API key, the provider is configured
        if (settings.apiKey && settings.apiKey !== '' && settings.apiKey !== '****') {
          setIsWizardOpen(false);
        }
      })
      .catch(() => {
        // Server function unavailable — leave wizard open by default
        if (!cancelled) setIsWizardOpen(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openSettings = () => {
    setIsWizardOpen(false);
    setIsSettingsOpen(true);
  };

  const closeWizard = () => {
    setIsWizardOpen(false);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <ProviderSettingsContext.Provider
      value={{ isWizardOpen, isSettingsOpen, openSettings, closeWizard, closeSettings }}
    >
      {children}
    </ProviderSettingsContext.Provider>
  );
}

export function useProviderSettings(): ProviderSettingsContextValue {
  const ctx = useContext(ProviderSettingsContext);
  if (!ctx) {
    throw new Error('useProviderSettings must be used within a ProviderSettingsProvider');
  }
  return ctx;
}
