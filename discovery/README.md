# API Discovery Module

Scan an SAP system to discover available APIs, business events, and extension points. This helps teams quickly understand what integration capabilities a client's SAP system offers.

## Quick Start

```bash
# Run in mock mode (no SAP system needed)
npm run discover

# Output as markdown
npm run discover -- --format md
```

## Live Mode

To scan a real SAP system, you need a Communication Arrangement set up in the target system:

```bash
# Using command-line arguments
npm run discover -- --system https://my-tenant.s4hana.cloud.sap -u USER -p PASS

# Or using environment variables
export SAP_HOSTNAME=my-tenant.s4hana.cloud.sap
export SAP_USERNAME=API_USER
export SAP_PASSWORD=secret
npm run discover -- --system https://$SAP_HOSTNAME
```

### Prerequisites for Live Scanning

The SAP system needs the following Communication Arrangements:

1. **Communication Scenario Read** (SAP_COM_0A08) - to list available scenarios
2. **Communication Arrangement Read** (SAP_COM_0A09) - to see activated arrangements
3. **API metadata endpoints** - standard OData metadata access

## What Gets Discovered

| Category | Description |
|----------|-------------|
| **Communication Scenarios** | Available API bundles (e.g., Business Partner, Sales Order) |
| **Released APIs** | Specific OData/REST APIs with their entities and operations |
| **Business Events** | Event Mesh topics for event-driven integration |
| **Extension Points** | Custom fields, custom logic, and custom CDS views |

## Output Formats

- **Terminal** (default): Formatted for console output
- **Markdown** (`--format md`): Structured markdown for documentation

## Architecture

```
discover.js    CLI entry point, argument parsing
scanner.js     Core scanning logic (mock + live modes)
report.js      Output formatting (terminal + markdown)
mock-catalog.json  Sample data for demo mode
```
