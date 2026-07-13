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
- `partial_outage` (a regional or partial service outage) has a severity floor of `SEV2`. A partial outage reported minutes ago, before report/revenue numbers roll in, must not be triaged as SEV3/SEV4 just because its score is still low. This is a floor, not a pin: a partial outage can still escalate to `SEV1`, unlike a full `outage`, which is always `SEV1`.
- The `SEV1` escalation threshold for `partial_outage` is **90**, not the standard 110 used for every other impact type. Rationale: regional/partial outages are chronically under-reported — the true blast radius is usually larger than what `reports`/`revenueAtRisk` show at triage time — so the queue should treat them as urgent earlier than the generic score curve would. This 90 threshold is a product decision, not something derived from the weights below; do not infer it from the scoring math.

## Sort Order

1. Higher score first.
2. `breached` SLA before `watch`, then `healthy`.
3. Higher `revenueAtRisk`.
4. Older incident.
