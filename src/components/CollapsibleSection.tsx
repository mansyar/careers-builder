import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children?: ReactNode;
  defaultOpen?: boolean;
  emptyText?: string;
  onAdd?: () => void;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  emptyText = 'No entries yet. Add one?',
  onAdd,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasContent = children !== null && children !== undefined && children !== false;

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--chip-line)]">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between bg-[var(--chip-bg)] px-4 py-3 text-left font-semibold text-[var(--sea-ink)] transition-colors hover:bg-[var(--chip-line)]"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span
          className={`text-xs text-[var(--sea-ink-soft)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-4 py-3">
          {hasContent ? (
            children
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-[var(--sea-ink-soft)]">{emptyText}</p>
              {onAdd && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="rounded-full bg-[var(--sea-ink)] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Add
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
