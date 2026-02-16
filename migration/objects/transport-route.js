/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Transportation Route Migration Object
 *
 * Migrates legacy LE-TRA routes and shipment config (TVRO/VTTK)
 * to S/4HANA TM transportation lanes and freight order config.
 *
 * ~35 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class TransportRouteMigrationObject extends BaseMigrationObject {
  get objectId() { return 'TRANSPORT_ROUTE'; }
  get name() { return 'Transportation Route'; }

  getFieldMappings() {
    return [
      // Route master
      { source: 'ROUTE', target: 'TransportationRoute' },
      { source: 'BEZEI', target: 'RouteDescription' },
      { source: 'VSART', target: 'ShippingType' },
      { source: 'VSBED', target: 'ShippingCondition' },
      { source: 'TRAESSION_ZI', target: 'TransitDays', convert: 'toInteger' },
      { source: 'DISTZ', target: 'Distance', convert: 'toDecimal' },
      { source: 'MEDESSION_KM', target: 'DistanceUnit' },
      // Source location
      { source: 'AESSION_LAND1', target: 'SourceCountry', convert: 'toUpperCase' },
      { source: 'AESSION_REGIO', target: 'SourceRegion' },
      { source: 'AESSION_ZONE', target: 'SourceTransportZone' },
      { source: 'AESSION_VSTEL', target: 'ShippingPoint' },
      // Destination location
      { source: 'EESSION_LAND1', target: 'DestCountry', convert: 'toUpperCase' },
      { source: 'EESSION_REGIO', target: 'DestRegion' },
      { source: 'EESSION_ZONE', target: 'DestTransportZone' },
      // Carrier
      { source: 'TDLNR', target: 'CarrierPartner' },
      { source: 'TDLNR_NAME', target: 'CarrierName' },
      { source: 'SESSION_MOTY', target: 'ModeOfTransport' },
      // Legs
      { source: 'LEG_IND', target: 'LegIndicator' },
      { source: 'LEG_SEQ', target: 'LegSequence', convert: 'toInteger' },
      { source: 'VIA_POINT', target: 'ViaPoint' },
      // Cost
      { source: 'FREIGHT_CLASS', target: 'FreightClass' },
      { source: 'COST_RATE', target: 'CostRate', convert: 'toDecimal' },
      { source: 'COST_UNIT', target: 'CostUnit' },
      { source: 'WAESSION_ERS', target: 'Currency' },
      // TM mapping
      { source: 'TM_LANE_ID', target: 'TMLaneId' },
      { source: 'TM_LANE_TYPE', target: 'TMLaneType' },
      { source: 'MIGRATION_ACTION', target: 'MigrationAction' },
      // Status
      { source: 'ACTIVE', target: 'IsActive', convert: 'boolYN' },
      { source: 'VALID_FROM', target: 'ValidFrom', convert: 'toDate' },
      { source: 'VALID_TO', target: 'ValidTo', convert: 'toDate' },
      // Metadata
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'TRANSPORT_ROUTE' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['TransportationRoute', 'RouteDescription', 'ShippingType'],
      exactDuplicate: { keys: ['TransportationRoute', 'LegSequence'] },
    };
  }

  _extractMock() {
    const records = [];
    const routes = [
      { route: 'RT0001', desc: 'NYC to Chicago', from: 'US/NY/Z01', to: 'US/IL/Z02', dist: 790, days: 2, type: 'ROAD' },
      { route: 'RT0002', desc: 'NYC to LA', from: 'US/NY/Z01', to: 'US/CA/Z05', dist: 2800, days: 5, type: 'ROAD' },
      { route: 'RT0003', desc: 'Chicago to Houston', from: 'US/IL/Z02', to: 'US/TX/Z03', dist: 1090, days: 2, type: 'ROAD' },
      { route: 'RT0004', desc: 'NYC to London', from: 'US/NY/Z01', to: 'GB/LN/Z10', dist: 5570, days: 14, type: 'SEA' },
      { route: 'RT0005', desc: 'LA to Shanghai', from: 'US/CA/Z05', to: 'CN/SH/Z20', dist: 11500, days: 21, type: 'SEA' },
      { route: 'RT0006', desc: 'Frankfurt to Munich', from: 'DE/HE/Z30', to: 'DE/BY/Z31', dist: 400, days: 1, type: 'ROAD' },
      { route: 'RT0007', desc: 'NYC to Frankfurt', from: 'US/NY/Z01', to: 'DE/HE/Z30', dist: 6200, days: 2, type: 'AIR' },
      { route: 'RT0008', desc: 'Tokyo to Shanghai', from: 'JP/TK/Z40', to: 'CN/SH/Z20', dist: 1800, days: 3, type: 'SEA' },
      { route: 'RT0009', desc: 'Munich to Milan', from: 'DE/BY/Z31', to: 'IT/LM/Z32', dist: 590, days: 1, type: 'ROAD' },
      { route: 'RT0010', desc: 'Houston to Mexico City', from: 'US/TX/Z03', to: 'MX/DF/Z50', dist: 1550, days: 3, type: 'ROAD' },
    ];

    const carriers = [
      { id: 'CARR001', name: 'FastFreight Inc.' },
      { id: 'CARR002', name: 'Ocean Global Shipping' },
      { id: 'CARR003', name: 'AirExpress Logistics' },
    ];

    for (const r of routes) {
      const [fromCountry, fromRegion, fromZone] = r.from.split('/');
      const [toCountry, toRegion, toZone] = r.to.split('/');
      const carrier = r.type === 'SEA' ? carriers[1] : r.type === 'AIR' ? carriers[2] : carriers[0];
      const legs = r.type === 'SEA' ? 3 : r.type === 'AIR' ? 2 : 1;

      for (let leg = 1; leg <= legs; leg++) {
        records.push({
          ROUTE: r.route,
          BEZEI: r.desc,
          VSART: r.type,
          VSBED: r.type === 'AIR' ? '02' : '01',
          TRAESSION_ZI: String(r.days),
          DISTZ: String(r.dist),
          MEDESSION_KM: 'KM',
          AESSION_LAND1: fromCountry,
          AESSION_REGIO: fromRegion,
          AESSION_ZONE: fromZone,
          AESSION_VSTEL: '1000',
          EESSION_LAND1: toCountry,
          EESSION_REGIO: toRegion,
          EESSION_ZONE: toZone,
          TDLNR: carrier.id,
          TDLNR_NAME: carrier.name,
          SESSION_MOTY: r.type === 'ROAD' ? '01' : r.type === 'SEA' ? '02' : '03',
          LEG_IND: legs > 1 ? 'Y' : 'N',
          LEG_SEQ: String(leg),
          VIA_POINT: legs > 1 && leg < legs ? `VIA_${r.route}_${leg}` : '',
          FREIGHT_CLASS: r.type === 'AIR' ? 'EXPRESS' : 'STANDARD',
          COST_RATE: r.type === 'AIR' ? '5.50' : r.type === 'SEA' ? '0.80' : '2.20',
          COST_UNIT: 'KG',
          WAESSION_ERS: 'USD',
          TM_LANE_ID: `LANE_${r.route}`,
          TM_LANE_TYPE: r.type === 'SEA' ? 'OCEAN' : r.type === 'AIR' ? 'AIR' : 'TRUCK',
          MIGRATION_ACTION: 'MIGRATE_TO_TM',
          ACTIVE: 'X',
          VALID_FROM: '20200101',
          VALID_TO: '99991231',
        });
      }
    }

    return records; // 10 routes: 5 single-leg(road) + 3 three-leg(sea) + 2 two-leg(air) = 5 + 9 + 4 = 18
  }
}

module.exports = TransportRouteMigrationObject;
