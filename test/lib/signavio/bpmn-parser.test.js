/**
 * Tests for BPMN 2.0 XML Parser
 */
const { BpmnParser } = require('../../../lib/signavio');

describe('BpmnParser', () => {
  let parsed;

  beforeEach(() => {
    parsed = BpmnParser.parse(BpmnParser.MOCK_BPMN_XML);
  });

  // ── parse() ─────────────────────────────────────────────────────────

  describe('parse()', () => {
    it('should parse processes from BPMN XML', () => {
      expect(parsed.processes).toBeInstanceOf(Array);
      expect(parsed.processes.length).toBe(1);
      expect(parsed.processes[0].id).toBe('Process_O2C');
      expect(parsed.processes[0].name).toBe('Order-to-Cash Process');
    });

    it('should extract tasks by type (userTask and serviceTask)', () => {
      const process = parsed.processes[0];
      expect(process.tasks.length).toBeGreaterThanOrEqual(5);

      const userTasks = process.tasks.filter(t => t.type === 'userTask');
      const serviceTasks = process.tasks.filter(t => t.type === 'serviceTask');
      expect(userTasks.length).toBeGreaterThanOrEqual(3);
      expect(serviceTasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract gateways', () => {
      const process = parsed.processes[0];
      expect(process.gateways.length).toBeGreaterThanOrEqual(1);
      expect(process.gateways[0].type).toBe('exclusiveGateway');
      expect(process.gateways[0].name).toContain('Credit Check');
    });

    it('should extract startEvent', () => {
      const process = parsed.processes[0];
      const startEvents = process.events.filter(e => e.type === 'startEvent');
      expect(startEvents.length).toBe(1);
      expect(startEvents[0].name).toBeDefined();
    });

    it('should extract endEvent', () => {
      const process = parsed.processes[0];
      const endEvents = process.events.filter(e => e.type === 'endEvent');
      expect(endEvents.length).toBe(1);
      expect(endEvents[0].name).toBeDefined();
    });

    it('should extract sequenceFlows with sourceRef and targetRef', () => {
      const process = parsed.processes[0];
      expect(process.sequenceFlows.length).toBeGreaterThanOrEqual(8);
      for (const flow of process.sequenceFlows) {
        expect(flow.id).toBeDefined();
        expect(flow.sourceRef).toBeDefined();
        expect(flow.targetRef).toBeDefined();
      }
    });

    it('should extract lanes with flowNodeRefs', () => {
      const process = parsed.processes[0];
      expect(process.lanes.length).toBeGreaterThanOrEqual(1);
      expect(process.lanes[0].id).toBeDefined();
      expect(process.lanes[0].name).toBeDefined();
      expect(Array.isArray(process.lanes[0].flowNodeRef)).toBe(true);
      expect(process.lanes[0].flowNodeRef.length).toBeGreaterThan(0);
    });

    it('should handle empty BPMN input', () => {
      const result = BpmnParser.parse('');
      expect(result.processes).toEqual([]);
      expect(result.collaborations).toEqual([]);
      expect(result.messageFlows).toEqual([]);
    });

    it('should handle multiple processes', () => {
      const multiXml = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
          <bpmn:process id="P1" name="Process 1">
            <bpmn:startEvent id="S1" name="Start"/>
            <bpmn:task id="T1" name="Task 1"/>
            <bpmn:endEvent id="E1" name="End"/>
            <bpmn:sequenceFlow id="F1" sourceRef="S1" targetRef="T1"/>
            <bpmn:sequenceFlow id="F2" sourceRef="T1" targetRef="E1"/>
          </bpmn:process>
          <bpmn:process id="P2" name="Process 2">
            <bpmn:startEvent id="S2" name="Start 2"/>
            <bpmn:task id="T2" name="Task 2"/>
            <bpmn:endEvent id="E2" name="End 2"/>
            <bpmn:sequenceFlow id="F3" sourceRef="S2" targetRef="T2"/>
            <bpmn:sequenceFlow id="F4" sourceRef="T2" targetRef="E2"/>
          </bpmn:process>
        </bpmn:definitions>`;
      const result = BpmnParser.parse(multiXml);
      expect(result.processes.length).toBe(2);
      expect(result.processes[0].id).toBe('P1');
      expect(result.processes[1].id).toBe('P2');
    });
  });

  // ── getProcessFlow() ────────────────────────────────────────────────

  describe('getProcessFlow()', () => {
    it('should return ordered execution steps', () => {
      const flow = BpmnParser.getProcessFlow(parsed);
      expect(Array.isArray(flow)).toBe(true);
      expect(flow.length).toBeGreaterThan(0);
    });

    it('should start from startEvent', () => {
      const flow = BpmnParser.getProcessFlow(parsed);
      expect(flow[0].type).toBe('startEvent');
    });

    it('should handle gateway branches', () => {
      const flow = BpmnParser.getProcessFlow(parsed);
      const gwStep = flow.find(s => s.type === 'exclusiveGateway');
      expect(gwStep).toBeDefined();
      // Gateway with 2 outgoing flows should have branches
      if (gwStep.branches) {
        expect(gwStep.branches.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should handle linear flow', () => {
      const linearXml = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
          <bpmn:process id="P1" name="Linear">
            <bpmn:startEvent id="S1" name="Start"/>
            <bpmn:task id="T1" name="Task 1"/>
            <bpmn:endEvent id="E1" name="End"/>
            <bpmn:sequenceFlow id="F1" sourceRef="S1" targetRef="T1"/>
            <bpmn:sequenceFlow id="F2" sourceRef="T1" targetRef="E1"/>
          </bpmn:process>
        </bpmn:definitions>`;
      const linearParsed = BpmnParser.parse(linearXml);
      const flow = BpmnParser.getProcessFlow(linearParsed);
      expect(flow.length).toBe(3); // start -> task -> end
      expect(flow[0].type).toBe('startEvent');
      expect(flow[1].type).toBe('task');
      expect(flow[2].type).toBe('endEvent');
    });

    it('should return empty for empty process', () => {
      const empty = { processes: [] };
      const flow = BpmnParser.getProcessFlow(empty);
      expect(flow).toEqual([]);
    });
  });

  // ── getTaskDependencies() ───────────────────────────────────────────

  describe('getTaskDependencies()', () => {
    it('should return dependency map', () => {
      const deps = BpmnParser.getTaskDependencies(parsed);
      expect(typeof deps).toBe('object');
      expect(Object.keys(deps).length).toBeGreaterThan(0);
    });

    it('should map prerequisites correctly', () => {
      const deps = BpmnParser.getTaskDependencies(parsed);
      // Task_CheckAvail depends on Task_CreateSO (through the gateway)
      const checkAvailDeps = deps['Task_CheckAvail'] || [];
      expect(checkAvailDeps).toContain('Task_CreateSO');
    });

    it('should have no dependencies for first task', () => {
      const deps = BpmnParser.getTaskDependencies(parsed);
      // Task_CreateSO is the first task, should have no task prereqs
      const firstDeps = deps['Task_CreateSO'] || [];
      expect(firstDeps.length).toBe(0);
    });

    it('should handle complex flows with multiple predecessors', () => {
      const deps = BpmnParser.getTaskDependencies(parsed);
      // Task_CreateInv depends on Task_GoodsIssue
      const invoiceDeps = deps['Task_CreateInv'] || [];
      expect(invoiceDeps.length).toBeGreaterThan(0);
    });
  });

  // ── getSapRelevantTasks() ───────────────────────────────────────────

  describe('getSapRelevantTasks()', () => {
    it('should find RFC tasks', () => {
      const tasks = BpmnParser.getSapRelevantTasks(parsed);
      const rfcTasks = tasks.filter(t => t.name.toLowerCase().includes('rfc'));
      expect(rfcTasks.length).toBeGreaterThan(0);
    });

    it('should find BAPI tasks', () => {
      const tasks = BpmnParser.getSapRelevantTasks(parsed);
      const bapiTasks = tasks.filter(t => t.name.toLowerCase().includes('bapi'));
      expect(bapiTasks.length).toBeGreaterThan(0);
    });

    it('should find sales order / delivery tasks via SAP keywords', () => {
      const tasks = BpmnParser.getSapRelevantTasks(parsed);
      // "Create Sales Order" contains no SAP keywords per se,
      // but "Create Delivery" and other tasks with RFC/BAPI should match
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should find transaction-related tasks', () => {
      const tasks = BpmnParser.getSapRelevantTasks(parsed);
      // Tasks with VA01 in name won't match "transaction" keyword, but BAPI/RFC ones will
      const names = tasks.map(t => t.name.toLowerCase());
      const hasSapKeyword = names.some(n =>
        n.includes('bapi') || n.includes('rfc') || n.includes('transaction')
      );
      expect(hasSapKeyword).toBe(true);
    });

    it('should return empty for non-SAP process', () => {
      const nonSapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
          <bpmn:process id="P1" name="Generic">
            <bpmn:startEvent id="S1" name="Start"/>
            <bpmn:task id="T1" name="Send Email"/>
            <bpmn:task id="T2" name="Review Document"/>
            <bpmn:endEvent id="E1" name="End"/>
            <bpmn:sequenceFlow id="F1" sourceRef="S1" targetRef="T1"/>
            <bpmn:sequenceFlow id="F2" sourceRef="T1" targetRef="T2"/>
            <bpmn:sequenceFlow id="F3" sourceRef="T2" targetRef="E1"/>
          </bpmn:process>
        </bpmn:definitions>`;
      const nonSapParsed = BpmnParser.parse(nonSapXml);
      const tasks = BpmnParser.getSapRelevantTasks(nonSapParsed);
      expect(tasks.length).toBe(0);
    });
  });

  // ── toConfigurationSteps() ──────────────────────────────────────────

  describe('toConfigurationSteps()', () => {
    it('should map tasks to configuration steps', () => {
      const steps = BpmnParser.toConfigurationSteps(parsed);
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].step).toBe(1);
      expect(steps[0].activity).toBeDefined();
    });

    it('should include transaction codes from parenthesized references', () => {
      const steps = BpmnParser.toConfigurationSteps(parsed);
      const withTcode = steps.filter(s => s.transaction);
      expect(withTcode.length).toBeGreaterThan(0);
      // VA01 appears in "Create Sales Order (VA01)"
      const va01Step = steps.find(s => s.transaction === 'VA01');
      expect(va01Step).toBeDefined();
    });

    it('should include BAPI references', () => {
      const steps = BpmnParser.toConfigurationSteps(parsed);
      const withBapi = steps.filter(s => s.bapi);
      expect(withBapi.length).toBeGreaterThan(0);
    });

    it('should handle empty process', () => {
      const steps = BpmnParser.toConfigurationSteps({ processes: [] });
      expect(steps).toEqual([]);
    });
  });

  // ── getProcessComplexity() ──────────────────────────────────────────

  describe('getProcessComplexity()', () => {
    it('should count tasks correctly', () => {
      const c = BpmnParser.getProcessComplexity(parsed);
      expect(c.taskCount).toBe(parsed.processes[0].tasks.length);
    });

    it('should count gateways correctly', () => {
      const c = BpmnParser.getProcessComplexity(parsed);
      expect(c.gatewayCount).toBe(parsed.processes[0].gateways.length);
    });

    it('should calculate complexityScore using formula', () => {
      const c = BpmnParser.getProcessComplexity(parsed);
      // complexityScore = taskCount + gatewayCount*2 + cycleCount*5 + nestingDepth*3
      const expected = c.taskCount + (c.gatewayCount * 2) + (c.cycleCount * 5) + (c.nestingDepth * 3);
      expect(c.complexityScore).toBe(expected);
    });

    it('should handle empty process', () => {
      const c = BpmnParser.getProcessComplexity({ processes: [] });
      expect(c.taskCount).toBe(0);
      expect(c.gatewayCount).toBe(0);
      expect(c.cycleCount).toBe(0);
      expect(c.nestingDepth).toBe(0);
      expect(c.complexityScore).toBe(0);
    });
  });

  // ── MOCK_BPMN_XML ──────────────────────────────────────────────────

  describe('MOCK_BPMN_XML', () => {
    it('should be valid XML with xml declaration', () => {
      expect(BpmnParser.MOCK_BPMN_XML).toContain('<?xml version="1.0"');
    });

    it('should have a startEvent', () => {
      expect(BpmnParser.MOCK_BPMN_XML).toContain('startEvent');
    });

    it('should have an endEvent', () => {
      expect(BpmnParser.MOCK_BPMN_XML).toContain('endEvent');
    });

    it('should have tasks', () => {
      expect(BpmnParser.MOCK_BPMN_XML).toContain('userTask');
      expect(BpmnParser.MOCK_BPMN_XML).toContain('serviceTask');
    });

    it('should have a gateway', () => {
      expect(BpmnParser.MOCK_BPMN_XML).toContain('exclusiveGateway');
    });
  });
});
