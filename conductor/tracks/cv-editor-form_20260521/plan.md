# Track: Track 1.2 — Manual CV Editor Form

## Phase 1: CV Form Data Layer & Route Setup [checkpoint: 0f43887]

**Goal:** Wire up the `/cv-builder` route with a TanStack Router loader that initializes the CV profile, fetches the active version, and caches data for offline access.

- [x] **Task: Profile initialization service**
    - [x] Write failing test: loader calls `createCvProfile()` directly (imported from handler) when no profile exists
    - [x] Implement: profile initialization logic — `cv-loader.ts` imports and calls `createCvProfile()` from `../cv-profiles.ts`
    - [x] Write failing test: profileId is persisted to localStorage after creation
    - [x] Implement: localStorage persistence for profileId on first creation (useEffect in cv-builder.tsx)
    - [x] Write failing test: loader looks up profileId from localStorage on subsequent visits
    - [x] Write failing test: loader falls back to DB query (`SELECT ... FROM cv_profiles WHERE user_id = 1 ORDER BY id DESC LIMIT 1`) when localStorage is empty
    - [x] Implement: lookup logic — loadOrCreateProfile checks DB for user 1 profile; component stores/reads from localStorage
    - [x] Write failing test: loader calls `getVersion()` directly to fetch active version data
    - [x] Implement: fetch logic — `cv-loader.ts` imports and calls `getVersion()` from `../cv-profiles.ts`
    - [x] Verify tests pass (Green phase for server function)
- [x] **Task: Route loader integration**
    - [x] Write failing test: cv-builder route exports loader with correct shape
    - [x] Implement: create `src/lib/server/cv-loader-server.ts` with the server-side loader logic via `createServerFn` (decoupled handler pattern, consistent with `src/lib/server/cv-profiles.ts`)
    - [x] Implement: wire the loader into `/_app/cv-builder.tsx` using `createFileRoute` with `loader` option
    - [x] Implement: pass `profileId`, `activeVersionId`, and `full_cv_json` as loader return data to the component
    - [x] Verify tests pass (Green phase)
- [x] **Task: Offline caching**
    - [x] Write failing test: loader data survives client-side navigation (TanStack Router built-in cache)
    - [x] Implement: rely on TanStack Router's built-in client-side data caching. Configure `staleTime: 30_000` for preloading behavior. Router loaders cache data automatically across SPA navigation.
    - [x] Verify tests pass (Green phase)

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
- [ ] **Task: Update existing placeholder tests**
    - [ ] Update `src/routes/__tests__/cv-builder.spec.tsx`: replace the 3 placeholder tests (checking "Coming Soon" button and old empty state text) with tests matching the new form behavior
    - [ ] Verify updated tests pass (Green phase)
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
