/**
 * Confidence Scorer
 *
 * Calculates an overall extraction confidence score (0-100%)
 * based on weighted coverage across categories.
 */

class ConfidenceScorer {
  static WEIGHTS = {
    config: 0.25,
    masterdata: 0.15,
    transaction: 0.10,
    code: 0.20,
    security: 0.10,
    interface: 0.10,
    process: 0.10,
  };

  calculate(coverageReport, gapReport) {
    const categoryScores = {};
    let weightedTotal = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(ConfidenceScorer.WEIGHTS)) {
      let score = this._getCategoryScore(category, coverageReport, gapReport);
      categoryScores[category] = { score, weight };
      weightedTotal += score * weight;
      totalWeight += weight;
    }

    const overall = totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : 0;

    return {
      overall,
      breakdown: categoryScores,
      grade: this._getGrade(overall),
      summary: this._getSummary(overall),
    };
  }

  _getCategoryScore(category, coverageReport, gapReport) {
    // Base score from coverage percentage
    let score = coverageReport.coverage || 0;

    // Adjust based on gaps
    if (gapReport.extraction?.missingCriticalTables?.length > 0) {
      score -= gapReport.extraction.missingCriticalTables.length * 5;
    }
    if (gapReport.authorization?.count > 0) {
      score -= gapReport.authorization.count * 3;
    }
    if (gapReport.dataVolume?.count > 0) {
      score -= gapReport.dataVolume.count * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  _getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  _getSummary(score) {
    if (score >= 90) return 'Excellent coverage — system is well understood';
    if (score >= 80) return 'Good coverage — minor gaps that can be addressed';
    if (score >= 70) return 'Adequate coverage — some significant gaps need attention';
    if (score >= 60) return 'Partial coverage — multiple areas need further investigation';
    return 'Insufficient coverage — major gaps require attention before proceeding';
  }
}

module.exports = ConfidenceScorer;
