import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import { getCvProfileData } from '../../lib/server/cv-loader-server';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { ContactSection } from '../../components/ContactSection';
import { ExecutiveSummarySection } from '../../components/ExecutiveSummarySection';
import { ExperienceSection } from '../../components/ExperienceSection';
import { EducationSection } from '../../components/EducationSection';
import { SkillsSection } from '../../components/SkillsSection';
import { ProjectsSection } from '../../components/ProjectsSection';

interface ContactData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface ProjectEntry {
  name: string;
  role: string;
  description: string;
  technologies: string[];
  url: string;
}

interface CvFormData {
  contact: ContactData;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
}

export interface CvProfilerLoaderData {
  profileId: number;
  activeVersionId: number;
  full_cv_json: Record<string, unknown>;
}

function getDefaultFormData(): CvFormData {
  return {
    contact: { name: '', email: '', phone: '', location: '', linkedin: '', website: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };
}

// Helper to extract typed fields from the raw JSON payload from the server.
// Type assertions are safe here because the schema is controlled server-side
// (serialized from the same TypeScript interfaces that define the form data).
function mapJsonToFormData(json: Record<string, unknown>): CvFormData {
  const contact = (json.contact as ContactData) ?? getDefaultFormData().contact;
  const summary = (json.summary as string) ?? '';
  const experience = (json.experience as ExperienceEntry[]) ?? [];
  const education = (json.education as EducationEntry[]) ?? [];
  const skills = (json.skills as string[]) ?? [];
  const projects = (json.projects as ProjectEntry[]) ?? [];
  return { contact, summary, experience, education, skills, projects };
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

  const [formData, setFormData] = useState<CvFormData>(() =>
    data?.full_cv_json ? mapJsonToFormData(data.full_cv_json) : getDefaultFormData(),
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const profileId = data?.profileId;
  const activeVersionId = data?.activeVersionId;

  // Persist profileId and activeVersionId to localStorage after loader data resolves
  useEffect(() => {
    if (profileId) {
      localStorage.setItem('cvProfileId', String(profileId));
      localStorage.setItem('cvActiveVersionId', String(activeVersionId));
    }
  }, [profileId, activeVersionId]);

  const handleSave = useCallback(async () => {
    if (!profileId || !activeVersionId) return;

    setSaveStatus('saving');

    try {
      const response = await fetch(`/api/cv/${profileId}/version/${activeVersionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch: formData, versionLabel: 'Manual edit' }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const result = (await response.json()) as {
        id: number;
        versionNumber: number;
        full_cv_json: Record<string, unknown>;
      };

      // Update localStorage with new active version
      localStorage.setItem('cvActiveVersionId', String(result.id));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [profileId, activeVersionId, formData]);

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--sea-ink)]">CV Builder</h2>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600 transition-opacity">
              Saved!
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-sm font-medium text-red-500">
              Save failed
            </span>
          )}
          {isOffline ? (
            <span
              className="cursor-not-allowed rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-5 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] opacity-60"
              title="Come back online to save changes."
            >
              Save Changes
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="rounded-full bg-[var(--sea-ink)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <p className="mb-6 text-base text-[var(--sea-ink-soft)]">
        Edit your CV details manually. All changes are saved locally until you click &ldquo;Save
        Changes&rdquo;.
      </p>

      {saveStatus === 'error' && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">Failed to save your changes. Please try again.</p>
          <button
            type="button"
            onClick={handleSave}
            className="ml-auto rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        <CollapsibleSection title="Contact" defaultOpen>
          <ContactSection
            data={formData.contact}
            onChange={(contact) => setFormData((prev) => ({ ...prev, contact }))}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Executive Summary" defaultOpen>
          <ExecutiveSummarySection
            data={formData.summary}
            onChange={(summary) => setFormData((prev) => ({ ...prev, summary }))}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Experience"
          defaultOpen
          emptyText="No experience entries yet. Add one?"
          onAdd={() =>
            setFormData((prev) => ({
              ...prev,
              experience: [
                ...prev.experience,
                {
                  company: '',
                  role: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  current: false,
                  description: [],
                },
              ],
            }))
          }
        >
          <ExperienceSection
            data={formData.experience}
            onChange={(experience) => setFormData((prev) => ({ ...prev, experience }))}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Education"
          defaultOpen
          emptyText="No education entries yet. Add one?"
          onAdd={() =>
            setFormData((prev) => ({
              ...prev,
              education: [
                ...prev.education,
                { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' },
              ],
            }))
          }
        >
          <EducationSection
            data={formData.education}
            onChange={(education) => setFormData((prev) => ({ ...prev, education }))}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Skills"
          defaultOpen
          emptyText="Type a skill below and press Enter to add it."
        >
          <SkillsSection
            data={formData.skills}
            onChange={(skills) => setFormData((prev) => ({ ...prev, skills }))}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Projects"
          defaultOpen
          emptyText="No projects yet. Add one?"
          onAdd={() =>
            setFormData((prev) => ({
              ...prev,
              projects: [
                ...prev.projects,
                { name: '', role: '', description: '', technologies: [], url: '' },
              ],
            }))
          }
        >
          <ProjectsSection
            data={formData.projects}
            onChange={(projects) => setFormData((prev) => ({ ...prev, projects }))}
          />
        </CollapsibleSection>
      </div>
    </div>
  );
}
