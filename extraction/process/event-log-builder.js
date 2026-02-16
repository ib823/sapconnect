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
 * Event Log Builder
 *
 * Transforms change documents into structured event logs
 * for process mining. Supports standard SAP process types:
 * O2C, P2P, R2R, A2R, P2M, M2S, H2R, and custom processes.
 */

class EventLogBuilder {
  /**
   * @param {Array} changeDocs - Change document headers with items
   * @param {object} objectClassMap - TCDOB object class definitions
   */
  constructor(changeDocs, objectClassMap = {}) {
    this.headers = changeDocs.headers || [];
    this.items = changeDocs.items || [];
    this.objectClassMap = {};
    for (const oc of (changeDocs.objectClasses || [])) {
      this.objectClassMap[oc.OBJECT] = oc.OBTEXT || oc.OBJECT;
    }

    // Index items by CHANGENR for fast lookup
    this._itemIndex = new Map();
    for (const item of this.items) {
      if (!this._itemIndex.has(item.CHANGENR)) {
        this._itemIndex.set(item.CHANGENR, []);
      }
      this._itemIndex.get(item.CHANGENR).push(item);
    }
  }

  buildO2CEventLog() {
    return this._buildEventLog('Order to Cash', ['VERKBELEG', 'LIEFERUNG', 'FAKTBELEG'], {
      VA01: 'Create Sales Order', VA02: 'Change Sales Order',
      VL01N: 'Create Delivery', VL02N: 'Change Delivery',
      VF01: 'Create Billing', VF02: 'Change Billing',
    });
  }

  buildP2PEventLog() {
    return this._buildEventLog('Procure to Pay', ['EINKBELEG', 'BANF', 'MATERIAL'], {
      ME51N: 'Create Purchase Requisition', ME21N: 'Create Purchase Order',
      ME22N: 'Change Purchase Order', ME29N: 'Release Purchase Order',
      MIGO: 'Goods Receipt', MIRO: 'Invoice Receipt',
      F110: 'Payment Run',
    });
  }

  buildR2REventLog() {
    return this._buildEventLog('Record to Report', ['BKPF', 'BELEG'], {
      FB01: 'Post Document', FB02: 'Change Document',
      F101: 'Period Close', FAGL_FC: 'Foreign Currency Valuation',
    });
  }

  buildA2REventLog() {
    return this._buildEventLog('Acquire to Retire', ['ANLA'], {
      AS01: 'Create Asset', AS02: 'Change Asset',
      ABZON: 'Acquisition', AFAB: 'Depreciation Run', ABAVN: 'Retirement',
    });
  }

  buildP2MEventLog() {
    return this._buildEventLog('Plan to Manufacture', ['AUFK'], {
      CO01: 'Create Production Order', CO02: 'Change Production Order',
      CO15: 'Confirm Production', MIGO: 'Goods Receipt',
    });
  }

  buildM2SEventLog() {
    return this._buildEventLog('Maintain to Settle', ['QMIH', 'AUFK'], {
      IW21: 'Create Notification', IW31: 'Create Maintenance Order',
      IW41: 'Confirm Maintenance', KO88: 'Settlement',
    });
  }

  buildH2REventLog() {
    return this._buildEventLog('Hire to Retire', ['PREL'], {
      PA40: 'Personnel Action', PA30: 'Maintain HR Master',
    });
  }

  buildCustomEventLog(spec) {
    return this._buildEventLog(
      spec.name || 'Custom Process',
      spec.objectClasses || [],
      spec.tcodeMap || {}
    );
  }

  _buildEventLog(processName, objectClasses, tcodeMap) {
    const events = [];
    const classSet = new Set(objectClasses);

    for (const header of this.headers) {
      if (!classSet.has(header.OBJECTCLAS)) continue;

      const activity = tcodeMap[header.TCODE] || header.TCODE;
      events.push({
        caseId: header.OBJECTID,
        activity,
        timestamp: `${header.UDATE}T${header.UTIME}`,
        user: header.USERNAME,
        tcode: header.TCODE,
        objectClass: header.OBJECTCLAS,
        objectClassText: this.objectClassMap[header.OBJECTCLAS] || header.OBJECTCLAS,
        changeNumber: header.CHANGENR,
        details: this._itemIndex.get(header.CHANGENR) || [],
      });
    }

    // Sort by caseId then timestamp
    events.sort((a, b) => a.caseId.localeCompare(b.caseId) || a.timestamp.localeCompare(b.timestamp));

    // Group into cases
    const cases = new Map();
    for (const event of events) {
      if (!cases.has(event.caseId)) {
        cases.set(event.caseId, []);
      }
      cases.get(event.caseId).push(event);
    }

    return {
      processName,
      totalEvents: events.length,
      totalCases: cases.size,
      events,
      cases: Object.fromEntries(cases),
    };
  }
}

module.exports = EventLogBuilder;
