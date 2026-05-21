# Specification: CV Profile & Version API

## Overview

This track implements the full CRUD API layer for CV profiles and their version history. It enables creating a CV profile, listing versions, fetching a single version's data, and updating a version with deep-merge + copy-on-write semantics. The UI is not included in this track — only the server-side API endpoints with unit tests.

## Functional Requirements

### 1. POST /api/cv — Create CV Profile

- **Route:** `src/routes/api/cv.ts` (TanStack Start server route)
- **Request body:** Empty (`{}`) — no input required
- **Behavior:**
  - Checks if a `users` row with `id = 1` exists; if not, auto-creates it (single-user default)
  - Creates a new row in `cv_profiles` with `user_id = 1` and `active_version_id = NULL` initially
  - Auto-creates the first empty `cv_profile_versions` row with `version_number = 1`, `version_label = 'Initial'`, and `full_cv_json = '{}'`
  - Updates `cv_profiles.active_version_id` to point to the newly created version
  - All operations wrapped in a transaction
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "activeVersionId": 1
  }
  ```

### 2. GET /api/cv/:cvProfileId/versions — List Versions

- **Route:** `src/routes/api/cv/$cvProfileId/versions.ts`
- **Behavior:**
  - Validates that `cvProfileId` exists in `cv_profiles`
  - Returns all `cv_profile_versions` rows for that profile, ordered by `version_number DESC`
- **Response (200 OK):**
  ```json
  {
    "versions": [
      {
        "id": 1,
        "versionNumber": 1,
        "versionLabel": "Initial",
        "createdAt": "2026-05-21T00:00:00.000Z"
      }
    ],
    "activeVersionId": 1
  }
  ```

### 3. GET /api/cv/:cvProfileId/version/:versionId — Get Single Version

- **Route:** `src/routes/api/cv/$cvProfileId/version/$versionId.ts`
- **Behavior:**
  - Validates both path parameters exist
  - Validates that the version belongs to the specified profile
  - Returns the full version row including `full_cv_json`
- **Response (200 OK):**
  ```json
  {
    "id": 1,
    "versionNumber": 1,
    "versionLabel": "Initial",
    "createdAt": "2026-05-21T00:00:00.000Z",
    "full_cv_json": {}
  }
  ```
- Returns 404 if either the profile or version does not exist

### 4. PUT /api/cv/:cvProfileId/version/:versionId — Update Version

- **Route:** `src/routes/api/cv/$cvProfileId/version/$versionId.ts` (adds PUT handler to same file as GET)
- **Request body:**
  ```json
  {
    "patch": {
      "contact": { "name": "John Doe", "email": "john@example.com" },
      "experience": [{ "company": "Acme Corp", "title": "Engineer" }]
    },
    "versionLabel": "Software Engineer — Core V2"
  }
  ```
  - `patch` (required): Partial CV JSON fields to deep-merge into `full_cv_json`
  - `versionLabel` (optional): Label for the resulting version. If omitted on a copy-on-write, the new version inherits the previous version's label.
- **Behavior:**
  - Validates that the profile and version exist
  - Validates that the version belongs to the specified profile
  - **Deep merge:** Merges the `patch` object into the existing `full_cv_json` using structured deep merge (nested objects merge, arrays replace)
  - **Copy-on-write:** If the `versionId` matches the profile's `activeVersionId`, creates a **new** `cv_profile_versions` row (version_number + 1) with the merged data instead of mutating the existing row. The new version's `version_label` uses the provided value if given, otherwise inherits from the previous version.
  - If `versionId` does NOT match active version, mutates the existing row in-place (it's already a historical version). The `version_label` may still be updated if provided.
  - Updates `cv_profiles.active_version_id` to point to the new version when copy-on-write creates one
  - All write operations wrapped in a transaction
- **Response (200 OK):**
  ```json
  {
    "id": 2,
    "versionNumber": 2,
    "versionLabel": "Software Engineer — Core V2",
    "createdAt": "2026-05-21T01:00:00.000Z",
    "full_cv_json": {
      "contact": { "name": "John Doe", "email": "john@example.com" },
      "experience": [{ "company": "Acme Corp", "title": "Engineer" }]
    }
  }
  ```

### 5. Error Handling

All endpoints must return appropriate error responses:
- **404 Not Found:** Profile or version does not exist
- **409 Conflict:** Attempting to PUT a version that belongs to a different profile
- **400 Bad Request:** Invalid or missing request body (missing `patch` field, wrong types)

Error response format:
```json
{
  "error": "CV profile not found",
  "code": "NOT_FOUND"
}
```

## Non-Functional Requirements

- All endpoints must be synchronous (`better-sqlite3` is synchronous)
- Database operations must use parameterized queries (no string concatenation)
- Response times must be < 100ms for all endpoints (local SQLite)
- Deep merge must not throw on null/undefined values in the patch

## Out of Scope

- No frontend UI or form — this is API-only
- No authentication/authorization (single-user mode)
- No encryption of CV data
- No Playwright E2E tests — Vitest unit tests only

## Deviations from TDD

- **Added `POST /api/cv`:** Referenced in ROADMAP §Track 1.1 but not defined in TDD §4. Added to provide the initial profile creation step required by later tracks.
- **Richer PUT response:** TDD §4 specifies `{ id, versionNumber, full_cv_json }`. The spec adds `versionLabel` and `createdAt` to reduce client round-trips.
- **Added `versionLabel` to PUT body:** TDD §4 only defines `{ patch }`. The spec adds an optional `versionLabel` field so clients can label versions meaningfully.

## Acceptance Criteria

1. `POST /api/cv` returns 201 with `{ id, activeVersionId }` — auto-creates user 1 if missing
2. `GET /api/cv/:cvProfileId/versions` returns versions array with activeVersionId
3. `GET /api/cv/:cvProfileId/version/:versionId` returns full version with full_cv_json
4. `PUT /api/cv/:cvProfileId/version/:versionId` merges patch via deep merge
5. PUT on active version creates a new version (copy-on-write) and updates activeVersionId
6. PUT on historical version mutates in-place (no new version created)
7. Requesting a non-existent profile/version returns 404
8. All endpoints use parameterized queries
9. Deep merge handles null/undefined values gracefully — no thrown errors
