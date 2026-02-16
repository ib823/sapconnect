# Contributing to SEN

Thank you for your interest in contributing to SEN! This document provides guidelines for contributions.

## Developer Certificate of Origin (DCO)

By contributing to this project, you certify that:

1. The contribution was created in whole or in part by you and you have the right to submit it under the Apache License 2.0; or
2. The contribution is based upon previous work that, to the best of your knowledge, is covered under an appropriate open-source license and you have the right to submit that work with modifications under the Apache License 2.0; or
3. The contribution was provided directly to you by some other person who certified (1) or (2) and you have not modified it.

You certify the above by adding a `Signed-off-by` line to your commit messages:

```
Signed-off-by: Your Name <your.email@example.com>
```

You can do this automatically with `git commit -s`.

## Important Legal Guidelines for Contributors

### SAP Intellectual Property

- **NEVER** include SAP proprietary source code, confidential documentation, or trade secrets in contributions
- **NEVER** reverse-engineer, decompile, or disassemble SAP software to create contributions
- Assessment rules MUST be based on publicly available SAP documentation (SAP Notes, SAP Help Portal, SAP API Business Hub, SAP Community)
- All API interactions MUST use SAP's publicly documented and released interfaces

### Clean Room Development

- If you have access to SAP proprietary code through your employment or SAP partnership, you must ensure your contributions do not derive from that proprietary access
- Contributions should be independently developed based on public documentation and standard API behavior
- When in doubt, document your source (e.g., "Based on SAP Note 2340778" or "Per api.sap.com documentation")

### Third-Party Code

- Do not copy code from other projects without verifying license compatibility with Apache 2.0
- Include proper attribution for any third-party code or algorithms used

## Code Standards

- All new files MUST include the Apache 2.0 license header (see existing files for format)
- All SAP write operations MUST go through the safety gate mechanism
- All new MCP tools MUST include proper parameter validation
- Tests are required for all new functionality

## Pull Request Process

1. Fork the repository and create a feature branch
2. Ensure all tests pass: `npm test`
3. Ensure linting passes: `npm run lint`
4. Sign off your commits (DCO)
5. Open a pull request with a clear description of changes
