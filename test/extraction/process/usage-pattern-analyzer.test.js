const UsagePatternAnalyzer = require('../../../extraction/process/usage-pattern-analyzer');

describe('UsagePatternAnalyzer', () => {
  const mockUsageData = {
    transactionUsage: [
      { tcode: 'VA01', executions: 15420, totalTime: 462600, avgTime: 30 },
      { tcode: 'VA02', executions: 28350, totalTime: 425250, avgTime: 15 },
      { tcode: 'ME21N', executions: 8900, totalTime: 267000, avgTime: 30 },
      { tcode: 'FB01', executions: 6200, totalTime: 186000, avgTime: 30 },
      { tcode: 'SE38', executions: 5600, totalTime: 280000, avgTime: 50 },
    ],
    userActivity: [
      { user: 'JSMITH', totalExecutions: 12500, topTcodes: ['VA01', 'VA02', 'VL01N'] },
      { user: 'KLEE', totalExecutions: 9800, topTcodes: ['ME21N', 'ME23N', 'MIGO'] },
      { user: 'LCHEN', totalExecutions: 8200, topTcodes: ['FB01', 'FB03', 'F110'] },
      { user: 'ADMIN', totalExecutions: 6500, topTcodes: ['SE38', 'SM37', 'SU01'] },
    ],
    timeDistribution: [
      { hour: 8, executions: 8500 },
      { hour: 9, executions: 15200 },
      { hour: 10, executions: 18900 },
      { hour: 14, executions: 17800 },
    ],
  };

  it('should rank transactions by execution count', () => {
    const analyzer = new UsagePatternAnalyzer(mockUsageData);
    const ranking = analyzer.getTransactionRanking();
    expect(ranking.length).toBe(5);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[0].tcode).toBe('VA02');
    expect(ranking[1].tcode).toBe('VA01');
  });

  it('should build user-transaction matrix', () => {
    const analyzer = new UsagePatternAnalyzer(mockUsageData);
    const matrix = analyzer.getUserTransactionMatrix();
    expect(matrix.JSMITH).toBeDefined();
    expect(matrix.JSMITH.totalExecutions).toBe(12500);
    expect(matrix.JSMITH.topTcodes).toContain('VA01');
    expect(matrix.KLEE.topTcodes).toContain('ME21N');
  });

  it('should derive transaction sequences from user patterns', () => {
    const analyzer = new UsagePatternAnalyzer(mockUsageData);
    const sequences = analyzer.getTransactionSequences();
    expect(sequences.length).toBeGreaterThan(0);
    expect(sequences[0]).toHaveProperty('from');
    expect(sequences[0]).toHaveProperty('to');
    expect(sequences[0]).toHaveProperty('user');
  });

  it('should return sorted time distribution', () => {
    const analyzer = new UsagePatternAnalyzer(mockUsageData);
    const dist = analyzer.getTimeDistribution();
    expect(dist.length).toBe(4);
    expect(dist[0].hour).toBe(8);
    expect(dist[dist.length - 1].hour).toBe(14);
  });

  it('should identify unused transactions', () => {
    const analyzer = new UsagePatternAnalyzer(mockUsageData);
    const unused = analyzer.getUnusedTransactions(['VA01', 'VA02', 'XK01', 'FK01']);
    expect(unused).toContain('XK01');
    expect(unused).toContain('FK01');
    expect(unused).not.toContain('VA01');
  });

  it('should infer department patterns from user activity', () => {
    const analyzer = new UsagePatternAnalyzer(mockUsageData);
    const patterns = analyzer.getDepartmentPatterns();
    expect(patterns.Sales).toBeDefined();
    expect(patterns.Sales.users).toContain('JSMITH');
    expect(patterns.Purchasing).toBeDefined();
    expect(patterns.Purchasing.users).toContain('KLEE');
    expect(patterns.Finance).toBeDefined();
    expect(patterns.Development).toBeDefined();
  });

  it('should produce a summary with key metrics', () => {
    const analyzer = new UsagePatternAnalyzer(mockUsageData);
    const summary = analyzer.getSummary();
    expect(summary.totalExecutions).toBeGreaterThan(0);
    expect(summary.totalUsers).toBe(4);
    expect(summary.uniqueTransactions).toBe(5);
    expect(summary.topTransactions.length).toBeLessThanOrEqual(10);
    expect(summary.peakHour).toBe(10);
  });

  it('should handle empty usage data gracefully', () => {
    const analyzer = new UsagePatternAnalyzer({});
    const ranking = analyzer.getTransactionRanking();
    expect(ranking).toEqual([]);
    const summary = analyzer.getSummary();
    expect(summary.totalExecutions).toBe(0);
    expect(summary.totalUsers).toBe(0);
  });
});
