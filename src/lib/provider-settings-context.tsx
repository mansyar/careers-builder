import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getProviderSettings } from './server/provider-settings-server';

export interface ProviderSettingsContextValue {
  isWizardOpen: boolean;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeWizard: () => void;
  closeSettings: () => void;
}

const ProviderSettingsContext = createContext<ProviderSettingsContextValue | null>(null);

export function ProviderSettingsProvider({ children }: { children: ReactNode }) {
  const [isWizardOpen, setIsWizardOpen] = useState(true); // Default to open until proven configured
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // On mount, check if provider is already configured
  useEffect(() => {
    let cancelled = false;
    getProviderSettings().then((settings) => {
      if (cancelled) return;
      if (settings.apiKey && settings.apiKey !== '****') {
        // Already configured — no wizard needed
        setIsWizardOpen(false);
      }
      // If apiKey is empty or masked, leave wizard open
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
