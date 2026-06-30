---
name: workflow-gotchas
description: Recurring friction points in this repo and how to avoid them
metadata:
  type: feedback
---

Always run `anchor test` before deploying.

Don't run `solana-test-validator --reset` mid-session — it wipes state the user
still needs.

Run `anchor idl upgrade` after every `anchor build` that changes the program
interface, or the IDL goes stale (this is what broke PR #156).

`claim_rewards` needs an explicit `ComputeBudgetProgram.setComputeUnitLimit` call —
the default 200k compute budget isn't enough.
