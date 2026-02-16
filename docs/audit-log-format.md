# SEN Audit Log Format

## Purpose

SEN maintains comprehensive audit logs of all operations performed against SAP systems. These logs serve:
1. **Security**: Track all access and modifications to SAP systems
2. **Compliance**: Demonstrate that all operations were authorized by licensed users
3. **Supportability**: Provide evidence trail if SAP support questions arise
4. **Rollback**: Enable identification of changes for rollback scenarios

## Log Entry Schema

| Field | Type | Description |
|-------|------|-------------|
| timestamp | ISO 8601 | When the operation occurred |
| operation | string | MCP tool name (e.g., "writeSource", "runMigrationObject") |
| category | enum | "read" or "write" |
| user | string | Authenticated SAP user ID |
| targetSystem | string | SAP system identifier (SID) |
| safetyGate | object | { decision: "ALLOWED"/"BLOCKED", reason: string, dryRun: boolean } |
| parameters | object | Operation parameters (credentials redacted) |
| result | object | { status: "success"/"error"/"dry-run", details: {...} } |
| duration_ms | number | Operation duration in milliseconds |

## Retention

Audit logs should be retained according to your organization's data retention policy. SEN does not automatically delete audit logs.

## Example Entry

```json
{
  "timestamp": "2026-02-16T14:30:00.000Z",
  "operation": "runMigrationObject",
  "category": "write",
  "user": "MIGUSER01",
  "targetSystem": "S4H",
  "safetyGate": {
    "decision": "ALLOWED",
    "reason": "write-operation-live-mode-confirmed",
    "dryRun": false
  },
  "parameters": {
    "objectType": "GL_ACCOUNT",
    "mode": "live",
    "recordCount": 4500
  },
  "result": {
    "status": "success",
    "recordsProcessed": 4500,
    "recordsFailed": 0
  },
  "duration_ms": 12340
}
```
