# Track: Track 1.2 — Manual CV Editor Form

## Phase 1: CV Form Data Layer & Route Setup

**Goal:** Wire up the `/cv-builder` route with a TanStack Router loader that initializes the CV profile, fetches the active version, and caches data for offline access.

- [ ] **Task: Profile initialization service**
    - [ ] Write failing test: loader creates profile via POST /api/cv when none exists
    - [ ] Implement: profile initialization logic in the route loader (calls POST /api/cv on first visit)
    - [ ] Write failing test: loader fetches existing active version on subsequent visits
    - [ ] Implement: fetch logic in the route loader (calls GET /api/cv/:id/version/:versionId)
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Route loader integration**
    - [ ] Write failing test: cv-builder route exports loader with correct shape
    - [ ] Implement: TanStack Router loader on `/_app/cv-builder.tsx` using `createFileRoute` with `loader`
    - [ ] Implement: store profileId and activeVersionId in loader context for downstream use
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Offline caching**
    - [ ] Write failing test: loader caches full_cv_json data
    - [ ] Implement: `gcTime` and `staleTime` configuration on the loader for offline persistence
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)**

## Phase 2: Section Form Components

**Goal:** Build reusable section panel components for all 6 CV sections, each with proper field mappings, validation, and interactive behaviors.

- [ ] **Task: CollapsibleSection component**
    - [ ] Write failing test: component renders header, expands/collapses on click, animates
    - [ ] Implement: `CollapsibleSection` with header, toggle button, content slot, smooth animation
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: TagInput component**
    - [ ] Write failing test: Enter key adds tag, X removes tag, keyboard-only flow works
    - [ ] Implement: `TagInput` component with add-on-Enter, remove-on-click, empty state
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: ContactSection component**
    - [ ] Write failing test: renders all contact fields, maps to/from full_cv_json shape
    - [ ] Implement: ContactSection with name, email, phone, location, linkedin, website fields
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: ExecutiveSummarySection component**
    - [ ] Write failing test: renders textarea, shows word count, enforces 500-word max
    - [ ] Implement: ExecutiveSummarySection with textarea and word counter
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: ExperienceSection component**
    - [ ] Write failing test: add/remove/reorder entries, "Currently working" hides endDate
    - [ ] Implement: ExperienceSection with repeatable entries, company/role/location/dates/description fields, current checkbox
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: EducationSection component**
    - [ ] Write failing test: add/remove entries, all fields render correctly
    - [ ] Implement: EducationSection with repeatable entries, institution/degree/field/dates/gpa fields
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: SkillsSection component**
    - [ ] Write failing test: TagInput integration, skills array maps correctly
    - [ ] Implement: SkillsSection with TagInput for skill list
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: ProjectsSection component**
    - [ ] Write failing test: add/remove/reorder entries, TagInput for technologies
    - [ ] Implement: ProjectsSection with repeatable entries, name/role/description/technologies/url fields
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)**

## Phase 3: Form Integration, Save Flow & Polish

**Goal:** Wire sections into the cv-builder page, implement the save flow with PUT endpoint, handle offline/error states, and add polish.

- [ ] **Task: CvBuilder page integration**
    - [ ] Write failing test: page renders all 6 section panels, populated from loader data
    - [ ] Implement: wire sections into cv-builder route, pass loader data as props, manage form state
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Save button & PUT call**
    - [ ] Write failing test: save button calls PUT with correct payload, handles success/error
    - [ ] Implement: "Save Changes" button, PUT call with patch payload, success indicator, error banner with retry
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Offline & error states**
    - [ ] Write failing test: save button disabled when offline, error banner shows on failure
    - [ ] Implement: `navigator.onLine` detection, disabled state with tooltip, inline error banner
    - [ ] Write failing test: skeleton loading state renders when loader is pending
    - [ ] Implement: skeleton shimmer panels during loading
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Empty section placeholders**
    - [ ] Write failing test: empty array fields show "No entries yet" placeholder
    - [ ] Implement: empty state per section with add button
    - [ ] Verify tests pass (Green phase)
- [ ] **Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)**
