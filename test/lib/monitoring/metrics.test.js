const { MetricsCollector } = require('../../../lib/monitoring/metrics');

describe('MetricsCollector', () => {
  let metrics;

  beforeEach(() => { metrics = new MetricsCollector({ prefix: 'test' }); });

  describe('increment', () => {
    it('increments a counter', () => {
      metrics.increment('requests', { method: 'GET' });
      metrics.increment('requests', { method: 'GET' });
      const json = metrics.toJSON();
      expect(json.counters['requests{method=GET}'].value).toBe(2);
    });

    it('increments by custom value', () => {
      metrics.increment('bytes', {}, 1024);
      expect(metrics.toJSON().counters['bytes'].value).toBe(1024);
    });
  });

  describe('gauge', () => {
    it('sets gauge value', () => {
      metrics.gauge('memory', 512, { type: 'heap' });
      expect(metrics.toJSON().gauges['memory{type=heap}'].value).toBe(512);
    });

    it('overwrites previous value', () => {
      metrics.gauge('connections', 5);
      metrics.gauge('connections', 10);
      expect(metrics.toJSON().gauges['connections'].value).toBe(10);
    });
  });

  describe('observe', () => {
    it('records histogram observations', () => {
      metrics.observe('latency', 100);
      metrics.observe('latency', 200);
      metrics.observe('latency', 50);

      const hist = metrics.toJSON().histograms['latency'];
      expect(hist.count).toBe(3);
      expect(hist.sum).toBe(350);
      expect(hist.min).toBe(50);
      expect(hist.max).toBe(200);
      expect(hist.avg).toBeCloseTo(116.67, 0);
    });
  });

  describe('toPrometheus', () => {
    it('exports counter in Prometheus format', () => {
      metrics.increment('http_requests', { method: 'GET' });
      const output = metrics.toPrometheus();
      expect(output).toContain('# TYPE test_http_requests_total counter');
      expect(output).toContain('test_http_requests_total{method="GET"} 1');
    });

    it('exports histogram with buckets', () => {
      metrics.observe('duration', 50);
      const output = metrics.toPrometheus();
      expect(output).toContain('# TYPE test_duration histogram');
      expect(output).toContain('test_duration_count');
      expect(output).toContain('test_duration_sum');
    });
  });

  describe('middleware', () => {
    it('records request metrics', () => {
      const mw = metrics.middleware();
      let finishHandler;
      const req = { method: 'GET', path: '/test', route: { path: '/test' } };
      const res = {
        statusCode: 200,
        on: (event, handler) => { if (event === 'finish') finishHandler = handler; },
      };
      const next = vi.fn();

      mw(req, res, next);
      expect(next).toHaveBeenCalled();
      finishHandler();

      const json = metrics.toJSON();
      const counterKey = Object.keys(json.counters).find(k => k.includes('http_requests'));
      expect(counterKey).toBeDefined();
    });
  });

  describe('registerRoutes', () => {
    it('registers /metrics endpoint', () => {
      const routes = [];
      const router = { get: (path, handler) => routes.push({ path, handler }) };
      metrics.registerRoutes(router);
      expect(routes[0].path).toBe('/metrics');
    });
  });

  describe('reset', () => {
    it('clears all metrics', () => {
      metrics.increment('test');
      metrics.gauge('test', 1);
      metrics.observe('test', 1);
      metrics.reset();
      const json = metrics.toJSON();
      expect(Object.keys(json.counters)).toHaveLength(0);
      expect(Object.keys(json.gauges)).toHaveLength(0);
      expect(Object.keys(json.histograms)).toHaveLength(0);
    });
  });
});
