interface ExecutiveSummarySectionProps {
  data: string;
  onChange: (value: string) => void;
}

const MAX_WORDS = 500;

export function ExecutiveSummarySection({ data, onChange }: ExecutiveSummarySectionProps) {
  const wordCount = data ? data.trim().split(/\s+/).filter(Boolean).length : 0;
  const overLimit = wordCount > MAX_WORDS;

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
        Professional Summary
      </label>
      <textarea
        value={data}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm text-[var(--sea-ink)] outline-none transition-colors focus:border-[var(--sea-ink)]"
        placeholder="Briefly describe your professional background and career objectives..."
      />
      <div
        className={`text-right text-xs ${overLimit ? 'font-semibold text-red-500' : 'text-[var(--sea-ink-soft)]'}`}
      >
        {wordCount}/{MAX_WORDS} words
        {overLimit && ' (over limit)'}
      </div>
    </div>
  );
}
