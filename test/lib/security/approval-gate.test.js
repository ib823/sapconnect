/**
 * Tests for Approval Gate
 */
const { ApprovalGate, APPROVAL_STATUS } = require('../../../lib/security/approval-gate');

describe('ApprovalGate', () => {
  let gate;

  beforeEach(() => {
    gate = new ApprovalGate();
  });

  afterEach(() => {
    gate.clear();
  });

  describe('APPROVAL_STATUS', () => {
    it('should export all status values', () => {
      expect(APPROVAL_STATUS.PENDING).toBe('pending');
      expect(APPROVAL_STATUS.APPROVED).toBe('approved');
      expect(APPROVAL_STATUS.REJECTED).toBe('rejected');
      expect(APPROVAL_STATUS.EXPIRED).toBe('expired');
      expect(APPROVAL_STATUS.CANCELLED).toBe('cancelled');
    });
  });

  describe('requestApproval', () => {
    it('should create a pending approval for tier 3 operations', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1', { migrationId: 'MIG-1' });
      expect(req.requestId).toMatch(/^apr-/);
      expect(req.status).toBe('pending');
      expect(req.operation).toBe('migration.load_staging');
      expect(req.requestedBy).toBe('user1');
      expect(req.tier).toBe(3);
      expect(req.requiredApprovers).toBe(1);
      expect(req.createdAt).toBeDefined();
      expect(req.expiresAt).toBeDefined();
    });

    it('should create a pending approval for tier 4 operations', () => {
      const req = gate.requestApproval('transport.import', 'user1');
      expect(req.tier).toBe(4);
      expect(req.requiredApprovers).toBe(2);
      expect(req.status).toBe('pending');
    });

    it('should auto-approve tier 1 operations', () => {
      const req = gate.requestApproval('extraction.run', 'user1');
      expect(req.status).toBe('approved');
      expect(req.autoApproved).toBe(true);
      expect(req.requestId).toBeNull();
    });

    it('should auto-approve tier 2 operations', () => {
      const req = gate.requestApproval('migration.transform', 'user1');
      expect(req.status).toBe('approved');
      expect(req.autoApproved).toBe(true);
    });

    it('should store details in the request', () => {
      const req = gate.requestApproval('migration.load_staging', 'admin', { objectCount: 42 });
      expect(req.details).toEqual({ objectCount: 42 });
    });
  });

  describe('approve', () => {
    it('should record an approval', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      const updated = gate.approve(req.requestId, 'approver1', 'Looks good');
      expect(updated.approvals).toHaveLength(1);
      expect(updated.approvals[0].approvedBy).toBe('approver1');
      expect(updated.approvals[0].comment).toBe('Looks good');
    });

    it('should mark approved when sufficient approvers (tier 3 = 1)', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      const updated = gate.approve(req.requestId, 'approver1');
      expect(updated.status).toBe('approved');
      expect(updated.resolvedAt).toBeDefined();
    });

    it('should stay pending until sufficient approvers (tier 4 = 2)', () => {
      const req = gate.requestApproval('transport.import', 'user1');
      const afterFirst = gate.approve(req.requestId, 'approver1');
      expect(afterFirst.status).toBe('pending');
      expect(afterFirst.approvals).toHaveLength(1);

      const afterSecond = gate.approve(req.requestId, 'approver2');
      expect(afterSecond.status).toBe('approved');
      expect(afterSecond.approvals).toHaveLength(2);
    });

    it('should prevent self-approval', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      expect(() => gate.approve(req.requestId, 'user1')).toThrow('self-approve');
    });

    it('should prevent duplicate approval by same user', () => {
      const req = gate.requestApproval('transport.import', 'user1');
      gate.approve(req.requestId, 'approver1');
      expect(() => gate.approve(req.requestId, 'approver1')).toThrow('already approved');
    });

    it('should throw on non-pending request', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      gate.approve(req.requestId, 'approver1');
      expect(() => gate.approve(req.requestId, 'approver2')).toThrow('status is "approved"');
    });

    it('should throw on unknown request ID', () => {
      expect(() => gate.approve('nonexistent', 'user')).toThrow('not found');
    });
  });

  describe('reject', () => {
    it('should mark request as rejected', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      const result = gate.reject(req.requestId, 'reviewer1', 'Needs more testing');
      expect(result.status).toBe('rejected');
      expect(result.rejections).toHaveLength(1);
      expect(result.rejections[0].rejectedBy).toBe('reviewer1');
      expect(result.rejections[0].reason).toBe('Needs more testing');
      expect(result.resolvedAt).toBeDefined();
    });

    it('should throw on non-pending request', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      gate.reject(req.requestId, 'reviewer1', 'No');
      expect(() => gate.reject(req.requestId, 'reviewer2')).toThrow('status is "rejected"');
    });
  });

  describe('cancel', () => {
    it('should cancel a pending request', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      const result = gate.cancel(req.requestId, 'user1');
      expect(result.status).toBe('cancelled');
      expect(result.resolvedAt).toBeDefined();
    });

    it('should only allow the requester to cancel', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      expect(() => gate.cancel(req.requestId, 'someoneElse')).toThrow('Only the requester');
    });

    it('should throw on non-pending request', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      gate.approve(req.requestId, 'approver1');
      expect(() => gate.cancel(req.requestId, 'user1')).toThrow('status is "approved"');
    });
  });

  describe('checkApprovalStatus', () => {
    it('should return pending status for new requests', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      const status = gate.checkApprovalStatus(req.requestId);
      expect(status.status).toBe('pending');
      expect(status.approvalsReceived).toBe(0);
      expect(status.approvalsRequired).toBe(1);
    });

    it('should return approved status after approval', () => {
      const req = gate.requestApproval('migration.load_staging', 'user1');
      gate.approve(req.requestId, 'approver1');
      const status = gate.checkApprovalStatus(req.requestId);
      expect(status.status).toBe('approved');
      expect(status.approvalsReceived).toBe(1);
    });

    it('should auto-expire past-due requests', async () => {
      const expGate = new ApprovalGate({ expirationMs: 1 }); // 1ms TTL
      const req = expGate.requestApproval('migration.load_staging', 'user1');

      // Wait to guarantee the expiration time has passed
      await new Promise(resolve => setTimeout(resolve, 10));

      const status = expGate.checkApprovalStatus(req.requestId);
      expect(status.status).toBe('expired');
    });

    it('should throw for unknown request', () => {
      expect(() => gate.checkApprovalStatus('unknown-id')).toThrow('not found');
    });
  });

  describe('listPendingApprovals', () => {
    it('should return all pending requests', () => {
      gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      const pending = gate.listPendingApprovals();
      expect(pending).toHaveLength(2);
    });

    it('should exclude approved/rejected requests', () => {
      const req1 = gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      gate.approve(req1.requestId, 'approver1');
      const pending = gate.listPendingApprovals();
      expect(pending).toHaveLength(1);
      expect(pending[0].operation).toBe('transport.import');
    });

    it('should filter by operation', () => {
      gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      const pending = gate.listPendingApprovals({ operation: 'transport.import' });
      expect(pending).toHaveLength(1);
    });

    it('should filter by requestedBy', () => {
      gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      const pending = gate.listPendingApprovals({ requestedBy: 'user1' });
      expect(pending).toHaveLength(1);
    });

    it('should filter by tier', () => {
      gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      const pending = gate.listPendingApprovals({ tier: 4 });
      expect(pending).toHaveLength(1);
      expect(pending[0].tier).toBe(4);
    });
  });

  describe('listAllRequests', () => {
    it('should return all requests regardless of status', () => {
      const req1 = gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      gate.approve(req1.requestId, 'approver1');
      const all = gate.listAllRequests();
      expect(all).toHaveLength(2);
    });

    it('should filter by status', () => {
      const req1 = gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      gate.approve(req1.requestId, 'approver1');
      const approved = gate.listAllRequests({ status: 'approved' });
      expect(approved).toHaveLength(1);
      expect(approved[0].status).toBe('approved');
    });
  });

  describe('clear', () => {
    it('should remove all stored requests', () => {
      gate.requestApproval('migration.load_staging', 'user1');
      gate.requestApproval('transport.import', 'user2');
      gate.clear();
      expect(gate.listAllRequests()).toHaveLength(0);
    });
  });
});
