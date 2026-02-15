# Getting Started

## Prerequisites

- **Node.js 22+** (included in Codespace)
- **npm** (included with Node.js)
- **@sap/cds-dk** (installed by post-create script)

## Option 1: GitHub Codespace (Recommended)

1. Open this repository on GitHub
2. Click **Code > Codespaces > New codespace**
3. Wait for the post-create script to finish (~2 minutes)
4. Open the terminal and run:
   ```bash
   npm run watch
   ```
5. When prompted, open port 4004 in the browser

## Option 2: Local Development

```bash
# Clone the repository
git clone <repo-url>
cd sapconnect

# Install dependencies
npm install

# Install CDS development kit globally
npm install -g @sap/cds-dk

# Start the server
npm run watch
```

## First Steps

### 1. Explore the Launcher Page

Open `http://localhost:4004` to see the launcher page with links to:
- Customer Management app (Fiori Elements)
- OData service metadata
- API Discovery documentation

### 2. Browse the OData Service

Try these URLs:
- `http://localhost:4004/api/customers/Customers` -- All customers
- `http://localhost:4004/api/customers/Projects` -- All projects
- `http://localhost:4004/api/customers/getProjectStats()` -- Statistics
- `http://localhost:4004/api/customers/$metadata` -- Service metadata

### 3. Run the Full Test Suite

```bash
# Run all 4,910 tests across 251 files
npm test

# Run a specific test file
npx vitest run test/migration/transform-coverage.test.js
```

### 4. Run API Discovery

```bash
# Mock mode (no SAP system needed)
npm run discover

# Markdown output
npm run discover -- --format md
```

### 5. Open the Fiori App

Navigate to the Customers app from the launcher page or directly at:
`http://localhost:4004/customers/webapp/index.html`

### 6. Try Draft Editing

1. Open the Customers list
2. Click a customer to open the Object Page
3. Click **Edit** to start a draft session
4. Make changes and click **Save**

### 7. Run a Migration Assessment

```bash
# Scan custom code against 874 rules
npm run assess

# Run all 42 migration objects in mock mode
node -e "
  const R = require('./migration/objects/registry');
  const r = new R();
  r.runAll({ mode: 'mock' }).then(res => console.log(JSON.stringify(res.stats, null, 2)))
"
```

### 8. Explore the Dashboard

Start the Express server on port 4005 and open the dashboard:
- Extraction progress with real-time SSE streaming
- Migration status and reconciliation reports
- Process mining results

## Project Structure

```
sapconnect/
├── db/              Data model and seed data
├── srv/             OData service and custom handlers
├── app/             Fiori Elements frontend + dashboard
├── extraction/      Forensic extraction engine (35 extractors)
├── migration/       ETLV migration framework (42 objects, 881 rules)
├── agent/           AI agent orchestrator (5 agents)
├── lib/             Core libraries
│   ├── rfc/         RFC client, pool, table reader
│   ├── odata/       OData client, batch, auth
│   ├── adt/         ADT REST client
│   ├── security/    Input validation, rate limiting, audit, XSUAA
│   ├── monitoring/  Health checks, metrics, request context
│   ├── greenfield/  BDC engine, BAPI catalog, transport
│   ├── mcp/         MCP server (43 SAP tools)
│   └── ai/          Safety gates, audit trail
├── discovery/       API Discovery CLI tool
├── clients/         Per-client configuration templates
├── website/         Marketing website (Next.js)
└── docs/            Documentation
```

## Next Steps

- Read the [Architecture Overview](architecture-overview.md)
- Understand [Clean Core](clean-core-guide.md) principles
- Review [Integration Patterns](integration-patterns.md)
- Set up a [client configuration](../clients/_template/README.md)
- Run through the [Demo Script](demo-script.md)
