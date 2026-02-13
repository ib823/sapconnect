/**
 * Usage Pattern Analyzer
 *
 * Analyzes transaction usage data from ST03N/SWNCMONI to identify
 * patterns, rankings, and unused transactions.
 */

class UsagePatternAnalyzer {
  /**
   * @param {object} usageData - Output from UsageStatisticsExtractor
   */
  constructor(usageData) {
    this.transactionUsage = usageData.transactionUsage || [];
    this.userActivity = usageData.userActivity || [];
    this.timeDistribution = usageData.timeDistribution || [];
  }

  getTransactionRanking() {
    return [...this.transactionUsage]
      .sort((a, b) => b.executions - a.executions)
      .map((t, i) => ({ rank: i + 1, ...t }));
  }

  getUserTransactionMatrix() {
    const matrix = {};
    for (const user of this.userActivity) {
      matrix[user.user] = {
        totalExecutions: user.totalExecutions,
        topTcodes: user.topTcodes,
      };
    }
    return matrix;
  }

  getTransactionSequences() {
    // Derive common tcode sequences from user activity patterns
    const sequences = [];
    for (const user of this.userActivity) {
      if (user.topTcodes && user.topTcodes.length >= 2) {
        for (let i = 0; i < user.topTcodes.length - 1; i++) {
          sequences.push({
            from: user.topTcodes[i],
            to: user.topTcodes[i + 1],
            user: user.user,
          });
        }
      }
    }
    return sequences;
  }

  getTimeDistribution() {
    return [...this.timeDistribution].sort((a, b) => a.hour - b.hour);
  }

  getUnusedTransactions(standardTcodes = []) {
    const usedSet = new Set(this.transactionUsage.map(t => t.tcode));
    return standardTcodes.filter(tc => !usedSet.has(tc));
  }

  getDepartmentPatterns() {
    // Group users by their primary tcode patterns to infer departments
    const patterns = {};
    const deptMap = {
      'VA': 'Sales', 'VL': 'Shipping', 'VF': 'Billing',
      'ME': 'Purchasing', 'MI': 'Inventory', 'MB': 'Inventory',
      'FB': 'Finance', 'FK': 'Finance', 'FD': 'Finance',
      'CO': 'Controlling', 'KS': 'Controlling',
      'MM': 'Materials', 'SE': 'Development', 'SM': 'Basis',
      'SU': 'Security', 'PA': 'HR',
    };

    for (const user of this.userActivity) {
      const topTcode = user.topTcodes?.[0] || '';
      const prefix = topTcode.substring(0, 2);
      const dept = deptMap[prefix] || 'Other';
      if (!patterns[dept]) {
        patterns[dept] = { users: [], totalExecutions: 0, topTcodes: {} };
      }
      patterns[dept].users.push(user.user);
      patterns[dept].totalExecutions += user.totalExecutions;
      for (const tc of user.topTcodes || []) {
        patterns[dept].topTcodes[tc] = (patterns[dept].topTcodes[tc] || 0) + 1;
      }
    }
    return patterns;
  }

  getSummary() {
    const totalExecs = this.transactionUsage.reduce((s, t) => s + t.executions, 0);
    const totalUsers = this.userActivity.length;
    const uniqueTcodes = this.transactionUsage.length;

    return {
      totalExecutions: totalExecs,
      totalUsers,
      uniqueTransactions: uniqueTcodes,
      topTransactions: this.getTransactionRanking().slice(0, 10),
      peakHour: this.timeDistribution.reduce((max, t) =>
        t.executions > (max.executions || 0) ? t : max, {}).hour,
    };
  }
}

module.exports = UsagePatternAnalyzer;
