/**
 * Tests for Concur REST V4 + SCIM 2.0 Client
 */
const ConcurClient = require('../../../lib/cloud/concur-client');
const { ConcurError } = require('../../../lib/errors');

describe('ConcurClient', () => {
  let client;

  beforeEach(() => {
    client = new ConcurClient({ mode: 'mock', companyId: 'test-company-uuid' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const c = new ConcurClient({});
      expect(c.mode).toBe('mock');
    });

    it('should accept custom options', () => {
      const c = new ConcurClient({
        baseUrl: 'https://concur.example.com',
        clientId: 'cid',
        clientSecret: 'secret',
        companyId: 'company-uuid',
        mode: 'mock',
      });
      expect(c.baseUrl).toBe('https://concur.example.com');
      expect(c.companyId).toBe('company-uuid');
    });

    it('should throw when companyId missing in live mode', () => {
      expect(() => new ConcurClient({ mode: 'live' }))
        .toThrow(ConcurError);
    });
  });

  // ── authenticate ─────────────────────────────────────────────────

  describe('authenticate', () => {
    it('should authenticate in mock mode', async () => {
      const result = await client.authenticate();
      expect(result.authenticated).toBe(true);
      expect(result.mode).toBe('mock');
    });

    it('should store access token', async () => {
      await client.authenticate();
      expect(client._accessToken).toBeDefined();
      expect(client._accessToken).toContain('mock-concur-token');
    });

    it('should throw when not authenticated', () => {
      const unauthClient = new ConcurClient({ mode: 'mock' });
      expect(() => unauthClient.getExpenseReports()).rejects.toThrow(ConcurError);
    });
  });

  // ── Expense Reports ──────────────────────────────────────────────

  describe('expense reports', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return expense reports list', async () => {
      const result = await client.getExpenseReports();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should get single expense report by ID', async () => {
      const reportId = 'a0e0001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const report = await client.getExpenseReport(reportId);
      expect(report.id).toBe(reportId);
      expect(report.name).toBe('Q3 Client Meetings');
      expect(report.entries).toBeDefined();
    });

    it('should get expense entries for a report', async () => {
      const reportId = 'a0e0001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const result = await client.getExpenseEntries(reportId);
      expect(result.entries).toBeDefined();
      expect(result.entries.length).toBe(3);
    });

    it('should create a new expense report', async () => {
      const data = {
        name: 'New Trip Report',
        purpose: 'Business travel',
        currency: 'USD',
        entries: [
          { expenseType: 'Airfare', amount: 500.00, currency: 'USD' },
        ],
      };
      const report = await client.createExpenseReport(data);
      expect(report.id).toBeDefined();
      expect(report.name).toBe('New Trip Report');
      expect(report.status).toBe('DRAFT');
      expect(report.total).toBe(500.00);
    });

    it('should have 5 mock expense reports', async () => {
      const result = await client.getExpenseReports({ limit: 100 });
      expect(result.totalCount).toBe(5);
    });

    it('should have correct report structure', async () => {
      const reportId = 'a0e0001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const report = await client.getExpenseReport(reportId);
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('name');
      expect(report).toHaveProperty('purpose');
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('currency');
      expect(report).toHaveProperty('total');
      expect(report).toHaveProperty('owner');
      expect(report).toHaveProperty('entries');
      expect(report.owner).toHaveProperty('id');
      expect(report.owner).toHaveProperty('name');
    });
  });

  // ── Travel Requests ──────────────────────────────────────────────

  describe('travel requests', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return travel requests', async () => {
      const result = await client.getTravelRequests();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should get travel request by ID', async () => {
      const requestId = 'a0e2001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const request = await client.getTravelRequest(requestId);
      expect(request.id).toBe(requestId);
      expect(request.name).toBe('Customer Visit - Chicago');
    });

    it('should have 3 mock travel requests', async () => {
      const result = await client.getTravelRequests({ limit: 100 });
      expect(result.totalCount).toBe(3);
    });

    it('should have correct request structure', async () => {
      const requestId = 'a0e2001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const request = await client.getTravelRequest(requestId);
      expect(request).toHaveProperty('id');
      expect(request).toHaveProperty('name');
      expect(request).toHaveProperty('purpose');
      expect(request).toHaveProperty('status');
      expect(request).toHaveProperty('estimatedCost');
      expect(request).toHaveProperty('destination');
      expect(request).toHaveProperty('startDate');
      expect(request).toHaveProperty('endDate');
    });
  });

  // ── SCIM Users ───────────────────────────────────────────────────

  describe('SCIM users', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return users list', async () => {
      const result = await client.getUsers();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should create a new user', async () => {
      const data = {
        userName: 'newuser@acme.com',
        name: { givenName: 'New', familyName: 'User' },
        emails: [{ value: 'newuser@acme.com', type: 'work', primary: true }],
      };
      const user = await client.createUser(data);
      expect(user.id).toBeDefined();
      expect(user.userName).toBe('newuser@acme.com');
      expect(user.active).toBe(true);
    });

    it('should update a user', async () => {
      const userId = 'a0e1001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const user = await client.updateUser(userId, { name: { givenName: 'Jonathan', familyName: 'Doe' } });
      expect(user.name.givenName).toBe('Jonathan');
      expect(user.name.familyName).toBe('Doe');
    });

    it('should deactivate a user (set active=false)', async () => {
      const userId = 'a0e1001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const user = await client.deactivateUser(userId);
      expect(user.active).toBe(false);
    });

    it('should have 10 mock users', async () => {
      const result = await client.getUsers({ limit: 100 });
      expect(result.totalCount).toBe(10);
    });

    it('should include SCIM schemas', async () => {
      const result = await client.getUsers({ limit: 1 });
      const user = result.items[0];
      expect(user.schemas).toBeDefined();
      expect(user.schemas).toContain('urn:ietf:params:scim:schemas:core:2.0:User');
    });

    it('should have correct user structure', async () => {
      const result = await client.getUsers({ limit: 1 });
      const user = result.items[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('userName');
      expect(user).toHaveProperty('name');
      expect(user.name).toHaveProperty('givenName');
      expect(user.name).toHaveProperty('familyName');
      expect(user).toHaveProperty('emails');
      expect(user).toHaveProperty('active');
      expect(user).toHaveProperty('employeeNumber');
    });
  });

  // ── Lists ────────────────────────────────────────────────────────

  describe('lists', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return lists', async () => {
      const result = await client.getLists();
      expect(result.lists).toBeDefined();
      expect(result.lists.length).toBeGreaterThan(0);
    });

    it('should get list items', async () => {
      const listId = 'a0e3001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const result = await client.getListItems(listId);
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should create a list item', async () => {
      const listId = 'a0e3001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const item = await client.createListItem(listId, { code: 'PARKING', value: 'Parking' });
      expect(item.code).toBe('PARKING');
      expect(item.value).toBe('Parking');
      expect(item.isActive).toBe(true);
    });

    it('should have 3 mock lists', async () => {
      const result = await client.getLists();
      expect(result.lists).toHaveLength(3);
    });

    it('should have correct list item structure', async () => {
      const listId = 'a0e3001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const result = await client.getListItems(listId);
      const item = result.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('isActive');
    });
  });

  // ── Error handling ───────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should throw ConcurError', async () => {
      try {
        await client.getExpenseReport('nonexistent-id');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ConcurError);
      }
    });

    it('should have correct error code', async () => {
      try {
        await client.getExpenseReport('nonexistent-id');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err.code).toBe('ERR_CONCUR');
      }
    });

    it('should throw on unknown report ID', async () => {
      await expect(client.getExpenseReport('unknown-uuid'))
        .rejects.toThrow(ConcurError);
    });

    it('should throw on unknown user ID', async () => {
      await expect(client.updateUser('unknown-uuid', { active: false }))
        .rejects.toThrow(ConcurError);
    });
  });

  // ── Pagination ───────────────────────────────────────────────────

  describe('pagination', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should support offset and limit', async () => {
      const result = await client.getExpenseReports({ offset: 1, limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.offset).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should use default limit', async () => {
      const result = await client.getExpenseReports();
      expect(result.limit).toBe(25);
    });

    it('should handle offset past end', async () => {
      const result = await client.getExpenseReports({ offset: 100 });
      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  // ── UUID IDs ─────────────────────────────────────────────────────

  describe('UUID IDs', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should use UUID format for all IDs', async () => {
      const uuidPattern = /^[a-f0-9]+-[a-f0-9]+-[a-f0-9]+-[a-f0-9]+-[a-f0-9]+$/;

      const reports = await client.getExpenseReports({ limit: 100 });
      for (const report of reports.items) {
        expect(report.id).toMatch(uuidPattern);
      }

      const users = await client.getUsers({ limit: 100 });
      for (const user of users.items) {
        expect(user.id).toMatch(uuidPattern);
      }
    });

    it('should have consistent IDs across operations', async () => {
      const reportId = 'a0e0001-2b3c-4d5e-8f6a-7b8c9d0e1f20';
      const report = await client.getExpenseReport(reportId);
      expect(report.id).toBe(reportId);

      const entries = await client.getExpenseEntries(reportId);
      expect(entries.entries.length).toBeGreaterThan(0);
    });
  });

  // ── Status tracking ──────────────────────────────────────────────

  describe('status tracking', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should have various report status values', async () => {
      const result = await client.getExpenseReports({ limit: 100 });
      const statuses = result.items.map((r) => r.status);
      expect(statuses).toContain('SUBMITTED');
      expect(statuses).toContain('APPROVED');
      expect(statuses).toContain('PAID');
      expect(statuses).toContain('DRAFT');
      expect(statuses).toContain('RECALLED');
    });

    it('should have various request status values', async () => {
      const result = await client.getTravelRequests({ limit: 100 });
      const statuses = result.items.map((r) => r.status);
      expect(statuses).toContain('APPROVED');
      expect(statuses).toContain('PENDING');
      expect(statuses).toContain('REJECTED');
    });

    it('should track user active flag', async () => {
      const result = await client.getUsers({ limit: 100 });
      const activeFlags = result.items.map((u) => u.active);
      expect(activeFlags).toContain(true);
      expect(activeFlags).toContain(false);
    });
  });
});
