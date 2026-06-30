# Agentic Payments Video Demo

Companion project for the agentic-payments / x402 / Solana / protocol-landscape
video. The production meta scopes this video as concept-only — no code, no live
demo, that's saved for the build video — but `demo/` now has one anyway: a real,
working x402-over-Solana payment flow, settling real (devnet-style) transactions.
It isn't required for this script as written, but it's there if you want to show
the mechanic live instead of just diagramming it, or want a head start on the build
video.

## Demo (`demo/`)

A paywalled HTTP server and an autonomous paying agent, settling real signed SPL
token transfers on a local Solana validator (or real devnet). Verified end-to-end
while building this — payment, balance changes, repeatability, and replay
rejection all confirmed live, not just typed-checked. See `demo/README.md` for
exactly what it proves, how to run it, and where it knowingly simplifies the real
x402 spec (and why those simplifications are spec-compliant, not shortcuts).

**Before recording, read `accuracy-check.md`.** The script itself asks for this
("verify against current data before quoting a number on camera") — two of the
specific figures in the script don't hold up (Solana finality, MPP's mechanism),
a few more need a wording tweak, and the rest checked out. Sourced findings for all
seven volatile/checkable claims are there.

## Visuals (`visuals/`)

One file per comparison the script calls for, plus a single static page
(`visuals/visuals.html` — no build step, just open it in a browser) that renders
all four as clean slides for screen-recording:

| Script moment | File |
|---|---|
| Hook — agent stuck vs. agent that pays | `01-hook-before-after.md` |
| Part 1 — the request/response flow | `02-request-response-flow.md` |
| Part 2 — Solana Pay vs. x402 | `03-solana-pay-vs-x402.md` |
| Part 3 — the protocol landscape (x402/AP2/ACP/MPP) | `04-protocol-landscape.md` |

`04-protocol-landscape.md` and `visuals.html` currently repeat the script's MPP
description verbatim. If you fix that line in the script per `accuracy-check.md`,
update both files to match before recording.

## Chapters (for the upload)

- 0:00 — Hook: agents that spend, not just act
- 1:00 — The gap: the web was never built for software to pay for things
- 4:00 — Why Solana keeps showing up — and Solana Pay vs. x402
- 7:30 — The wider landscape: AP2, ACP, MPP
- 11:00 — Gotchas: three things people get wrong about this space
- 12:00 — What to watch next

## Reference docs mentioned in the script

x402: [x402.org](https://x402.org) · Solana payments: [solana.com/docs/payments](https://solana.com/docs/payments)
