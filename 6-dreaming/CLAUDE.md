# CLAUDE.md

## Stable references (imported, rarely change)
@docs/program-addresses.md
@docs/architecture-decisions.md

## Key commands
- `anchor build` — compile the program
- `anchor test` — run the Anchor test suite against a local validator
- `anchor deploy --provider.cluster devnet` — deploy to devnet
- `solana logs <program-id>` — tail program logs

## Known gotchas
- `claim_rewards` needs an explicit `ComputeBudgetProgram.setComputeUnitLimit` call — the default 200k compute budget isn't enough.
- Run `anchor idl upgrade` after every `anchor build` that changes the program interface, or the IDL goes stale.
- Don't run `solana-test-validator --reset` mid-session — it wipes state you probably still need.
