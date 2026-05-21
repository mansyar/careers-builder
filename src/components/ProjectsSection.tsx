import { TagInput } from './TagInput';

interface ProjectEntry {
  name: string;
  role: string;
  description: string;
  technologies: string[];
  url: string;
}

interface ProjectsSectionProps {
  data: ProjectEntry[];
  onChange: (data: ProjectEntry[]) => void;
}

export function ProjectsSection({ data, onChange }: ProjectsSectionProps) {
  const addEntry = () => {
    onChange([...data, { name: '', role: '', description: '', technologies: [], url: '' }]);
  };

  const removeEntry = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof ProjectEntry, value: string | string[]) => {
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
              {entry.name || `Project #${index + 1}`}
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
                aria-label={`Remove ${entry.name || 'entry'}`}
              >
                Remove
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Project Name
              </label>
              <input
                type="text"
                value={entry.name}
                onChange={(e) => updateEntry(index, 'name', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Your Role
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
                Description
              </label>
              <textarea
                value={entry.description}
                onChange={(e) => updateEntry(index, 'description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                Technologies
              </label>
              <TagInput
                tags={entry.technologies}
                onChange={(tags) => updateEntry(index, 'technologies', tags)}
                placeholder="Type a technology..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
                URL (optional)
              </label>
              <input
                type="url"
                value={entry.url}
                onChange={(e) => updateEntry(index, 'url', e.target.value)}
                className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--sea-ink)]"
              />
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--sea-ink-soft)]">No projects yet.</p>
      )}

      <button
        type="button"
        onClick={addEntry}
        className="mt-2 rounded-full border border-dashed border-[var(--chip-line)] px-4 py-2 text-sm text-[var(--sea-ink-soft)] transition-colors hover:border-[var(--sea-ink)] hover:text-[var(--sea-ink)]"
      >
        + Add Project
      </button>
    </div>
  );
}
