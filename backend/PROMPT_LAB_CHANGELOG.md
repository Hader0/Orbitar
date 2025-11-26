v0.1 – Logging and opt-in wired. refine_events table + prompt_lab_opt_in + is_incognito

## 2025-11-25

- v0.1 – Added RefineEvent table (`refine_events`) plus `promptLabOptIn` and `isIncognito` fields. Basic refine logging wired into the new model.
- v0.2 – Introduced template slug + semver version registry. All GA templates currently at version `1.0.0`.

## 2025-11-26

- v0.3 – Extended RefineEvent with behavior fields (`acceptedAt`, `reverted`, `editDistanceBucket`) and added a behavior update API (`/api/refine-events/behavior`) with auth, validation, and structured error handling. Extension now forwards and stores `refineEventId` for follow‑up behavior tracking.
- v0.4 – Added core Prompt Lab tables (schema only): `SyntheticTask`, `PromptSample`, `LabRun`, `LabScore`. Relations wired and SQLite‑safe types used (JSON stored as string fields).
- v0.5 – Added read-only `/admin/prompt-lab` admin dashboard (top-level stats + template leaderboard) and dev-only seed tools for `SyntheticTask` and `PromptSample`.

## 2025-11-27

- v0.6 – Added v0 Lab runner (dev-only batch run) and heuristic scoring engine (structure/contract/domain/overall) for `LabRun` → `LabScore`. Admin-triggered “Run Lab Batch (DEV)” button added in `/admin/prompt-lab` with admin + non‑production guards.
