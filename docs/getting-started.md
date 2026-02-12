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
- `http://localhost:4004/api/customers/Customers` - All customers
- `http://localhost:4004/api/customers/Projects` - All projects
- `http://localhost:4004/api/customers/getProjectStats()` - Statistics
- `http://localhost:4004/api/customers/$metadata` - Service metadata

### 3. Run API Discovery

```bash
# Mock mode (no SAP system needed)
npm run discover

# Markdown output
npm run discover -- --format md
```

### 4. Open the Fiori App

Navigate to the Customers app from the launcher page or directly at:
`http://localhost:4004/customers/webapp/index.html`

### 5. Try Draft Editing

1. Open the Customers list
2. Click a customer to open the Object Page
3. Click **Edit** to start a draft session
4. Make changes and click **Save**

## Project Structure

```
sapconnect/
├── db/          Data model and seed data
├── srv/         OData service and custom handlers
├── app/         Fiori Elements frontend
├── discovery/   API Discovery CLI tool
├── clients/     Per-client configuration templates
└── docs/        Documentation
```

## Next Steps

- Read the [Architecture Overview](architecture-overview.md)
- Understand [Clean Core](clean-core-guide.md) principles
- Review [Integration Patterns](integration-patterns.md)
- Set up a [client configuration](../clients/_template/README.md)
- Run through the [Demo Script](demo-script.md)
