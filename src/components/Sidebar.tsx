import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/cv-builder', label: 'CV Builder' },
  { to: '/job-search', label: 'Job Search' },
] as const;

const DESKTOP_BREAKPOINT = 768;

function SidebarContent() {
  return (
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
  );
}

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  // Close sidebar on navigation (when a link is clicked on mobile)
  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  if (!isMobile) {
    return (
      <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] py-4">
        <SidebarContent />
      </aside>
    );
  }

  return (
    <>
      {/* Hamburger toggle button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] shadow-sm"
        aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        <span className="sr-only">{isMobileOpen ? 'Close' : 'Menu'}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          {isMobileOpen ? (
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {/* Backdrop overlay — interactive button so screen readers can dismiss sidebar */}
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 cursor-default"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* Mobile sidebar panel */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-[var(--line)] bg-[var(--surface)] py-4 pt-14 shadow-xl transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div onClick={handleNavClick}>
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
