# Product Guidelines

## 1. Prose Style & Tone

### Voice
- **Professional & Approachable:** Use clear, confident language that inspires trust. Avoid jargon unless it's a defined term.
- **Concise & Direct:** Prefer short sentences and active voice. Every UI label, error message, and tooltip should communicate the action or state in as few words as possible.
- **Empathetic:** Acknowledge user effort. For long-running operations (embedding, scraping, PDF export), show progress and estimated time rather than a blank spinner.

### Terminology
- Use **"CV"** consistently — not "resume" or "curriculum vitae" — throughout the entire application.
- Use **"Career Sweep"** (capitalized) for the job search initiation action.
- Use **"Active Targeting Profile"** for the selected CV version used in job matching.
- Use **"Template"** for visual CV designs, **"Template Toggle"** for the switching mechanism.

---

## 2. Brand & Visual Identity

### Design Principle: Local-First, Professional-First
- The UI should convey **privacy, control, and professionalism**. No cloud-like abstractions (e.g., "syncing", "uploading").
- Use muted, professional color palettes. Avoid overly bright or playful colors.
- Status indicators (CPU/memory, network requests, embedding progress) should be subtle but present — the user should always know what their machine is doing.

### Layout Guidelines
- **Sidebar:** Persistent left sidebar for mode navigation (CV Builder | Job Search Matrix). Always visible.
- **Content Area:** Right-panel fills remaining space. Use a single-column layout for chat/interview, multi-column for comparison (template selection, job results).
- **Empty States:** Every view must have a well-designed empty state explaining what the view is for and how to start using it.

### Component Behavior
- **Streaming Text:** The AI chat messages must stream character-by-character with a visible cursor animation. Messages must be left-aligned (AI) and right-aligned (user).
- **Template Previews:** Must render at A4/Letter proportions within the viewport. Use CSS `aspect-ratio` to maintain print proportions.
- **Job Results:** Display as a ranked list with color-coded match scores (green < 0.3, yellow < 0.5, red >= 0.5). Each result must be expandable.

---

## 3. UX Principles

### Transparency
- **Show state:** Never hide system state from the user. If the model is downloading, show a progress bar. If scraping is in progress, show sources searched / total sources.
- **Show intent:** When a long operation starts, explain what will happen. Example: "Starting Career Sweep: I will search 5 job boards, embed each posting, and rank them against your CV."
- **Show failures:** Never silently fail. Every error must have a visible state, an explanation, and a recovery action.

### Data Sovereignty
- All data controls must be local. No buttons or labels suggesting "cloud save" or "sync."
- The first-run wizard must make the privacy model explicit: "Your data stays on your machine. Only chat text is sent to the AI provider."
- API key input must use a password-masked field with a "show" toggle.

### Offline First
- The application must never be fully non-functional due to network loss.
- CV editing, template switching, and PDF export must work without any network connection.
- Chat and job search views must show a clear "Requires network" placeholder when offline.
- Data mutations must not depend on network responses — they write locally first, always.

### Performance Expectations
- Chat streaming must start within 2 seconds of user input.
- Template switching must complete in under 500ms.
- PDF export must complete in under 10 seconds for a single-page CV.
- Vector search across 1,000 postings must return in under 1 second.

---

## 4. Writing Guidelines

### Error Messages
- **Format:** [What happened] + [Why it happened] + [What the user can do]
- **Example:** *"Connection to the AI provider was lost. Your interview progress is saved. You can retry or come back later."*
- Never use technical jargon in user-facing errors. No "streamText threw", "LLM provider error", "vector match failed".
- Use recovery actions: buttons labeled "Retry", "Configure Provider", "Export Anyway".

### Button Labels
- Start with a verb. Be specific.
- ✅ "Initiate Career Sweep" instead of "Search"
- ✅ "Export PDF" instead of "Download"
- ✅ "Done — Extract This Section" instead of "Submit"
- ✅ "Configure AI Provider" instead of "Settings"

### Placeholder Text
- Guide the user with examples.
- ✅ "e.g., Senior Software Engineer at Acme Corp" instead of "Enter job title"
- ✅ "e.g., Python, TypeScript, React" instead of "Enter skills"

---

## 5. Accessibility

- All interactive elements must be keyboard-navigable.
- Color must not be the only differentiator for match scores (use icons or labels alongside color).
- Chat streaming output must be announced to screen readers as it updates.
- Template previews must have `aria-label` describing the template name and active state.
- All icons must have `aria-hidden="true"` and text alternatives where relevant.
