# Architecture Decisions

## Why fee_router is a separate program from rewards_vault
Originally fees were collected inside `rewards_vault` directly. We split fee
collection into its own program (PR #142) so an upgrade or bug in fee routing can't
take down reward claims, and so we can route fees differently per integration
partner without touching the vault program at all.

## Why rewards_vault has a versioned account layout
Reward calculation logic changes more often than we'd like, and a flat account
struct meant every change was a breaking migration. v2 introduced a `version` byte
on the account so the program can read old and new layouts during a rollout window
instead of requiring every account to migrate atomically.
