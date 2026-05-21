import { TagInput } from './TagInput';

interface SkillsSectionProps {
  data: string[];
  onChange: (data: string[]) => void;
}

export function SkillsSection({ data, onChange }: SkillsSectionProps) {
  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">Skills</label>
      <TagInput tags={data} onChange={onChange} placeholder="Type a skill and press Enter..." />
    </div>
  );
}
