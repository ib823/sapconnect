/**
 * Tests for Ariba API Client
 */
const AribaClient = require('../../../lib/cloud/ariba-client');
const { AribaError } = require('../../../lib/errors');

describe('AribaClient', () => {
  let client;

  beforeEach(() => {
    client = new AribaClient({ mode: 'mock', realm: 'TEST_REALM' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const c = new AribaClient({});
      expect(c.mode).toBe('mock');
    });

    it('should accept custom options', () => {
      const c = new AribaClient({
        baseUrl: 'https://ariba.example.com',
        realm: 'MY_REALM',
        clientId: 'cid',
        clientSecret: 'secret',
        apiKey: 'key123',
        mode: 'mock',
      });
      expect(c.baseUrl).toBe('https://ariba.example.com');
      expect(c.realm).toBe('MY_REALM');
      expect(c.apiKey).toBe('key123');
    });

    it('should throw when realm missing in live mode', () => {
      expect(() => new AribaClient({ mode: 'live' }))
        .toThrow(AribaError);
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
      expect(client._accessToken).toContain('mock-ariba-token');
    });

    it('should throw when not authenticated', () => {
      const unauthClient = new AribaClient({ mode: 'mock' });
      expect(() => unauthClient.getRequisitions())
        .rejects.toThrow(AribaError);
    });
  });

  // ── getRequisitions ──────────────────────────────────────────────

  describe('getRequisitions', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return requisitions', async () => {
      const result = await client.getRequisitions();
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const result = await client.getRequisitions({ $skip: 1, $top: 1 });
      expect(result.results).toHaveLength(1);
      expect(result.offset).toBe(1);
    });

    it('should return total count', async () => {
      const result = await client.getRequisitions();
      expect(result.totalCount).toBe(3);
    });

    it('should have correct requisition structure', async () => {
      const result = await client.getRequisitions();
      const req = result.results[0];
      expect(req).toHaveProperty('id');
      expect(req).toHaveProperty('requisitionNumber');
      expect(req).toHaveProperty('status');
      expect(req).toHaveProperty('requester');
      expect(req).toHaveProperty('amount');
      expect(req).toHaveProperty('currency');
      expect(req).toHaveProperty('items');
    });
  });

  // ── getPurchaseOrders ────────────────────────────────────────────

  describe('getPurchaseOrders', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return purchase orders', async () => {
      const result = await client.getPurchaseOrders();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should have correct PO structure', async () => {
      const result = await client.getPurchaseOrders();
      const po = result.results[0];
      expect(po).toHaveProperty('id');
      expect(po).toHaveProperty('poNumber');
      expect(po).toHaveProperty('status');
      expect(po).toHaveProperty('vendor');
      expect(po).toHaveProperty('amount');
      expect(po).toHaveProperty('currency');
      expect(po).toHaveProperty('items');
      expect(po.vendor).toHaveProperty('id');
      expect(po.vendor).toHaveProperty('name');
    });

    it('should support params', async () => {
      const result = await client.getPurchaseOrders({ $top: 2 });
      expect(result.results).toHaveLength(2);
    });

    it('should return total count', async () => {
      const result = await client.getPurchaseOrders();
      expect(result.totalCount).toBe(5);
    });
  });

  // ── getInvoices ──────────────────────────────────────────────────

  describe('getInvoices', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return invoices', async () => {
      const result = await client.getInvoices();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should have correct invoice structure', async () => {
      const result = await client.getInvoices();
      const inv = result.results[0];
      expect(inv).toHaveProperty('id');
      expect(inv).toHaveProperty('invoiceNumber');
      expect(inv).toHaveProperty('status');
      expect(inv).toHaveProperty('vendor');
      expect(inv).toHaveProperty('amount');
      expect(inv).toHaveProperty('invoiceDate');
      expect(inv).toHaveProperty('dueDate');
    });

    it('should support filters via params', async () => {
      const result = await client.getInvoices({ $top: 1 });
      expect(result.results).toHaveLength(1);
    });
  });

  // ── getReceipts ──────────────────────────────────────────────────

  describe('getReceipts', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return receipts', async () => {
      const result = await client.getReceipts();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should have correct receipt structure', async () => {
      const result = await client.getReceipts();
      const rec = result.results[0];
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('receiptNumber');
      expect(rec).toHaveProperty('purchaseOrder');
      expect(rec).toHaveProperty('vendor');
      expect(rec).toHaveProperty('status');
      expect(rec).toHaveProperty('items');
    });
  });

  // ── getSourcingProjects ──────────────────────────────────────────

  describe('getSourcingProjects', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return sourcing projects', async () => {
      const result = await client.getSourcingProjects();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should have correct project structure', async () => {
      const result = await client.getSourcingProjects();
      const proj = result.results[0];
      expect(proj).toHaveProperty('id');
      expect(proj).toHaveProperty('title');
      expect(proj).toHaveProperty('status');
      expect(proj).toHaveProperty('category');
      expect(proj).toHaveProperty('estimatedValue');
    });
  });

  // ── getContracts ─────────────────────────────────────────────────

  describe('getContracts', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return contracts', async () => {
      const result = await client.getContracts();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should have correct contract structure', async () => {
      const result = await client.getContracts();
      const contract = result.results[0];
      expect(contract).toHaveProperty('id');
      expect(contract).toHaveProperty('contractNumber');
      expect(contract).toHaveProperty('title');
      expect(contract).toHaveProperty('supplier');
      expect(contract).toHaveProperty('status');
      expect(contract).toHaveProperty('totalValue');
      expect(contract).toHaveProperty('terms');
    });

    it('should support pagination', async () => {
      const result = await client.getContracts({ $top: 1 });
      expect(result.results).toHaveLength(1);
    });
  });

  // ── getSuppliers ─────────────────────────────────────────────────

  describe('getSuppliers', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return suppliers', async () => {
      const result = await client.getSuppliers();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should have correct supplier structure', async () => {
      const result = await client.getSuppliers();
      const sup = result.results[0];
      expect(sup).toHaveProperty('id');
      expect(sup).toHaveProperty('name');
      expect(sup).toHaveProperty('category');
      expect(sup).toHaveProperty('country');
      expect(sup).toHaveProperty('qualificationStatus');
    });

    it('should support search', async () => {
      const result = await client.getSuppliers({ search: 'Cloud' });
      expect(result.results.length).toBe(1);
      expect(result.results[0].name).toContain('Cloud');
    });

    it('should have 10 suppliers', async () => {
      const result = await client.getSuppliers();
      expect(result.totalCount).toBe(10);
    });
  });

  // ── getReport ────────────────────────────────────────────────────

  describe('getReport', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return report data', async () => {
      const result = await client.getReport('SPEND_ANALYSIS');
      expect(result.viewId).toBe('SPEND_ANALYSIS');
      expect(result.records).toBeDefined();
      expect(result.records.length).toBeGreaterThan(0);
    });

    it('should support filters', async () => {
      const result = await client.getReport('SPEND_ANALYSIS', { category: 'IT' });
      expect(result.filters).toEqual({ category: 'IT' });
    });
  });

  // ── createSupplier ───────────────────────────────────────────────

  describe('createSupplier', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should create a new supplier', async () => {
      const result = await client.createSupplier({ name: 'New Vendor Inc.', category: 'IT Services', country: 'US' });
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('New Vendor Inc.');
      expect(result.status).toBe('created');
    });

    it('should return created supplier with ID', async () => {
      const result = await client.createSupplier({ name: 'Another Vendor', category: 'Consulting' });
      expect(result.data.id).toBeDefined();
      expect(result.data.qualificationStatus).toBe('Pending');
    });

    it('should validate supplier data', async () => {
      await expect(client.createSupplier({}))
        .rejects.toThrow(AribaError);
    });
  });

  // ── approveDocument ──────────────────────────────────────────────

  describe('approveDocument', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should approve a requisition', async () => {
      const result = await client.approveDocument('requisition', 'REQ-001', 'approve');
      expect(result.action).toBe('approve');
      expect(result.newStatus).toBe('Approved');
    });

    it('should reject an invoice', async () => {
      const result = await client.approveDocument('invoice', 'INV-001', 'reject');
      expect(result.action).toBe('reject');
      expect(result.newStatus).toBe('Rejected');
    });

    it('should validate document type', async () => {
      await expect(client.approveDocument('unknown', 'DOC-001', 'approve'))
        .rejects.toThrow(AribaError);
    });

    it('should validate action', async () => {
      await expect(client.approveDocument('requisition', 'REQ-001', 'cancel'))
        .rejects.toThrow(AribaError);
    });
  });

  // ── Error handling ───────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw AribaError', () => {
      const unauthClient = new AribaClient({ mode: 'mock' });
      expect(() => unauthClient.getPurchaseOrders()).rejects.toThrow(AribaError);
    });

    it('should have correct error code', async () => {
      const unauthClient = new AribaClient({ mode: 'mock' });
      try {
        await unauthClient.getPurchaseOrders();
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err.code).toBe('ERR_ARIBA');
      }
    });

    it('should track request count', async () => {
      await client.authenticate();
      expect(client.getRequestCount()).toBe(0);
      await client.getPurchaseOrders();
      await client.getInvoices();
      expect(client.getRequestCount()).toBe(2);
    });
  });
});
