# Phase 8 Stabilization Audit - 2026-06-09

## Scope

This pass focused on deploy-blocking and workflow-breaking defects discovered while reviewing Phase 8 readiness:

- frontend production build health
- backend route correctness
- message and file-sharing persistence
- upload configuration safety
- environment configuration consistency
- lint/test command usability

## Findings

### Critical

- Frontend page imports pointed to non-existent paths from `src/pages`, preventing production builds.
- Several frontend API modules used `/api/...` even though the Axios base URL already includes `/api`, producing `/api/api/...`.
- `GET /api/calls/missed`, `/active`, and `/stats` were declared after `GET /api/calls/:id`, so Express treated them as dynamic IDs.
- Message route validators were reading the wrong request location for params/query routes, causing valid message fetch/edit/search requests to fail validation.

### High

- Uploaded file metadata (`fileName`, `fileSize`) was accepted by the frontend but not persisted by the message service.
- Message file type validation accepted broad labels while the upload flow returns MIME types.
- Cloudinary upload config used a mismatched cloud-name env var and mixed Cloudinary-backed Multer storage with a second manual upload stream.
- Vite was configured for `terser` minification without `terser` installed.

### Medium

- `server.js` duplicated environment validation instead of using the centralized config module.
- ESLint 9 scripts could not run because both packages lacked flat config files.
- `Call` schema defined `recordingUrl` twice.
- PostCSS config used CommonJS in an ESM frontend package.

### Remaining Risks

- Backend DB-backed test suites are currently skipped by their own test guards.
- Frontend tests cannot run until declared testing dependencies are installed; `vitest` is listed in `package.json` but absent from the current install/lock state.
- Backend lint passes with warnings that should be cleaned up in a follow-up hygiene pass.

## Changes Applied

- Fixed frontend page imports and nested call component imports.
- Normalized chat/message API calls to the configured Axios `/api` base URL.
- Added a named `apiClient` export while preserving the default export.
- Corrected message validators for body, params, and query targets.
- Persisted file metadata through controller, service, and socket message paths.
- Reordered static call routes before the dynamic `/:id` route.
- Centralized server env validation through `config/env.js`.
- Reworked Cloudinary upload handling to use memory storage and one upload path.
- Updated Cloudinary env naming to `CLOUDINARY_CLOUD_NAME`, with backward-compatible `CLOUDINARY_NAME` support.
- Converted PostCSS config to ESM and restored Tailwind processing.
- Switched Vite minification from missing `terser` to built-in `esbuild`.
- Added ESLint flat configs for backend and frontend.
- Removed duplicate `recordingUrl` from the Call schema.

## Verification

- `backend`: `npx jest --runInBand` with `NODE_OPTIONS=--experimental-vm-modules` passed before final lint-only/backend schema cleanup; 2 suites passed, 3 DB-backed suites skipped.
- `frontend`: `npm run build` passed after build fixes.
- `backend`: `npm run lint` passes with warnings.
- `frontend`: `npm run lint` passes cleanly.
- `git diff --check` passes with Windows CRLF warnings only.

Further escalated test/build reruns were blocked by the execution environment after the usage-limit gate rejected additional approvals.
