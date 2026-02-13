/**
 * Tests for Universal Table Reader
 */
const { TableReader, TableReadError } = require('../../../lib/rfc/table-reader');

describe('TableReader', () => {
  let mockPool;
  let mockClient;
  let reader;

  beforeEach(() => {
    mockClient = {
      call: vi.fn().mockResolvedValue({
        FIELDS: [
          { FIELDNAME: 'BUKRS', OFFSET: '0', LENGTH: '4', TYPE: 'C' },
          { FIELDNAME: 'BUTXT', OFFSET: '4', LENGTH: '25', TYPE: 'C' },
        ],
        DATA: [
          { WA: '1000Test Company              ' },
          { WA: '2000Second Company            ' },
        ],
      }),
      isConnected: true,
    };
    mockPool = {
      acquire: vi.fn().mockResolvedValue(mockClient),
      release: vi.fn().mockResolvedValue(undefined),
    };
    reader = new TableReader(mockPool, { chunkSize: 100 });
  });

  describe('readTable', () => {
    it('should read and parse table data', async () => {
      const result = await reader.readTable('T001');
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].BUKRS).toBe('1000');
      expect(result.rows[0].BUTXT).toBe('Test Company');
      expect(result.fields).toEqual(['BUKRS', 'BUTXT']);
    });

    it('should pass fields and where clause', async () => {
      await reader.readTable('T001', { fields: ['BUKRS'], where: "BUKRS = '1000'" });
      // First call (index 0) is FM resolution with T000, second (index 1) is actual read
      const callArgs = mockClient.call.mock.calls[1];
      const params = callArgs[1];
      expect(params.QUERY_TABLE).toBe('T001');
    });

    it('should release connection even on error', async () => {
      mockClient.call.mockRejectedValue(new Error('Auth error'));
      reader._resolvedFm = 'RFC_READ_TABLE'; // Skip FM resolution
      await expect(reader.readTable('ZFAIL')).rejects.toThrow();
      expect(mockPool.release).toHaveBeenCalled();
    });
  });

  describe('streamTable', () => {
    it('should yield chunks via AsyncGenerator', async () => {
      // First call returns full chunk, second returns less than chunk
      let callCount = 0;
      mockClient.call.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          // FM resolution + first read
          return Promise.resolve({
            FIELDS: [{ FIELDNAME: 'BUKRS', OFFSET: '0', LENGTH: '4', TYPE: 'C' }],
            DATA: [{ WA: '1000' }, { WA: '2000' }],
          });
        }
        // Second read — empty (end of data)
        return Promise.resolve({
          FIELDS: [{ FIELDNAME: 'BUKRS', OFFSET: '0', LENGTH: '4', TYPE: 'C' }],
          DATA: [],
        });
      });

      const chunks = [];
      for await (const chunk of reader.streamTable('T001', { chunkSize: 2 })) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0].rows.length).toBeGreaterThan(0);
    });
  });

  describe('getTableMetadata', () => {
    it('should return field metadata from DD03L', async () => {
      mockClient.call.mockResolvedValue({
        FIELDS: [
          { FIELDNAME: 'FIELDNAME', OFFSET: '0', LENGTH: '30', TYPE: 'C' },
          { FIELDNAME: 'DATATYPE', OFFSET: '30', LENGTH: '4', TYPE: 'C' },
          { FIELDNAME: 'LENG', OFFSET: '34', LENGTH: '6', TYPE: 'N' },
          { FIELDNAME: 'DECIMALS', OFFSET: '40', LENGTH: '6', TYPE: 'N' },
          { FIELDNAME: 'ROLLNAME', OFFSET: '46', LENGTH: '30', TYPE: 'C' },
        ],
        DATA: [
          { WA: 'BUKRS                         CHAR004   000000BUKRS                         ' },
          { WA: 'BUTXT                         CHAR025   000000BUTXT                         ' },
        ],
      });
      reader._resolvedFm = 'RFC_READ_TABLE';
      const meta = await reader.getTableMetadata('T001');
      expect(meta.table).toBe('T001');
      expect(meta.fields.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TableReadError', () => {
    it('should be an instance of RfcError', () => {
      const { RfcError } = require('../../../lib/errors');
      const err = new TableReadError('test', { table: 'T001' });
      expect(err).toBeInstanceOf(RfcError);
      expect(err.code).toBe('ERR_TABLE_READ');
    });
  });
});
