# Client Setup Template

Use this template to configure SAP Connect for a new client.

## Steps

1. **Create a client folder:**
   ```bash
   cp -r clients/_template clients/<client-name>
   ```

2. **Configure environment:**
   ```bash
   cp clients/<client-name>/.env.template .env
   # Edit .env with the client's SAP system details
   ```

3. **Configure BTP destinations** (if deploying):
   ```bash
   cp clients/<client-name>/default-env.json.template default-env.json
   # Edit default-env.json with destination credentials
   ```

4. **Run API Discovery** to understand the client's system:
   ```bash
   npm run discover -- --system https://<tenant>.s4hana.cloud.sap
   ```

5. **Start developing:**
   ```bash
   npm run watch
   ```

## System Types

| Type | Description | Config Notes |
|------|-------------|--------------|
| `public-cloud` | SAP S/4HANA Public Cloud | Clean Core only, released APIs |
| `private-cloud` | SAP S/4HANA Private Cloud | More flexibility, custom code possible |
| `btp-only` | SAP BTP standalone | No S/4HANA, BTP services only |

## Switching Clients

To switch between clients, update the `.env` file in the project root:

```bash
cp clients/<other-client>/.env.template .env
# Edit with the other client's values
npm run watch
```
