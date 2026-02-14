# SAP AI Agent

Multi-agent ABAP development assistant powered by AI. Analyzes requirements, designs solutions, generates code, runs tests, and reviews implementations — all following SAP Clean Core principles.

## Quick Start

```bash
# Full 5-stage workflow (mock mode, no API key needed)
npm run agent -- workflow "Add a custom vendor rating field to purchase orders"

# Single agent stage
npm run agent -- analyze "Add vendor rating to purchase orders"

# Markdown output
npm run agent -- workflow "Add vendor rating" --format md
```

## Agent Roles

| Stage | Command | Agent | Description |
|-------|---------|-------|-------------|
| 1 | `analyze` | Planner | Scope analysis, affected objects, risk assessment |
| 2 | `design` | Designer | Data model, class design, error handling strategy |
| 3 | `generate` | Implementer | ABAP source code generation and activation |
| 4 | `test` | Tester | Unit test creation, execution, coverage reporting |
| 5 | `review` | Reviewer | Code review, Clean Core compliance, verdict |

## Architecture

```
agent.js           CLI entry point (parses args, dispatches commands)
  │
  ├── orchestrator.js  Sequences agents, manages context passing
  │     │
  │     ├── agents.js      Role definitions + system prompts
  │     └── tools.js       Tool definitions for AI function calling
  │           │
  │           └── sap-gateway.js   SAP abstraction (mock / vsp / live)
  │                 │
  │                 ├── mock-responses.json   Simulated SAP data
  │                 └── vsp (CLI)             vibing-steampunk ADT bridge
  │
  └── AgentResult        Output formatter (terminal / markdown)
```

## Mock Scenario

The demo scenario is **"Add a custom vendor rating field to purchase orders"**. Mock data includes:

- **ABAP Source**: `ZCL_VENDOR_RATING` class with get/set rating methods
- **Data Dictionary**: `ZVENDOR_RATING` custom table, `EKKO` standard table
- **Package Objects**: 5 objects in `ZVENDOR_RATING` package
- **Unit Tests**: 3/3 passing, 87% statement coverage
- **Syntax Check**: Clean, no errors

Each agent returns pre-built analysis for this scenario, demonstrating the full workflow without needing a real SAP system or AI API key.

## SAP Tools

Agents use these tools to interact with the SAP system:

| Tool | Description |
|------|-------------|
| `read_abap_source` | Read source code of a class, interface, or program |
| `write_abap_source` | Create or update ABAP source code |
| `list_objects` | List all objects in a package |
| `search_repository` | Search for objects matching a pattern |
| `get_data_dictionary` | Get table/structure field definitions |
| `activate_object` | Activate an object after modification |
| `run_unit_tests` | Execute ABAP Unit tests with coverage |
| `run_syntax_check` | Check syntax of an ABAP object |

## vsp Integration (Live SAP Access)

[vibing-steampunk (vsp)](https://github.com/oisee/vibing-steampunk) is a production Go binary that bridges SAP ADT APIs. It provides live SAP access without building a custom RFC layer.

### Gateway Modes

| Mode | Priority | Trigger | Description |
|------|----------|---------|-------------|
| `vsp` | 1 | `--vsp-path` or `VSP_PATH` | Live SAP via vsp CLI |
| `live` | 2 | `--sap-system` | RFC connection (stub, not yet implemented) |
| `mock` | 3 | default | Reads from mock-responses.json |

### Tool Mapping

| Agent Tool | vsp CLI | vsp MCP |
|------------|---------|---------|
| `read_abap_source` | `vsp source CLAS ZCL_NAME` | `read_object_source` |
| `search_repository` | `vsp search "query" --max 50` | `search_object` |
| `write_abap_source` | -- (mock fallback) | `create_or_update_object` |
| `list_objects` | -- (mock fallback) | `list_package_objects` |
| `get_data_dictionary` | -- (mock fallback) | `read_object_source` |
| `activate_object` | -- (mock fallback) | `activate_objects` |
| `run_unit_tests` | -- (mock fallback) | `run_unit_tests` |
| `run_syntax_check` | -- (mock fallback) | `check_syntax` |

### CLI Integration

Set the vsp binary path to enable vsp mode:

```bash
# Via environment variables
export VSP_PATH=/usr/local/bin/vsp
export VSP_SYSTEM=DEV

# Or via CLI flags
npm run agent -- analyze "Add vendor rating" --vsp-path /usr/local/bin/vsp -S DEV
```

Read operations (`read_abap_source`, `search_repository`) run against the live SAP system. Write operations fall back to mock data with a message directing you to use MCP mode.

### MCP Integration (Full Capability)

For full access to all 99 vsp tools, configure vsp as an MCP server for your AI assistant. Copy `.mcp.json.example` to `.mcp.json` and fill in your SAP credentials:

```json
{
  "mcpServers": {
    "abap-adt": {
      "command": "/path/to/vsp",
      "env": {
        "SAP_URL": "https://your-sap-host:44300",
        "SAP_USER": "your-username",
        "SAP_PASSWORD": "your-password",
        "SAP_CLIENT": "001"
      }
    }
  }
}
```

This gives the AI assistant direct access to ADT operations: reading/writing ABAP, running tests, activating objects, managing transports, and more.

### Live Mode (RFC — Future)

The `live` mode stub remains for future RFC-based access via `node-rfc`. It falls back to mock data with informational messages.

## CLI Reference

```
npm run agent -- <command> "<requirement>" [options]

Commands:
  analyze    Planner agent (scope + risk)
  design     Designer agent (technical design)
  generate   Implementer agent (code generation)
  test       Tester agent (unit tests)
  review     Reviewer agent (code review)
  workflow   All 5 agents in sequence

Options:
  -f, --format <fmt>       terminal (default) or md
  -s, --sap-system <url>   SAP system URL
  -k, --api-key <key>      AI API key
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile (from .vsp.json)
  -v, --verbose            Detailed execution logs
  -h, --help               Show help
```
