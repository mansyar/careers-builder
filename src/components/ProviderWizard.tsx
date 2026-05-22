import { useState } from 'react';
import { Eye, EyeOff, Check, X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { checkProviderSettings } from '../lib/provider-settings-client';

export interface WizardSettings {
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

export interface ProviderWizardProps {
  initialSettings?: Partial<WizardSettings>;
  dismissable?: boolean;
  onSave: (settings: WizardSettings) => void;
  onDismiss?: () => void;
}

type ValidationState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export function ProviderWizard({
  initialSettings = {},
  dismissable = false,
  onSave,
  onDismiss,
}: ProviderWizardProps) {
  const [step, setStep] = useState(initialSettings.apiKey ? 2 : 1);
  const [apiKey, setApiKey] = useState(initialSettings.apiKey ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState(initialSettings.baseUrl ?? 'https://api.openai.com/v1');
  const [modelId, setModelId] = useState(initialSettings.modelId ?? 'gpt-4o');
  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' });

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setValidation({ status: 'error', message: 'Please enter an API key' });
      return;
    }
    setValidation({ status: 'validating' });
    try {
      const result = await checkProviderSettings({ apiKey, baseUrl, modelId });
      if (result.valid) {
        setValidation({ status: 'success' });
      } else {
        setValidation({
          status: 'error',
          message: result.error ?? 'Connection failed',
        });
      }
    } catch {
      setValidation({ status: 'error', message: 'Connection test failed' });
    }
  };

  const handleFinish = () => {
    onSave({ apiKey, baseUrl, modelId });
  };

  const canProceedFromStep1 = apiKey.trim().length > 0;
  const isValidated = validation.status === 'success';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl bg-[var(--surface)] p-6 shadow-xl border border-[var(--line)]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
            AI Provider Configuration
          </h2>
          {dismissable && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md p-1 text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)]"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step indicators */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  s <= step
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]'
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className="h-px w-8 bg-[var(--line)]" />}
            </div>
          ))}
        </div>

        {/* Step 1: API Key + Base URL */}
        {step === 1 && (
          <div className="space-y-4">
            {/* API Key Field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--sea-ink)]">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidation({ status: 'idle' });
                  }}
                  autoFocus
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 pr-10 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Base URL Field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--sea-ink)]">
                Provider URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setValidation({ status: 'idle' });
                }}
                placeholder="https://api.openai.com/v1"
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--accent)]"
              />
              <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                For custom providers, enter your API endpoint URL.
              </p>
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!canProceedFromStep1 || validation.status === 'validating'}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {validation.status === 'validating' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>

              {validation.status === 'success' && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check size={16} />
                  Connection successful
                </span>
              )}
              {validation.status === 'error' && (
                <span className="flex items-center gap-1 text-sm text-red-500">
                  <X size={16} />
                  {validation.message}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Model ID */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[var(--sea-ink)]">
              Model ID (optional)
            </label>
            <input
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="gpt-4o"
              autoFocus
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)] disabled:opacity-30"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && (!canProceedFromStep1 || !isValidated)}
              className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              <Check size={16} />
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
