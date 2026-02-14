'use strict';

const {
  ReferenceModel,
  REFERENCE_MODELS,
  getReferenceModel,
  getAllReferenceModelIds,
} = require('../../../extraction/process-mining/reference-models');

const ALL_MODEL_IDS = ['O2C', 'P2P', 'R2R', 'A2R', 'H2R', 'P2M', 'M2S'];

// ===========================================================================
// REFERENCE_MODELS registry
// ===========================================================================

describe('REFERENCE_MODELS', () => {
  it('contains all 7 process models', () => {
    for (const id of ALL_MODEL_IDS) {
      expect(REFERENCE_MODELS[id]).toBeDefined();
    }
  });

  it('has exactly 7 entries', () => {
    expect(Object.keys(REFERENCE_MODELS)).toHaveLength(7);
  });

  it('every model is a ReferenceModel instance', () => {
    for (const model of Object.values(REFERENCE_MODELS)) {
      expect(model).toBeInstanceOf(ReferenceModel);
    }
  });
});

// ===========================================================================
// getReferenceModel()
// ===========================================================================

describe('getReferenceModel()', () => {
  it.each(ALL_MODEL_IDS)('returns the correct model for %s', (id) => {
    const model = getReferenceModel(id);
    expect(model).not.toBeNull();
    expect(model.id).toBe(id);
    expect(model).toBeInstanceOf(ReferenceModel);
  });

  it('returns null for unknown model ID', () => {
    expect(getReferenceModel('UNKNOWN')).toBeNull();
    expect(getReferenceModel('')).toBeNull();
  });
});

// ===========================================================================
// getAllReferenceModelIds()
// ===========================================================================

describe('getAllReferenceModelIds()', () => {
  it('returns all 7 model IDs', () => {
    const ids = getAllReferenceModelIds();
    expect(ids).toHaveLength(7);
    for (const id of ALL_MODEL_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('returns an array of strings', () => {
    for (const id of getAllReferenceModelIds()) {
      expect(typeof id).toBe('string');
    }
  });
});

// ===========================================================================
// ReferenceModel structure validation (all models)
// ===========================================================================

describe('ReferenceModel structure', () => {
  it.each(ALL_MODEL_IDS)('%s has id, name, and non-empty activities', (id) => {
    const model = getReferenceModel(id);
    expect(typeof model.id).toBe('string');
    expect(typeof model.name).toBe('string');
    expect(model.name.length).toBeGreaterThan(0);
    expect(Array.isArray(model.activities)).toBe(true);
    expect(model.activities.length).toBeGreaterThan(0);
  });

  it.each(ALL_MODEL_IDS)('%s has non-empty edges array', (id) => {
    const model = getReferenceModel(id);
    expect(Array.isArray(model.edges)).toBe(true);
    expect(model.edges.length).toBeGreaterThan(0);
  });

  it.each(ALL_MODEL_IDS)('%s has startActivities and endActivities', (id) => {
    const model = getReferenceModel(id);
    expect(Array.isArray(model.startActivities)).toBe(true);
    expect(model.startActivities.length).toBeGreaterThan(0);
    expect(Array.isArray(model.endActivities)).toBe(true);
    expect(model.endActivities.length).toBeGreaterThan(0);
  });

  it.each(ALL_MODEL_IDS)('%s has non-empty slaTargets', (id) => {
    const model = getReferenceModel(id);
    expect(typeof model.slaTargets).toBe('object');
    expect(Object.keys(model.slaTargets).length).toBeGreaterThan(0);
  });

  it.each(ALL_MODEL_IDS)('%s has non-empty criticalTransitions', (id) => {
    const model = getReferenceModel(id);
    expect(Array.isArray(model.criticalTransitions)).toBe(true);
    expect(model.criticalTransitions.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Graph integrity checks
// ===========================================================================

describe('Graph integrity', () => {
  it.each(ALL_MODEL_IDS)('%s — every edge references activities in the activities list', (id) => {
    const model = getReferenceModel(id);
    const activitySet = new Set(model.activities);
    for (const edge of model.edges) {
      expect(activitySet.has(edge.from)).toBe(true);
      expect(activitySet.has(edge.to)).toBe(true);
      expect(['sequence', 'parallel', 'choice']).toContain(edge.type);
    }
  });

  it.each(ALL_MODEL_IDS)('%s — startActivities are in the activities list', (id) => {
    const model = getReferenceModel(id);
    const activitySet = new Set(model.activities);
    for (const start of model.startActivities) {
      expect(activitySet.has(start)).toBe(true);
    }
  });

  it.each(ALL_MODEL_IDS)('%s — endActivities are in the activities list', (id) => {
    const model = getReferenceModel(id);
    const activitySet = new Set(model.activities);
    for (const end of model.endActivities) {
      expect(activitySet.has(end)).toBe(true);
    }
  });

  it.each(ALL_MODEL_IDS)('%s — every edge has from, to, and type', (id) => {
    const model = getReferenceModel(id);
    for (const edge of model.edges) {
      expect(typeof edge.from).toBe('string');
      expect(typeof edge.to).toBe('string');
      expect(typeof edge.type).toBe('string');
    }
  });
});

// ===========================================================================
// Adjacency lists: getSuccessors / getPredecessors
// ===========================================================================

describe('getSuccessors() / getPredecessors()', () => {
  it('O2C: Create Sales Order has successors', () => {
    const model = getReferenceModel('O2C');
    const succs = model.getSuccessors('Create Sales Order');
    expect(succs.length).toBeGreaterThan(0);
    expect(succs).toContain('Credit Check');
  });

  it('O2C: Credit Check has Create Sales Order as predecessor', () => {
    const model = getReferenceModel('O2C');
    const preds = model.getPredecessors('Credit Check');
    expect(preds).toContain('Create Sales Order');
  });

  it('returns empty array for unknown activity', () => {
    const model = getReferenceModel('O2C');
    expect(model.getSuccessors('Nonexistent')).toEqual([]);
    expect(model.getPredecessors('Nonexistent')).toEqual([]);
  });

  it('P2P: Goods Receipt follows Send Purchase Order', () => {
    const model = getReferenceModel('P2P');
    const succs = model.getSuccessors('Send Purchase Order');
    expect(succs).toContain('Goods Receipt');
  });

  it('P2P: Payment Clearing has Payment Run as predecessor', () => {
    const model = getReferenceModel('P2P');
    const preds = model.getPredecessors('Payment Clearing');
    expect(preds).toContain('Payment Run');
  });
});

// ===========================================================================
// isValidTransition()
// ===========================================================================

describe('isValidTransition()', () => {
  it('returns true for a valid edge', () => {
    const model = getReferenceModel('O2C');
    expect(model.isValidTransition('Create Sales Order', 'Credit Check')).toBe(true);
    expect(model.isValidTransition('Goods Issue', 'Create Invoice')).toBe(true);
  });

  it('returns false for an invalid edge', () => {
    const model = getReferenceModel('O2C');
    expect(model.isValidTransition('Receive Payment', 'Create Sales Order')).toBe(false);
  });

  it('returns false for non-existent activities', () => {
    const model = getReferenceModel('O2C');
    expect(model.isValidTransition('Fake', 'Also Fake')).toBe(false);
  });
});

// ===========================================================================
// isStartActivity / isEndActivity
// ===========================================================================

describe('isStartActivity / isEndActivity', () => {
  it('O2C start is Create Sales Order', () => {
    const model = getReferenceModel('O2C');
    expect(model.isStartActivity('Create Sales Order')).toBe(true);
    expect(model.isStartActivity('Credit Check')).toBe(false);
  });

  it('O2C end is Clear Invoice', () => {
    const model = getReferenceModel('O2C');
    expect(model.isEndActivity('Clear Invoice')).toBe(true);
    expect(model.isEndActivity('Create Sales Order')).toBe(false);
  });

  it('P2P has two start activities', () => {
    const model = getReferenceModel('P2P');
    expect(model.isStartActivity('Create Purchase Requisition')).toBe(true);
    expect(model.isStartActivity('Create Purchase Order')).toBe(true);
  });

  it('P2P has two end activities', () => {
    const model = getReferenceModel('P2P');
    expect(model.isEndActivity('Payment Clearing')).toBe(true);
    expect(model.isEndActivity('Reject Purchase Requisition')).toBe(true);
  });
});

// ===========================================================================
// getCriticalPath()
// ===========================================================================

describe('getCriticalPath()', () => {
  it.each(ALL_MODEL_IDS)('%s — returns a non-empty path', (id) => {
    const model = getReferenceModel(id);
    const path = model.getCriticalPath();
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
  });

  it.each(ALL_MODEL_IDS)('%s — path starts with a start activity', (id) => {
    const model = getReferenceModel(id);
    const path = model.getCriticalPath();
    expect(model.startActivities).toContain(path[0]);
  });

  it.each(ALL_MODEL_IDS)('%s — path ends with an end activity', (id) => {
    const model = getReferenceModel(id);
    const path = model.getCriticalPath();
    expect(model.endActivities).toContain(path[path.length - 1]);
  });

  it.each(ALL_MODEL_IDS)('%s — all path activities are in the activities list', (id) => {
    const model = getReferenceModel(id);
    const path = model.getCriticalPath();
    const activitySet = new Set(model.activities);
    for (const act of path) {
      expect(activitySet.has(act)).toBe(true);
    }
  });

  it.each(ALL_MODEL_IDS)('%s — consecutive activities in path are connected by valid edges', (id) => {
    const model = getReferenceModel(id);
    const path = model.getCriticalPath();
    for (let i = 0; i < path.length - 1; i++) {
      expect(model.isValidTransition(path[i], path[i + 1])).toBe(true);
    }
  });
});

// ===========================================================================
// SLA targets
// ===========================================================================

describe('SLA targets', () => {
  it.each(ALL_MODEL_IDS)('%s — all SLA targets have target and unit', (id) => {
    const model = getReferenceModel(id);
    for (const [key, sla] of Object.entries(model.slaTargets)) {
      expect(typeof sla.target).toBe('number');
      expect(typeof sla.unit).toBe('string');
      expect(['hours', 'days', 'minutes', 'weeks', 'months'].some(
        u => sla.unit.includes(u) || u.includes(sla.unit)
      )).toBe(true);
    }
  });

  it('getSLATarget returns target for known transition', () => {
    const model = getReferenceModel('O2C');
    const sla = model.getSLATarget('Create Sales Order', 'Create Delivery');
    expect(sla).not.toBeNull();
    expect(sla.target).toBe(3);
    expect(sla.unit).toBe('days');
  });

  it('getSLATarget returns null for unknown transition', () => {
    const model = getReferenceModel('O2C');
    expect(model.getSLATarget('Fake', 'Also Fake')).toBeNull();
  });

  it('O2C has SLA for invoice-to-payment', () => {
    const model = getReferenceModel('O2C');
    const sla = model.getSLATarget('Create Invoice', 'Payment Received');
    expect(sla).not.toBeNull();
    expect(sla.target).toBe(30);
    expect(sla.unit).toBe('days');
    expect(sla.severity).toBe('critical');
  });
});

// ===========================================================================
// O2C model specifically
// ===========================================================================

describe('O2C model details', () => {
  const o2c = getReferenceModel('O2C');

  it('has the expected key activities', () => {
    const expectedActivities = [
      'Create Sales Order',
      'Credit Check',
      'Goods Issue',
      'Create Invoice',
      'Send Invoice',
      'Payment Received',
      'Clear Invoice',
      'Create Delivery',
    ];
    for (const act of expectedActivities) {
      expect(o2c.activities).toContain(act);
    }
  });

  it('has approximately 15 activities', () => {
    expect(o2c.activities.length).toBeGreaterThanOrEqual(10);
    expect(o2c.activities.length).toBeLessThanOrEqual(20);
  });

  it('includes Change Sales Order and Block Order activities', () => {
    expect(o2c.activities).toContain('Change Sales Order');
    expect(o2c.activities).toContain('Block Order');
  });

  it('includes the Dunning activity for overdue invoices', () => {
    expect(o2c.activities).toContain('Dunning');
  });

  it('has happy-path edges from order through to clearing', () => {
    expect(o2c.isValidTransition('Create Sales Order', 'Credit Check')).toBe(true);
    expect(o2c.isValidTransition('Credit Check', 'Create Delivery')).toBe(true);
    expect(o2c.isValidTransition('Create Delivery', 'Pick')).toBe(true);
    expect(o2c.isValidTransition('Pick', 'Pack')).toBe(true);
    expect(o2c.isValidTransition('Pack', 'Goods Issue')).toBe(true);
    expect(o2c.isValidTransition('Goods Issue', 'Create Invoice')).toBe(true);
    expect(o2c.isValidTransition('Create Invoice', 'Send Invoice')).toBe(true);
    expect(o2c.isValidTransition('Send Invoice', 'Payment Received')).toBe(true);
    expect(o2c.isValidTransition('Payment Received', 'Clear Invoice')).toBe(true);
  });

  it('has credit block alternative path', () => {
    expect(o2c.isValidTransition('Credit Check', 'Block Order')).toBe(true);
    expect(o2c.isValidTransition('Block Order', 'Approve Credit')).toBe(true);
    expect(o2c.isValidTransition('Approve Credit', 'Release Order')).toBe(true);
    expect(o2c.isValidTransition('Release Order', 'Create Delivery')).toBe(true);
  });

  it('has critical transitions list', () => {
    expect(o2c.criticalTransitions.length).toBeGreaterThan(0);
    expect(o2c.criticalTransitions).toContain('Goods Issue -> Create Invoice');
    expect(o2c.criticalTransitions).toContain('Create Invoice -> Payment Received');
  });
});

// ===========================================================================
// toJSON()
// ===========================================================================

describe('ReferenceModel.toJSON()', () => {
  it('serializes all properties', () => {
    const model = getReferenceModel('O2C');
    const json = model.toJSON();
    expect(json.id).toBe('O2C');
    expect(json.name).toBe('Order to Cash');
    expect(Array.isArray(json.activities)).toBe(true);
    expect(Array.isArray(json.edges)).toBe(true);
    expect(Array.isArray(json.startActivities)).toBe(true);
    expect(Array.isArray(json.endActivities)).toBe(true);
    expect(typeof json.slaTargets).toBe('object');
    expect(Array.isArray(json.criticalTransitions)).toBe(true);
  });

  it('JSON can be used to create a new equivalent model', () => {
    const original = getReferenceModel('P2P');
    const json = original.toJSON();
    const reconstructed = new ReferenceModel(json);
    expect(reconstructed.id).toBe(original.id);
    expect(reconstructed.activities).toEqual(original.activities);
    expect(reconstructed.edges).toEqual(original.edges);
    expect(reconstructed.getSuccessors('Create Purchase Requisition')).toEqual(
      original.getSuccessors('Create Purchase Requisition')
    );
  });
});

// ===========================================================================
// Remaining models: quick validation of names
// ===========================================================================

describe('Model names', () => {
  const expectedNames = {
    O2C: 'Order to Cash',
    P2P: 'Procure to Pay',
    R2R: 'Record to Report',
    A2R: 'Acquire to Retire',
    H2R: 'Hire to Retire',
    P2M: 'Plan to Manufacture',
    M2S: 'Maintain to Settle',
  };

  it.each(ALL_MODEL_IDS)('%s has the expected name', (id) => {
    expect(getReferenceModel(id).name).toBe(expectedNames[id]);
  });
});
