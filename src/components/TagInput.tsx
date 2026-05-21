import { useState, type KeyboardEvent, type ChangeEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Type a skill and press Enter...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Prevent duplicates
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const removeTag = (index: number) => {
    const updated = tags.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2">
      {tags.map((tag, index) => (
        <span
          key={`${index}-${tag}`}
          className="flex items-center gap-1 rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-sm text-[var(--sea-ink)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-xs leading-none text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--chip-line)] hover:text-[var(--sea-ink)]"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-[var(--sea-ink)] outline-none placeholder:text-[var(--sea-ink-soft)]"
      />
    </div>
  );
}
