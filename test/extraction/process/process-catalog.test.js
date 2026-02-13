/**
 * Tests for ProcessCatalog
 */

const ProcessCatalog = require('../../../extraction/process/process-catalog');

describe('ProcessCatalog', () => {
  let catalog;

  beforeEach(() => {
    catalog = new ProcessCatalog();
  });

  const makeProcess = (overrides = {}) => ({
    processId: 'PROC-001',
    name: 'Order to Cash',
    category: 'SD',
    variants: [
      {
        description: 'Standard Order',
        volume: 1000,
        steps: [
          { activity: 'Create Order' },
          { activity: 'Deliver Goods' },
          { activity: 'Create Invoice' },
        ],
        users: ['USER1', 'USER2'],
      },
    ],
    gaps: [],
    ...overrides,
  });

  describe('empty catalog', () => {
    it('should have an empty processes array', () => {
      expect(catalog.processes).toEqual([]);
      expect(catalog.processes).toHaveLength(0);
    });

    it('toJSON shows 0 totals', () => {
      const json = catalog.toJSON();
      expect(json.totalProcesses).toBe(0);
      expect(json.totalVariants).toBe(0);
      expect(json.processes).toEqual([]);
    });

    it('toJSON includes generatedAt timestamp', () => {
      const json = catalog.toJSON();
      expect(json).toHaveProperty('generatedAt');
      expect(typeof json.generatedAt).toBe('string');
      // Should be a valid ISO date
      expect(() => new Date(json.generatedAt)).not.toThrow();
      expect(new Date(json.generatedAt).toISOString()).toBe(json.generatedAt);
    });

    it('getSummary returns 0 totalProcesses', () => {
      const summary = catalog.getSummary();
      expect(summary.totalProcesses).toBe(0);
    });

    it('getSummary returns empty byCategory', () => {
      const summary = catalog.getSummary();
      expect(summary.byCategory).toEqual({});
    });

    it('getSummary returns empty topByVolume', () => {
      const summary = catalog.getSummary();
      expect(summary.topByVolume).toEqual([]);
    });

    it('toMarkdown produces valid markdown with header', () => {
      const md = catalog.toMarkdown();
      expect(md).toContain('# Process Catalog');
      expect(md).toContain('Total Processes: 0');
    });
  });

  describe('addProcess', () => {
    it('adds a process to the catalog', () => {
      catalog.addProcess(makeProcess());
      expect(catalog.processes).toHaveLength(1);
    });

    it('adds multiple processes', () => {
      catalog.addProcess(makeProcess({ processId: 'PROC-001' }));
      catalog.addProcess(makeProcess({ processId: 'PROC-002', name: 'Procure to Pay' }));
      catalog.addProcess(makeProcess({ processId: 'PROC-003', name: 'Plan to Produce' }));
      expect(catalog.processes).toHaveLength(3);
    });

    it('preserves all process properties', () => {
      const proc = makeProcess();
      catalog.addProcess(proc);
      expect(catalog.processes[0]).toBe(proc);
      expect(catalog.processes[0].processId).toBe('PROC-001');
      expect(catalog.processes[0].name).toBe('Order to Cash');
      expect(catalog.processes[0].category).toBe('SD');
    });
  });

  describe('getProcess', () => {
    it('finds a process by processId', () => {
      catalog.addProcess(makeProcess({ processId: 'PROC-001' }));
      catalog.addProcess(makeProcess({ processId: 'PROC-002', name: 'Procure to Pay' }));
      const found = catalog.getProcess('PROC-002');
      expect(found).toBeDefined();
      expect(found.processId).toBe('PROC-002');
      expect(found.name).toBe('Procure to Pay');
    });

    it('returns null for unknown processId', () => {
      catalog.addProcess(makeProcess({ processId: 'PROC-001' }));
      expect(catalog.getProcess('NONEXISTENT')).toBeNull();
    });

    it('returns null on empty catalog', () => {
      expect(catalog.getProcess('PROC-001')).toBeNull();
    });

    it('returns the first match if duplicates exist', () => {
      catalog.addProcess(makeProcess({ processId: 'PROC-001', name: 'First' }));
      catalog.addProcess(makeProcess({ processId: 'PROC-001', name: 'Second' }));
      const found = catalog.getProcess('PROC-001');
      expect(found.name).toBe('First');
    });
  });

  describe('toJSON', () => {
    it('includes generatedAt as ISO string', () => {
      const json = catalog.toJSON();
      expect(json.generatedAt).toBeDefined();
      const date = new Date(json.generatedAt);
      expect(date.toISOString()).toBe(json.generatedAt);
    });

    it('correctly counts totalProcesses', () => {
      catalog.addProcess(makeProcess({ processId: 'PROC-001' }));
      catalog.addProcess(makeProcess({ processId: 'PROC-002' }));
      const json = catalog.toJSON();
      expect(json.totalProcesses).toBe(2);
    });

    it('correctly counts totalVariants across all processes', () => {
      catalog.addProcess(makeProcess({
        processId: 'PROC-001',
        variants: [
          { description: 'V1', volume: 100 },
          { description: 'V2', volume: 200 },
        ],
      }));
      catalog.addProcess(makeProcess({
        processId: 'PROC-002',
        variants: [
          { description: 'V3', volume: 50 },
        ],
      }));
      const json = catalog.toJSON();
      expect(json.totalVariants).toBe(3);
    });

    it('totalVariants is 0 when processes have no variants', () => {
      catalog.addProcess(makeProcess({ processId: 'PROC-001', variants: undefined }));
      const json = catalog.toJSON();
      expect(json.totalVariants).toBe(0);
    });

    it('includes all processes in the output', () => {
      const proc1 = makeProcess({ processId: 'PROC-001' });
      const proc2 = makeProcess({ processId: 'PROC-002' });
      catalog.addProcess(proc1);
      catalog.addProcess(proc2);
      const json = catalog.toJSON();
      expect(json.processes).toHaveLength(2);
      expect(json.processes[0]).toBe(proc1);
      expect(json.processes[1]).toBe(proc2);
    });
  });

  describe('toMarkdown', () => {
    it('starts with # Process Catalog heading', () => {
      const md = catalog.toMarkdown();
      expect(md.startsWith('# Process Catalog')).toBe(true);
    });

    it('includes Generated timestamp', () => {
      const md = catalog.toMarkdown();
      expect(md).toContain('Generated:');
    });

    it('includes Total Processes count', () => {
      catalog.addProcess(makeProcess());
      const md = catalog.toMarkdown();
      expect(md).toContain('Total Processes: 1');
    });

    it('includes process name as ## heading', () => {
      catalog.addProcess(makeProcess({ name: 'Order to Cash' }));
      const md = catalog.toMarkdown();
      expect(md).toContain('## Order to Cash');
    });

    it('includes process category', () => {
      catalog.addProcess(makeProcess({ category: 'SD' }));
      const md = catalog.toMarkdown();
      expect(md).toContain('- Category: SD');
    });

    it('includes variant count', () => {
      catalog.addProcess(makeProcess({
        variants: [
          { description: 'V1', volume: 100, steps: [], users: [] },
          { description: 'V2', volume: 200, steps: [], users: [] },
        ],
      }));
      const md = catalog.toMarkdown();
      expect(md).toContain('- Variants: 2');
    });

    it('includes total volume from variants', () => {
      catalog.addProcess(makeProcess({
        variants: [
          { description: 'V1', volume: 100, steps: [], users: [] },
          { description: 'V2', volume: 200, steps: [], users: [] },
        ],
      }));
      const md = catalog.toMarkdown();
      expect(md).toContain('- Total Volume: 300');
    });

    it('includes variant details', () => {
      catalog.addProcess(makeProcess({
        variants: [
          {
            description: 'Standard Order',
            volume: 500,
            steps: [{ activity: 'Create Order' }, { activity: 'Ship' }],
            users: ['USER1', 'USER2'],
          },
        ],
      }));
      const md = catalog.toMarkdown();
      expect(md).toContain('### Variant: Standard Order');
      expect(md).toContain('- Volume: 500');
      expect(md).toContain('Create Order');
      expect(md).toContain('Ship');
      expect(md).toContain('USER1, USER2');
    });

    it('includes steps joined with arrow', () => {
      catalog.addProcess(makeProcess({
        variants: [
          {
            description: 'Flow',
            volume: 10,
            steps: [{ activity: 'A' }, { activity: 'B' }, { activity: 'C' }],
            users: [],
          },
        ],
      }));
      const md = catalog.toMarkdown();
      expect(md).toMatch(/A → B → C/);
    });

    it('includes gaps section when gaps exist', () => {
      catalog.addProcess(makeProcess({
        gaps: ['Missing approval step', 'No error handling'],
      }));
      const md = catalog.toMarkdown();
      expect(md).toContain('### Gaps');
      expect(md).toContain('- Missing approval step');
      expect(md).toContain('- No error handling');
    });

    it('omits gaps section when no gaps', () => {
      catalog.addProcess(makeProcess({ gaps: [] }));
      const md = catalog.toMarkdown();
      expect(md).not.toContain('### Gaps');
    });

    it('shows N/A for users when none specified', () => {
      catalog.addProcess(makeProcess({
        variants: [
          { description: 'V1', volume: 10, steps: [], users: undefined },
        ],
      }));
      const md = catalog.toMarkdown();
      expect(md).toContain('N/A');
    });
  });

  describe('getSummary', () => {
    it('returns correct totalProcesses', () => {
      catalog.addProcess(makeProcess({ processId: 'P1' }));
      catalog.addProcess(makeProcess({ processId: 'P2' }));
      expect(catalog.getSummary().totalProcesses).toBe(2);
    });

    it('groups processes by category', () => {
      catalog.addProcess(makeProcess({ processId: 'P1', category: 'SD' }));
      catalog.addProcess(makeProcess({ processId: 'P2', category: 'SD' }));
      catalog.addProcess(makeProcess({ processId: 'P3', category: 'MM' }));
      const summary = catalog.getSummary();
      expect(summary.byCategory).toEqual({ SD: 2, MM: 1 });
    });

    it('sorts topByVolume in descending order', () => {
      catalog.addProcess(makeProcess({
        processId: 'P1',
        name: 'Low Volume',
        variants: [{ description: 'V', volume: 10 }],
      }));
      catalog.addProcess(makeProcess({
        processId: 'P2',
        name: 'High Volume',
        variants: [{ description: 'V', volume: 5000 }],
      }));
      catalog.addProcess(makeProcess({
        processId: 'P3',
        name: 'Mid Volume',
        variants: [{ description: 'V', volume: 500 }],
      }));
      const summary = catalog.getSummary();
      expect(summary.topByVolume[0].name).toBe('High Volume');
      expect(summary.topByVolume[0].volume).toBe(5000);
      expect(summary.topByVolume[1].name).toBe('Mid Volume');
      expect(summary.topByVolume[1].volume).toBe(500);
      expect(summary.topByVolume[2].name).toBe('Low Volume');
      expect(summary.topByVolume[2].volume).toBe(10);
    });

    it('limits topByVolume to 5 entries', () => {
      for (let i = 0; i < 8; i++) {
        catalog.addProcess(makeProcess({
          processId: `P${i}`,
          name: `Process ${i}`,
          variants: [{ description: 'V', volume: (i + 1) * 100 }],
        }));
      }
      const summary = catalog.getSummary();
      expect(summary.topByVolume).toHaveLength(5);
      // Top should be Process 7 with volume 800
      expect(summary.topByVolume[0].name).toBe('Process 7');
      expect(summary.topByVolume[0].volume).toBe(800);
    });

    it('handles processes without variants in topByVolume', () => {
      catalog.addProcess(makeProcess({
        processId: 'P1',
        name: 'No Variants',
        variants: undefined,
      }));
      const summary = catalog.getSummary();
      expect(summary.topByVolume).toHaveLength(1);
      expect(summary.topByVolume[0].volume).toBe(0);
    });

    it('aggregates volume across multiple variants', () => {
      catalog.addProcess(makeProcess({
        processId: 'P1',
        name: 'Multi Variant',
        variants: [
          { description: 'V1', volume: 100 },
          { description: 'V2', volume: 200 },
          { description: 'V3', volume: 300 },
        ],
      }));
      const summary = catalog.getSummary();
      expect(summary.topByVolume[0].name).toBe('Multi Variant');
      expect(summary.topByVolume[0].volume).toBe(600);
    });
  });

  describe('multiple processes with variants — totalVariants calculation', () => {
    it('counts all variants across all processes', () => {
      catalog.addProcess(makeProcess({
        processId: 'P1',
        variants: [
          { description: 'V1', volume: 100 },
          { description: 'V2', volume: 200 },
        ],
      }));
      catalog.addProcess(makeProcess({
        processId: 'P2',
        variants: [
          { description: 'V3', volume: 300 },
          { description: 'V4', volume: 400 },
          { description: 'V5', volume: 500 },
        ],
      }));
      catalog.addProcess(makeProcess({
        processId: 'P3',
        variants: [],
      }));
      const json = catalog.toJSON();
      expect(json.totalVariants).toBe(5);
    });

    it('handles mix of processes with and without variants', () => {
      catalog.addProcess(makeProcess({
        processId: 'P1',
        variants: [{ description: 'V1', volume: 100 }],
      }));
      catalog.addProcess(makeProcess({
        processId: 'P2',
        variants: undefined,
      }));
      catalog.addProcess(makeProcess({
        processId: 'P3',
        variants: [
          { description: 'V2', volume: 200 },
          { description: 'V3', volume: 300 },
        ],
      }));
      const json = catalog.toJSON();
      expect(json.totalVariants).toBe(3);
    });
  });
});
