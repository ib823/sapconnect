const { Orchestrator, AgentResult } = require('../../agent/orchestrator');

describe('Orchestrator', () => {
  describe('mock mode', () => {
    it('should default to mock mode without API key', () => {
      const orch = new Orchestrator();
      expect(orch.mode).toBe('mock');
    });

    it('should run single agent', async () => {
      const orch = new Orchestrator();
      const result = await orch.run('analyze', 'Create a test report');
      expect(result).toBeInstanceOf(AgentResult);
      expect(result.role).toBe('planner');
    });

    it('should run full workflow', async () => {
      const orch = new Orchestrator();
      const results = await orch.run('workflow', 'Build customer report');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(5);
      const roles = results.map((r) => r.role);
      expect(roles).toContain('planner');
      expect(roles).toContain('designer');
      expect(roles).toContain('implementer');
      expect(roles).toContain('tester');
      expect(roles).toContain('reviewer');
    });

    it('should throw for unknown command', async () => {
      const orch = new Orchestrator();
      await expect(orch.run('unknown', 'test')).rejects.toThrow('Unknown agent command');
    });
  });

  describe('AgentResult', () => {
    it('should format to terminal', () => {
      const result = new AgentResult({
        role: 'tester',
        title: 'Test Output',
        sections: [{ heading: 'Results', content: 'All tests pass' }],
      });
      const output = result.toTerminal();
      expect(output).toContain('Test Output');
      expect(output).toContain('TESTER');
    });

    it('should format to markdown', () => {
      const result = new AgentResult({
        role: 'tester',
        title: 'Test Output',
        sections: [{ heading: 'Results', content: 'All tests pass' }],
      });
      const output = result.toMarkdown();
      expect(output).toContain('## Test Output');
      expect(output).toContain('### Results');
    });
  });
});
