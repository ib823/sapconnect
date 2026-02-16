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
 * Workflow Extractor
 *
 * Extracts workflow definitions and instances including templates,
 * template steps, work items, work item objects, container objects,
 * and task relationships.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class WorkflowExtractor extends BaseExtractor {
  get extractorId() { return 'WORKFLOWS'; }
  get name() { return 'Workflow Definitions & Instances'; }
  get module() { return 'BASIS'; }
  get category() { return 'process'; }

  getExpectedTables() {
    return [
      { table: 'SWP_HEADER', description: 'Workflow templates', critical: true },
      { table: 'SWP_STEP', description: 'Workflow template steps', critical: true },
      { table: 'SWWWIHEAD', description: 'Work item header data', critical: true },
      { table: 'SWW_WI2OBJ', description: 'Work item to object links', critical: false },
      { table: 'SWW_CONTOB', description: 'Container objects', critical: false },
      { table: 'SWP_TSKREL', description: 'Task relationships', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // SWP_HEADER - Workflow templates
    try {
      const data = await this._readTable('SWP_HEADER', {
        fields: ['WI_ID', 'WI_TYPE', 'WI_TEXT', 'WI_STAT', 'WI_LANG', 'WI_PRIO', 'WI_CREATOR', 'WI_CD', 'WI_CT'],
      });
      result.templates = data.rows;
    } catch (err) {
      this.logger.warn(`SWP_HEADER read failed: ${err.message}`);
      result.templates = [];
    }

    // SWP_STEP - Template steps
    try {
      const data = await this._readTable('SWP_STEP', {
        fields: ['WI_ID', 'STEP_ID', 'STEP_TYPE', 'TASK_ID', 'STEP_TEXT', 'STEP_PRIO'],
      });
      result.templateSteps = data.rows;
    } catch (err) {
      this.logger.warn(`SWP_STEP read failed: ${err.message}`);
      result.templateSteps = [];
    }

    // SWWWIHEAD - Work items
    try {
      const data = await this._readTable('SWWWIHEAD', {
        fields: ['WI_ID', 'WI_TYPE', 'WI_TEXT', 'WI_STAT', 'WI_PRIO', 'WI_CD', 'WI_CT', 'WI_AAGENT'],
        maxRows: 1000,
      });
      result.workItems = data.rows;
    } catch (err) {
      this.logger.warn(`SWWWIHEAD read failed: ${err.message}`);
      result.workItems = [];
    }

    // SWW_WI2OBJ - Work item objects
    try {
      const data = await this._readTable('SWW_WI2OBJ', {
        fields: ['WI_ID', 'CATID', 'TYPEID', 'INSTID'],
      });
      result.workItemObjects = data.rows;
    } catch (err) {
      this._trackCoverage('SWW_WI2OBJ', 'skipped', { reason: err.message });
      result.workItemObjects = [];
    }

    // SWW_CONTOB - Container objects
    try {
      const data = await this._readTable('SWW_CONTOB', {
        fields: ['WI_ID', 'ELEMENT', 'ELETYP', 'TYPEID', 'INSTID'],
      });
      result.containerObjects = data.rows;
    } catch (err) {
      this._trackCoverage('SWW_CONTOB', 'skipped', { reason: err.message });
      result.containerObjects = [];
    }

    // SWP_TSKREL - Task relationships
    try {
      const data = await this._readTable('SWP_TSKREL', {
        fields: ['TASK_ID', 'TASK_TYPE', 'WF_ID', 'REL_TYPE'],
      });
      result.taskRelationships = data.rows;
    } catch (err) {
      this._trackCoverage('SWP_TSKREL', 'skipped', { reason: err.message });
      result.taskRelationships = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/workflow-data.json');
    this._trackCoverage('SWP_HEADER', 'extracted', { rowCount: mockData.templates.length });
    this._trackCoverage('SWP_STEP', 'extracted', { rowCount: mockData.templateSteps.length });
    this._trackCoverage('SWWWIHEAD', 'extracted', { rowCount: mockData.workItems.length });
    this._trackCoverage('SWW_WI2OBJ', 'extracted', { rowCount: mockData.workItemObjects.length });
    this._trackCoverage('SWW_CONTOB', 'extracted', { rowCount: mockData.containerObjects.length });
    this._trackCoverage('SWP_TSKREL', 'extracted', { rowCount: mockData.taskRelationships.length });
    return mockData;
  }
}

WorkflowExtractor._extractorId = 'WORKFLOWS';
WorkflowExtractor._module = 'BASIS';
WorkflowExtractor._category = 'process';
ExtractorRegistry.register(WorkflowExtractor);

module.exports = WorkflowExtractor;
