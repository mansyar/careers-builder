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

## Phase 2: Section Form Components [checkpoint: 201e1b1]

**Goal:** Build reusable section panel components for all 6 CV sections, each with proper field mappings, validation, and interactive behaviors.

- [x] **Task: CollapsibleSection component**
    - [x] Write failing test: component renders header, expands/collapses on click, animates
    - [x] Implement: `CollapsibleSection` with header, toggle button, content slot, smooth animation
    - [x] Verify tests pass (Green phase)
- [x] **Task: TagInput component**
    - [x] Write failing test: Enter key adds tag, X removes tag, keyboard-only flow works
    - [x] Implement: `TagInput` component with add-on-Enter, remove-on-click, empty state
    - [x] Verify tests pass (Green phase)
- [x] **Task: ContactSection component**
    - [x] Write failing test: renders all contact fields, maps to/from full_cv_json shape
    - [x] Implement: ContactSection with name, email, phone, location, linkedin, website fields
    - [x] Verify tests pass (Green phase)
- [x] **Task: ExecutiveSummarySection component**
    - [x] Write failing test: renders textarea, shows word count, enforces 500-word max
    - [x] Implement: ExecutiveSummarySection with textarea and word counter
    - [x] Verify tests pass (Green phase)
- [x] **Task: ExperienceSection component**
    - [x] Write failing test: add/remove/reorder entries, "Currently working" hides endDate
    - [x] Implement: ExperienceSection with repeatable entries, company/role/location/dates/description fields, current checkbox
    - [x] Verify tests pass (Green phase)
- [x] **Task: EducationSection component**
    - [x] Write failing test: add/remove entries, all fields render correctly
    - [x] Implement: EducationSection with repeatable entries, institution/degree/field/dates/gpa fields
    - [x] Verify tests pass (Green phase)
- [x] **Task: SkillsSection component**
    - [x] Write failing test: TagInput integration, skills array maps correctly
    - [x] Implement: SkillsSection with TagInput for skill list
    - [x] Verify tests pass (Green phase)
- [x] **Task: ProjectsSection component**
    - [x] Write failing test: add/remove/reorder entries, TagInput for technologies
    - [x] Implement: ProjectsSection with repeatable entries, name/role/description/technologies/url fields
    - [x] Verify tests pass (Green phase)

## Phase 3: Form Integration, Save Flow & Polish [checkpoint: 461114c]

**Goal:** Wire sections into the cv-builder page, implement the save flow with PUT endpoint, handle offline/error states, and add polish.

- [x] **Task: CvBuilder page integration**
    - [x] Write failing test: page renders all 6 section panels, populated from loader data
    - [x] Implement: wire sections into cv-builder route, pass loader data as props, manage form state
    - [x] Verify tests pass (Green phase)
- [x] **Task: Update existing placeholder tests**
    - [x] Update `src/routes/__tests__/cv-builder.spec.tsx`: replace the 3 placeholder tests (checking "Coming Soon" button and old empty state text) with tests matching the new form behavior
    - [x] Verify updated tests pass (Green phase)
- [x] **Task: Save button & PUT call**
    - [x] Write failing test: save button calls PUT with correct payload, handles success/error
    - [x] Implement: "Save Changes" button, PUT call with patch payload, success indicator, error banner with retry
    - [x] Verify tests pass (Green phase)
- [x] **Task: Offline & error states**
    - [x] Write failing test: save button disabled when offline, error banner shows on failure
    - [x] Implement: `navigator.onLine` detection, disabled state with tooltip, inline error banner
    - [x] Write failing test: skeleton loading state renders when loader is pending
    - [x] Implement: skeleton shimmer panels during loading
    - [x] Verify tests pass (Green phase)
- [x] **Task: Empty section placeholders**
    - [x] Write failing test: empty array fields show "No entries yet" placeholder
    - [x] Implement: empty state per section with add button
    - [x] Verify tests pass (Green phase)
