/**
 * Tests for Generic Function Module Caller
 */
const { FunctionCaller, FunctionCallError } = require('../../../lib/rfc/function-caller');

describe('FunctionCaller', () => {
  let mockPool;
  let mockClient;
  let caller;

  beforeEach(() => {
    mockClient = {
      call: vi.fn().mockResolvedValue({ COMPANY_LIST: [{ COMP_CODE: '1000' }] }),
      isConnected: true,
    };
    mockPool = {
      acquire: vi.fn().mockResolvedValue(mockClient),
      release: vi.fn().mockResolvedValue(undefined),
    };
    caller = new FunctionCaller(mockPool);
  });

  describe('call', () => {
    it('should call a function module and return result', async () => {
      const result = await caller.call('BAPI_COMPANYCODE_GETLIST');
      expect(result).toEqual({ COMPANY_LIST: [{ COMP_CODE: '1000' }] });
      expect(mockPool.acquire).toHaveBeenCalled();
      expect(mockPool.release).toHaveBeenCalled();
    });

    it('should pass imports and tables as params', async () => {
      await caller.call('BAPI_TEST', { PARAM1: 'A' }, { TABLE1: [{ F1: 'V1' }] });
      expect(mockClient.call).toHaveBeenCalledWith('BAPI_TEST', {
        PARAM1: 'A',
        TABLE1: [{ F1: 'V1' }],
      });
    });

    it('should check BAPI RETURN for errors', async () => {
      mockClient.call.mockResolvedValue({
        RETURN: [{ TYPE: 'E', ID: 'MM', NUMBER: '001', MESSAGE: 'Material not found' }],
      });
      await expect(caller.call('BAPI_MATERIAL_GETDETAIL')).rejects.toThrow('BAPI');
    });

    it('should not throw on success return messages', async () => {
      mockClient.call.mockResolvedValue({
        RETURN: [{ TYPE: 'S', ID: 'MM', NUMBER: '000', MESSAGE: 'Success' }],
      });
      const result = await caller.call('BAPI_MATERIAL_GETDETAIL');
      expect(result.RETURN[0].TYPE).toBe('S');
    });

    it('should release connection on error', async () => {
      mockClient.call.mockRejectedValue(new Error('Network error'));
      await expect(caller.call('BAD_FM')).rejects.toThrow();
      expect(mockPool.release).toHaveBeenCalled();
    });
  });

  describe('callWithCommit', () => {
    it('should call FM then BAPI_TRANSACTION_COMMIT', async () => {
      await caller.callWithCommit('BAPI_MATERIAL_SAVEDATA', { MATERIAL: 'MAT001' });
      expect(mockClient.call).toHaveBeenCalledTimes(2);
      expect(mockClient.call.mock.calls[1][0]).toBe('BAPI_TRANSACTION_COMMIT');
    });

    it('should rollback on error', async () => {
      mockClient.call
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce({});
      await expect(caller.callWithCommit('BAPI_FAIL')).rejects.toThrow();
      expect(mockClient.call).toHaveBeenCalledWith('BAPI_TRANSACTION_ROLLBACK');
    });
  });

  describe('getInterface', () => {
    it('should read FM interface definition', async () => {
      mockClient.call.mockResolvedValue({
        IMPORT_PARAMETER: [{ PARAMETER: 'MATERIALID ', TYP: 'MATNR   ', OPTIONAL: '', DEFAULT: '' }],
        EXPORT_PARAMETER: [{ PARAMETER: 'RETURN     ', TYP: 'BAPIRETURN' }],
        CHANGING_PARAMETER: [],
        TABLES_PARAMETER: [{ PARAMETER: 'ITEMS      ', TYP: 'BAPI_ITEMS' }],
      });
      const iface = await caller.getInterface('BAPI_MATERIAL_GETDETAIL');
      expect(iface.name).toBe('BAPI_MATERIAL_GETDETAIL');
      expect(iface.imports).toHaveLength(1);
      expect(iface.imports[0].name).toBe('MATERIALID');
      expect(iface.exports).toHaveLength(1);
      expect(iface.tables).toHaveLength(1);
    });
  });

  describe('FunctionCallError', () => {
    it('should be an instance of RfcError', () => {
      const { RfcError } = require('../../../lib/errors');
      const err = new FunctionCallError('test', { fm: 'BAPI_TEST' });
      expect(err).toBeInstanceOf(RfcError);
      expect(err.code).toBe('ERR_FUNCTION_CALL');
    });
  });
});
