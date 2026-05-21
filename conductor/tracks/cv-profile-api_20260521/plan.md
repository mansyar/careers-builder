# Implementation Plan: CV Profile & Version API

Implementation follows the existing decoupled pattern: write handler functions in `src/lib/server/`, then wire them as TanStack Start server routes. Each handler follows TDD (Red → Green).

---

## Phase 1 - CV Profile Handler Layer [checkpoint: TBD]

Goal: Create all decoupled, testable handler functions for CV profile and version operations. Each handler accepts a `Database` instance and returns typed results — no HTTP/routing concerns.

### Files to create:
- `src/lib/server/deep-merge.ts` — Generic deep merge utility
- `src/lib/server/deep-merge.spec.ts` — deepMerge tests
- `src/lib/server/cv-profiles.ts` — Handler functions
- `src/lib/server/cv-profiles.spec.ts` — Tests

- [x] Task 1.1: deepMerge utility function (1b3b4bb)
    - [x] Write failing test: merges nested objects (existing keys preserved, new keys added)
    - [x] Write failing test: arrays in source replace (not merge) arrays in target
    - [x] Write failing test: null/undefined patch values do not throw
    - [x] Write failing test: primitive values in patch replace primitives in target
    - [x] Implement deepMerge(target, source) in `src/lib/server/deep-merge.ts`
    - [x] Verify all tests pass
- [x] Task 1.2: createCvProfile handler — create profile + first empty version (8e0ae98)
    - [x] Write failing test: auto-creates default user (id=1) if missing
    - [x] Write failing test: creates a cv_profiles row with user_id=1
    - [x] Write failing test: auto-creates first cv_profile_versions row (version_number=1, version_label='Initial', full_cv_json='{}')
    - [x] Write failing test: returns { id, activeVersionId }
    - [x] Implement createCvProfile(db) handler
    - [x] Verify all tests pass
- [x] Task 1.3: listVersions handler — list all versions for a profile (e3f358c)
    - [x] Write failing test: returns versions array ordered by version_number DESC
    - [x] Write failing test: returns activeVersionId from cv_profiles
    - [x] Write failing test: returns empty versions array for non-existent profile
    - [x] Implement listVersions(db, cvProfileId) handler
    - [x] Verify all tests pass
- [ ] Task 1.4: getVersion handler — fetch single version with full_cv_json
    - [ ] Write failing test: returns full version object with all fields
    - [ ] Write failing test: returns null indicator when version does not exist
    - [ ] Write failing test: validates that version belongs to the specified profile
    - [ ] Implement getVersion(db, cvProfileId, versionId) handler
    - [ ] Verify all tests pass
- [ ] Task 1.5: updateVersion handler — deep merge + copy-on-write
    - [ ] Write failing test: deep merges patch into existing full_cv_json
    - [ ] Write failing test: arrays in patch replace (not merge) arrays in existing
    - [ ] Write failing test: copy-on-write creates new version row when updating active version
    - [ ] Write failing test: copy-on-write updates cv_profiles.active_version_id
    - [ ] Write failing test: copy-on-write copies version_label from previous version when not provided
    - [ ] Write failing test: copy-on-write uses provided versionLabel when given
    - [ ] Write failing test: in-place mutation when updating historical (non-active) version
    - [ ] Write failing test: handles null/undefined in patch gracefully
    - [ ] Write failing test: returns full version object with merged data
    - [ ] Implement updateVersion(db, cvProfileId, versionId, patch, versionLabel?) handler
    - [ ] Verify all tests pass
- [ ] Task 1.6: Conductor - User Manual Verification 'Phase 1 - CV Profile Handler Layer' (Protocol in workflow.md)

---

## Phase 2 - API Route Wiring & Acceptance [checkpoint: TBD]

Goal: Wrap handler functions as thin TanStack Start server routes. Route tests are kept light since all business logic is already tested in Phase 1 — only the request/response wiring is verified here.

### Files to create:
- `src/routes/api/cv.ts` — POST /api/cv
- `src/routes/api/cv/$cvProfileId/versions.ts` — GET versions list
- `src/routes/api/cv/$cvProfileId/version/$versionId.ts` — GET single version + PUT update
- `src/routes/api/__tests__/cv-acceptance.spec.ts` — Full flow acceptance test
- `conductor/tech-stack.md` — Add deviation notes

- [ ] Task 2.1: Create POST /api/cv route
    - [ ] Implement route at `src/routes/api/cv.ts` calling createCvProfile
    - [ ] Verify dev server starts and route is registered (`pnpm dev`)
- [ ] Task 2.2: Create GET /api/cv/:cvProfileId/versions route
    - [ ] Implement route at `src/routes/api/cv/$cvProfileId/versions.ts` calling listVersions
    - [ ] Verify route is registered
- [ ] Task 2.3: Create GET + PUT /api/cv/:cvProfileId/version/:versionId route
    - [ ] Implement GET handler at `src/routes/api/cv/$cvProfileId/version/$versionId.ts` calling getVersion
    - [ ] Implement PUT handler calling updateVersion
    - [ ] Verify route is registered
- [ ] Task 2.4: Write full-flow acceptance test
    - [ ] Create profile → verify { id, activeVersionId }
    - [ ] Add CV data via PUT → verify merged full_cv_json
    - [ ] Verify data via GET single version → matches PUT response
    - [ ] PUT again to trigger copy-on-write → verify new version_number
    - [ ] Verify activeVersionId updated after copy-on-write
    - [ ] Verify historical version GET still returns old data (immutable)
    - [ ] Verify all handler tests pass
    - [ ] Verify coverage meets 80% threshold
    - [ ] Run `CI=true pnpm test -- --coverage` and confirm
- [ ] Task 2.5: Document deviations in tech-stack.md
    - [ ] Add deviation note: POST /api/cv added (not in TDD §4)
    - [ ] Add deviation note: PUT response includes versionLabel + createdAt
    - [ ] Add deviation note: PUT request accepts optional versionLabel
- [ ] Task 2.6: Conductor - User Manual Verification 'Phase 2 - API Route Wiring & Acceptance' (Protocol in workflow.md)
