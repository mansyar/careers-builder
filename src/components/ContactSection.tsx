interface ContactData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

interface ContactSectionProps {
  data: ContactData;
  onChange: (data: ContactData) => void;
}

export function ContactSection({ data, onChange }: ContactSectionProps) {
  const updateField = (field: keyof ContactData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const fields: Array<{ key: keyof ContactData; label: string; type: string; required?: boolean }> =
    [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'tel' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
      { key: 'website', label: 'Website', type: 'url' },
    ];

  return (
    <div className="space-y-4">
      {fields.map(({ key, label, type, required }) => (
        <div key={key}>
          <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <input
            type={type}
            value={data[key]}
            onChange={(e) => updateField(key, e.target.value)}
            required={required}
            className="w-full rounded-lg border border-[var(--chip-line)] bg-white px-3 py-2 text-sm text-[var(--sea-ink)] outline-none transition-colors focus:border-[var(--sea-ink)]"
          />
        </div>
      ))}
    </div>
  );
}
