interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface EducationSectionProps {
  data: EducationEntry[];
  onChange: (data: EducationEntry[]) => void;
}

export function EducationSection({ data, onChange }: EducationSectionProps) {
  const addEntry = () => {
    onChange([
      ...data,
      { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' },
    ]);
  };

  const removeEntry = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = data.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {data.map((entry, index) => (
        <div key={index} className="rounded-lg border border-[var(--chip-line)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--sea-ink)]">
              {entry.institution || `Education #${index + 1}`}
            </span>
            <button
              type="button"
              onClick={() => removeEntry(index)}
              className="rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
              aria-label={`Remove ${entry.institution || 'entry'}`}
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Institution
              </label>
              <input
                type="text"
                value={entry.institution}
                onChange={(e) => updateEntry(index, 'institution', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Degree
              </label>
              <input
                type="text"
                value={entry.degree}
                onChange={(e) => updateEntry(index, 'degree', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Field of Study
              </label>
              <input
                type="text"
                value={entry.field}
                onChange={(e) => updateEntry(index, 'field', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
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
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                GPA (optional)
              </label>
              <input
                type="text"
                value={entry.gpa}
                onChange={(e) => updateEntry(index, 'gpa', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--sea-ink-soft)]">
          No education entries yet.
        </p>
      )}

      <button
        type="button"
        onClick={addEntry}
        className="mt-2 rounded-full border border-dashed border-[var(--chip-line)] px-4 py-2 text-sm text-[var(--sea-ink-soft)] transition-colors hover:border-[var(--sea-ink)] hover:text-[var(--sea-ink)]"
      >
        + Add Education
      </button>
    </div>
  );
}
