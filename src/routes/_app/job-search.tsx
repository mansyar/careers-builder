import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/job-search')({
  component: JobSearch,
});

function JobSearch() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="mb-3 text-2xl font-bold text-[var(--sea-ink)]">Job Search</h2>
      <p className="mb-6 max-w-md text-base text-[var(--sea-ink-soft)]">
        No job searches yet. Create a CV first to start searching.
      </p>
    </div>
  );
}
