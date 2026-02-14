/**
 * Tests for BDC Configuration Template Engine
 */

const { BdcEngine, SCREEN_SEQUENCES } = require('../../../lib/greenfield/bdc-engine');

describe('BdcEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new BdcEngine({ mode: 'mock' });
  });

  describe('validateTemplate', () => {
    it('should validate a valid company_code template', () => {
      const result = engine.validateTemplate({
        type: 'company_code',
        data: { BUKRS: '1000', BUTXT: 'Test Corp', WAERS: 'USD' },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid plant template', () => {
      const result = engine.validateTemplate({
        type: 'plant',
        data: { WERKS: '1000', NAME1: 'Main Plant' },
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a valid sales_org template', () => {
      const result = engine.validateTemplate({
        type: 'sales_org',
        data: { VKORG: '1000', VTEXT: 'US Sales' },
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a valid purchasing_org template', () => {
      const result = engine.validateTemplate({
        type: 'purchasing_org',
        data: { EKORG: '1000', EKOTX: 'US Purchasing' },
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a valid controlling_area template', () => {
      const result = engine.validateTemplate({
        type: 'controlling_area',
        data: { KOKRS: '1000', BEZEI: 'US Controlling' },
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a valid storage_location template', () => {
      const result = engine.validateTemplate({
        type: 'storage_location',
        data: { WERKS: '1000', LGORT: '0001', LGOBE: 'Main' },
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a valid shipping_point template', () => {
      const result = engine.validateTemplate({
        type: 'shipping_point',
        data: { VSTEL: '1000', VTEXT: 'Shipping NY' },
      });
      expect(result.valid).toBe(true);
    });

    it('should reject template without type', () => {
      const result = engine.validateTemplate({ data: { BUKRS: '1000' } });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('type');
    });

    it('should reject unknown template type', () => {
      const result = engine.validateTemplate({
        type: 'unknown_type',
        data: { FIELD: 'VALUE' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown template type');
    });

    it('should reject template without data object', () => {
      const result = engine.validateTemplate({ type: 'company_code' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('data');
    });

    it('should reject data with no recognized fields', () => {
      const result = engine.validateTemplate({
        type: 'company_code',
        data: { NONSENSE_FIELD: 'abc' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('at least one recognized field');
    });

    it('should reject null template', () => {
      const result = engine.validateTemplate(null);
      expect(result.valid).toBe(false);
    });

    it('should reject non-object template', () => {
      const result = engine.validateTemplate('not an object');
      expect(result.valid).toBe(false);
    });

    it('should validate custom template with screens', () => {
      const result = engine.validateTemplate({
        type: 'custom',
        transaction: 'ZT01',
        screens: [
          { program: 'ZPROG', dynpro: '0100', fields: { F1: 'V1' } },
        ],
      });
      expect(result.valid).toBe(true);
    });

    it('should reject custom template without transaction', () => {
      const result = engine.validateTemplate({
        type: 'custom',
        screens: [{ program: 'ZPROG', dynpro: '0100' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Custom templates must specify a "transaction"');
    });

    it('should reject custom template without screens', () => {
      const result = engine.validateTemplate({
        type: 'custom',
        transaction: 'ZT01',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('screens');
    });

    it('should reject custom template with empty screens array', () => {
      const result = engine.validateTemplate({
        type: 'custom',
        transaction: 'ZT01',
        screens: [],
      });
      expect(result.valid).toBe(false);
    });

    it('should reject custom screen without program', () => {
      const result = engine.validateTemplate({
        type: 'custom',
        transaction: 'ZT01',
        screens: [{ dynpro: '0100' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('program');
    });

    it('should reject custom screen without dynpro', () => {
      const result = engine.validateTemplate({
        type: 'custom',
        transaction: 'ZT01',
        screens: [{ program: 'ZPROG' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('dynpro');
    });
  });

  describe('generateRecording', () => {
    it('should generate BDC recording for company_code', () => {
      const result = engine.generateRecording({
        type: 'company_code',
        data: { BUKRS: '1000', BUTXT: 'ACME Corp', ORT01: 'New York', LAND1: 'US', WAERS: 'USD', SPRAS: 'EN', KTOPL: 'CAUS' },
      });

      expect(result.transaction).toBe('OX02');
      expect(result.type).toBe('company_code');
      expect(result.recording).toBeInstanceOf(Array);
      expect(result.recording.length).toBeGreaterThan(0);

      // First entry should be dynpro begin
      expect(result.recording[0].dynbegin).toBe('X');
      expect(result.recording[0].program).toBe('SAPMF02K');
      expect(result.recording[0].dynpro).toBe('0100');
    });

    it('should include field values from template data', () => {
      const result = engine.generateRecording({
        type: 'company_code',
        data: { BUKRS: '2000', BUTXT: 'Test Corp', WAERS: 'EUR' },
      });

      const fieldEntries = result.recording.filter(r => r.fnam && r.fnam !== 'BDC_OKCODE');
      const bukrsEntry = fieldEntries.find(r => r.fnam === 'RF02K-BUKRS');
      expect(bukrsEntry).toBeDefined();
      expect(bukrsEntry.fval).toBe('2000');
    });

    it('should generate recording for plant', () => {
      const result = engine.generateRecording({
        type: 'plant',
        data: { WERKS: '1000', NAME1: 'Main Plant', BUKRS: '1000', LAND1: 'US' },
      });
      expect(result.transaction).toBe('OX10');
      expect(result.recording.length).toBeGreaterThan(0);
    });

    it('should generate recording for sales_org', () => {
      const result = engine.generateRecording({
        type: 'sales_org',
        data: { VKORG: '1000', VTEXT: 'US Sales Org', BUKRS: '1000' },
      });
      expect(result.transaction).toBe('OVXD');
    });

    it('should generate recording for purchasing_org', () => {
      const result = engine.generateRecording({
        type: 'purchasing_org',
        data: { EKORG: '1000', EKOTX: 'US Purchasing' },
      });
      expect(result.transaction).toBe('OX08');
    });

    it('should generate recording for controlling_area', () => {
      const result = engine.generateRecording({
        type: 'controlling_area',
        data: { KOKRS: '1000', BEZEI: 'US Controlling', KTOPL: 'CAUS' },
      });
      expect(result.transaction).toBe('OKKP');
      expect(result.recording.length).toBeGreaterThan(0);
    });

    it('should generate recording for storage_location', () => {
      const result = engine.generateRecording({
        type: 'storage_location',
        data: { WERKS: '1000', LGORT: '0001', LGOBE: 'Main Storage' },
      });
      expect(result.transaction).toBe('OX09');
    });

    it('should generate recording for shipping_point', () => {
      const result = engine.generateRecording({
        type: 'shipping_point',
        data: { VSTEL: '1000', VTEXT: 'Shipping Point NY', WERKS: '1000' },
      });
      expect(result.transaction).toBe('OVXC');
    });

    it('should include OK codes in recording', () => {
      const result = engine.generateRecording({
        type: 'company_code',
        data: { BUKRS: '1000', BUTXT: 'Test' },
      });

      const okCodes = result.recording.filter(r => r.fnam === 'BDC_OKCODE');
      expect(okCodes.length).toBeGreaterThan(0);
    });

    it('should skip null data fields', () => {
      const result = engine.generateRecording({
        type: 'company_code',
        data: { BUKRS: '1000', BUTXT: null, WAERS: 'USD' },
      });

      const fieldEntries = result.recording.filter(r => r.fnam && r.fnam !== 'BDC_OKCODE');
      const butxtEntry = fieldEntries.find(r => r.fnam === 'T001-BUTXT');
      expect(butxtEntry).toBeUndefined();
    });

    it('should throw on invalid template', () => {
      expect(() => engine.generateRecording({ data: { X: 'Y' } })).toThrow('Invalid template');
    });

    it('should handle custom template with explicit screens', () => {
      const result = engine.generateRecording({
        type: 'custom',
        transaction: 'ZT01',
        screens: [
          {
            program: 'ZPROG',
            dynpro: '0100',
            fields: { 'ZPROG-FIELD1': 'VALUE1' },
            okcode: '/00',
          },
          {
            program: 'ZPROG',
            dynpro: '0200',
            fields: { 'ZPROG-FIELD2': 'VALUE2' },
            okcode: '=SAVE',
          },
        ],
      });

      expect(result.type).toBe('custom');
      expect(result.transaction).toBe('ZT01');
      expect(result.recording.length).toBeGreaterThan(0);
      // Two dynpro begins
      const begins = result.recording.filter(r => r.dynbegin === 'X');
      expect(begins).toHaveLength(2);
    });

    it('should allow overriding transaction in template', () => {
      const result = engine.generateRecording({
        type: 'company_code',
        transaction: 'ZOX02',
        data: { BUKRS: '1000', BUTXT: 'Test' },
      });
      expect(result.transaction).toBe('ZOX02');
    });
  });

  describe('executeRecording', () => {
    it('should return mock success in mock mode', async () => {
      const recording = engine.generateRecording({
        type: 'company_code',
        data: { BUKRS: '1000', BUTXT: 'Test' },
      });

      const result = await engine.executeRecording(recording);
      expect(result.success).toBe(true);
      expect(result.transaction).toBe('OX02');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('S');
      expect(result.recordsProcessed).toBe(1);
    });

    it('should call ABAP4_CALL_TRANSACTION in live mode', async () => {
      const liveEngine = new BdcEngine({ mode: 'live' });
      const recording = liveEngine.generateRecording({
        type: 'company_code',
        data: { BUKRS: '1000', BUTXT: 'Test' },
      });

      const mockClient = {
        call: vi.fn().mockResolvedValue({
          SUBRC: 0,
          MESSAGES: [{ MSGTYP: 'S', MSGID: 'BDC', MSGNR: '000', MSGV1: 'Success' }],
        }),
      };
      const mockPool = {
        acquire: vi.fn().mockResolvedValue(mockClient),
        release: vi.fn().mockResolvedValue(undefined),
      };

      const result = await liveEngine.executeRecording(recording, mockPool);
      expect(result.success).toBe(true);
      expect(mockClient.call).toHaveBeenCalledWith('ABAP4_CALL_TRANSACTION', expect.objectContaining({
        TCODE: 'OX02',
      }));
      expect(mockPool.release).toHaveBeenCalled();
    });

    it('should detect errors in live execution result', async () => {
      const liveEngine = new BdcEngine({ mode: 'live' });
      const recording = liveEngine.generateRecording({
        type: 'plant',
        data: { WERKS: '9999', NAME1: 'Bad Plant' },
      });

      const mockClient = {
        call: vi.fn().mockResolvedValue({
          SUBRC: 4,
          MESSAGES: [{ MSGTYP: 'E', MSGID: 'MSG', MSGNR: '001', MSGV1: 'Plant already exists' }],
        }),
      };
      const mockPool = {
        acquire: vi.fn().mockResolvedValue(mockClient),
        release: vi.fn().mockResolvedValue(undefined),
      };

      const result = await liveEngine.executeRecording(recording, mockPool);
      expect(result.success).toBe(false);
      expect(result.recordsProcessed).toBe(0);
    });
  });

  describe('listTemplateTypes', () => {
    it('should return all 55 built-in types plus custom', () => {
      const types = engine.listTemplateTypes();
      expect(types.length).toBe(56); // 55 built-in + custom
    });

    it('should include transaction codes for each type', () => {
      const types = engine.listTemplateTypes();
      const companyCode = types.find(t => t.type === 'company_code');
      expect(companyCode.transaction).toBe('OX02');
    });

    it('should include descriptions', () => {
      const types = engine.listTemplateTypes();
      for (const t of types) {
        expect(t.description).toBeDefined();
        expect(t.description.length).toBeGreaterThan(0);
      }
    });

    it('should include field lists for non-custom types', () => {
      const types = engine.listTemplateTypes();
      const plant = types.find(t => t.type === 'plant');
      expect(plant.fields.length).toBeGreaterThan(0);
      expect(plant.fields).toContain('WERKS');
    });

    it('should include custom type with empty fields', () => {
      const types = engine.listTemplateTypes();
      const custom = types.find(t => t.type === 'custom');
      expect(custom).toBeDefined();
      expect(custom.fields).toHaveLength(0);
    });
  });

  describe('generateBatch', () => {
    it('should generate recordings for multiple templates', () => {
      const result = engine.generateBatch([
        { type: 'company_code', data: { BUKRS: '1000', BUTXT: 'Corp A' } },
        { type: 'plant', data: { WERKS: '1000', NAME1: 'Plant A' } },
      ]);

      expect(result.recordings).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
    });

    it('should handle mixed valid and invalid templates', () => {
      const result = engine.generateBatch([
        { type: 'company_code', data: { BUKRS: '1000', BUTXT: 'Corp A' } },
        { type: 'invalid_type', data: { X: 'Y' } },
        { type: 'plant', data: { WERKS: '1000', NAME1: 'Plant A' } },
      ]);

      expect(result.recordings).toHaveLength(2);
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.errors).toHaveLength(1);
      expect(result.summary.errors[0].index).toBe(1);
    });

    it('should throw on empty array', () => {
      expect(() => engine.generateBatch([])).toThrow('non-empty array');
    });

    it('should throw on non-array input', () => {
      expect(() => engine.generateBatch('not an array')).toThrow('non-empty array');
    });
  });

  describe('toTransportFormat', () => {
    it('should format recording with header and bdcdata', () => {
      const recording = engine.generateRecording({
        type: 'company_code',
        data: { BUKRS: '1000', BUTXT: 'Test' },
      });

      const transport = engine.toTransportFormat(recording);
      expect(transport.header).toBeDefined();
      expect(transport.header.transaction).toBe('OX02');
      expect(transport.header.type).toBe('company_code');
      expect(transport.header.mode).toBe('N');
      expect(transport.header.update).toBe('S');
      expect(transport.header.generatedAt).toBeDefined();
      expect(transport.header.stepCount).toBe(recording.recording.length);
    });

    it('should include line numbers in bdcdata', () => {
      const recording = engine.generateRecording({
        type: 'plant',
        data: { WERKS: '1000', NAME1: 'Test Plant' },
      });

      const transport = engine.toTransportFormat(recording);
      expect(transport.bdcdata.length).toBeGreaterThan(0);
      expect(transport.bdcdata[0].line).toBe(1);
      expect(transport.bdcdata[0].PROGRAM).toBeDefined();
      expect(transport.bdcdata[0].DYNPRO).toBeDefined();
    });

    it('should map recording fields to uppercase SAP format', () => {
      const recording = engine.generateRecording({
        type: 'storage_location',
        data: { WERKS: '1000', LGORT: '0001', LGOBE: 'Main' },
      });

      const transport = engine.toTransportFormat(recording);
      const firstEntry = transport.bdcdata[0];
      expect(firstEntry).toHaveProperty('PROGRAM');
      expect(firstEntry).toHaveProperty('DYNPRO');
      expect(firstEntry).toHaveProperty('DYNBEGIN');
      expect(firstEntry).toHaveProperty('FNAM');
      expect(firstEntry).toHaveProperty('FVAL');
    });
  });

  describe('SCREEN_SEQUENCES', () => {
    it('should define all 55 template types', () => {
      const types = Object.keys(SCREEN_SEQUENCES);
      expect(types.length).toBe(55);
      expect(types).toContain('company_code');
      expect(types).toContain('plant');
      expect(types).toContain('sales_org');
      expect(types).toContain('purchasing_org');
      expect(types).toContain('controlling_area');
      expect(types).toContain('storage_location');
      expect(types).toContain('shipping_point');
    });

    it('should have transaction codes for each type', () => {
      for (const [type, seq] of Object.entries(SCREEN_SEQUENCES)) {
        expect(seq.transaction).toBeDefined();
        expect(seq.transaction.length).toBeGreaterThanOrEqual(4);
      }
    });
  });
});
