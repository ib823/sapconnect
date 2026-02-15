/**
 * Lawson Security Extractor
 *
 * Extracts Infor Lawson security model: user profiles, security classes,
 * token-based access control, Landmark security roles, and
 * segregation of duties (SOD) analysis.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonSecurityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_SECURITY'; }
  get name() { return 'Lawson Security & Access Control'; }
  get module() { return 'LAWSON_SEC'; }
  get category() { return 'security'; }

  getExpectedTables() {
    return [
      { table: 'USERPROFILE', description: 'User profile records', critical: true },
      { table: 'SECURITYCLASS', description: 'Security class definitions', critical: true },
      { table: 'TOKENACCESS', description: 'Token-based access assignments', critical: true },
      { table: 'LANDMARKSEC', description: 'Landmark security roles', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const users = await this._readOData('lawson/v1', 'USERPROFILE');
      result.users = users;
      this._trackCoverage('USERPROFILE', 'extracted', { rowCount: users.length });
    } catch (err) {
      this.logger.warn(`USERPROFILE read failed: ${err.message}`);
      result.users = [];
      this._trackCoverage('USERPROFILE', 'failed', { error: err.message });
    }

    try {
      const classes = await this._readOData('lawson/v1', 'SECURITYCLASS');
      result.securityClasses = classes;
      this._trackCoverage('SECURITYCLASS', 'extracted', { rowCount: classes.length });
    } catch (err) {
      this.logger.warn(`SECURITYCLASS read failed: ${err.message}`);
      result.securityClasses = [];
      this._trackCoverage('SECURITYCLASS', 'failed', { error: err.message });
    }

    try {
      const tokens = await this._readOData('lawson/v1', 'TOKENACCESS');
      result.tokenAccess = tokens;
      this._trackCoverage('TOKENACCESS', 'extracted', { rowCount: tokens.length });
    } catch (err) {
      this.logger.warn(`TOKENACCESS read failed: ${err.message}`);
      result.tokenAccess = [];
      this._trackCoverage('TOKENACCESS', 'failed', { error: err.message });
    }

    try {
      const lmkSec = await this._readOData('lawson/v1', 'LANDMARKSEC');
      result.landmarkSecurity = lmkSec;
      this._trackCoverage('LANDMARKSEC', 'extracted', { rowCount: lmkSec.length });
    } catch (err) {
      this.logger.warn(`LANDMARKSEC read failed: ${err.message}`);
      result.landmarkSecurity = [];
      this._trackCoverage('LANDMARKSEC', 'failed', { error: err.message });
    }

    // SOD analysis
    result.sodAnalysis = this._analyzeSOD(result.users, result.tokenAccess);

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/security.json');
    this._trackCoverage('USERPROFILE', 'extracted', { rowCount: mockData.users.length });
    this._trackCoverage('SECURITYCLASS', 'extracted', { rowCount: mockData.securityClasses.length });
    this._trackCoverage('TOKENACCESS', 'extracted', { rowCount: (mockData.tokenAccess || []).length });
    this._trackCoverage('LANDMARKSEC', 'extracted', { rowCount: 0 });
    return mockData;
  }

  /**
   * Basic segregation of duties analysis.
   * Detects users with conflicting access (e.g., AP create + AP approve).
   */
  _analyzeSOD(users, tokenAccess) {
    if (!users || !tokenAccess) return { violations: [] };

    const conflictingPairs = [
      { a: 'AP10.1', b: 'AP20.1', description: 'Vendor create + Invoice entry' },
      { a: 'PO20.1', b: 'PO30.1', description: 'PO create + Goods receipt' },
      { a: 'GL40.1', b: 'GL190', description: 'Journal entry + Period close' },
    ];

    const userTokens = {};
    for (const ta of tokenAccess) {
      if (!userTokens[ta.USER_ID]) userTokens[ta.USER_ID] = new Set();
      userTokens[ta.USER_ID].add(ta.TOKEN);
    }

    const violations = [];
    for (const [userId, tokens] of Object.entries(userTokens)) {
      for (const pair of conflictingPairs) {
        if (tokens.has(pair.a) && tokens.has(pair.b)) {
          violations.push({
            userId,
            conflict: pair.description,
            tokens: [pair.a, pair.b],
          });
        }
      }
    }

    return { violations, totalChecked: Object.keys(userTokens).length };
  }
}

LawsonSecurityExtractor._extractorId = 'INFOR_LAWSON_SECURITY';
LawsonSecurityExtractor._module = 'LAWSON_SEC';
LawsonSecurityExtractor._category = 'security';
LawsonSecurityExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonSecurityExtractor);

module.exports = LawsonSecurityExtractor;
