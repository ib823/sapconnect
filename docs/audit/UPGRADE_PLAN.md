# Dependency Upgrade Plan (No changes applied)

## Policy interpretation

- User allowed all operations, but did not define semver tolerance policy.
- Upgrade policy is therefore **BLOCKED** for strict governance decisions.

## Recommended strategy

1. **Phase A — Patch-only sweep (low risk)**
   - Upgrade patch releases for runtime deps in root and website.
   - Re-run `npm test`, `npm run lint`, website build/lint.
2. **Phase B — Minor updates with compatibility checks**
   - Prioritize security-sensitive packages (`express`, auth libs, SAP SDK-adjacent libs).
   - Run full regression suite and smoke test server endpoints.
3. **Phase C — Major updates (planned migrations)**
   - Create RFC/change proposal per major (especially `next`, `react`, `@sap/cds`).

## Rollback plan

- Keep lockfile snapshots per phase.
- Perform one dependency cohort per PR.
- If regression: revert cohort commit + lockfile, re-run full test suite.

## Verification gates for each upgrade PR

- `npm test` pass (root).
- `npm run lint` pass with non-increasing warning budget.
- `npm audit`/SCA pass or documented accepted risk exception.
- Container build and health endpoint smoke tests.

