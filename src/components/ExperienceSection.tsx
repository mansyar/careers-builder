interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

interface ExperienceSectionProps {
  data: ExperienceEntry[];
  onChange: (data: ExperienceEntry[]) => void;
}

export function ExperienceSection({ data, onChange }: ExperienceSectionProps) {
  const addEntry = () => {
    onChange([
      ...data,
      {
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: [],
      },
    ]);
  };

  const removeEntry = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof ExperienceEntry, value: unknown) => {
    const updated = data.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    onChange(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...data];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const moveDown = (index: number) => {
    if (index === data.length - 1) return;
    const updated = [...data];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {data.map((entry, index) => (
        <div key={index} className="rounded-lg border border-[var(--chip-line)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--sea-ink)]">
              {entry.company || `Experience #${index + 1}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="rounded px-2 py-1 text-xs text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--chip-bg)] disabled:opacity-30"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === data.length - 1}
                className="rounded px-2 py-1 text-xs text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--chip-bg)] disabled:opacity-30"
                aria-label="Move down"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="ml-2 rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                aria-label={`Remove ${entry.company || 'entry'}`}
              >
                Remove
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Company
              </label>
              <input
                type="text"
                value={entry.company}
                onChange={(e) => updateEntry(index, 'company', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Role
              </label>
              <input
                type="text"
                value={entry.role}
                onChange={(e) => updateEntry(index, 'role', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Location
              </label>
              <input
                type="text"
                value={entry.location}
                onChange={(e) => updateEntry(index, 'location', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={entry.current}
                  onChange={(e) => updateEntry(index, 'current', e.target.checked)}
                  className="rounded border-[var(--chip-line)]"
                />
                Currently working here
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Start Date
              </label>
              <input
                type="date"
                value={entry.startDate}
                onChange={(e) => updateEntry(index, 'startDate', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            {!entry.current && (
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                  End Date
                </label>
                <input
                  type="date"
                  value={entry.endDate}
                  onChange={(e) => updateEntry(index, 'endDate', e.target.value)}
                  className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--sea-ink-soft)]">
          No experience entries yet.
        </p>
      )}

      <button
        type="button"
        onClick={addEntry}
        className="mt-2 rounded-full border border-dashed border-[var(--chip-line)] px-4 py-2 text-sm text-[var(--sea-ink-soft)] transition-colors hover:border-[var(--sea-ink)] hover:text-[var(--sea-ink)]"
      >
        + Add Experience
      </button>
    </div>
  );
}
