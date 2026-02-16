/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { enforceSafetyGate, WRITE_OPERATIONS, READ_OPERATIONS } = require('../lib/mcp/safety-gates');

describe('Safety Gates', () => {
  test('all read operations are allowed without conditions', () => {
    for (const op of READ_OPERATIONS) {
      const result = enforceSafetyGate(op, {});
      expect(result.allowed).toBe(true);
    }
  });

  test('write operations are BLOCKED by default (dryRun not explicitly false)', () => {
    for (const op of WRITE_OPERATIONS) {
      const result = enforceSafetyGate(op, {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('write-operation-requires-explicit-live-mode');
    }
  });

  test('write operations are BLOCKED when dryRun=true', () => {
    for (const op of WRITE_OPERATIONS) {
      const result = enforceSafetyGate(op, { dryRun: true });
      expect(result.allowed).toBe(false);
    }
  });

  test('write operations are ALLOWED only when dryRun=false explicitly', () => {
    for (const op of WRITE_OPERATIONS) {
      const result = enforceSafetyGate(op, { dryRun: false });
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('write-operation-live-mode-confirmed');
    }
  });

  test('unknown operations are denied', () => {
    const result = enforceSafetyGate('dropDatabase', {});
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('unknown-operation');
  });
});
