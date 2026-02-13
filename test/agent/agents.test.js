const { AGENTS, COMMAND_MAP, WORKFLOW_ORDER, getAgent, getCommands } = require('../../agent/agents');
const { TOOLS } = require('../../agent/tools');

/** All valid tool names from tools.js */
const VALID_TOOL_NAMES = TOOLS.map((t) => t.name);

const ALL_ROLES = ['planner', 'designer', 'implementer', 'tester', 'reviewer'];

const REQUIRED_AGENT_FIELDS = ['name', 'command', 'description', 'systemPrompt', 'tools'];

describe('agents', () => {
  // ---------------------------------------------------------------
  // AGENTS object
  // ---------------------------------------------------------------
  describe('AGENTS', () => {
    it('should define exactly 5 agent roles', () => {
      expect(Object.keys(AGENTS)).toHaveLength(5);
    });

    it.each(ALL_ROLES)('should include the "%s" role', (role) => {
      expect(AGENTS).toHaveProperty(role);
    });

    describe.each(ALL_ROLES)('%s agent', (role) => {
      const agent = AGENTS[role];

      it.each(REQUIRED_AGENT_FIELDS)('should have a "%s" field', (field) => {
        expect(agent).toHaveProperty(field);
      });

      it('should have a non-empty string name', () => {
        expect(typeof agent.name).toBe('string');
        expect(agent.name.length).toBeGreaterThan(0);
      });

      it('should have a non-empty string command', () => {
        expect(typeof agent.command).toBe('string');
        expect(agent.command.length).toBeGreaterThan(0);
      });

      it('should have a non-empty string description', () => {
        expect(typeof agent.description).toBe('string');
        expect(agent.description.length).toBeGreaterThan(0);
      });

      it('should have a non-empty string systemPrompt', () => {
        expect(typeof agent.systemPrompt).toBe('string');
        expect(agent.systemPrompt.length).toBeGreaterThan(0);
      });

      it('should have a non-empty tools array', () => {
        expect(Array.isArray(agent.tools)).toBe(true);
        expect(agent.tools.length).toBeGreaterThan(0);
      });

      it('should only reference valid tool names from tools.js', () => {
        for (const toolName of agent.tools) {
          expect(VALID_TOOL_NAMES).toContain(toolName);
        }
      });
    });

    it('planner should have the expected tools', () => {
      expect(AGENTS.planner.tools).toEqual([
        'read_abap_source',
        'list_objects',
        'search_repository',
        'get_data_dictionary',
      ]);
    });

    it('designer should have the expected tools', () => {
      expect(AGENTS.designer.tools).toEqual([
        'read_abap_source',
        'list_objects',
        'get_data_dictionary',
        'search_repository',
      ]);
    });

    it('implementer should have the expected tools', () => {
      expect(AGENTS.implementer.tools).toEqual([
        'read_abap_source',
        'write_abap_source',
        'activate_object',
        'run_syntax_check',
        'get_data_dictionary',
      ]);
    });

    it('tester should have the expected tools', () => {
      expect(AGENTS.tester.tools).toEqual([
        'read_abap_source',
        'write_abap_source',
        'run_unit_tests',
        'run_syntax_check',
      ]);
    });

    it('reviewer should have the expected tools', () => {
      expect(AGENTS.reviewer.tools).toEqual([
        'read_abap_source',
        'list_objects',
        'search_repository',
        'get_data_dictionary',
        'run_syntax_check',
      ]);
    });

    it('planner agent should have command "analyze"', () => {
      expect(AGENTS.planner.command).toBe('analyze');
    });

    it('designer agent should have command "design"', () => {
      expect(AGENTS.designer.command).toBe('design');
    });

    it('implementer agent should have command "generate"', () => {
      expect(AGENTS.implementer.command).toBe('generate');
    });

    it('tester agent should have command "test"', () => {
      expect(AGENTS.tester.command).toBe('test');
    });

    it('reviewer agent should have command "review"', () => {
      expect(AGENTS.reviewer.command).toBe('review');
    });
  });

  // ---------------------------------------------------------------
  // COMMAND_MAP
  // ---------------------------------------------------------------
  describe('COMMAND_MAP', () => {
    it('should have exactly 5 entries', () => {
      expect(Object.keys(COMMAND_MAP)).toHaveLength(5);
    });

    it('should map "analyze" to "planner"', () => {
      expect(COMMAND_MAP.analyze).toBe('planner');
    });

    it('should map "design" to "designer"', () => {
      expect(COMMAND_MAP.design).toBe('designer');
    });

    it('should map "generate" to "implementer"', () => {
      expect(COMMAND_MAP.generate).toBe('implementer');
    });

    it('should map "test" to "tester"', () => {
      expect(COMMAND_MAP.test).toBe('tester');
    });

    it('should map "review" to "reviewer"', () => {
      expect(COMMAND_MAP.review).toBe('reviewer');
    });

    it('should map each command to a valid role in AGENTS', () => {
      for (const [command, role] of Object.entries(COMMAND_MAP)) {
        expect(AGENTS).toHaveProperty(role);
        expect(AGENTS[role].command).toBe(command);
      }
    });
  });

  // ---------------------------------------------------------------
  // WORKFLOW_ORDER
  // ---------------------------------------------------------------
  describe('WORKFLOW_ORDER', () => {
    it('should be an array of 5 roles', () => {
      expect(Array.isArray(WORKFLOW_ORDER)).toBe(true);
      expect(WORKFLOW_ORDER).toHaveLength(5);
    });

    it('should contain all roles in correct order', () => {
      expect(WORKFLOW_ORDER).toEqual([
        'planner',
        'designer',
        'implementer',
        'tester',
        'reviewer',
      ]);
    });

    it('should reference only roles that exist in AGENTS', () => {
      for (const role of WORKFLOW_ORDER) {
        expect(AGENTS).toHaveProperty(role);
      }
    });

    it('should contain the same roles as AGENTS keys', () => {
      const agentKeys = Object.keys(AGENTS).sort();
      const workflowSorted = [...WORKFLOW_ORDER].sort();
      expect(workflowSorted).toEqual(agentKeys);
    });
  });

  // ---------------------------------------------------------------
  // getAgent()
  // ---------------------------------------------------------------
  describe('getAgent', () => {
    describe('lookup by role name', () => {
      it.each(ALL_ROLES)('should return agent for role "%s"', (role) => {
        const agent = getAgent(role);
        expect(agent).not.toBeNull();
        expect(agent.role).toBe(role);
        expect(agent.name).toBe(AGENTS[role].name);
        expect(agent.command).toBe(AGENTS[role].command);
        expect(agent.description).toBe(AGENTS[role].description);
        expect(agent.systemPrompt).toBe(AGENTS[role].systemPrompt);
        expect(agent.tools).toEqual(AGENTS[role].tools);
      });
    });

    describe('lookup by CLI command', () => {
      const commandToRole = [
        ['analyze', 'planner'],
        ['design', 'designer'],
        ['generate', 'implementer'],
        ['test', 'tester'],
        ['review', 'reviewer'],
      ];

      it.each(commandToRole)(
        'should return the %s agent for command "%s"',
        (command, expectedRole) => {
          const agent = getAgent(command);
          expect(agent).not.toBeNull();
          expect(agent.role).toBe(expectedRole);
          expect(agent.name).toBe(AGENTS[expectedRole].name);
        },
      );
    });

    describe('unknown input', () => {
      it('should return null for an unknown role name', () => {
        expect(getAgent('unknown')).toBeNull();
      });

      it('should return null for an empty string', () => {
        expect(getAgent('')).toBeNull();
      });

      it('should return null for undefined', () => {
        expect(getAgent(undefined)).toBeNull();
      });

      it('should return null for a number', () => {
        expect(getAgent(42)).toBeNull();
      });
    });

    it('should include a "role" property in the returned object', () => {
      const agent = getAgent('planner');
      expect(agent).toHaveProperty('role', 'planner');
    });

    it('should spread all agent fields into the returned object', () => {
      const agent = getAgent('planner');
      for (const field of REQUIRED_AGENT_FIELDS) {
        expect(agent).toHaveProperty(field);
      }
    });
  });

  // ---------------------------------------------------------------
  // getCommands()
  // ---------------------------------------------------------------
  describe('getCommands', () => {
    it('should return an array', () => {
      expect(Array.isArray(getCommands())).toBe(true);
    });

    it('should return exactly 5 commands', () => {
      expect(getCommands()).toHaveLength(5);
    });

    it('should return all CLI commands', () => {
      const commands = getCommands();
      expect(commands).toContain('analyze');
      expect(commands).toContain('design');
      expect(commands).toContain('generate');
      expect(commands).toContain('test');
      expect(commands).toContain('review');
    });

    it('should return the keys of COMMAND_MAP', () => {
      expect(getCommands()).toEqual(Object.keys(COMMAND_MAP));
    });

    it('should return a new array on each call', () => {
      const a = getCommands();
      const b = getCommands();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });
});
