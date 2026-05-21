import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Careers Builder</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Build your CV. Find your next role.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          A private, AI-powered CV Builder and Smart Job Opportunity Searcher. All your data stays
          on your machine.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/cv-builder"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Build Your CV
          </Link>
          <Link
            to="/job-search"
            className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
          >
            Search Jobs
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          [
            'AI-Powered CV Builder',
            'Guided chat interview that extracts your professional details and maps them onto multiple design templates.',
            '/cv-builder' as const,
          ],
          [
            'Smart Job Search',
            'Semantic search engine that reads your CV, scrapes live job postings, and ranks them by relevance.',
            '/job-search' as const,
          ],
          [
            'Local-First Privacy',
            'All personal data stays on your machine. Only conversation text reaches the LLM under no-retention terms.',
            null,
          ],
          [
            'Multi-Template Engine',
            'Switch between Modern Minimalist, Executive Traditional, and Creative Tech templates instantly.',
            null,
          ],
        ].map(([title, desc, route], index) => {
          const content = (
            <article
              className={`island-shell feature-card rise-in rounded-2xl p-5 ${
                route ? 'cursor-pointer' : ''
              }`}
              style={{ animationDelay: `${index * 90 + 80}ms` }}
            >
              <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
              <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
            </article>
          );

          if (route) {
            return (
              <Link key={title} to={route} className="no-underline">
                {content}
              </Link>
            );
          }

          return <div key={title}>{content}</div>;
        })}
      </section>
    </main>
  );
}
