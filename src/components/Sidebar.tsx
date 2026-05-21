import { Link } from '@tanstack/react-router';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/cv-builder', label: 'CV Builder' },
  { to: '/job-search', label: 'Job Search' },
] as const;

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--line)] bg-[var(--surface)] py-4">
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)]"
            activeProps={{
              className:
                'rounded-lg px-3 py-2 text-sm font-semibold bg-[var(--chip-bg)] text-[var(--sea-ink)] is-active',
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
