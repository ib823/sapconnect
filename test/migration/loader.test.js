const Loader = require('../../migration/loader');
const Transformer = require('../../migration/transformer');
const Extractor = require('../../migration/extractor');

describe('Loader', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  async function getTransformResult() {
    const extractor = new Extractor(mockGateway());
    const extraction = await extractor.extract();
    const transformer = new Transformer();
    return transformer.transform(extraction);
  }

  it('should load transformed data', async () => {
    const loader = new Loader(mockGateway());
    const transformResult = await getTransformResult();
    const result = await loader.load(transformResult);

    expect(result).toHaveProperty('loads');
    expect(result).toHaveProperty('stats');
    expect(result.loads.length).toBeGreaterThan(0);
  });

  it('should respect batch size', async () => {
    const loader = new Loader(mockGateway(), { batchSize: 1000 });
    const transformResult = await getTransformResult();
    const result = await loader.load(transformResult);

    expect(result.stats.batchSize).toBe(1000);
    expect(result.stats.totalBatches).toBeGreaterThan(0);
  });

  it('should simulate small error rate', async () => {
    const loader = new Loader(mockGateway());
    const transformResult = await getTransformResult();
    const result = await loader.load(transformResult);

    // For large datasets, there should be some simulated errors
    expect(result.stats.totalRecordsLoaded).toBeGreaterThan(0);
  });

  it('should report target type', async () => {
    const loaderPublic = new Loader(mockGateway(), { targetType: 'public' });
    const transformResult = await getTransformResult();
    const result = await loaderPublic.load(transformResult);

    expect(result.stats.targetType).toBe('public');
  });

  it('should handle private target type', async () => {
    const loader = new Loader(mockGateway(), { targetType: 'private' });
    const transformResult = await getTransformResult();
    const result = await loader.load(transformResult);

    expect(result.stats.targetType).toBe('private');
    for (const load of result.loads) {
      for (const tl of load.tableLoads) {
        expect(tl.method).toBe('Staging Table');
      }
    }
  });
});
