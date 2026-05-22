import { createContext, useContext, useState, type ReactNode } from 'react';

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
