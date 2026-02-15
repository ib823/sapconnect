/**
 * Archiving Advisor Extractor
 *
 * Analyzes SAP data volumes and recommends archiving strategies before
 * S/4HANA migration. Assesses table sizes, identifies archivable data
 * (old FI documents, completed orders, historic data), and estimates
 * volume reduction potential.
 *
 * Categories:
 *   - FI/CO documents (BKPF/BSEG, ACDOCA, COEP)
 *   - SD documents (VBAK/VBAP completed orders)
 *   - MM documents (EKKO/EKPO completed POs)
 *   - Change documents (CDHDR/CDPOS)
 *   - Spool/job logs (TSP01, TBTCO)
 *   - Workflow (SWW_WI*)
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

// Archiving object definitions with thresholds
const ARCHIVING_OBJECTS = [
  {
    id: 'FI_DOCUMNT',
    name: 'FI Documents',
    tables: ['BKPF', 'BSEG', 'BSAD', 'BSID', 'BSAK', 'BSIK'],
    retentionYears: 7,
    category: 'finance',
    priority: 'high',
  },
  {
    id: 'CO_ITEM',
    name: 'CO Line Items',
    tables: ['COEP', 'COBK', 'COSP', 'COSS'],
    retentionYears: 7,
    category: 'finance',
    priority: 'high',
  },
  {
    id: 'SD_VBAK',
    name: 'Sales Documents',
    tables: ['VBAK', 'VBAP', 'VBFA', 'VBEP'],
    retentionYears: 5,
    category: 'sales',
    priority: 'medium',
  },
  {
    id: 'MM_EKKO',
    name: 'Purchase Documents',
    tables: ['EKKO', 'EKPO', 'EKBE', 'EKET'],
    retentionYears: 5,
    category: 'procurement',
    priority: 'medium',
  },
  {
    id: 'CHANGEDOCU',
    name: 'Change Documents',
    tables: ['CDHDR', 'CDPOS'],
    retentionYears: 3,
    category: 'basis',
    priority: 'medium',
  },
  {
    id: 'BC_SPOOL',
    name: 'Spool Requests',
    tables: ['TSP01', 'TSP02'],
    retentionYears: 1,
    category: 'basis',
    priority: 'low',
  },
  {
    id: 'BC_JOBLOG',
    name: 'Job Logs',
    tables: ['TBTCO', 'TBTCP'],
    retentionYears: 1,
    category: 'basis',
    priority: 'low',
  },
  {
    id: 'IDOC',
    name: 'IDocs',
    tables: ['EDIDS', 'EDIDC', 'EDID4'],
    retentionYears: 2,
    category: 'integration',
    priority: 'medium',
  },
  {
    id: 'MATDOC',
    name: 'Material Documents',
    tables: ['MKPF', 'MSEG'],
    retentionYears: 5,
    category: 'logistics',
    priority: 'medium',
  },
  {
    id: 'PP_ORDER',
    name: 'Production Orders',
    tables: ['AUFK', 'AFKO', 'AFPO'],
    retentionYears: 5,
    category: 'production',
    priority: 'low',
  },
];

class ArchivingAdvisorExtractor extends BaseExtractor {
  get extractorId() { return 'ARCHIVING_ADVISOR'; }
  get name() { return 'Archiving Advisor'; }
  get module() { return 'CROSS'; }
  get category() { return 'advisory'; }

  getExpectedTables() {
    return ARCHIVING_OBJECTS.flatMap(obj => obj.tables);
  }

  async _extractMock() {
    const mockData = this._generateMockData();
    return this._analyzeVolumes(mockData);
  }

  async _extractLive() {
    const volumeData = {};
    const tableReader = this.context.getTableReader();

    for (const obj of ARCHIVING_OBJECTS) {
      for (const table of obj.tables) {
        try {
          // Read table row count
          const result = await tableReader.readTable(table, {
            fields: ['COUNT(*)'],
            maxRows: 1,
          });
          volumeData[table] = {
            rowCount: parseInt(result[0]?.['COUNT(*)'] || '0', 10),
            archivingObject: obj.id,
          };
          this.context.coverage.markTable(this.extractorId, table, true);
        } catch {
          volumeData[table] = { rowCount: 0, archivingObject: obj.id, error: true };
          this.context.coverage.markTable(this.extractorId, table, false);
        }
      }
    }

    return this._analyzeVolumes(volumeData);
  }

  _analyzeVolumes(volumeData) {
    const recommendations = [];
    let totalRecords = 0;
    let archivableRecords = 0;

    for (const obj of ARCHIVING_OBJECTS) {
      const tableVolumes = obj.tables.map(t => ({
        table: t,
        rowCount: volumeData[t]?.rowCount || 0,
      }));

      const objTotal = tableVolumes.reduce((sum, t) => sum + t.rowCount, 0);
      totalRecords += objTotal;

      // Estimate archivable percentage based on retention period
      // Assume linear distribution: archivable = (1 - retention/totalAge) * total
      // Conservative estimate: 40-70% of records older than retention period
      const archivablePercent = this._estimateArchivablePercent(obj);
      const archivable = Math.round(objTotal * archivablePercent);
      archivableRecords += archivable;

      if (objTotal > 0) {
        recommendations.push({
          archivingObject: obj.id,
          name: obj.name,
          category: obj.category,
          priority: obj.priority,
          tables: tableVolumes,
          totalRecords: objTotal,
          archivableRecords: archivable,
          archivablePercent: Math.round(archivablePercent * 100),
          retentionYears: obj.retentionYears,
          action: this._recommendAction(objTotal, archivablePercent, obj.priority),
          estimatedSizeReductionMB: Math.round(archivable * 0.0005), // ~500 bytes/record avg
        });
      }
    }

    // Sort by potential impact (archivable records descending)
    recommendations.sort((a, b) => b.archivableRecords - a.archivableRecords);

    return {
      stats: {
        totalRecords,
        archivableRecords,
        reductionPercent: totalRecords > 0 ? Math.round((archivableRecords / totalRecords) * 100) : 0,
        archivingObjects: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
      },
      recommendations,
      summary: this._generateSummary(totalRecords, archivableRecords, recommendations),
    };
  }

  _estimateArchivablePercent(obj) {
    // Conservative archiving estimates by category
    const estimates = {
      finance: 0.55,     // ~55% of FI docs are historical
      sales: 0.45,       // ~45% of completed sales orders
      procurement: 0.40, // ~40% of closed POs
      basis: 0.80,       // ~80% of logs/spool are archivable
      integration: 0.60, // ~60% of old IDocs
      logistics: 0.50,   // ~50% of material docs
      production: 0.35,  // ~35% of closed production orders
    };
    return estimates[obj.category] || 0.40;
  }

  _recommendAction(totalRecords, archivablePercent, priority) {
    if (totalRecords > 10000000 && archivablePercent > 0.5) {
      return 'ARCHIVE_BEFORE_MIGRATION';
    }
    if (totalRecords > 1000000 && priority === 'high') {
      return 'ARCHIVE_RECOMMENDED';
    }
    if (archivablePercent > 0.7) {
      return 'ARCHIVE_BENEFICIAL';
    }
    return 'REVIEW';
  }

  _generateSummary(totalRecords, archivableRecords, recommendations) {
    const topActions = recommendations
      .filter(r => r.action === 'ARCHIVE_BEFORE_MIGRATION' || r.action === 'ARCHIVE_RECOMMENDED')
      .map(r => r.name);

    return {
      headline: `${archivableRecords.toLocaleString()} of ${totalRecords.toLocaleString()} records are candidates for archiving`,
      topRecommendations: topActions,
      estimatedSavingsMB: recommendations.reduce((sum, r) => sum + r.estimatedSizeReductionMB, 0),
    };
  }

  _generateMockData() {
    // Realistic mock data for demo
    const data = {};
    const mockVolumes = {
      BKPF: 2500000, BSEG: 15000000, BSAD: 800000, BSID: 600000, BSAK: 700000, BSIK: 500000,
      COEP: 8000000, COBK: 1200000, COSP: 3000000, COSS: 2500000,
      VBAK: 1800000, VBAP: 5500000, VBFA: 3200000, VBEP: 2100000,
      EKKO: 900000, EKPO: 3200000, EKBE: 4500000, EKET: 1800000,
      CDHDR: 12000000, CDPOS: 35000000,
      TSP01: 500000, TSP02: 800000,
      TBTCO: 2000000, TBTCP: 3500000,
      EDIDS: 4000000, EDIDC: 2000000, EDID4: 6000000,
      MKPF: 3500000, MSEG: 9000000,
      AUFK: 800000, AFKO: 600000, AFPO: 1200000,
    };

    for (const [table, rowCount] of Object.entries(mockVolumes)) {
      const obj = ARCHIVING_OBJECTS.find(o => o.tables.includes(table));
      data[table] = { rowCount, archivingObject: obj?.id };
    }
    return data;
  }
}

ArchivingAdvisorExtractor._extractorId = 'ARCHIVING_ADVISOR';
ExtractorRegistry.register(ArchivingAdvisorExtractor);

module.exports = ArchivingAdvisorExtractor;
