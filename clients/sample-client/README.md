# Sample Client

This is the default demo client. It uses **mock data only** and requires no real SAP system connection.

## Configuration

No configuration needed. The sample client uses:
- SQLite in-memory database with CSV seed data
- Mocked SAP Business Partner API
- Mock API Discovery catalog

## Running

```bash
# Start the CAP server
npm run watch

# Run API Discovery in mock mode
npm run discover
```

## What's Included

- **5 sample customers** with SAP IDs and tier classifications
- **4 sample projects** across different integration scenarios
- **Mock Business Partner lookup** returning simulated SAP data
- **Mock API catalog** showing typical S/4HANA Public Cloud APIs

This client demonstrates the full toolkit without any external dependencies.
