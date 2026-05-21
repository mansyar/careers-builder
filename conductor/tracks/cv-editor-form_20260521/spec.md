# Track 1.2 — Manual CV Editor Form

## Overview

Build a manual CV editor form at `/cv-builder` that renders all CV sections (Contact, Executive Summary, Experience, Education, Skills, Projects) with fields mapped from `full_cv_json`. Users can edit their CV data directly — without the AI chat — and save changes via the existing `PUT /api/cv/:cvProfileId/version/:versionId` endpoint. The form works fully offline via TanStack Router loader caching.

## Functional Requirements

### FR1: Profile Initialization
- When a user visits `/cv-builder` for the first time and no CV profile exists, the app calls `POST /api/cv` to create a new profile with an empty first version.
- The profile ID and active version ID are stored in the TanStack Router loader state for subsequent requests.
- On subsequent visits, the loader fetches the existing active version via `GET /api/cv/:cvProfileId/version/:activeVersionId`.

### FR2: CV Form Sections

**FR2.1 — Contact Section**
- Fields: `name` (text), `email` (email), `phone` (tel), `location` (text), `linkedin` (url), `website` (url)
- All fields optional except `name`.

**FR2.2 — Executive Summary**
- A single `summary` textarea field (plain text, 500-word max).

**FR2.3 — Experience (repeatable)**
- Array of entries, each with: `company` (text), `role` (text), `location` (text), `startDate` (date), `endDate` (date, nullable if current), `current` (checkbox), `description` (array of bullet-point strings)
- User can add, remove, and reorder entries.
- "Currently working here" checkbox hides the `endDate` field.

**FR2.4 — Education (repeatable)**
- Array of entries, each with: `institution` (text), `degree` (text), `field` (text), `startDate` (date), `endDate` (date), `gpa` (text, optional)
- User can add and remove entries.

**FR2.5 — Skills**
- Array of skill strings (e.g., `["Python", "TypeScript", "React"]`).
- Simple tag-style input: type skill name, press Enter/comma to add, click X to remove.
- Optional categorization support via an adjacent text field per category group.

**FR2.6 — Projects (repeatable)**
- Array of entries, each with: `name` (text), `role` (text), `description` (textarea), `technologies` (tag-style array), `url` (url, optional)
- User can add, remove, and reorder entries.

### FR3: Collapsible Section Panels
- Each section renders as a collapsible panel with a header (section name) and expand/collapse toggle.
- Multiple sections can be open simultaneously.
- Section state (expanded/collapsed) is local state, not persisted.
- Empty sections show a "No entries yet. Add one?" placeholder with an add button.

### FR4: Save & Versioning
- A "Save Changes" button at the top of the form (and/or at the bottom) triggers a `PUT /api/cv/:cvProfileId/version/:activeVersionId` with the full form data as the `patch` payload.
- Each save creates a new version (copy-on-write, already implemented server-side).
- After save, the loader updates with the new `activeVersionId` and `full_cv_json`.
- A "Saved" confirmation toast/indicator appears on success.
- Error state shows an inline error banner with a retry button.

### FR5: Offline Support
- The current CV version's `full_cv_json` is cached in the TanStack Router loader data.
- The form reads from and writes to this cached state — no network required for editing.
- The "Save Changes" button requires network (PUT call). When offline, it shows a disabled state with tooltip "Come back online to save changes."
- Unsaved changes remain in-form (React component state) even if the user navigates away and comes back (caveat: page refresh loses unsaved changes — this is acceptable for MVP).

### FR6: Loading & Empty States
- **Loading**: Skeleton panels shimmer while the loader fetches CV data.
- **Empty (no profile yet)**: Auto-create profile, show empty form with all sections collapsed.
- **Error**: Inline error banner with "Retry" button if the initial profile creation or fetch fails.

## Non-Functional Requirements

- All form state changes must feel instant (no waiting for network on field edits).
- Section expand/collapse must complete in under 100ms.
- Tag input for skills must support keyboard-only flow (type → Enter → add).
- All form inputs must be keyboard-navigable.

## Acceptance Criteria

- [ ] Visiting `/cv-builder` for the first time auto-creates a CV profile and shows an empty form.
- [ ] All 6 sections render with correct fields mapped from `full_cv_json`.
- [ ] Repeatable sections (Experience, Education, Projects) support add/remove/reorder.
- [ ] Tag input (Skills, project technologies) works via keyboard (Enter to add, X to remove).
- [ ] Filling in fields, clicking "Save Changes" calls PUT and creates a new version.
- [ ] After save, the form reflects the updated `full_cv_json` from the new version.
- [ ] Refreshing the page re-fetches the latest version data and populates the form.
- [ ] Editing again and saving creates another version (copy-on-write).
- [ ] Collapsible panels expand/collapse with smooth animation.
- [ ] Experience section: checking "Currently working here" hides the endDate field.
- [ ] Offline: form fields are editable, Save button shows disabled state.
- [ ] Error state: failed save shows inline error with retry button.

## Out of Scope

- AI-powered extraction (handled in Phase 2 tracks).
- Template preview rendering (handled in Phase 3 tracks).
- PDF export (handled in Phase 3 tracks).
- CV version history view (current version only).
