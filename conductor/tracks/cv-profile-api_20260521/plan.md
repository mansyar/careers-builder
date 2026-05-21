# Implementation Plan: CV Profile & Version API

Implementation follows the existing decoupled pattern: write handler functions in `src/lib/server/`, then wire them as TanStack Start server routes. Each handler follows TDD (Red → Green).

---

## Phase 1 - CV Profile Handler Layer [checkpoint: TBD]

Goal: Create all decoupled, testable handler functions for CV profile and version operations. Each handler accepts a `Database` instance and returns typed results — no HTTP/routing concerns.

### Files to create:
- `src/lib/server/cv-profiles.ts` — Handler functions
- `src/lib/server/cv-profiles.spec.ts` — Tests

- [ ] Task 1.1: createCvProfile handler — create profile + first empty version
    - [ ] Write failing test: creates a cv_profiles row with user_id=1
    - [ ] Write failing test: auto-creates first cv_profile_versions row (version_number=1, version_label='Initial', full_cv_json='{}')
    - [ ] Write failing test: returns { id, activeVersionId }
    - [ ] Implement createCvProfile(db) handler
    - [ ] Verify all tests pass
- [ ] Task 1.2: listVersions handler — list all versions for a profile
    - [ ] Write failing test: returns versions array ordered by version_number DESC
    - [ ] Write failing test: returns activeVersionId from cv_profiles
    - [ ] Write failing test: returns empty versions array for non-existent profile
    - [ ] Implement listVersions(db, cvProfileId) handler
    - [ ] Verify all tests pass
- [ ] Task 1.3: getVersion handler — fetch single version with full_cv_json
    - [ ] Write failing test: returns full version object with all fields
    - [ ] Write failing test: returns null indicator when version does not exist
    - [ ] Write failing test: validates that version belongs to the specified profile
    - [ ] Implement getVersion(db, cvProfileId, versionId) handler
    - [ ] Verify all tests pass
- [ ] Task 1.4: updateVersion handler — deep merge + copy-on-write
    - [ ] Write failing test: deep merges patch into existing full_cv_json
    - [ ] Write failing test: arrays in patch replace (not merge) arrays in existing
    - [ ] Write failing test: copy-on-write creates new version row when updating active version
    - [ ] Write failing test: copy-on-write updates cv_profiles.active_version_id
    - [ ] Write failing test: in-place mutation when updating historical (non-active) version
    - [ ] Write failing test: handles null/undefined in patch gracefully
    - [ ] Write failing test: returns full version object with merged data
    - [ ] Implement updateVersion(db, cvProfileId, versionId, patch) handler
    - [ ] Implement deepMerge utility function
    - [ ] Verify all tests pass
- [ ] Task 1.5: Conductor - User Manual Verification 'Phase 1 - CV Profile Handler Layer' (Protocol in workflow.md)

---

## Phase 2 - API Route Wiring [checkpoint: TBD]

Goal: Wrap handler functions as TanStack Start server route endpoints.

### Files to create:
- `src/routes/api/cv.ts` — POST /api/cv
- `src/routes/api/cv/$cvProfileId/versions.ts` — GET versions list
- `src/routes/api/cv/$cvProfileId/version/$versionId.ts` — GET single version + PUT update

- [ ] Task 2.1: Create POST /api/cv route
    - [ ] Write failing test: route handler creates profile and returns 201 with { id, activeVersionId }
    - [ ] Implement route at `src/routes/api/cv.ts` calling createCvProfile
    - [ ] Verify tests pass
- [ ] Task 2.2: Create GET /api/cv/:cvProfileId/versions route
    - [ ] Write failing test: route handler returns versions list with 200
    - [ ] Write failing test: route handler returns 404 for non-existent profile
    - [ ] Implement route at `src/routes/api/cv/$cvProfileId/versions.ts`
    - [ ] Verify tests pass
- [ ] Task 2.3: Create GET + PUT /api/cv/:cvProfileId/version/:versionId route
    - [ ] Write failing test: GET returns full version object with 200
    - [ ] Write failing test: GET returns 404 for non-existent version
    - [ ] Write failing test: PUT with valid patch returns merged version
    - [ ] Write failing test: PUT returns 404 for non-existent profile/version
    - [ ] Write failing test: PUT returns 400 for missing/invalid request body
    - [ ] Implement route at `src/routes/api/cv/$cvProfileId/version/$versionId.ts`
    - [ ] Verify tests pass
- [ ] Task 2.4: Conductor - User Manual Verification 'Phase 2 - API Route Wiring' (Protocol in workflow.md)

---

## Phase 3 - Acceptance Testing & Polish [checkpoint: TBD]

Goal: Run end-to-end acceptance test against the full API and verify all acceptance criteria.

- [ ] Task 3.1: Write end-to-end acceptance test (Create → PUT → GET → copy-on-write → verify)
    - [ ] Create profile via POST /api/cv
    - [ ] Add CV data via PUT /api/cv/:id/version/:versionId
    - [ ] Verify data via GET /api/cv/:id/version/:versionId
    - [ ] PUT again to trigger copy-on-write
    - [ ] Verify a new version was created
    - [ ] Verify activeVersionId updated
    - [ ] Verify all endpoints pass
    - [ ] Verify overall coverage meets 80% threshold
    - [ ] Run `CI=true pnpm test -- --coverage` and confirm
- [ ] Task 3.2: Conductor - User Manual Verification 'Phase 3 - Acceptance Testing' (Protocol in workflow.md)
