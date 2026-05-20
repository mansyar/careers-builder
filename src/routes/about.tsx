import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Careers Builder — build your CV, find your role.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          A private, AI-powered CV Builder and Smart Job Opportunity Searcher. All your personal
          data stays on your machine — only conversational AI text reaches the LLM provider under
          strict no-retention terms.
        </p>
      </section>
    </main>
  );
}
