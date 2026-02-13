const MigrationBridge = require('../../extraction/migration-bridge');

// ── Mock forensic results ─────────────────────────────────────────
const mockForensicResult = {
  results: {
    FI_TRANSACTIONS: { records: new Array(100).fill({ BUKRS: '1000' }), recordCount: 100 },
    FI_GL_ACCOUNTS: { records: new Array(50).fill({ SAKNR: '100000' }), recordCount: 50 },
    FI_COMPANY_CODES: { records: [{ BUKRS: '1000' }], recordCount: 1 },
    CO_COST_CENTERS: { records: new Array(20).fill({ KOSTL: 'CC1' }), recordCount: 20 },
    CO_PROFIT_CENTERS: { records: new Array(10).fill({ PRCTR: 'PC1' }), recordCount: 10 },
    MM_MATERIALS: { records: new Array(200).fill({ MATNR: 'MAT1' }), recordCount: 200 },
    MM_PURCHASING: { records: new Array(80).fill({ EBELN: 'PO1' }), recordCount: 80 },
    SD_SALES: { records: new Array(60).fill({ VBELN: 'SO1' }), recordCount: 60 },
    SD_CUSTOMERS: { records: new Array(40).fill({ KUNNR: 'CUST1' }), recordCount: 40 },
    PM_EQUIPMENT: { records: new Array(30).fill({ EQUNR: 'EQ1' }), recordCount: 30 },
  },
  confidence: { overall: 82, grade: 'B' },
  gapReport: {
    extraction: { missingCriticalTables: [], coveragePct: 75 },
    authorization: { count: 0 },
  },
  humanValidation: ['Check GL account mapping', 'Verify BP dedup rules'],
};

describe('MigrationBridge', () => {
  let bridge;

  beforeEach(() => {
    bridge = new MigrationBridge({ logLevel: 'error' });
  });

  // ── Plan shape validation ───────────────────────────────────────

  describe('plan() returns valid shape', () => {
    it('returns all required top-level fields', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan).toHaveProperty('generatedAt');
      expect(plan).toHaveProperty('scope');
      expect(plan).toHaveProperty('objects');
      expect(plan).toHaveProperty('executionPlan');
      expect(plan).toHaveProperty('effort');
      expect(plan).toHaveProperty('risks');
      expect(plan).toHaveProperty('confidence');
      expect(plan).toHaveProperty('recommendations');
    });

    it('generatedAt is a valid ISO timestamp', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(typeof plan.generatedAt).toBe('string');
      expect(new Date(plan.generatedAt).toISOString()).toBe(plan.generatedAt);
    });

    it('scope has activeModules, totalObjects, totalEstimatedRecords', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.scope).toHaveProperty('activeModules');
      expect(plan.scope).toHaveProperty('totalObjects');
      expect(plan.scope).toHaveProperty('totalEstimatedRecords');
      expect(Array.isArray(plan.scope.activeModules)).toBe(true);
      expect(typeof plan.scope.totalObjects).toBe('number');
      expect(typeof plan.scope.totalEstimatedRecords).toBe('number');
    });

    it('objects is an array of correctly shaped entries', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(Array.isArray(plan.objects)).toBe(true);
      expect(plan.objects.length).toBeGreaterThan(0);
      for (const obj of plan.objects) {
        expect(obj).toHaveProperty('objectId');
        expect(obj).toHaveProperty('priority');
        expect(obj).toHaveProperty('estimatedRecords');
        expect(obj).toHaveProperty('estimatedHours');
        expect(obj).toHaveProperty('complexityBase');
        expect(obj).toHaveProperty('dependencies');
        expect(obj).toHaveProperty('isPrerequisite');
        expect(typeof obj.objectId).toBe('string');
        expect(typeof obj.priority).toBe('number');
        expect(typeof obj.estimatedRecords).toBe('number');
        expect(typeof obj.estimatedHours).toBe('number');
        expect(typeof obj.complexityBase).toBe('number');
        expect(Array.isArray(obj.dependencies)).toBe(true);
        expect(typeof obj.isPrerequisite).toBe('boolean');
      }
    });

    it('executionPlan has waves array and totalWaves', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.executionPlan).toHaveProperty('waves');
      expect(plan.executionPlan).toHaveProperty('totalWaves');
      expect(Array.isArray(plan.executionPlan.waves)).toBe(true);
      expect(typeof plan.executionPlan.totalWaves).toBe('number');
      expect(plan.executionPlan.totalWaves).toBe(plan.executionPlan.waves.length);
    });

    it('each wave has waveNumber, objectIds, canRunInParallel, objects', () => {
      const plan = bridge.plan(mockForensicResult);
      for (const wave of plan.executionPlan.waves) {
        expect(wave).toHaveProperty('waveNumber');
        expect(wave).toHaveProperty('objectIds');
        expect(wave).toHaveProperty('canRunInParallel');
        expect(wave).toHaveProperty('objects');
        expect(typeof wave.waveNumber).toBe('number');
        expect(Array.isArray(wave.objectIds)).toBe(true);
        expect(typeof wave.canRunInParallel).toBe('boolean');
        expect(Array.isArray(wave.objects)).toBe(true);
      }
    });

    it('wave numbers are sequential starting from 1', () => {
      const plan = bridge.plan(mockForensicResult);
      for (let i = 0; i < plan.executionPlan.waves.length; i++) {
        expect(plan.executionPlan.waves[i].waveNumber).toBe(i + 1);
      }
    });

    it('effort has all required fields', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.effort).toHaveProperty('totalEstimatedHours');
      expect(plan.effort).toHaveProperty('configurationHours');
      expect(plan.effort).toHaveProperty('dataMigrationHours');
      expect(plan.effort).toHaveProperty('estimatedCalendarDays');
      expect(plan.effort).toHaveProperty('breakdown');
      expect(typeof plan.effort.totalEstimatedHours).toBe('number');
      expect(typeof plan.effort.configurationHours).toBe('number');
      expect(typeof plan.effort.dataMigrationHours).toBe('number');
      expect(typeof plan.effort.estimatedCalendarDays).toBe('number');
    });

    it('effort breakdown has categorized counts', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.effort.breakdown).toHaveProperty('config');
      expect(plan.effort.breakdown).toHaveProperty('masterData');
      expect(plan.effort.breakdown).toHaveProperty('transactional');
      expect(plan.effort.breakdown).toHaveProperty('interfaces');
    });

    it('risks is an array of correctly shaped entries', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(Array.isArray(plan.risks)).toBe(true);
      for (const risk of plan.risks) {
        expect(risk).toHaveProperty('level');
        expect(risk).toHaveProperty('category');
        expect(risk).toHaveProperty('description');
        expect(risk).toHaveProperty('mitigation');
        expect(['high', 'medium', 'low']).toContain(risk.level);
        expect(typeof risk.category).toBe('string');
        expect(typeof risk.description).toBe('string');
        expect(typeof risk.mitigation).toBe('string');
      }
    });

    it('recommendations is an array with phase and action', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(Array.isArray(plan.recommendations)).toBe(true);
      expect(plan.recommendations.length).toBeGreaterThan(0);
      for (const rec of plan.recommendations) {
        expect(rec).toHaveProperty('phase');
        expect(rec).toHaveProperty('action');
        expect(typeof rec.phase).toBe('string');
        expect(typeof rec.action).toBe('string');
      }
    });
  });

  // ── Active module detection ─────────────────────────────────────

  describe('active module detection', () => {
    it('detects FI, CO, MM, SD, PM from mock results', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.scope.activeModules).toContain('FI');
      expect(plan.scope.activeModules).toContain('CO');
      expect(plan.scope.activeModules).toContain('MM');
      expect(plan.scope.activeModules).toContain('SD');
      expect(plan.scope.activeModules).toContain('PM');
    });

    it('does not detect modules with no extraction data', () => {
      const plan = bridge.plan(mockForensicResult);
      // No PP, HR, EWM, TM, GTS, BW, BASIS data in mock
      expect(plan.scope.activeModules).not.toContain('PP');
      expect(plan.scope.activeModules).not.toContain('EWM');
      expect(plan.scope.activeModules).not.toContain('TM');
      expect(plan.scope.activeModules).not.toContain('GTS');
      expect(plan.scope.activeModules).not.toContain('BW');
      expect(plan.scope.activeModules).not.toContain('BASIS');
    });

    it('detects modules from minimal extraction data', () => {
      const minimal = {
        results: { FI_TRANSACTIONS: { records: [{ BUKRS: '1' }], recordCount: 1 } },
        confidence: { overall: 50 },
        gapReport: { extraction: { missingCriticalTables: [] }, authorization: { count: 0 } },
      };
      const plan = bridge.plan(minimal);
      expect(plan.scope.activeModules).toContain('FI');
      expect(plan.scope.activeModules).toHaveLength(1);
    });
  });

  // ── Object mapping from modules ─────────────────────────────────

  describe('object mapping from modules', () => {
    it('FI module produces GL_BALANCE, GL_ACCOUNT_MASTER, and others', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('GL_BALANCE');
      expect(objectIds).toContain('GL_ACCOUNT_MASTER');
      expect(objectIds).toContain('CUSTOMER_OPEN_ITEM');
      expect(objectIds).toContain('VENDOR_OPEN_ITEM');
    });

    it('CO module produces COST_CENTER, PROFIT_CENTER, INTERNAL_ORDER', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('COST_CENTER');
      expect(objectIds).toContain('PROFIT_CENTER');
      expect(objectIds).toContain('INTERNAL_ORDER');
    });

    it('MM module produces MATERIAL_MASTER, PURCHASE_ORDER', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('MATERIAL_MASTER');
      expect(objectIds).toContain('PURCHASE_ORDER');
    });

    it('SD module produces SALES_ORDER', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('SALES_ORDER');
    });

    it('PM module produces EQUIPMENT_MASTER, FUNCTIONAL_LOCATION', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('EQUIPMENT_MASTER');
      expect(objectIds).toContain('FUNCTIONAL_LOCATION');
    });

    it('totalObjects matches objects array length', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.scope.totalObjects).toBe(plan.objects.length);
    });
  });

  // ── Dependency prerequisites ────────────────────────────────────

  describe('dependency prerequisites', () => {
    it('BUSINESS_PARTNER is included when SALES_ORDER is in scope', () => {
      // SD produces SALES_ORDER which depends on BUSINESS_PARTNER
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      if (objectIds.includes('SALES_ORDER')) {
        expect(objectIds).toContain('BUSINESS_PARTNER');
      }
    });

    it('BUSINESS_PARTNER is included when CUSTOMER_OPEN_ITEM is in scope', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      if (objectIds.includes('CUSTOMER_OPEN_ITEM')) {
        expect(objectIds).toContain('BUSINESS_PARTNER');
      }
    });

    it('BANK_MASTER is included as transitive dependency of BUSINESS_PARTNER', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      if (objectIds.includes('BUSINESS_PARTNER')) {
        expect(objectIds).toContain('BANK_MASTER');
      }
    });

    it('PROFIT_CENTER prerequisite is included when COST_CENTER is in scope', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      if (objectIds.includes('COST_CENTER')) {
        expect(objectIds).toContain('PROFIT_CENTER');
      }
    });

    it('MATERIAL_MASTER is included when PRICING_CONDITION is in scope', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      if (objectIds.includes('PRICING_CONDITION')) {
        expect(objectIds).toContain('MATERIAL_MASTER');
      }
    });
  });

  // ── Execution plan wave ordering ────────────────────────────────

  describe('execution plan wave ordering', () => {
    it('has at least 2 waves (dependencies exist)', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.executionPlan.totalWaves).toBeGreaterThanOrEqual(2);
    });

    it('dependencies appear in earlier waves than dependents', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);

      // Build a wave-index lookup
      const waveOf = {};
      for (const wave of plan.executionPlan.waves) {
        for (const id of wave.objectIds) {
          waveOf[id] = wave.waveNumber;
        }
      }

      // GL_ACCOUNT_MASTER before GL_BALANCE
      if (objectIds.includes('GL_ACCOUNT_MASTER') && objectIds.includes('GL_BALANCE')) {
        expect(waveOf['GL_ACCOUNT_MASTER']).toBeLessThan(waveOf['GL_BALANCE']);
      }

      // BUSINESS_PARTNER before CUSTOMER_OPEN_ITEM
      if (objectIds.includes('BUSINESS_PARTNER') && objectIds.includes('CUSTOMER_OPEN_ITEM')) {
        expect(waveOf['BUSINESS_PARTNER']).toBeLessThan(waveOf['CUSTOMER_OPEN_ITEM']);
      }

      // PROFIT_CENTER before COST_CENTER
      if (objectIds.includes('PROFIT_CENTER') && objectIds.includes('COST_CENTER')) {
        expect(waveOf['PROFIT_CENTER']).toBeLessThan(waveOf['COST_CENTER']);
      }
    });

    it('all plan objects appear in exactly one wave', () => {
      const plan = bridge.plan(mockForensicResult);
      const waveIds = plan.executionPlan.waves.flatMap(w => w.objectIds);
      const planObjIds = plan.objects.map(o => o.objectId);
      for (const id of planObjIds) {
        const occurrences = waveIds.filter(wid => wid === id).length;
        expect(occurrences).toBe(1);
      }
    });
  });

  // ── Effort estimation ───────────────────────────────────────────

  describe('effort estimation', () => {
    it('totalEstimatedHours is positive', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.effort.totalEstimatedHours).toBeGreaterThan(0);
    });

    it('totalEstimatedHours = configurationHours + dataMigrationHours', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.effort.totalEstimatedHours).toBe(
        plan.effort.configurationHours + plan.effort.dataMigrationHours
      );
    });

    it('estimatedCalendarDays is positive', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.effort.estimatedCalendarDays).toBeGreaterThan(0);
    });

    it('estimatedCalendarDays = ceil(totalEstimatedHours / 12)', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.effort.estimatedCalendarDays).toBe(
        Math.ceil(plan.effort.totalEstimatedHours / 12)
      );
    });

    it('config hours come from _CONFIG objects', () => {
      const plan = bridge.plan(mockForensicResult);
      const configObjs = plan.objects.filter(o => o.objectId.endsWith('_CONFIG'));
      const expectedConfigHours = Math.round(configObjs.reduce((sum, o) => sum + o.estimatedHours, 0));
      expect(plan.effort.configurationHours).toBe(expectedConfigHours);
    });

    it('breakdown.config counts config objects', () => {
      const plan = bridge.plan(mockForensicResult);
      const configCount = plan.objects.filter(o => o.objectId.endsWith('_CONFIG')).length;
      expect(plan.effort.breakdown.config).toBe(configCount);
    });

    it('objects with known volume have higher estimated hours', () => {
      const plan = bridge.plan(mockForensicResult);
      const glBalance = plan.objects.find(o => o.objectId === 'GL_BALANCE');
      const tradeComp = plan.objects.find(o => o.objectId === 'TRADE_COMPLIANCE');
      // GL_BALANCE has 100 records from mock, TRADE_COMPLIANCE has 0
      if (glBalance && tradeComp) {
        expect(glBalance.estimatedHours).toBeGreaterThan(tradeComp.estimatedHours);
      }
    });
  });

  // ── planOptions.includeModules ──────────────────────────────────

  describe('planOptions.includeModules', () => {
    it('filters to only specified modules', () => {
      const plan = bridge.plan(mockForensicResult, { includeModules: ['FI'] });
      expect(plan.scope.activeModules).toContain('FI');
      expect(plan.scope.activeModules).not.toContain('MM');
      expect(plan.scope.activeModules).not.toContain('SD');
      expect(plan.scope.activeModules).not.toContain('PM');
    });

    it('produces only objects from the included module (plus prerequisites)', () => {
      const plan = bridge.plan(mockForensicResult, { includeModules: ['FI'] });
      const objectIds = plan.objects.map(o => o.objectId);
      // FI objects
      expect(objectIds).toContain('GL_BALANCE');
      expect(objectIds).toContain('GL_ACCOUNT_MASTER');
      // Should NOT contain MM-only objects
      expect(objectIds).not.toContain('PURCHASE_ORDER');
      expect(objectIds).not.toContain('SOURCE_LIST');
    });

    it('multiple included modules work', () => {
      const plan = bridge.plan(mockForensicResult, { includeModules: ['FI', 'CO'] });
      expect(plan.scope.activeModules).toContain('FI');
      expect(plan.scope.activeModules).toContain('CO');
      expect(plan.scope.activeModules).not.toContain('SD');
    });

    it('is case-insensitive', () => {
      const plan = bridge.plan(mockForensicResult, { includeModules: ['fi', 'co'] });
      expect(plan.scope.activeModules).toContain('FI');
      expect(plan.scope.activeModules).toContain('CO');
    });
  });

  // ── planOptions.excludeModules ──────────────────────────────────

  describe('planOptions.excludeModules', () => {
    it('removes specified modules', () => {
      const plan = bridge.plan(mockForensicResult, { excludeModules: ['SD', 'PM'] });
      expect(plan.scope.activeModules).not.toContain('SD');
      expect(plan.scope.activeModules).not.toContain('PM');
      expect(plan.scope.activeModules).toContain('FI');
      expect(plan.scope.activeModules).toContain('CO');
      expect(plan.scope.activeModules).toContain('MM');
    });

    it('excluded module objects are removed from plan', () => {
      const plan = bridge.plan(mockForensicResult, { excludeModules: ['PM'] });
      const objectIds = plan.objects.map(o => o.objectId);
      // PM objects should be gone unless they are prerequisites for others
      expect(objectIds).not.toContain('MAINTENANCE_ORDER');
    });

    it('is case-insensitive', () => {
      const plan = bridge.plan(mockForensicResult, { excludeModules: ['sd'] });
      expect(plan.scope.activeModules).not.toContain('SD');
    });
  });

  // ── planOptions.excludeObjects ──────────────────────────────────

  describe('planOptions.excludeObjects', () => {
    it('removes specific objects from the plan', () => {
      const plan = bridge.plan(mockForensicResult, { excludeObjects: ['GL_BALANCE'] });
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).not.toContain('GL_BALANCE');
    });

    it('other objects from same module are still included', () => {
      const plan = bridge.plan(mockForensicResult, { excludeObjects: ['GL_BALANCE'] });
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('GL_ACCOUNT_MASTER');
    });

    it('can exclude multiple objects', () => {
      const plan = bridge.plan(mockForensicResult, {
        excludeObjects: ['GL_BALANCE', 'SALES_ORDER', 'PURCHASE_ORDER'],
      });
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).not.toContain('GL_BALANCE');
      expect(objectIds).not.toContain('SALES_ORDER');
      expect(objectIds).not.toContain('PURCHASE_ORDER');
    });
  });

  // ── planOptions.includeInterfaces ───────────────────────────────

  describe('planOptions.includeInterfaces=false', () => {
    it('excludes interface objects', () => {
      // Need BASIS module active for interface objects
      const withBasis = {
        ...mockForensicResult,
        results: {
          ...mockForensicResult.results,
          BASIS_RFC: { records: [{ dest: 'X' }], recordCount: 1 },
        },
      };
      const plan = bridge.plan(withBasis, { includeInterfaces: false });
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).not.toContain('RFC_DESTINATION');
      expect(objectIds).not.toContain('IDOC_CONFIG');
      expect(objectIds).not.toContain('WEB_SERVICE');
      expect(objectIds).not.toContain('BATCH_JOB');
    });

    it('default (true) includes interface objects when BASIS is active', () => {
      const withBasis = {
        ...mockForensicResult,
        results: {
          ...mockForensicResult.results,
          BASIS_RFC: { records: [{ dest: 'X' }], recordCount: 1 },
        },
      };
      const plan = bridge.plan(withBasis);
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('RFC_DESTINATION');
    });
  });

  // ── planOptions.includeConfig ───────────────────────────────────

  describe('planOptions.includeConfig=false', () => {
    it('excludes config objects', () => {
      const plan = bridge.plan(mockForensicResult, { includeConfig: false });
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).not.toContain('FI_CONFIG');
      expect(objectIds).not.toContain('CO_CONFIG');
      expect(objectIds).not.toContain('MM_CONFIG');
      expect(objectIds).not.toContain('SD_CONFIG');
    });

    it('default (true) includes config objects', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).toContain('FI_CONFIG');
      expect(objectIds).toContain('CO_CONFIG');
      expect(objectIds).toContain('MM_CONFIG');
      expect(objectIds).toContain('SD_CONFIG');
    });
  });

  // ── Risk assessment ─────────────────────────────────────────────

  describe('risk assessment', () => {
    it('low confidence triggers high risk', () => {
      const lowConf = {
        ...mockForensicResult,
        confidence: { overall: 40, grade: 'D' },
      };
      const plan = bridge.plan(lowConf);
      const highRisks = plan.risks.filter(r => r.level === 'high');
      expect(highRisks.length).toBeGreaterThanOrEqual(1);
      const confRisk = highRisks.find(r => r.category === 'data-completeness');
      expect(confRisk).toBeDefined();
      expect(confRisk.description).toContain('40%');
    });

    it('confidence above 70 does not trigger data-completeness risk', () => {
      const plan = bridge.plan(mockForensicResult); // 82% confidence
      const confRisk = plan.risks.find(r => r.category === 'data-completeness');
      expect(confRisk).toBeUndefined();
    });

    it('missing critical tables trigger high risk', () => {
      const withGaps = {
        ...mockForensicResult,
        gapReport: {
          extraction: { missingCriticalTables: ['BKPF', 'BSEG'], coveragePct: 50 },
          authorization: { count: 0 },
        },
      };
      const plan = bridge.plan(withGaps);
      const missingRisk = plan.risks.find(r => r.category === 'missing-data');
      expect(missingRisk).toBeDefined();
      expect(missingRisk.level).toBe('high');
    });

    it('authorization gaps trigger medium risk', () => {
      const withAuth = {
        ...mockForensicResult,
        gapReport: {
          extraction: { missingCriticalTables: [], coveragePct: 75 },
          authorization: { count: 5 },
        },
      };
      const plan = bridge.plan(withAuth);
      const authRisk = plan.risks.find(r => r.category === 'authorization');
      expect(authRisk).toBeDefined();
      expect(authRisk.level).toBe('medium');
    });

    it('no authorization gaps means no authorization risk', () => {
      const plan = bridge.plan(mockForensicResult);
      const authRisk = plan.risks.find(r => r.category === 'authorization');
      expect(authRisk).toBeUndefined();
    });

    it('many human validation items trigger low risk', () => {
      const manyValidation = {
        ...mockForensicResult,
        humanValidation: ['Item1', 'Item2', 'Item3', 'Item4'],
      };
      const plan = bridge.plan(manyValidation);
      const valRisk = plan.risks.find(r => r.category === 'validation');
      expect(valRisk).toBeDefined();
      expect(valRisk.level).toBe('low');
    });

    it('few human validation items do not trigger validation risk', () => {
      const plan = bridge.plan(mockForensicResult); // only 2 items
      const valRisk = plan.risks.find(r => r.category === 'validation');
      expect(valRisk).toBeUndefined();
    });
  });

  // ── Recommendations ─────────────────────────────────────────────

  describe('recommendations', () => {
    it('includes data profiling recommendation', () => {
      const plan = bridge.plan(mockForensicResult);
      const profRec = plan.recommendations.find(r => r.phase === 'profile' && r.action.includes('profiling'));
      expect(profRec).toBeDefined();
    });

    it('includes BP dedup recommendation when BUSINESS_PARTNER is in scope', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      if (objectIds.includes('BUSINESS_PARTNER')) {
        const bpRec = plan.recommendations.find(r =>
          r.action.includes('duplicate detection') || r.action.includes('Business Partner')
        );
        expect(bpRec).toBeDefined();
      }
    });

    it('includes config-first recommendation when config objects present', () => {
      const plan = bridge.plan(mockForensicResult);
      const configRec = plan.recommendations.find(r =>
        r.phase === 'configure' && r.action.includes('configuration objects')
      );
      expect(configRec).toBeDefined();
    });

    it('includes high-risk resolution recommendation when high risks exist', () => {
      const lowConf = {
        ...mockForensicResult,
        confidence: { overall: 30, grade: 'F' },
      };
      const plan = bridge.plan(lowConf);
      const riskRec = plan.recommendations.find(r =>
        r.phase === 'pre-migration' && r.action.includes('high-risk')
      );
      expect(riskRec).toBeDefined();
    });
  });

  // ── Empty extraction results ────────────────────────────────────

  describe('empty extraction results', () => {
    it('returns empty plan with no objects', () => {
      const empty = {
        results: {},
        confidence: { overall: 0 },
        gapReport: { extraction: { missingCriticalTables: [] }, authorization: { count: 0 } },
      };
      const plan = bridge.plan(empty);
      expect(plan.scope.activeModules).toHaveLength(0);
      expect(plan.scope.totalObjects).toBe(0);
      expect(plan.objects).toHaveLength(0);
      expect(plan.executionPlan.totalWaves).toBe(0);
      expect(plan.executionPlan.waves).toHaveLength(0);
    });

    it('empty plan still has valid top-level shape', () => {
      const empty = {
        results: {},
        confidence: { overall: 0 },
        gapReport: { extraction: { missingCriticalTables: [] }, authorization: { count: 0 } },
      };
      const plan = bridge.plan(empty);
      expect(plan).toHaveProperty('generatedAt');
      expect(plan).toHaveProperty('scope');
      expect(plan).toHaveProperty('objects');
      expect(plan).toHaveProperty('executionPlan');
      expect(plan).toHaveProperty('effort');
      expect(plan).toHaveProperty('risks');
      expect(plan).toHaveProperty('recommendations');
    });

    it('empty plan has zero effort', () => {
      const empty = {
        results: {},
        confidence: { overall: 100 },
        gapReport: { extraction: { missingCriticalTables: [] }, authorization: { count: 0 } },
      };
      const plan = bridge.plan(empty);
      expect(plan.effort.totalEstimatedHours).toBe(0);
      expect(plan.effort.configurationHours).toBe(0);
      expect(plan.effort.dataMigrationHours).toBe(0);
    });

    it('null/undefined results treated as empty', () => {
      const noResults = {
        results: undefined,
        confidence: { overall: 50 },
        gapReport: { extraction: { missingCriticalTables: [] }, authorization: { count: 0 } },
      };
      const plan = bridge.plan(noResults);
      expect(plan.scope.activeModules).toHaveLength(0);
      expect(plan.objects).toHaveLength(0);
    });
  });

  // ── Volume estimation ───────────────────────────────────────────

  describe('volume estimation', () => {
    it('GL_BALANCE estimated records come from FI_TRANSACTIONS', () => {
      const plan = bridge.plan(mockForensicResult);
      const glBalance = plan.objects.find(o => o.objectId === 'GL_BALANCE');
      expect(glBalance).toBeDefined();
      expect(glBalance.estimatedRecords).toBe(100); // from mock
    });

    it('MATERIAL_MASTER estimated records come from MM_MATERIALS', () => {
      const plan = bridge.plan(mockForensicResult);
      const mat = plan.objects.find(o => o.objectId === 'MATERIAL_MASTER');
      expect(mat).toBeDefined();
      expect(mat.estimatedRecords).toBe(200); // from mock
    });

    it('COST_CENTER estimated records come from CO_COST_CENTERS', () => {
      const plan = bridge.plan(mockForensicResult);
      const cc = plan.objects.find(o => o.objectId === 'COST_CENTER');
      expect(cc).toBeDefined();
      expect(cc.estimatedRecords).toBe(20); // from mock
    });

    it('EQUIPMENT_MASTER estimated records come from PM_EQUIPMENT', () => {
      const plan = bridge.plan(mockForensicResult);
      const eq = plan.objects.find(o => o.objectId === 'EQUIPMENT_MASTER');
      expect(eq).toBeDefined();
      expect(eq.estimatedRecords).toBe(30); // from mock
    });

    it('objects without extraction mapping get 0 estimated records', () => {
      const plan = bridge.plan(mockForensicResult);
      // FI_CONFIG has no extraction mapping
      const fiConfig = plan.objects.find(o => o.objectId === 'FI_CONFIG');
      if (fiConfig) {
        expect(fiConfig.estimatedRecords).toBe(0);
      }
    });

    it('totalEstimatedRecords is sum of all object records', () => {
      const plan = bridge.plan(mockForensicResult);
      const sumRecords = plan.objects.reduce((sum, o) => sum + o.estimatedRecords, 0);
      expect(plan.scope.totalEstimatedRecords).toBe(sumRecords);
    });
  });

  // ── Priority ordering ───────────────────────────────────────────

  describe('priority ordering', () => {
    it('objects are sorted by priority descending', () => {
      const plan = bridge.plan(mockForensicResult);
      for (let i = 1; i < plan.objects.length; i++) {
        expect(plan.objects[i - 1].priority).toBeGreaterThanOrEqual(plan.objects[i].priority);
      }
    });

    it('config objects have highest priority (100)', () => {
      const plan = bridge.plan(mockForensicResult);
      const configs = plan.objects.filter(o => o.objectId.endsWith('_CONFIG'));
      for (const c of configs) {
        expect(c.priority).toBe(100);
      }
    });

    it('GL_ACCOUNT_MASTER has priority 95', () => {
      const plan = bridge.plan(mockForensicResult);
      const obj = plan.objects.find(o => o.objectId === 'GL_ACCOUNT_MASTER');
      expect(obj).toBeDefined();
      expect(obj.priority).toBe(95);
    });

    it('BUSINESS_PARTNER has priority 90', () => {
      const plan = bridge.plan(mockForensicResult);
      const obj = plan.objects.find(o => o.objectId === 'BUSINESS_PARTNER');
      if (obj) {
        expect(obj.priority).toBe(90);
      }
    });
  });

  // ── Confidence passthrough ──────────────────────────────────────

  describe('confidence passthrough', () => {
    it('passes through the extraction confidence', () => {
      const plan = bridge.plan(mockForensicResult);
      expect(plan.confidence.overall).toBe(82);
      expect(plan.confidence.grade).toBe('B');
    });

    it('handles missing confidence gracefully', () => {
      const noConf = {
        results: mockForensicResult.results,
        gapReport: mockForensicResult.gapReport,
      };
      const plan = bridge.plan(noConf);
      expect(plan.confidence).toEqual({});
    });
  });

  // ── Combined options ────────────────────────────────────────────

  describe('combined planOptions', () => {
    it('includeModules + excludeObjects work together', () => {
      const plan = bridge.plan(mockForensicResult, {
        includeModules: ['FI'],
        excludeObjects: ['GL_BALANCE'],
      });
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).not.toContain('GL_BALANCE');
      expect(objectIds).toContain('GL_ACCOUNT_MASTER');
      expect(objectIds).not.toContain('PURCHASE_ORDER');
    });

    it('excludeModules + includeConfig=false work together', () => {
      const plan = bridge.plan(mockForensicResult, {
        excludeModules: ['PM'],
        includeConfig: false,
      });
      const objectIds = plan.objects.map(o => o.objectId);
      expect(objectIds).not.toContain('EQUIPMENT_MASTER');
      expect(objectIds).not.toContain('FI_CONFIG');
      expect(objectIds).not.toContain('CO_CONFIG');
    });

    it('includeModules with no matching active modules produces empty plan', () => {
      const plan = bridge.plan(mockForensicResult, { includeModules: ['BW'] });
      // BW has no extraction data in mock, so no active BW module
      expect(plan.scope.activeModules).toHaveLength(0);
      expect(plan.objects).toHaveLength(0);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles extraction results with error entries', () => {
      const withError = {
        results: {
          FI_TRANSACTIONS: { error: 'AUTH_FAIL', records: null },
          FI_GL_ACCOUNTS: { records: new Array(10).fill({ SAKNR: '1' }), recordCount: 10 },
        },
        confidence: { overall: 50 },
        gapReport: { extraction: { missingCriticalTables: [] }, authorization: { count: 0 } },
      };
      const plan = bridge.plan(withError);
      // FI should still be detected because FI_GL_ACCOUNTS has data
      expect(plan.scope.activeModules).toContain('FI');
    });

    it('handles results as Map', () => {
      const mapResult = {
        results: new Map([
          ['FI_TRANSACTIONS', { records: new Array(50).fill({ BUKRS: '1' }), recordCount: 50 }],
        ]),
        confidence: { overall: 70 },
        gapReport: { extraction: { missingCriticalTables: [] }, authorization: { count: 0 } },
      };
      const plan = bridge.plan(mapResult);
      expect(plan.scope.activeModules).toContain('FI');
    });

    it('default planOptions are permissive (include everything)', () => {
      const plan = bridge.plan(mockForensicResult);
      const objectIds = plan.objects.map(o => o.objectId);
      // Should include config
      expect(objectIds.some(id => id.endsWith('_CONFIG'))).toBe(true);
    });
  });
});
