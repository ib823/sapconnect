/**
 * Transportation Management (TM) Rules
 *
 * Covers transition from legacy LE-TRA transportation to
 * embedded TM in S/4HANA. Key: shipment documents replaced,
 * freight order/booking model, carrier selection changes.
 */

module.exports = [
  // ── Shipment Processing ──────────────────────────────────────
  {
    id: 'SIMPL-TM-001',
    title: 'Legacy Shipment Processing (VT01-VT03)',
    description: 'Legacy shipment transactions VT01N/VT02N/VT03N replaced by TM freight order processing.',
    severity: 'critical',
    category: 'TM – Shipment Processing',
    sNote: '2462480',
    pattern: /\b(VT0[1-3]N?|VTTK|VTTP|VTTS)\b/i,
    patternType: 'source',
    remediation: 'Replace VT01-VT03 with TM freight order management (/SCMTMS/FO_CREATE).',
  },
  {
    id: 'SIMPL-TM-002',
    title: 'Shipment Cost Settlement Changed',
    description: 'Shipment cost documents (VI01-VI03) replaced by TM freight settlement.',
    severity: 'high',
    category: 'TM – Shipment Processing',
    sNote: '2462480',
    pattern: /\b(VI0[1-3]|VFSI|SHIPMENT_COST)\b/i,
    patternType: 'source',
    remediation: 'Migrate shipment cost settlement to TM freight settlement. Configure charge calculation schemas.',
  },
  {
    id: 'SIMPL-TM-003',
    title: 'Transportation Planning Point Replaced',
    description: 'Transportation planning points replaced by TM organizational units (business partner, org unit).',
    severity: 'high',
    category: 'TM – Shipment Processing',
    sNote: '2462480',
    pattern: /\b(VSTEL|TRANS_PLAN_POINT|T000V)\b/i,
    patternType: 'source',
    remediation: 'Map transportation planning points to TM organizational model.',
  },

  // ── Route & Carrier ──────────────────────────────────────────
  {
    id: 'SIMPL-TM-004',
    title: 'Route Determination Changed',
    description: 'Legacy route determination (OVTC) replaced by TM transportation lane model.',
    severity: 'high',
    category: 'TM – Route & Carrier',
    sNote: '2462480',
    pattern: /\b(OVTC|TVRO|ROUTE_DET|T_ROUTE)\b/i,
    patternType: 'source',
    remediation: 'Configure transportation lanes in TM to replace legacy route determination.',
  },
  {
    id: 'SIMPL-TM-005',
    title: 'Carrier Selection Replaced',
    description: 'Carrier selection moves from LE-TRA carrier master to TM carrier profiles with capacity and rate management.',
    severity: 'medium',
    category: 'TM – Route & Carrier',
    sNote: '2462480',
    pattern: /\b(CARRIER_SELECTION|TDLNR|FORWARDING_AGENT)\b/i,
    patternType: 'source',
    remediation: 'Set up TM carrier profiles and integrate with SAP Business Network for freight collaboration.',
  },

  // ── Integration ──────────────────────────────────────────────
  {
    id: 'SIMPL-TM-006',
    title: 'Delivery-to-Shipment Integration',
    description: 'Delivery-to-shipment assignment model replaced by TM freight unit builder.',
    severity: 'high',
    category: 'TM – Integration',
    sNote: '2462480',
    pattern: /\b(VLSP|DELIVERY_SHIPMENT|VL32N)\b/i,
    patternType: 'source',
    remediation: 'Configure freight unit builder in TM for automatic delivery-to-freight unit assignment.',
  },
  {
    id: 'SIMPL-TM-007',
    title: 'Dangerous Goods Processing Changed',
    description: 'Dangerous goods processing in transportation changes to TM-based DG checks.',
    severity: 'medium',
    category: 'TM – Integration',
    sNote: '2462480',
    pattern: /\b(DG_CHECK|DANGEROUS_GOODS|VGK[1-3])\b/i,
    patternType: 'source',
    remediation: 'Configure dangerous goods processing in TM. Review DG master data migration.',
  },
  {
    id: 'SIMPL-TM-008',
    title: 'Freight Cost Calculation Schema',
    description: 'TM introduces charge calculation schemas replacing legacy shipment cost conditions.',
    severity: 'medium',
    category: 'TM – Integration',
    sNote: '2462480',
    pattern: /\b(FREIGHT_COST|KOFL|SHIPMENT_CONDITION)\b/i,
    patternType: 'source',
    remediation: 'Migrate freight cost conditions to TM charge calculation schemas.',
  },
];
