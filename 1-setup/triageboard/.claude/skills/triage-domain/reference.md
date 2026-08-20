# Triage Domain Reference

## Severity Rules

| Severity | Meaning | Target Response |
| --- | --- | --- |
| `SEV1` | Outage or high customer-impact incident | 30 minutes |
| `SEV2` | Degraded critical path or substantial revenue risk | 120 minutes |
| `SEV3` | User-visible issue with limited scope | 480 minutes |
| `SEV4` | Low-risk operational issue | 2880 minutes |

## Priority Inputs

- `customerImpact` has the highest weight.
- `revenueAtRisk` should influence ordering, but never override outage status.
- `minutesOpen` matters because older incidents approach or breach SLA.
- `reports` matters, but a pile of low-impact reports should not outrank an outage.

## Sort Order

1. Higher score first.
2. `breached` SLA before `watch`, then `healthy`.
3. Higher `revenueAtRisk`.
4. Older incident.
