/**
 * SAP Best Practice Reference Process Models
 *
 * Defines the expected (ideal) process flows for standard SAP end-to-end
 * scenarios. Used by the conformance checker to measure how actual processes
 * deviate from the reference, identify bottlenecks, and flag missing steps.
 *
 * Each model includes:
 *  - Complete activity set (happy path + exception paths)
 *  - Edges with type annotations (sequence, parallel, choice)
 *  - SLA targets based on SAP best practice benchmarks
 *  - Critical transitions that auditors verify
 *
 * Supported models: O2C, P2P, R2R, A2R, H2R, P2M, M2S
 */

const Logger = require('../../lib/logger');

const log = new Logger('reference-models');

// ---------------------------------------------------------------------------
// Helper: build a transition key from two activity names
// ---------------------------------------------------------------------------
function transitionKey(from, to) {
  return `${from} -> ${to}`;
}

// ---------------------------------------------------------------------------
// ReferenceModel class
// ---------------------------------------------------------------------------

class ReferenceModel {
  /**
   * @param {object} config
   * @param {string}   config.id               - Short process identifier (e.g. 'O2C')
   * @param {string}   config.name             - Human-readable name
   * @param {string[]} config.activities        - Ordered list of activity names
   * @param {Array<{from:string, to:string, type:string}>} config.edges
   *   type: 'sequence' | 'parallel' | 'choice'
   * @param {string[]} config.startActivities   - Valid starting activities
   * @param {string[]} config.endActivities     - Valid ending activities
   * @param {object}   config.slaTargets        - { [transitionKey]: { target, unit, severity } }
   * @param {string[]} config.criticalTransitions - Transitions that MUST occur
   */
  constructor({ id, name, activities, edges, startActivities, endActivities, slaTargets, criticalTransitions }) {
    this.id = id;
    this.name = name;
    this.activities = activities || [];
    this.edges = edges || [];
    this.startActivities = startActivities || [];
    this.endActivities = endActivities || [];
    this.slaTargets = slaTargets || {};
    this.criticalTransitions = criticalTransitions || [];

    // Pre-compute adjacency lists for fast lookups
    this._successors = new Map();   // activity -> Set<activity>
    this._predecessors = new Map(); // activity -> Set<activity>
    this._edgeIndex = new Map();    // transitionKey -> edge

    for (const activity of this.activities) {
      this._successors.set(activity, new Set());
      this._predecessors.set(activity, new Set());
    }

    for (const edge of this.edges) {
      if (!this._successors.has(edge.from)) {
        this._successors.set(edge.from, new Set());
      }
      if (!this._predecessors.has(edge.to)) {
        this._predecessors.set(edge.to, new Set());
      }
      this._successors.get(edge.from).add(edge.to);
      this._predecessors.get(edge.to).add(edge.from);
      this._edgeIndex.set(transitionKey(edge.from, edge.to), edge);
    }

    log.debug(`Loaded reference model: ${id} (${this.activities.length} activities, ${this.edges.length} edges)`);
  }

  /**
   * Returns the set of activities that can directly follow the given activity.
   * @param {string} activity
   * @returns {string[]}
   */
  getSuccessors(activity) {
    const set = this._successors.get(activity);
    return set ? Array.from(set) : [];
  }

  /**
   * Returns the set of activities that can directly precede the given activity.
   * @param {string} activity
   * @returns {string[]}
   */
  getPredecessors(activity) {
    const set = this._predecessors.get(activity);
    return set ? Array.from(set) : [];
  }

  /**
   * Checks whether a direct edge exists between two activities.
   * @param {string} from
   * @param {string} to
   * @returns {boolean}
   */
  isValidTransition(from, to) {
    return this._edgeIndex.has(transitionKey(from, to));
  }

  /**
   * @param {string} activity
   * @returns {boolean}
   */
  isStartActivity(activity) {
    return this.startActivities.includes(activity);
  }

  /**
   * @param {string} activity
   * @returns {boolean}
   */
  isEndActivity(activity) {
    return this.endActivities.includes(activity);
  }

  /**
   * Returns the SLA target for a specific transition, or null if none defined.
   * @param {string} fromActivity
   * @param {string} toActivity
   * @returns {{ target: number, unit: string, severity: string } | null}
   */
  getSLATarget(fromActivity, toActivity) {
    return this.slaTargets[transitionKey(fromActivity, toActivity)] || null;
  }

  /**
   * Computes the longest (critical) path through the model using topological
   * ordering and dynamic programming. Returns an array of activity names.
   * @returns {string[]}
   */
  getCriticalPath() {
    // Compute in-degrees
    const inDegree = new Map();
    for (const activity of this.activities) {
      inDegree.set(activity, 0);
    }
    for (const edge of this.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    // Topological sort (Kahn's algorithm)
    const queue = [];
    for (const [activity, deg] of inDegree) {
      if (deg === 0) queue.push(activity);
    }

    const topoOrder = [];
    const tempInDegree = new Map(inDegree);
    const topoQueue = [...queue];

    while (topoQueue.length > 0) {
      const current = topoQueue.shift();
      topoOrder.push(current);
      for (const succ of this.getSuccessors(current)) {
        tempInDegree.set(succ, tempInDegree.get(succ) - 1);
        if (tempInDegree.get(succ) === 0) {
          topoQueue.push(succ);
        }
      }
    }

    // If topological sort didn't include all activities, there is a cycle.
    // Fall back to start-to-end BFS longest path that tracks visited nodes.
    if (topoOrder.length < this.activities.length) {
      return this._longestPathWithCycles();
    }

    // DP: longest path in a DAG
    const dist = new Map();     // activity -> longest distance from any start
    const prev = new Map();     // activity -> predecessor on longest path

    for (const activity of topoOrder) {
      dist.set(activity, 0);
      prev.set(activity, null);
    }

    // Initialize start activities with distance 1
    for (const start of this.startActivities) {
      if (dist.has(start)) dist.set(start, 1);
    }

    for (const u of topoOrder) {
      for (const v of this.getSuccessors(u)) {
        const newDist = dist.get(u) + 1;
        if (newDist > dist.get(v)) {
          dist.set(v, newDist);
          prev.set(v, u);
        }
      }
    }

    // Find the end activity with the longest distance
    let bestEnd = null;
    let bestDist = -1;
    for (const end of this.endActivities) {
      if (dist.has(end) && dist.get(end) > bestDist) {
        bestDist = dist.get(end);
        bestEnd = end;
      }
    }

    // If no end activity was reached, pick the activity with highest distance
    if (bestEnd === null) {
      for (const [activity, d] of dist) {
        if (d > bestDist) {
          bestDist = d;
          bestEnd = activity;
        }
      }
    }

    // Backtrack to build the path
    const path = [];
    let current = bestEnd;
    while (current !== null) {
      path.unshift(current);
      current = prev.get(current);
    }

    return path;
  }

  /**
   * Fallback longest path finder for models with cycles (loops).
   * Uses BFS from start activities, tracking visited per path.
   * @returns {string[]}
   * @private
   */
  _longestPathWithCycles() {
    let longestPath = [];

    for (const start of this.startActivities) {
      // BFS with path tracking
      const stack = [{ activity: start, path: [start], visited: new Set([start]) }];

      while (stack.length > 0) {
        const { activity, path, visited } = stack.pop();

        if (this.endActivities.includes(activity) && path.length > longestPath.length) {
          longestPath = [...path];
        }

        for (const succ of this.getSuccessors(activity)) {
          if (!visited.has(succ)) {
            const newVisited = new Set(visited);
            newVisited.add(succ);
            stack.push({ activity: succ, path: [...path, succ], visited: newVisited });
          }
        }
      }
    }

    return longestPath;
  }

  /**
   * Serializes the model to a plain object.
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      activities: this.activities,
      edges: this.edges,
      startActivities: this.startActivities,
      endActivities: this.endActivities,
      slaTargets: this.slaTargets,
      criticalTransitions: this.criticalTransitions,
    };
  }
}

// ===========================================================================
// Reference Model Definitions
// ===========================================================================

// ---------------------------------------------------------------------------
// O2C — Order to Cash (SAP Best Practice)
// ---------------------------------------------------------------------------
const O2C = new ReferenceModel({
  id: 'O2C',
  name: 'Order to Cash',
  activities: [
    'Create Sales Order',
    'Change Sales Order',
    'Credit Check',
    'Approve Credit',
    'Block Order',
    'Release Order',
    'Create Delivery',
    'Pick',
    'Pack',
    'Goods Issue',
    'Create Invoice',
    'Send Invoice',
    'Dunning',
    'Payment Received',
    'Clear Invoice',
  ],
  edges: [
    // Happy path
    { from: 'Create Sales Order', to: 'Credit Check', type: 'sequence' },
    { from: 'Credit Check', to: 'Create Delivery', type: 'sequence' },
    { from: 'Create Delivery', to: 'Pick', type: 'sequence' },
    { from: 'Pick', to: 'Pack', type: 'sequence' },
    { from: 'Pack', to: 'Goods Issue', type: 'sequence' },
    { from: 'Goods Issue', to: 'Create Invoice', type: 'sequence' },
    { from: 'Create Invoice', to: 'Send Invoice', type: 'sequence' },
    { from: 'Send Invoice', to: 'Payment Received', type: 'sequence' },
    { from: 'Payment Received', to: 'Clear Invoice', type: 'sequence' },

    // Credit block path
    { from: 'Credit Check', to: 'Block Order', type: 'choice' },
    { from: 'Block Order', to: 'Approve Credit', type: 'sequence' },
    { from: 'Approve Credit', to: 'Release Order', type: 'sequence' },
    { from: 'Release Order', to: 'Create Delivery', type: 'sequence' },

    // Change / rework loop
    { from: 'Create Sales Order', to: 'Change Sales Order', type: 'choice' },
    { from: 'Change Sales Order', to: 'Credit Check', type: 'sequence' },

    // Parallel: credit check can run alongside order changes
    { from: 'Create Sales Order', to: 'Create Delivery', type: 'parallel' },

    // Dunning loop for overdue invoices
    { from: 'Send Invoice', to: 'Dunning', type: 'choice' },
    { from: 'Dunning', to: 'Payment Received', type: 'sequence' },
    { from: 'Dunning', to: 'Dunning', type: 'choice' },
  ],
  startActivities: ['Create Sales Order'],
  endActivities: ['Clear Invoice'],
  slaTargets: {
    [transitionKey('Create Sales Order', 'Create Delivery')]: { target: 3, unit: 'days', severity: 'warning' },
    [transitionKey('Create Delivery', 'Goods Issue')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Goods Issue', 'Create Invoice')]: { target: 2, unit: 'days', severity: 'warning' },
    [transitionKey('Create Invoice', 'Payment Received')]: { target: 30, unit: 'days', severity: 'critical' },
    [transitionKey('Create Sales Order', 'Payment Received')]: { target: 45, unit: 'days', severity: 'critical' },
    [transitionKey('Create Sales Order', 'Clear Invoice')]: { target: 50, unit: 'days', severity: 'critical' },
    [transitionKey('Credit Check', 'Block Order')]: { target: 1, unit: 'hours', severity: 'warning' },
    [transitionKey('Block Order', 'Release Order')]: { target: 2, unit: 'days', severity: 'warning' },
  },
  criticalTransitions: [
    transitionKey('Goods Issue', 'Create Invoice'),
    transitionKey('Create Invoice', 'Payment Received'),
    transitionKey('Payment Received', 'Clear Invoice'),
    transitionKey('Create Sales Order', 'Credit Check'),
  ],
});

// ---------------------------------------------------------------------------
// P2P — Procure to Pay
// ---------------------------------------------------------------------------
const P2P = new ReferenceModel({
  id: 'P2P',
  name: 'Procure to Pay',
  activities: [
    'Create Purchase Requisition',
    'Approve Purchase Requisition',
    'Reject Purchase Requisition',
    'Create Purchase Order',
    'Approve Purchase Order',
    'Send Purchase Order',
    'Goods Receipt',
    'Invoice Receipt',
    'Three-Way Match',
    'Block Invoice',
    'Release Invoice',
    'Schedule Payment',
    'Payment Run',
    'Payment Clearing',
  ],
  edges: [
    // Happy path
    { from: 'Create Purchase Requisition', to: 'Approve Purchase Requisition', type: 'sequence' },
    { from: 'Approve Purchase Requisition', to: 'Create Purchase Order', type: 'sequence' },
    { from: 'Create Purchase Order', to: 'Approve Purchase Order', type: 'sequence' },
    { from: 'Approve Purchase Order', to: 'Send Purchase Order', type: 'sequence' },
    { from: 'Send Purchase Order', to: 'Goods Receipt', type: 'sequence' },
    { from: 'Goods Receipt', to: 'Invoice Receipt', type: 'sequence' },
    { from: 'Invoice Receipt', to: 'Three-Way Match', type: 'sequence' },
    { from: 'Three-Way Match', to: 'Schedule Payment', type: 'sequence' },
    { from: 'Schedule Payment', to: 'Payment Run', type: 'sequence' },
    { from: 'Payment Run', to: 'Payment Clearing', type: 'sequence' },

    // Rejection path
    { from: 'Create Purchase Requisition', to: 'Reject Purchase Requisition', type: 'choice' },

    // Invoice block path
    { from: 'Three-Way Match', to: 'Block Invoice', type: 'choice' },
    { from: 'Block Invoice', to: 'Release Invoice', type: 'sequence' },
    { from: 'Release Invoice', to: 'Schedule Payment', type: 'sequence' },

    // Direct PO creation (no requisition required for some scenarios)
    { from: 'Create Purchase Order', to: 'Send Purchase Order', type: 'parallel' },

    // Invoice before goods (service PO)
    { from: 'Send Purchase Order', to: 'Invoice Receipt', type: 'parallel' },

    // Evaluated receipt settlement (auto-invoice)
    { from: 'Goods Receipt', to: 'Three-Way Match', type: 'parallel' },
  ],
  startActivities: ['Create Purchase Requisition', 'Create Purchase Order'],
  endActivities: ['Payment Clearing', 'Reject Purchase Requisition'],
  slaTargets: {
    [transitionKey('Create Purchase Requisition', 'Approve Purchase Requisition')]: { target: 2, unit: 'days', severity: 'warning' },
    [transitionKey('Approve Purchase Requisition', 'Create Purchase Order')]: { target: 3, unit: 'days', severity: 'warning' },
    [transitionKey('Create Purchase Order', 'Send Purchase Order')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Send Purchase Order', 'Goods Receipt')]: { target: 14, unit: 'days', severity: 'warning' },
    [transitionKey('Goods Receipt', 'Invoice Receipt')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Invoice Receipt', 'Three-Way Match')]: { target: 2, unit: 'days', severity: 'warning' },
    [transitionKey('Three-Way Match', 'Schedule Payment')]: { target: 3, unit: 'days', severity: 'warning' },
    [transitionKey('Invoice Receipt', 'Payment Clearing')]: { target: 30, unit: 'days', severity: 'critical' },
    [transitionKey('Create Purchase Requisition', 'Payment Clearing')]: { target: 60, unit: 'days', severity: 'critical' },
    [transitionKey('Block Invoice', 'Release Invoice')]: { target: 5, unit: 'days', severity: 'warning' },
  },
  criticalTransitions: [
    transitionKey('Goods Receipt', 'Invoice Receipt'),
    transitionKey('Invoice Receipt', 'Three-Way Match'),
    transitionKey('Three-Way Match', 'Schedule Payment'),
    transitionKey('Payment Run', 'Payment Clearing'),
  ],
});

// ---------------------------------------------------------------------------
// R2R — Record to Report
// ---------------------------------------------------------------------------
const R2R = new ReferenceModel({
  id: 'R2R',
  name: 'Record to Report',
  activities: [
    'Create Journal Entry',
    'Park Journal Entry',
    'Approve Journal Entry',
    'Post Journal Entry',
    'Reverse Journal Entry',
    'Clear Line Item',
    'Run Automatic Clearing',
    'Period Close Posting',
    'Execute Reconciliation',
    'Close Period',
  ],
  edges: [
    // Happy path: direct posting
    { from: 'Create Journal Entry', to: 'Post Journal Entry', type: 'sequence' },
    { from: 'Post Journal Entry', to: 'Clear Line Item', type: 'sequence' },
    { from: 'Clear Line Item', to: 'Run Automatic Clearing', type: 'sequence' },
    { from: 'Run Automatic Clearing', to: 'Period Close Posting', type: 'sequence' },
    { from: 'Period Close Posting', to: 'Execute Reconciliation', type: 'sequence' },
    { from: 'Execute Reconciliation', to: 'Close Period', type: 'sequence' },

    // Park and approve path
    { from: 'Create Journal Entry', to: 'Park Journal Entry', type: 'choice' },
    { from: 'Park Journal Entry', to: 'Approve Journal Entry', type: 'sequence' },
    { from: 'Approve Journal Entry', to: 'Post Journal Entry', type: 'sequence' },

    // Reversal path
    { from: 'Post Journal Entry', to: 'Reverse Journal Entry', type: 'choice' },
    { from: 'Reverse Journal Entry', to: 'Create Journal Entry', type: 'sequence' },

    // Direct clearing without manual line item clearing
    { from: 'Post Journal Entry', to: 'Run Automatic Clearing', type: 'parallel' },

    // Period close can trigger reconciliation directly
    { from: 'Period Close Posting', to: 'Close Period', type: 'parallel' },
  ],
  startActivities: ['Create Journal Entry'],
  endActivities: ['Close Period'],
  slaTargets: {
    [transitionKey('Create Journal Entry', 'Post Journal Entry')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Park Journal Entry', 'Approve Journal Entry')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Approve Journal Entry', 'Post Journal Entry')]: { target: 4, unit: 'hours', severity: 'warning' },
    [transitionKey('Period Close Posting', 'Close Period')]: { target: 5, unit: 'days', severity: 'critical' },
    [transitionKey('Execute Reconciliation', 'Close Period')]: { target: 2, unit: 'days', severity: 'critical' },
    [transitionKey('Post Journal Entry', 'Clear Line Item')]: { target: 3, unit: 'days', severity: 'warning' },
    [transitionKey('Run Automatic Clearing', 'Period Close Posting')]: { target: 1, unit: 'days', severity: 'warning' },
  },
  criticalTransitions: [
    transitionKey('Approve Journal Entry', 'Post Journal Entry'),
    transitionKey('Execute Reconciliation', 'Close Period'),
    transitionKey('Period Close Posting', 'Close Period'),
  ],
});

// ---------------------------------------------------------------------------
// A2R — Acquire to Retire
// ---------------------------------------------------------------------------
const A2R = new ReferenceModel({
  id: 'A2R',
  name: 'Acquire to Retire',
  activities: [
    'Create Asset Master',
    'Post Asset Acquisition',
    'Capitalize Asset',
    'Post Depreciation',
    'Transfer Asset',
    'Revalue Asset',
    'Retire Asset',
    'Scrap Asset',
    'Settle Asset',
  ],
  edges: [
    // Happy path: full lifecycle
    { from: 'Create Asset Master', to: 'Post Asset Acquisition', type: 'sequence' },
    { from: 'Post Asset Acquisition', to: 'Capitalize Asset', type: 'sequence' },
    { from: 'Capitalize Asset', to: 'Post Depreciation', type: 'sequence' },
    { from: 'Post Depreciation', to: 'Retire Asset', type: 'sequence' },
    { from: 'Retire Asset', to: 'Settle Asset', type: 'sequence' },

    // Depreciation loop (runs monthly)
    { from: 'Post Depreciation', to: 'Post Depreciation', type: 'choice' },

    // Transfer path
    { from: 'Post Depreciation', to: 'Transfer Asset', type: 'choice' },
    { from: 'Transfer Asset', to: 'Post Depreciation', type: 'sequence' },

    // Revaluation path
    { from: 'Post Depreciation', to: 'Revalue Asset', type: 'choice' },
    { from: 'Revalue Asset', to: 'Post Depreciation', type: 'sequence' },

    // Scrap path (alternative to retirement)
    { from: 'Post Depreciation', to: 'Scrap Asset', type: 'choice' },
    { from: 'Scrap Asset', to: 'Settle Asset', type: 'sequence' },

    // Direct retirement without further depreciation
    { from: 'Capitalize Asset', to: 'Retire Asset', type: 'choice' },

    // Direct scrap from capitalized state
    { from: 'Capitalize Asset', to: 'Scrap Asset', type: 'choice' },
  ],
  startActivities: ['Create Asset Master'],
  endActivities: ['Settle Asset'],
  slaTargets: {
    [transitionKey('Create Asset Master', 'Post Asset Acquisition')]: { target: 2, unit: 'days', severity: 'warning' },
    [transitionKey('Post Asset Acquisition', 'Capitalize Asset')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Capitalize Asset', 'Post Depreciation')]: { target: 30, unit: 'days', severity: 'warning' },
    [transitionKey('Retire Asset', 'Settle Asset')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Scrap Asset', 'Settle Asset')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Create Asset Master', 'Capitalize Asset')]: { target: 10, unit: 'days', severity: 'critical' },
  },
  criticalTransitions: [
    transitionKey('Post Asset Acquisition', 'Capitalize Asset'),
    transitionKey('Capitalize Asset', 'Post Depreciation'),
    transitionKey('Retire Asset', 'Settle Asset'),
  ],
});

// ---------------------------------------------------------------------------
// H2R — Hire to Retire
// ---------------------------------------------------------------------------
const H2R = new ReferenceModel({
  id: 'H2R',
  name: 'Hire to Retire',
  activities: [
    'Create Employee',
    'Hire Action',
    'Assign Organizational Unit',
    'Assign Position',
    'Enter Basic Pay',
    'Onboard',
    'Change Position',
    'Promote',
    'Transfer',
    'Adjust Pay',
    'Process Payroll',
    'Terminate',
  ],
  edges: [
    // Happy path: hire to onboard
    { from: 'Create Employee', to: 'Hire Action', type: 'sequence' },
    { from: 'Hire Action', to: 'Assign Organizational Unit', type: 'sequence' },
    { from: 'Assign Organizational Unit', to: 'Assign Position', type: 'sequence' },
    { from: 'Assign Position', to: 'Enter Basic Pay', type: 'sequence' },
    { from: 'Enter Basic Pay', to: 'Onboard', type: 'sequence' },

    // Parallel: org unit and position can be assigned together
    { from: 'Hire Action', to: 'Assign Position', type: 'parallel' },
    { from: 'Hire Action', to: 'Enter Basic Pay', type: 'parallel' },

    // Ongoing lifecycle from onboarding
    { from: 'Onboard', to: 'Process Payroll', type: 'sequence' },

    // Career changes (from active employment)
    { from: 'Onboard', to: 'Change Position', type: 'choice' },
    { from: 'Onboard', to: 'Promote', type: 'choice' },
    { from: 'Onboard', to: 'Transfer', type: 'choice' },
    { from: 'Onboard', to: 'Adjust Pay', type: 'choice' },

    // Career changes cycle back to payroll
    { from: 'Change Position', to: 'Process Payroll', type: 'sequence' },
    { from: 'Promote', to: 'Adjust Pay', type: 'sequence' },
    { from: 'Adjust Pay', to: 'Process Payroll', type: 'sequence' },
    { from: 'Transfer', to: 'Assign Organizational Unit', type: 'sequence' },

    // Payroll recurs and can lead to further changes or termination
    { from: 'Process Payroll', to: 'Process Payroll', type: 'choice' },
    { from: 'Process Payroll', to: 'Change Position', type: 'choice' },
    { from: 'Process Payroll', to: 'Promote', type: 'choice' },
    { from: 'Process Payroll', to: 'Transfer', type: 'choice' },
    { from: 'Process Payroll', to: 'Adjust Pay', type: 'choice' },
    { from: 'Process Payroll', to: 'Terminate', type: 'sequence' },

    // Direct termination from onboarded state
    { from: 'Onboard', to: 'Terminate', type: 'choice' },
  ],
  startActivities: ['Create Employee'],
  endActivities: ['Terminate'],
  slaTargets: {
    [transitionKey('Create Employee', 'Hire Action')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Hire Action', 'Onboard')]: { target: 14, unit: 'days', severity: 'critical' },
    [transitionKey('Enter Basic Pay', 'Onboard')]: { target: 3, unit: 'days', severity: 'warning' },
    [transitionKey('Onboard', 'Process Payroll')]: { target: 30, unit: 'days', severity: 'warning' },
    [transitionKey('Process Payroll', 'Process Payroll')]: { target: 30, unit: 'days', severity: 'warning' },
    [transitionKey('Promote', 'Adjust Pay')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Change Position', 'Process Payroll')]: { target: 30, unit: 'days', severity: 'warning' },
    [transitionKey('Process Payroll', 'Terminate')]: { target: 30, unit: 'days', severity: 'warning' },
  },
  criticalTransitions: [
    transitionKey('Hire Action', 'Onboard'),
    transitionKey('Enter Basic Pay', 'Onboard'),
    transitionKey('Onboard', 'Process Payroll'),
    transitionKey('Process Payroll', 'Terminate'),
  ],
});

// ---------------------------------------------------------------------------
// P2M — Plan to Manufacture
// ---------------------------------------------------------------------------
const P2M = new ReferenceModel({
  id: 'P2M',
  name: 'Plan to Manufacture',
  activities: [
    'Create Production Order',
    'Plan Order',
    'Release Production Order',
    'Print Shop Floor Papers',
    'Issue Materials',
    'Start Operation',
    'Confirm Operation',
    'Partial Confirmation',
    'Goods Receipt',
    'Technically Complete',
    'Close Order',
    'Settle Order',
  ],
  edges: [
    // Happy path
    { from: 'Create Production Order', to: 'Plan Order', type: 'sequence' },
    { from: 'Plan Order', to: 'Release Production Order', type: 'sequence' },
    { from: 'Release Production Order', to: 'Print Shop Floor Papers', type: 'sequence' },
    { from: 'Release Production Order', to: 'Issue Materials', type: 'parallel' },
    { from: 'Print Shop Floor Papers', to: 'Issue Materials', type: 'sequence' },
    { from: 'Issue Materials', to: 'Start Operation', type: 'sequence' },
    { from: 'Start Operation', to: 'Confirm Operation', type: 'sequence' },
    { from: 'Confirm Operation', to: 'Goods Receipt', type: 'sequence' },
    { from: 'Goods Receipt', to: 'Technically Complete', type: 'sequence' },
    { from: 'Technically Complete', to: 'Close Order', type: 'sequence' },
    { from: 'Close Order', to: 'Settle Order', type: 'sequence' },

    // Partial confirmation loop (multi-operation orders)
    { from: 'Start Operation', to: 'Partial Confirmation', type: 'choice' },
    { from: 'Partial Confirmation', to: 'Start Operation', type: 'sequence' },
    { from: 'Partial Confirmation', to: 'Confirm Operation', type: 'sequence' },

    // Direct material issue at release (backflush)
    { from: 'Confirm Operation', to: 'Issue Materials', type: 'parallel' },

    // Fast close: skip technical completion for simple orders
    { from: 'Goods Receipt', to: 'Close Order', type: 'parallel' },

    // Rework loop
    { from: 'Confirm Operation', to: 'Start Operation', type: 'choice' },
  ],
  startActivities: ['Create Production Order'],
  endActivities: ['Settle Order'],
  slaTargets: {
    [transitionKey('Create Production Order', 'Plan Order')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Plan Order', 'Release Production Order')]: { target: 2, unit: 'days', severity: 'warning' },
    [transitionKey('Release Production Order', 'Issue Materials')]: { target: 1, unit: 'days', severity: 'critical' },
    [transitionKey('Issue Materials', 'Start Operation')]: { target: 4, unit: 'hours', severity: 'warning' },
    [transitionKey('Start Operation', 'Confirm Operation')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Confirm Operation', 'Goods Receipt')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Goods Receipt', 'Technically Complete')]: { target: 2, unit: 'days', severity: 'warning' },
    [transitionKey('Technically Complete', 'Settle Order')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Release Production Order', 'Goods Receipt')]: { target: 10, unit: 'days', severity: 'critical' },
  },
  criticalTransitions: [
    transitionKey('Release Production Order', 'Issue Materials'),
    transitionKey('Confirm Operation', 'Goods Receipt'),
    transitionKey('Goods Receipt', 'Technically Complete'),
    transitionKey('Close Order', 'Settle Order'),
  ],
});

// ---------------------------------------------------------------------------
// M2S — Maintain to Settle
// ---------------------------------------------------------------------------
const M2S = new ReferenceModel({
  id: 'M2S',
  name: 'Maintain to Settle',
  activities: [
    'Create Notification',
    'Classify Notification',
    'Approve Notification',
    'Create Work Order',
    'Plan Work Order',
    'Release Work Order',
    'Print Work Order',
    'Issue Spare Parts',
    'Execute Maintenance',
    'Confirm Operations',
    'Technically Complete',
    'Settle Work Order',
  ],
  edges: [
    // Happy path
    { from: 'Create Notification', to: 'Classify Notification', type: 'sequence' },
    { from: 'Classify Notification', to: 'Approve Notification', type: 'sequence' },
    { from: 'Approve Notification', to: 'Create Work Order', type: 'sequence' },
    { from: 'Create Work Order', to: 'Plan Work Order', type: 'sequence' },
    { from: 'Plan Work Order', to: 'Release Work Order', type: 'sequence' },
    { from: 'Release Work Order', to: 'Print Work Order', type: 'sequence' },
    { from: 'Print Work Order', to: 'Issue Spare Parts', type: 'sequence' },
    { from: 'Issue Spare Parts', to: 'Execute Maintenance', type: 'sequence' },
    { from: 'Execute Maintenance', to: 'Confirm Operations', type: 'sequence' },
    { from: 'Confirm Operations', to: 'Technically Complete', type: 'sequence' },
    { from: 'Technically Complete', to: 'Settle Work Order', type: 'sequence' },

    // Fast track for emergency maintenance: skip formal planning
    { from: 'Create Notification', to: 'Create Work Order', type: 'parallel' },
    { from: 'Approve Notification', to: 'Release Work Order', type: 'parallel' },

    // Release without printing (digital work orders)
    { from: 'Release Work Order', to: 'Issue Spare Parts', type: 'parallel' },

    // No spare parts needed
    { from: 'Release Work Order', to: 'Execute Maintenance', type: 'parallel' },
    { from: 'Print Work Order', to: 'Execute Maintenance', type: 'parallel' },

    // Multi-operation maintenance: confirm loops back to execute
    { from: 'Confirm Operations', to: 'Execute Maintenance', type: 'choice' },

    // Additional spare parts during maintenance
    { from: 'Execute Maintenance', to: 'Issue Spare Parts', type: 'choice' },
  ],
  startActivities: ['Create Notification'],
  endActivities: ['Settle Work Order'],
  slaTargets: {
    [transitionKey('Create Notification', 'Classify Notification')]: { target: 4, unit: 'hours', severity: 'warning' },
    [transitionKey('Classify Notification', 'Approve Notification')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Create Notification', 'Create Work Order')]: { target: 1, unit: 'days', severity: 'critical' },
    [transitionKey('Approve Notification', 'Create Work Order')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Plan Work Order', 'Release Work Order')]: { target: 3, unit: 'days', severity: 'warning' },
    [transitionKey('Release Work Order', 'Execute Maintenance')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Execute Maintenance', 'Confirm Operations')]: { target: 2, unit: 'days', severity: 'warning' },
    [transitionKey('Confirm Operations', 'Technically Complete')]: { target: 1, unit: 'days', severity: 'warning' },
    [transitionKey('Technically Complete', 'Settle Work Order')]: { target: 5, unit: 'days', severity: 'warning' },
    [transitionKey('Create Notification', 'Settle Work Order')]: { target: 30, unit: 'days', severity: 'critical' },
  },
  criticalTransitions: [
    transitionKey('Create Notification', 'Create Work Order'),
    transitionKey('Release Work Order', 'Execute Maintenance'),
    transitionKey('Execute Maintenance', 'Confirm Operations'),
    transitionKey('Technically Complete', 'Settle Work Order'),
  ],
});

// ===========================================================================
// Model registry
// ===========================================================================

const REFERENCE_MODELS = {
  O2C,
  P2P,
  R2R,
  A2R,
  H2R,
  P2M,
  M2S,
};

/**
 * Returns a ReferenceModel instance by process identifier.
 * @param {string} processId - One of O2C, P2P, R2R, A2R, H2R, P2M, M2S
 * @returns {ReferenceModel|null}
 */
function getReferenceModel(processId) {
  const model = REFERENCE_MODELS[processId] || null;
  if (!model) {
    log.warn(`Reference model not found: ${processId}`);
  }
  return model;
}

/**
 * Returns the list of all available reference model identifiers.
 * @returns {string[]}
 */
function getAllReferenceModelIds() {
  return Object.keys(REFERENCE_MODELS);
}

module.exports = {
  ReferenceModel,
  REFERENCE_MODELS,
  getReferenceModel,
  getAllReferenceModelIds,
};
