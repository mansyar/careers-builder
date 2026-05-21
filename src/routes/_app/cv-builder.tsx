import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { useEffect } from 'react';
import { getCvProfileData } from '../../lib/server/cv-loader-server';

export interface CvProfilerLoaderData {
  profileId: number;
  activeVersionId: number;
  full_cv_json: Record<string, unknown>;
}

export const Route = createFileRoute('/_app/cv-builder')({
  loader: async (): Promise<CvProfilerLoaderData> => {
    const data = await getCvProfileData();
    return {
      profileId: data.profileId,
      activeVersionId: data.activeVersionId,
      full_cv_json: data.full_cv_json as Record<string, unknown>,
    };
  },
  staleTime: 30_000,
  component: CvBuilder,
  pendingComponent: CvBuilderSkeleton,
});

function CvBuilderSkeleton() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-[var(--chip-bg)]" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-4 rounded-lg border border-[var(--chip-line)] p-4">
          <div className="mb-3 h-6 w-32 animate-pulse rounded bg-[var(--chip-bg)]" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--chip-bg)]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--chip-bg)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CvBuilder() {
  const data = useLoaderData({ from: '/_app/cv-builder' });

  // Persist profileId and activeVersionId to localStorage after loader data resolves
  useEffect(() => {
    if (data?.profileId) {
      localStorage.setItem('cvProfileId', String(data.profileId));
      localStorage.setItem('cvActiveVersionId', String(data.activeVersionId));
    }
  }, [data?.profileId, data?.activeVersionId]);

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--sea-ink)]">CV Builder</h2>
      </div>

      <p className="mb-6 text-base text-[var(--sea-ink-soft)]">
        Edit your CV details manually. All changes are saved locally until you click &ldquo;Save
        Changes&rdquo;.
      </p>

      <div className="space-y-4">
        {/* Sections will be rendered here in Phase 2 */}
        <p className="py-8 text-center text-[var(--sea-ink-soft)]">
          Form sections will appear here once implemented.
        </p>
      </div>
    </div>
  );
}
