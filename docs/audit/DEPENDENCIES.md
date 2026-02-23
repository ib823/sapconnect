# Dependency & Supply-Chain Audit

Status legend: **VERIFIED / EVIDENCE-PARTIAL / BLOCKED**.

## 1) Dependency inventory

### Root Node project
- Manifest: `package.json` (Node >=20).
- Runtime deps: `@sap/cds`, `@sap/xssec`, `express`, `passport`.
- Optional deps: `node-rfc`, `abap-adt-api`.
- Dev deps include `@sap/cds-dk`, `vitest`, `eslint`, `prettier`, `@cap-js/sqlite`, `@cap-js/postgres`.
- Status: **VERIFIED**.

### Website project
- Manifest: `website/package.json`.
- Runtime deps include `next@^15`, `react@^19`, `react-dom@^19`, `framer-motion`, MDX packages.
- Status: **VERIFIED**.

### Lockfiles
- `website/pnpm-lock.yaml` exists.
- Root `package-lock.json` exists. **VERIFIED**.

## 2) Supply chain controls found

- Dockerfile uses multi-stage build and non-root runtime user. **VERIFIED**.
- GitHub Actions CI pipeline exists in `.github/workflows/ci.yml` with lint, test (Node 20/22 matrix), security audit (`npm audit --audit-level=high/critical`), license checking (`license-checker --failOn GPL-3.0;AGPL-3.0;SSPL-1.0;BSL-1.1`), SPDX header verification, and Docker build jobs. **VERIFIED**.
- GitHub Actions release pipeline exists in `.github/workflows/release.yml` for tag-based Docker image publishing. **VERIFIED**.

> **Correction (2026-02-23):** The original audit incorrectly stated no CI workflows were found. Both `ci.yml` and `release.yml` exist under `.github/workflows/`.

## 3) Vulnerability scanning evidence

- `npm audit --omit=dev --json` failed due registry API 403 on audit advisory endpoint.
- Status: **BLOCKED** for vulnerability database-backed SCA results.
- Output excerpt:
  - `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`

## 4) Required next scans (tool plan, no upgrades yet)

1. SCA: `npm audit` (root + website) and/or OSV-based scanner.
2. License audit: `license-checker` or equivalent.
3. Secrets scan: `gitleaks` against repo history + workspace.
4. IaC scan: Dockerfile + `mta.yaml` + compose via Checkov/Trivy config mode.

Status of execution in this pass:
- SCA advisory lookup: **BLOCKED** by endpoint policy/permissions.
- Additional scanners: **BLOCKED** (not installed/executed in this pass to keep read-only and avoid toolchain mutation).

