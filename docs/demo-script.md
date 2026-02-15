# Demo Script

Step-by-step walkthrough for demonstrating SAP Connect to clients and stakeholders.

## Setup (Before the Demo)

```bash
# Ensure everything is running
npm run watch
# Verify: server starts on port 4004, no errors
```

Open the browser to `http://localhost:4004`.

## Part 1: The Big Picture (2 min)

**Show the launcher page** (`http://localhost:4004`)

> "This is SAP Connect -- a self-contained development toolkit that demonstrates how we build extensions for SAP systems following Clean Core principles."

> "Everything here runs in a GitHub Codespace. No SAP system needed for demos -- we use mock data that mirrors a real SAP environment."

**Key points:**
- Runs in browser, nothing to install
- Mock mode for demos, live mode for real clients
- Follows SAP's recommended architecture (CAP + Fiori Elements)

## Part 2: The Data Model (3 min)

**Open** `http://localhost:4004/api/customers/Customers`

> "Here's our OData V4 service. We have 5 sample customers with SAP IDs, tier classifications, and industry data."

**Show:**
- Customer list (JSON response)
- Project list: `/api/customers/Projects`
- Statistics: `/api/customers/getProjectStats()`
- Metadata: `/api/customers/$metadata`

> "This is a standard OData V4 service built with SAP CAP. It supports filtering, sorting, pagination -- everything an SAP Fiori app needs."

## Part 3: The Fiori App (5 min)

**Open the Customers app** from the launcher page.

> "This is a Fiori Elements app. We didn't write any UI code -- the entire interface is generated from metadata annotations."

**Demonstrate:**
1. **List Report** -- Show the customer table with filters
2. **Filtering** -- Filter by tier or industry
3. **Navigation** -- Click a customer to see the Object Page
4. **Object Page** -- Show customer details and projects table
5. **Draft Editing** -- Click Edit, change a field, then Save

> "Fiori Elements gives us a production-quality UI with zero custom code. Filters, sorting, responsive layout, draft editing -- all built in."

## Part 4: Migration Assessment (3 min)

**Run in the terminal:**
```bash
npm run assess
```

> "This runs 874 compatibility rules across 21 SAP modules. It scans custom code for issues that need to be addressed before migration."

**Show the output:**
- Rule counts by module (FI: 80, ABAP: 80, MM: 67, etc.)
- Severity classification (critical, warning, info)
- Auto-fix suggestions with confidence scores

> "For a real client, we'd point this at their SAP system and get a complete compatibility report in minutes instead of weeks."

## Part 5: Test Suite (2 min)

**Run in the terminal:**
```bash
npm test
```

> "We have 4,910 automated tests across 251 files covering every component: extraction, migration, process mining, security, AI safety, connectivity, and more."

**Highlight:**
- Zero test failures
- Full coverage of 42 migration objects and 881 transform rules
- Mock and live mode tests for SAP connectivity

## Part 6: API Discovery (3 min)

**Run in the terminal:**
```bash
npm run discover
```

> "This is our API Discovery tool. It scans an SAP system to show what APIs, events, and extension points are available."

**Walk through the output:**
- Communication Scenarios (API bundles)
- Released APIs (with entities and operations)
- Business Events (for event-driven integration)
- Extension Points (custom fields, custom logic)

> "For a real client, we'd point this at their SAP system and get a complete picture of what we can integrate with -- all Clean Core compliant."

## Part 7: Real-Time Dashboard (2 min)

**Show the extraction dashboard** on port 4005.

> "During live operations, SAP Connect streams real-time progress via server-sent events. You can monitor extraction, migration, and testing as they happen."

**Key points:**
- Per-extractor progress tracking
- Migration wave status with record counts
- Event history with full replay capability

## Part 8: Multi-Client Support (2 min)

**Show** the `clients/` directory.

> "SAP Connect supports multiple clients without separate environments. Each client has their own configuration -- we just swap the .env file to switch contexts."

**Show** `clients/_template/.env.template`

> "For a new client, we copy this template, fill in their SAP system details, and we're ready to go. No code changes needed."

## Closing (1 min)

> "To summarize: SAP Connect gives us a complete development environment for SAP extensions and migrations that follows Clean Core principles, runs anywhere via Codespaces, supports multiple clients, and is backed by 4,910 automated tests. Everything we've built here deploys to SAP BTP when ready for production."

## FAQ Responses

**Q: Does this work with our SAP system?**
> "Yes -- the API Discovery tool can scan your system to show exactly which APIs are available. We support Public Cloud, Private Cloud, and on-premise scenarios."

**Q: How long to set up for a real client?**
> "The toolkit is ready immediately. Connecting to a real SAP system requires a Communication Arrangement, which your Basis team sets up."

**Q: Is this Clean Core compliant?**
> "Yes -- we only use released APIs, standard UI technology (Fiori Elements), and SAP's recommended development framework (CAP). See our Clean Core Guide for details."

**Q: What about security?**
> "Every operation passes through input validation, rate limiting, and audit logging. For production, we support XSUAA JWT authentication with scope-based access control. Transport management is enforced on all write operations."
