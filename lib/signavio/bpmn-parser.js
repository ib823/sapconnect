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
'use strict';

const Logger = require('../logger');

/**
 * BPMN 2.0 XML Parser
 *
 * Parses BPMN 2.0 XML using regex/string parsing (no xml2js dependency).
 * Extracts processes, tasks, gateways, events, sequence flows, lanes,
 * and provides analysis methods for SAP implementation workflows.
 */

const log = new Logger('bpmn-parser', { level: 'warn' });

// ── SAP keyword patterns for task filtering ────────────────────────

const SAP_KEYWORDS = [
  'bapi', 'rfc', 'config', 'transport', 'customizing', 'img', 'spro',
  'tcode', 'transaction', 'posting', 'master data', 'material', 'vendor',
  'customer', 'gl', 'fi', 'co', 'mm', 'sd', 'pp', 'hr',
];

const SAP_KEYWORD_REGEX = new RegExp(
  SAP_KEYWORDS.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// ── Task type tags ──────────────────────────────────────────────────

const TASK_TYPES = [
  'userTask', 'serviceTask', 'scriptTask', 'manualTask',
  'sendTask', 'receiveTask', 'task',
];

const GATEWAY_TYPES = [
  'exclusiveGateway', 'parallelGateway', 'inclusiveGateway', 'eventBasedGateway',
];

const EVENT_TYPES = [
  'startEvent', 'endEvent', 'intermediateThrowEvent', 'intermediateCatchEvent',
];

// ── Transaction code mappings for config steps ──────────────────────

const TCODE_MAP = {
  'sales order': 'VA01',
  'purchase order': 'ME21N',
  'delivery': 'VL01N',
  'goods issue': 'MIGO',
  'goods receipt': 'MIGO',
  'invoice': 'VF01',
  'billing': 'VF01',
  'payment': 'F110',
  'journal entry': 'FB50',
  'material master': 'MM01',
  'vendor master': 'XK01',
  'customer master': 'XD01',
  'cost center': 'KS01',
  'profit center': 'KE51',
  'gl account': 'FS00',
  'customizing': 'SPRO',
  'transport': 'SE09',
  'config': 'SPRO',
};

const BAPI_MAP = {
  'sales order': 'BAPI_SALESORDER_CREATEFROMDAT2',
  'purchase order': 'BAPI_PO_CREATE1',
  'goods issue': 'BAPI_GOODSMVT_CREATE',
  'goods receipt': 'BAPI_GOODSMVT_CREATE',
  'material master': 'BAPI_MATERIAL_SAVEDATA',
  'vendor master': 'BAPI_VENDOR_CREATE',
  'customer master': 'BAPI_CUSTOMER_CREATEFROMDATA1',
  'payment': 'BAPI_ACC_DOCUMENT_POST',
  'journal entry': 'BAPI_ACC_DOCUMENT_POST',
  'invoice': 'BAPI_BILLINGDOC_CREATEMULTIPLE',
  'delivery': 'BAPI_OUTB_DELIVERY_CREATE_SLS',
};

class BpmnParser {
  /**
   * Parse BPMN 2.0 XML into a structured representation.
   * @param {string} bpmnXml - BPMN 2.0 XML string
   * @returns {{ processes: Array, collaborations: Array, messageFlows: Array }}
   */
  static parse(bpmnXml) {
    if (!bpmnXml || typeof bpmnXml !== 'string') {
      return { processes: [], collaborations: [], messageFlows: [] };
    }

    const processes = BpmnParser._extractProcesses(bpmnXml);
    const collaborations = BpmnParser._extractCollaborations(bpmnXml);
    const messageFlows = BpmnParser._extractMessageFlows(bpmnXml);

    log.debug('Parsed BPMN', {
      processCount: processes.length,
      collaborationCount: collaborations.length,
      messageFlowCount: messageFlows.length,
    });

    return { processes, collaborations, messageFlows };
  }

  /**
   * Get ordered execution flow starting from startEvent.
   * Follows sequenceFlows, recording gateway branches.
   * @param {{ processes: Array }} parsed - Output from parse()
   * @returns {Array<{ element: object, type: string, branches?: Array }>}
   */
  static getProcessFlow(parsed) {
    if (!parsed || !parsed.processes || parsed.processes.length === 0) {
      return [];
    }

    const process = parsed.processes[0];
    const allElements = BpmnParser._buildElementMap(process);
    const flowMap = BpmnParser._buildFlowMap(process.sequenceFlows);

    const startEvents = process.events.filter(e => e.type === 'startEvent');
    if (startEvents.length === 0) {
      return [];
    }

    const steps = [];
    const visited = new Set();

    const traverse = (elementId) => {
      if (!elementId || visited.has(elementId)) return;
      visited.add(elementId);

      const element = allElements.get(elementId);
      if (!element) return;

      const isGateway = GATEWAY_TYPES.includes(element.type);
      const step = { element, type: element.type };

      if (isGateway) {
        const outgoing = flowMap.get(elementId) || [];
        if (outgoing.length > 1) {
          step.branches = outgoing.map(flow => {
            const branchSteps = [];
            const branchVisited = new Set(visited);
            const collectBranch = (nodeId) => {
              if (!nodeId || branchVisited.has(nodeId)) return;
              branchVisited.add(nodeId);
              const node = allElements.get(nodeId);
              if (!node) return;
              branchSteps.push({ element: node, type: node.type });
              const nextFlows = flowMap.get(nodeId) || [];
              for (const nf of nextFlows) {
                collectBranch(nf.targetRef);
              }
            };
            collectBranch(flow.targetRef);
            return { name: flow.name || '', steps: branchSteps };
          });
        }
      }

      steps.push(step);

      const outgoing = flowMap.get(elementId) || [];
      for (const flow of outgoing) {
        traverse(flow.targetRef);
      }
    };

    traverse(startEvents[0].id);
    return steps;
  }

  /**
   * Get task dependency graph (which tasks must complete before others).
   * @param {{ processes: Array }} parsed - Output from parse()
   * @returns {object} Map of taskId -> [prerequisiteTaskIds]
   */
  static getTaskDependencies(parsed) {
    if (!parsed || !parsed.processes || parsed.processes.length === 0) {
      return {};
    }

    const process = parsed.processes[0];
    const taskIds = new Set(process.tasks.map(t => t.id));
    const deps = {};

    for (const task of process.tasks) {
      deps[task.id] = [];
    }

    // Build a reverse-reachability map: for each task, find which tasks
    // directly precede it through any number of intermediate elements.
    const reverseFlowMap = {};
    for (const flow of process.sequenceFlows) {
      if (!reverseFlowMap[flow.targetRef]) {
        reverseFlowMap[flow.targetRef] = [];
      }
      reverseFlowMap[flow.targetRef].push(flow.sourceRef);
    }

    const forwardFlowMap = {};
    for (const flow of process.sequenceFlows) {
      if (!forwardFlowMap[flow.sourceRef]) {
        forwardFlowMap[flow.sourceRef] = [];
      }
      forwardFlowMap[flow.sourceRef].push(flow.targetRef);
    }

    for (const task of process.tasks) {
      const prereqs = new Set();
      const visited = new Set();
      const queue = [...(reverseFlowMap[task.id] || [])];

      while (queue.length > 0) {
        const nodeId = queue.shift();
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        if (taskIds.has(nodeId)) {
          prereqs.add(nodeId);
        } else {
          // traverse through gateways and events
          const predecessors = reverseFlowMap[nodeId] || [];
          queue.push(...predecessors);
        }
      }

      deps[task.id] = [...prereqs];
    }

    return deps;
  }

  /**
   * Filter tasks whose names contain SAP-relevant keywords.
   * Keywords: BAPI, RFC, config, transport, customizing, IMG, SPRO,
   * tcode, transaction, posting, master data, material, vendor, customer,
   * GL, FI, CO, MM, SD, PP, HR
   * @param {{ processes: Array }} parsed - Output from parse()
   * @returns {Array<object>} SAP-relevant tasks
   */
  static getSapRelevantTasks(parsed) {
    if (!parsed || !parsed.processes || parsed.processes.length === 0) {
      return [];
    }

    const allTasks = [];
    for (const process of parsed.processes) {
      for (const task of process.tasks) {
        const nameToCheck = (task.name || '').toLowerCase();
        if (SAP_KEYWORD_REGEX.test(nameToCheck)) {
          allTasks.push(task);
        }
      }
    }

    return allTasks;
  }

  /**
   * Map BPMN tasks to SAP configuration activity steps.
   * @param {{ processes: Array }} parsed - Output from parse()
   * @returns {Array<{ step: number, activity: string, transaction?: string, bapi?: string, configPath?: string }>}
   */
  static toConfigurationSteps(parsed) {
    if (!parsed || !parsed.processes || parsed.processes.length === 0) {
      return [];
    }

    const steps = [];
    let stepNum = 0;

    for (const process of parsed.processes) {
      for (const task of process.tasks) {
        stepNum++;
        const name = (task.name || '').toLowerCase();
        const step = {
          step: stepNum,
          activity: task.name || `Task ${task.id}`,
        };

        // Match transaction codes
        for (const [keyword, tcode] of Object.entries(TCODE_MAP)) {
          if (name.includes(keyword)) {
            step.transaction = tcode;
            break;
          }
        }

        // Match BAPIs
        for (const [keyword, bapi] of Object.entries(BAPI_MAP)) {
          if (name.includes(keyword)) {
            step.bapi = bapi;
            break;
          }
        }

        // Extract explicit tcode from parentheses, e.g., "Create Sales Order (VA01)"
        const tcodeMatch = (task.name || '').match(/\(([A-Z]{2,4}\d{1,3}[A-Z]?)\)/);
        if (tcodeMatch) {
          step.transaction = tcodeMatch[1];
        }

        // Extract explicit BAPI/RFC from name
        const bapiMatch = (task.name || '').match(/\((BAPI_[A-Z_]+)\)/i);
        if (bapiMatch) {
          step.bapi = bapiMatch[1].toUpperCase();
        }

        const rfcMatch = (task.name || '').match(/\((RFC[A-Z_]*)\)/i);
        if (rfcMatch && !bapiMatch) {
          step.bapi = rfcMatch[1].toUpperCase();
        }

        // Config path for customizing tasks
        if (name.includes('config') || name.includes('customizing') || name.includes('img') || name.includes('spro')) {
          step.configPath = `SPRO > ${task.name || 'Configuration'}`;
        }

        steps.push(step);
      }
    }

    return steps;
  }

  /**
   * Calculate process complexity metrics.
   * @param {{ processes: Array }} parsed - Output from parse()
   * @returns {{ taskCount: number, gatewayCount: number, cycleCount: number, nestingDepth: number, complexityScore: number }}
   */
  static getProcessComplexity(parsed) {
    if (!parsed || !parsed.processes || parsed.processes.length === 0) {
      return { taskCount: 0, gatewayCount: 0, cycleCount: 0, nestingDepth: 0, complexityScore: 0 };
    }

    let taskCount = 0;
    let gatewayCount = 0;
    let cycleCount = 0;
    let nestingDepth = 0;

    for (const process of parsed.processes) {
      taskCount += process.tasks.length;
      gatewayCount += process.gateways.length;

      // Detect cycles: build adjacency list and look for back edges via DFS
      const adj = {};
      for (const flow of process.sequenceFlows) {
        if (!adj[flow.sourceRef]) adj[flow.sourceRef] = [];
        adj[flow.sourceRef].push(flow.targetRef);
      }

      const WHITE = 0, GRAY = 1, BLACK = 2;
      const color = {};
      const allNodes = new Set();
      for (const flow of process.sequenceFlows) {
        allNodes.add(flow.sourceRef);
        allNodes.add(flow.targetRef);
      }
      for (const nodeId of allNodes) {
        color[nodeId] = WHITE;
      }

      const dfs = (nodeId) => {
        color[nodeId] = GRAY;
        for (const neighbor of (adj[nodeId] || [])) {
          if (color[neighbor] === GRAY) {
            cycleCount++;
          } else if (color[neighbor] === WHITE) {
            dfs(neighbor);
          }
        }
        color[nodeId] = BLACK;
      };

      for (const nodeId of allNodes) {
        if (color[nodeId] === WHITE) {
          dfs(nodeId);
        }
      }

      // Nesting depth: count max depth of nested gateways
      // (gateways within the span of other gateways)
      const gatewayIds = new Set(process.gateways.map(g => g.id));
      let currentDepth = 0;
      let maxDepth = 0;
      const gwVisited = new Set();

      const measureDepth = (nodeId) => {
        if (!nodeId || gwVisited.has(nodeId)) return;
        gwVisited.add(nodeId);

        if (gatewayIds.has(nodeId)) {
          currentDepth++;
          if (currentDepth > maxDepth) maxDepth = currentDepth;
        }

        for (const neighbor of (adj[nodeId] || [])) {
          measureDepth(neighbor);
        }

        if (gatewayIds.has(nodeId)) {
          currentDepth--;
        }
      };

      const startEvents = process.events.filter(e => e.type === 'startEvent');
      for (const se of startEvents) {
        measureDepth(se.id);
      }

      nestingDepth = Math.max(nestingDepth, maxDepth);
    }

    const complexityScore = taskCount + (gatewayCount * 2) + (cycleCount * 5) + (nestingDepth * 3);

    return { taskCount, gatewayCount, cycleCount, nestingDepth, complexityScore };
  }

  // ── Internal Extraction Methods ─────────────────────────────────────

  static _extractProcesses(xml) {
    const processes = [];
    // Match <bpmn:process> or <process> blocks
    const processRegex = /<(?:bpmn:)?process\s([^>]*)>([\s\S]*?)<\/(?:bpmn:)?process>/g;
    let match;

    while ((match = processRegex.exec(xml)) !== null) {
      const attrs = match[1];
      const content = match[2];
      const id = BpmnParser._extractAttr(attrs, 'id');
      const name = BpmnParser._extractAttr(attrs, 'name');

      const tasks = BpmnParser._extractElements(content, TASK_TYPES);
      const gateways = BpmnParser._extractElements(content, GATEWAY_TYPES);
      const events = BpmnParser._extractElements(content, EVENT_TYPES);
      const sequenceFlows = BpmnParser._extractSequenceFlows(content);
      const lanes = BpmnParser._extractLanes(content);

      processes.push({ id, name, tasks, gateways, events, sequenceFlows, lanes });
    }

    return processes;
  }

  static _extractElements(xml, types) {
    const elements = [];
    for (const type of types) {
      // Match self-closing and content-bearing tags
      const regex = new RegExp(
        `<(?:bpmn:)?${type}\\s([^>]*?)(?:/>|>(.*?)<\\/(?:bpmn:)?${type}>)`,
        'gs'
      );
      let match;
      while ((match = regex.exec(xml)) !== null) {
        const attrs = match[1];
        elements.push({
          id: BpmnParser._extractAttr(attrs, 'id') || '',
          name: BpmnParser._extractAttr(attrs, 'name') || '',
          type,
        });
      }
    }
    return elements;
  }

  static _extractSequenceFlows(xml) {
    const flows = [];
    const regex = /<(?:bpmn:)?sequenceFlow\s([^>]*?)(?:\/?>)/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const attrs = match[1];
      flows.push({
        id: BpmnParser._extractAttr(attrs, 'id') || '',
        name: BpmnParser._extractAttr(attrs, 'name') || '',
        sourceRef: BpmnParser._extractAttr(attrs, 'sourceRef') || '',
        targetRef: BpmnParser._extractAttr(attrs, 'targetRef') || '',
      });
    }
    return flows;
  }

  static _extractLanes(xml) {
    const lanes = [];
    // Match lane elements with their content (including flowNodeRef children)
    const laneRegex = /<(?:bpmn:)?lane\s([^>]*?)>([\s\S]*?)<\/(?:bpmn:)?lane>/g;
    let match;
    while ((match = laneRegex.exec(xml)) !== null) {
      const attrs = match[1];
      const content = match[2];

      const flowNodeRefs = [];
      const refRegex = /<(?:bpmn:)?flowNodeRef>(.*?)<\/(?:bpmn:)?flowNodeRef>/g;
      let refMatch;
      while ((refMatch = refRegex.exec(content)) !== null) {
        flowNodeRefs.push(refMatch[1].trim());
      }

      lanes.push({
        id: BpmnParser._extractAttr(attrs, 'id') || '',
        name: BpmnParser._extractAttr(attrs, 'name') || '',
        flowNodeRef: flowNodeRefs,
      });
    }
    return lanes;
  }

  static _extractCollaborations(xml) {
    const collaborations = [];
    const regex = /<(?:bpmn:)?collaboration\s([^>]*?)(?:>([\s\S]*?)<\/(?:bpmn:)?collaboration>|\/?>)/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const attrs = match[1];
      const content = match[2] || '';
      const participants = [];

      const partRegex = /<(?:bpmn:)?participant\s([^>]*?)(?:\/?>)/g;
      let partMatch;
      while ((partMatch = partRegex.exec(content)) !== null) {
        const partAttrs = partMatch[1];
        participants.push({
          id: BpmnParser._extractAttr(partAttrs, 'id') || '',
          name: BpmnParser._extractAttr(partAttrs, 'name') || '',
          processRef: BpmnParser._extractAttr(partAttrs, 'processRef') || '',
        });
      }

      collaborations.push({
        id: BpmnParser._extractAttr(attrs, 'id') || '',
        participants,
      });
    }
    return collaborations;
  }

  static _extractMessageFlows(xml) {
    const flows = [];
    const regex = /<(?:bpmn:)?messageFlow\s([^>]*?)(?:\/?>)/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const attrs = match[1];
      flows.push({
        id: BpmnParser._extractAttr(attrs, 'id') || '',
        name: BpmnParser._extractAttr(attrs, 'name') || '',
        sourceRef: BpmnParser._extractAttr(attrs, 'sourceRef') || '',
        targetRef: BpmnParser._extractAttr(attrs, 'targetRef') || '',
      });
    }
    return flows;
  }

  // ── Helper: Build element map and flow map ────────────────────────

  static _buildElementMap(process) {
    const map = new Map();
    for (const task of process.tasks) {
      map.set(task.id, task);
    }
    for (const gw of process.gateways) {
      map.set(gw.id, gw);
    }
    for (const evt of process.events) {
      map.set(evt.id, evt);
    }
    return map;
  }

  static _buildFlowMap(sequenceFlows) {
    const map = new Map();
    for (const flow of sequenceFlows) {
      if (!map.has(flow.sourceRef)) {
        map.set(flow.sourceRef, []);
      }
      map.get(flow.sourceRef).push(flow);
    }
    return map;
  }

  // ── Helper: Extract XML attribute value ───────────────────────────

  static _extractAttr(attrString, attrName) {
    const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
    const match = attrString.match(regex);
    return match ? match[1] : '';
  }
}

// ── Static MOCK_BPMN_XML Property ──────────────────────────────────

BpmnParser.MOCK_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_O2C"
                  targetNamespace="http://example.com/sapconnect">
  <bpmn:collaboration id="Collab_O2C">
    <bpmn:participant id="Participant_O2C" name="Order-to-Cash" processRef="Process_O2C"/>
  </bpmn:collaboration>
  <bpmn:process id="Process_O2C" name="Order-to-Cash Process" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Sales" name="Sales Department">
        <bpmn:flowNodeRef>Start_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CreateSO</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>GW_CreditCheck</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CheckAvail</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="Start_1" name="Customer Order Received"/>
    <bpmn:userTask id="Task_CreateSO" name="Create Sales Order (VA01)"/>
    <bpmn:exclusiveGateway id="GW_CreditCheck" name="Credit Check Passed?"/>
    <bpmn:serviceTask id="Task_CheckAvail" name="Check Availability (RFC)"/>
    <bpmn:userTask id="Task_CreateDel" name="Create Delivery"/>
    <bpmn:serviceTask id="Task_GoodsIssue" name="Post Goods Issue (BAPI)"/>
    <bpmn:userTask id="Task_CreateInv" name="Create Invoice"/>
    <bpmn:endEvent id="End_1" name="Order Fulfilled"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_CreateSO"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_CreateSO" targetRef="GW_CreditCheck"/>
    <bpmn:sequenceFlow id="Flow_3" name="Approved" sourceRef="GW_CreditCheck" targetRef="Task_CheckAvail"/>
    <bpmn:sequenceFlow id="Flow_4" name="Rejected" sourceRef="GW_CreditCheck" targetRef="End_1"/>
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_CheckAvail" targetRef="Task_CreateDel"/>
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_CreateDel" targetRef="Task_GoodsIssue"/>
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_GoodsIssue" targetRef="Task_CreateInv"/>
    <bpmn:sequenceFlow id="Flow_8" sourceRef="Task_CreateInv" targetRef="End_1"/>
  </bpmn:process>
</bpmn:definitions>`;

module.exports = BpmnParser;
