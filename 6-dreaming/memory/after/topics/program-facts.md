---
name: program-facts
description: Current facts about rewards_vault and fee_router — addresses, mainnet status, and why they're split
metadata:
  type: project
---

fee_router is deployed to mainnet-beta (confirmed — supersedes the earlier
"devnet only" note, which was written before the deploy went out).

rewards_vault's program address changed after the v2 migration. See
`docs/program-addresses.md` for the current address — the pre-migration address is
deprecated and must never be reused.

fee_router was split out of rewards_vault (PR #142) so an upgrade or bug in fee
routing can't take down reward claims, and so fees can be routed differently per
integration partner without touching the vault program. See
`docs/architecture-decisions.md` for the full rationale.
