/**
 * Tests for AI Safety Gates
 */
const SafetyGates = require('../../../lib/ai/safety-gates');

describe('SafetyGates', () => {
  let gates;

  beforeEach(() => {
    gates = new SafetyGates({ mode: 'mock', strictness: 'moderate' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Built-in Gate Registration
  // ─────────────────────────────────────────────────────────────────────────

  describe('gate registration', () => {
    it('should register all 6 built-in gates', () => {
      const status = gates.getGateStatus();
      expect(status).toHaveLength(6);
      const names = status.map(g => g.name);
      expect(names).toContain('syntax-check');
      expect(names).toContain('atc-check');
      expect(names).toContain('naming-convention');
      expect(names).toContain('transport-required');
      expect(names).toContain('human-approval');
      expect(names).toContain('unit-test-coverage');
    });

    it('should register custom gates', () => {
      gates.registerGate('custom-gate', async () => ({
        status: 'passed', message: 'OK', details: {},
      }), { priority: 100 });
      const status = gates.getGateStatus();
      expect(status).toHaveLength(7);
      expect(status.find(g => g.name === 'custom-gate')).toBeDefined();
    });

    it('should throw on invalid gate name', () => {
      expect(() => gates.registerGate('', vi.fn())).toThrow();
    });

    it('should throw on non-function checkFn', () => {
      expect(() => gates.registerGate('bad-gate', 'not a function')).toThrow();
    });

    it('should have correct priorities for built-in gates', () => {
      const status = gates.getGateStatus();
      const syntaxGate = status.find(g => g.name === 'syntax-check');
      const humanGate = status.find(g => g.name === 'human-approval');
      expect(syntaxGate.priority).toBeLessThan(humanGate.priority);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Validate Artifact
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateArtifact', () => {
    it('should run all applicable gates and return results', async () => {
      const artifact = {
        type: 'program',
        name: 'Z_TEST_PROGRAM',
        source: 'REPORT z_test_program.\nWRITE: / "Hello".',
        transport: 'DEVK900123',
      };
      const result = await gates.validateArtifact(artifact);
      expect(result.gates).toBeDefined();
      expect(result.gates.length).toBeGreaterThan(0);
      expect(result.overallStatus).toBeDefined();
      expect(typeof result.approved).toBe('boolean');
    });

    it('should approve clean artifact with transport', async () => {
      const artifact = {
        type: 'program',
        name: 'Z_CLEAN_REPORT',
        source: 'REPORT z_clean_report.\nDATA: lv_test TYPE string.\nlv_test = "hello".\nCLASS lcl_test DEFINITION FOR TESTING.\nENDCLASS.',
        transport: 'DEVK900123',
      };
      const result = await gates.validateArtifact(artifact);
      expect(result.gates.every(g => g.status !== 'failed')).toBe(true);
    });

    it('should throw on null artifact', async () => {
      await expect(gates.validateArtifact(null)).rejects.toThrow();
    });

    it('should throw on artifact without name', async () => {
      await expect(gates.validateArtifact({ type: 'program' })).rejects.toThrow('name');
    });

    it('should create audit trail on validation', async () => {
      const artifact = { type: 'program', name: 'Z_AUDIT_TEST', transport: 'DEVK900001' };
      await gates.validateArtifact(artifact);
      const log = gates.getAuditLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].artifactName).toBe('Z_AUDIT_TEST');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Syntax Check Gate
  // ─────────────────────────────────────────────────────────────────────────

  describe('syntax-check gate', () => {
    it('should pass for valid ABAP code', async () => {
      const result = gates._checkSyntax({
        source: 'REPORT z_test.\nIF 1 = 1.\n  WRITE: / "OK".\nENDIF.',
      });
      expect(result.status).toBe('passed');
    });

    it('should fail on unmatched IF/ENDIF', () => {
      const result = gates._checkSyntax({
        source: 'REPORT z_test.\nIF 1 = 1.\n  WRITE: / "OK".',
      });
      expect(result.status).toBe('failed');
      expect(result.details.errors.some(e => e.includes('IF/ENDIF'))).toBe(true);
    });

    it('should fail on unmatched LOOP/ENDLOOP', () => {
      const result = gates._checkSyntax({
        source: 'LOOP AT lt_data INTO ls_data.\n  WRITE: / ls_data.',
      });
      expect(result.status).toBe('failed');
      expect(result.details.errors.some(e => e.includes('LOOP/ENDLOOP'))).toBe(true);
    });

    it('should pass when no source provided', () => {
      const result = gates._checkSyntax({});
      expect(result.status).toBe('passed');
      expect(result.details.skipped).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ATC Check Gate
  // ─────────────────────────────────────────────────────────────────────────

  describe('atc-check gate', () => {
    it('should fail on SELECT *', () => {
      const result = gates._checkAtc({
        source: 'SELECT * FROM mara INTO TABLE lt_mara.',
      });
      expect(result.status).toBe('failed');
      expect(result.details.findings.some(f => f.category === 'PERFORMANCE')).toBe(true);
    });

    it('should fail on CALL TRANSACTION without AUTHORITY-CHECK', () => {
      const result = gates._checkAtc({
        source: 'CALL TRANSACTION "SE38".',
      });
      expect(result.status).toBe('failed');
      expect(result.details.findings.some(f => f.category === 'SECURITY')).toBe(true);
    });

    it('should pass for clean code', () => {
      const result = gates._checkAtc({
        source: 'DATA: lv_test TYPE string.\nlv_test = "hello".\nWRITE: / lv_test.',
      });
      expect(result.status).toBe('passed');
    });

    it('should detect obsolete HEADER LINE', () => {
      const result = gates._checkAtc({
        source: 'DATA: lt_data TYPE TABLE OF mara WITH HEADER LINE.',
      });
      expect(result.details.findings.some(f => f.category === 'S4HANA_READINESS')).toBe(true);
    });

    it('should pass when no source provided', () => {
      const result = gates._checkAtc({});
      expect(result.status).toBe('passed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Naming Convention Gate
  // ─────────────────────────────────────────────────────────────────────────

  describe('naming-convention gate', () => {
    it('should pass for Z-prefixed names', () => {
      const result = gates._checkNamingConvention({ type: 'program', name: 'Z_MY_PROGRAM' });
      expect(result.status).toBe('passed');
    });

    it('should pass for Y-prefixed names', () => {
      const result = gates._checkNamingConvention({ type: 'program', name: 'Y_MY_PROGRAM' });
      expect(result.status).toBe('passed');
    });

    it('should fail for non-Z/Y program names', () => {
      const result = gates._checkNamingConvention({ type: 'program', name: 'MY_PROGRAM' });
      expect(result.status).toBe('failed');
      expect(result.message).toContain('naming convention');
    });

    it('should fail for class names without ZCL_ prefix', () => {
      const result = gates._checkNamingConvention({ type: 'class', name: 'CL_MY_CLASS' });
      expect(result.status).toBe('failed');
    });

    it('should fail for names with spaces', () => {
      const result = gates._checkNamingConvention({ type: 'program', name: 'Z MY PROGRAM' });
      expect(result.status).toBe('failed');
    });

    it('should fail for names exceeding 30 chars', () => {
      const longName = 'Z_' + 'A'.repeat(30);
      const result = gates._checkNamingConvention({ type: 'program', name: longName });
      expect(result.status).toBe('failed');
    });

    it('should fail when name is missing', () => {
      const result = gates._checkNamingConvention({ type: 'program' });
      expect(result.status).toBe('failed');
    });

    it('should warn on non-uppercase names in moderate mode', () => {
      const result = gates._checkNamingConvention({ type: 'program', name: 'z_my_program' });
      expect(result.status).toBe('warning');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Transport Enforcement Gate
  // ─────────────────────────────────────────────────────────────────────────

  describe('transport-required gate', () => {
    it('should pass with valid transport', () => {
      const result = gates._checkTransportRequired({ transport: 'DEVK900123' });
      expect(result.status).toBe('passed');
      expect(result.message).toContain('DEVK900123');
    });

    it('should fail without transport in moderate mode', () => {
      const result = gates._checkTransportRequired({});
      expect(result.status).toBe('failed');
    });

    it('should fail with invalid transport format', () => {
      const result = gates._checkTransportRequired({ transport: 'INVALID' });
      expect(result.status).toBe('failed');
      expect(result.message).toContain('Invalid transport');
    });

    it('should warn (not fail) in permissive mode without transport', () => {
      gates.setStrictness('permissive');
      const result = gates._checkTransportRequired({});
      expect(result.status).toBe('warning');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Human Approval Gate
  // ─────────────────────────────────────────────────────────────────────────

  describe('human-approval gate', () => {
    it('should return pending_review in strict mode', () => {
      gates.setStrictness('strict');
      const result = gates._checkHumanApproval({ name: 'Z_TEST' });
      expect(result.status).toBe('pending_review');
    });

    it('should return warning in moderate mode', () => {
      const result = gates._checkHumanApproval({ name: 'Z_TEST' });
      expect(result.status).toBe('warning');
    });

    it('should auto-pass in permissive mode', () => {
      gates.setStrictness('permissive');
      const result = gates._checkHumanApproval({ name: 'Z_TEST' });
      expect(result.status).toBe('passed');
      expect(result.details.autoApproved).toBe(true);
    });

    it('should pass if artifact already approved', () => {
      gates.setStrictness('strict');
      // Create and approve
      const approval = gates.requestApproval(
        { name: 'Z_APPROVED', type: 'program' },
        [{ name: 'syntax-check', status: 'passed', message: 'OK' }]
      );
      gates.approveArtifact(approval.approvalId, 'admin', 'looks good');
      const result = gates._checkHumanApproval({ name: 'Z_APPROVED' });
      expect(result.status).toBe('passed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Unit Test Coverage Gate
  // ─────────────────────────────────────────────────────────────────────────

  describe('unit-test-coverage gate', () => {
    it('should pass when FOR TESTING class exists', () => {
      const result = gates._checkUnitTestCoverage({
        source: 'CLASS lcl_test DEFINITION FOR TESTING.',
      });
      expect(result.status).toBe('passed');
    });

    it('should warn when no tests in moderate mode', () => {
      const result = gates._checkUnitTestCoverage({
        source: 'REPORT z_test.\nWRITE: / "hello".',
      });
      expect(result.status).toBe('warning');
    });

    it('should fail when no tests in strict mode', () => {
      gates.setStrictness('strict');
      const result = gates._checkUnitTestCoverage({
        source: 'REPORT z_test.\nWRITE: / "hello".',
      });
      expect(result.status).toBe('failed');
    });

    it('should pass when metadata indicates tests exist', () => {
      const result = gates._checkUnitTestCoverage({
        source: 'REPORT z_test.',
        metadata: { hasTests: true },
      });
      expect(result.status).toBe('passed');
    });

    it('should pass when no source provided', () => {
      const result = gates._checkUnitTestCoverage({});
      expect(result.status).toBe('passed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Approval Workflow
  // ─────────────────────────────────────────────────────────────────────────

  describe('approval workflow', () => {
    it('should create approval request', () => {
      const req = gates.requestApproval(
        { name: 'Z_PROGRAM', type: 'program' },
        [{ name: 'syntax-check', status: 'passed', message: 'OK' }]
      );
      expect(req.approvalId).toBeDefined();
      expect(req.status).toBe('pending');
      expect(req.artifactName).toBe('Z_PROGRAM');
    });

    it('should approve artifact', () => {
      const req = gates.requestApproval(
        { name: 'Z_APPROVE_ME', type: 'program' },
        [{ name: 'syntax-check', status: 'passed', message: 'OK' }]
      );
      const result = gates.approveArtifact(req.approvalId, 'admin', 'Approved');
      expect(result.status).toBe('approved');
      expect(result.approver).toBe('admin');
      expect(result.comments).toBe('Approved');
    });

    it('should reject artifact', () => {
      const req = gates.requestApproval(
        { name: 'Z_REJECT_ME', type: 'program' },
        [{ name: 'syntax-check', status: 'failed', message: 'Error' }]
      );
      const result = gates.rejectArtifact(req.approvalId, 'reviewer', 'Bad code');
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('Bad code');
    });

    it('should throw on unknown approval id', () => {
      expect(() => gates.approveArtifact('APR-NONEXIST', 'admin', 'ok')).toThrow('not found');
    });

    it('should throw when approving already approved', () => {
      const req = gates.requestApproval({ name: 'Z_DOUBLE', type: 'program' }, []);
      gates.approveArtifact(req.approvalId, 'admin', 'ok');
      expect(() => gates.approveArtifact(req.approvalId, 'admin', 'again')).toThrow('already');
    });

    it('should throw when rejecting without reason', () => {
      const req = gates.requestApproval({ name: 'Z_NO_REASON', type: 'program' }, []);
      expect(() => gates.rejectArtifact(req.approvalId, 'admin', '')).toThrow('reason');
    });

    it('should throw when approving without approver', () => {
      const req = gates.requestApproval({ name: 'Z_NO_APPROVER', type: 'program' }, []);
      expect(() => gates.approveArtifact(req.approvalId, '', 'ok')).toThrow('Approver');
    });

    it('should list pending approvals', () => {
      gates.requestApproval({ name: 'Z_PENDING_1', type: 'program' }, []);
      gates.requestApproval({ name: 'Z_PENDING_2', type: 'program' }, []);
      const req3 = gates.requestApproval({ name: 'Z_DONE', type: 'program' }, []);
      gates.approveArtifact(req3.approvalId, 'admin', 'ok');
      const pending = gates.getPendingApprovals();
      expect(pending).toHaveLength(2);
      expect(pending.every(p => p.status === 'pending')).toBe(true);
    });

    it('isApproved returns true for approved artifacts', () => {
      const req = gates.requestApproval({ name: 'Z_IS_APPROVED', type: 'program' }, []);
      expect(gates.isApproved('Z_IS_APPROVED')).toBe(false);
      gates.approveArtifact(req.approvalId, 'admin', 'ok');
      expect(gates.isApproved('Z_IS_APPROVED')).toBe(true);
    });

    it('isApproved returns false for unapproved artifacts', () => {
      expect(gates.isApproved('Z_NOT_APPROVED')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Audit Trail
  // ─────────────────────────────────────────────────────────────────────────

  describe('audit trail', () => {
    it('should record audit entries', () => {
      const entry = gates.createAuditTrail(
        { name: 'Z_AUDIT', type: 'program' },
        [{ name: 'syntax-check', status: 'passed', message: 'OK', required: true }]
      );
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.artifactName).toBe('Z_AUDIT');
    });

    it('should filter audit log by artifact name', () => {
      gates.createAuditTrail({ name: 'Z_FIRST', type: 'program' }, []);
      gates.createAuditTrail({ name: 'Z_SECOND', type: 'program' }, []);
      const filtered = gates.getAuditLog({ artifactName: 'Z_FIRST' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artifactName).toBe('Z_FIRST');
    });

    it('should filter audit log by artifact type', () => {
      gates.createAuditTrail({ name: 'Z_PROG', type: 'program' }, []);
      gates.createAuditTrail({ name: 'ZCL_CLASS', type: 'class' }, []);
      const filtered = gates.getAuditLog({ artifactType: 'class' });
      expect(filtered).toHaveLength(1);
    });

    it('should filter audit log by approval status', () => {
      gates.createAuditTrail({ name: 'Z_PASS', type: 'program' }, [
        { name: 'test', status: 'passed', message: 'OK', required: true },
      ]);
      gates.createAuditTrail({ name: 'Z_FAIL', type: 'program' }, [
        { name: 'test', status: 'failed', message: 'Bad', required: true },
      ]);
      const passed = gates.getAuditLog({ approved: true });
      expect(passed.length).toBeGreaterThanOrEqual(1);
      expect(passed.every(e => e.overallApproved)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Strictness Levels
  // ─────────────────────────────────────────────────────────────────────────

  describe('strictness levels', () => {
    it('should change strictness level', () => {
      gates.setStrictness('strict');
      expect(gates.strictness).toBe('strict');
      gates.setStrictness('permissive');
      expect(gates.strictness).toBe('permissive');
    });

    it('should throw on invalid strictness', () => {
      expect(() => gates.setStrictness('invalid')).toThrow();
    });

    it('strict mode makes warnings into failures for ATC', () => {
      gates.setStrictness('strict');
      const result = gates._checkAtc({
        source: 'DATA: lt_data TYPE TABLE OF mara WITH HEADER LINE.',
      });
      expect(result.status).toBe('failed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Batch Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateBatch', () => {
    it('should validate multiple artifacts and return summary', async () => {
      const artifacts = [
        { type: 'program', name: 'Z_BATCH_1', transport: 'DEVK900001' },
        { type: 'program', name: 'Z_BATCH_2', transport: 'DEVK900002' },
      ];
      const result = await gates.validateBatch(artifacts);
      expect(result.results).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary).toHaveProperty('approved');
      expect(result.summary).toHaveProperty('rejected');
    });

    it('should throw on non-array input', async () => {
      await expect(gates.validateBatch('bad')).rejects.toThrow('array');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Transport Enforcement
  // ─────────────────────────────────────────────────────────────────────────

  describe('transport enforcement', () => {
    it('enforceTransport returns valid for proper transport', () => {
      const result = gates.enforceTransport({ transport: 'DEVK900123' });
      expect(result.valid).toBe(true);
    });

    it('enforceTransport returns invalid without transport', () => {
      const result = gates.enforceTransport({});
      expect(result.valid).toBe(false);
    });

    it('enforceTransport returns invalid for bad format', () => {
      const result = gates.enforceTransport({ transport: '12345' });
      expect(result.valid).toBe(false);
    });

    it('validateTransportChain returns pipeline stages', () => {
      const result = gates.validateTransportChain('DEVK900123');
      expect(result.valid).toBe(true);
      expect(result.stages).toHaveLength(3);
      expect(result.stages[0].stage).toBe('DEV');
      expect(result.stages[1].stage).toBe('QAS');
      expect(result.stages[2].stage).toBe('PRD');
    });

    it('validateTransportChain rejects invalid number', () => {
      const result = gates.validateTransportChain('INVALID');
      expect(result.valid).toBe(false);
    });
  });
});
