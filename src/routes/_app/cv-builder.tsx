import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/cv-builder')({
  component: CvBuilder,
});

function CvBuilder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="mb-3 text-2xl font-bold text-[var(--sea-ink)]">CV Builder</h2>
      <p className="mb-6 max-w-md text-base text-[var(--sea-ink-soft)]">
        No CV yet. Start the guided interview to build your CV.
      </p>
      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink-soft)] opacity-60"
        title="Coming soon"
      >
        Coming Soon
      </button>
    </div>
  );
}
