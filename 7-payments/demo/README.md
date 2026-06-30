# x402 + Solana — a real, working demo

A genuine end-to-end implementation of the x402 payment protocol settling on
Solana: a server that paywalls an endpoint with a real HTTP 402, and an agent that
pays for it autonomously with a real signed, on-chain-settled SPL token transfer.
Nothing in the payment path is mocked.

This goes beyond the "concept-only, no demo" scope this video originally had (see
`../README.md` and `../accuracy-check.md` for the explainer half) — this is the
actual mechanic working, pulled forward from what was scoped for the later build
video.

## What this proves, concretely

1. `GET /api/weather` with no payment → a real `402 Payment Required`, with x402's
   actual `accepts` array shape (`scheme`, `network`, `amount`, `asset`, `payTo`,
   `resource`).
2. The agent signs a real SPL `TransferChecked` instruction but does **not**
   broadcast it — the signed-but-unsubmitted transaction is base64-encoded into the
   `X-PAYMENT` header, exactly how the spec's Solana scheme does it.
3. The server decodes that header, inspects the instruction (right mint, right
   destination, right amount), and only then submits + confirms it itself.
4. `200 OK` comes back with the resource and an `X-PAYMENT-RESPONSE` header
   carrying the real transaction signature.
5. Replay is rejected — not by anything this demo wrote, but by Solana itself.
   `npm run demo:replay` proves it: resending the identical signed payment a second
   time fails with "this transaction has already been processed."

Verified live while building this: ran `setup` → `server` → `agent` end to end
against a local validator, confirmed the resulting transaction independently with
`solana confirm`, checked both token balances moved by exactly the right amount,
re-ran the agent a second time to confirm it's repeatable, and confirmed replay is
rejected.

## Run it

```sh
npm install

# Start a local validator once, in its own terminal — instant airdrops, no
# dependency on the public devnet faucet (see "About the network" below)
solana-test-validator

# One-time: generates seller + agent wallets under .wallets/ (gitignored), creates
# a test SPL token (a mock stablecoin), and funds the agent with some of both SOL
# (for fees) and the test token (to actually pay with)
npm run setup

# Terminal A
npm run server

# Terminal B — runs the full 402 → pay → 200 flow once and exits
npm run agent

# Optional
npm run balances       # see the token balances move
npm run demo:replay    # see a replayed payment get rejected
```

## About the network

This defaults to a local validator (`SOLANA_RPC_URL` in `.env`) instead of public
devnet, on purpose. While building this, the public devnet airdrop faucet
(`api.devnet.solana.com`) returned `429` ("airdrop limit... or the faucet has run
dry") on every attempt — a known, common annoyance with the shared faucet, not a
bug in this demo. To run this against real devnet for the actual recording, either
retry (it's intermittent) or fund the wallets manually from
[faucet.solana.com](https://faucet.solana.com) and switch `SOLANA_RPC_URL` in
`.env`. The protocol logic — what gets signed, what gets verified, what gets
rejected — is identical either way; only the network differs.

## Where this simplifies the real spec, on purpose

- **A test token, not USDC.** Real x402-on-Solana typically settles in USDC. This
  demo mints its own throwaway SPL token instead of depending on a devnet
  USDC-equivalent mint address, so setup has zero external dependencies beyond the
  validator itself. The mechanic — `TransferChecked`, decimals, mint-checked — is
  identical to what a real stablecoin payment would do.
- **No facilitator.** The spec supports a third-party "facilitator" that verifies
  and settles on the seller's behalf — useful when the seller doesn't want to run
  Solana infrastructure, or when the facilitator (not the buyer) should pay the
  network fee. This demo has the seller verify and settle directly. Solana
  Foundation's own reference implementation explicitly confirms this is a valid,
  spec-compliant simplification, not a shortcut around the protocol:
  [solana.com/developers/guides/getstarted/intro-to-x402](https://solana.com/developers/guides/getstarted/intro-to-x402).
- **`network` field.** The spec's Solana scheme technically wants a CAIP-2-style
  genesis-hash string (e.g. `"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"`); this demo
  uses the simpler `"solana-devnet"` / `"solana-localnet"` strings that real-world
  implementations actually ship with.

Primary sources used while building this: the spec repo (`x402-foundation/x402`,
formerly `coinbase/x402`) — `specs/x402-specification-v1.md`,
`specs/transports-v1/http.md`, `specs/schemes/exact/scheme_exact_svm.md` — plus the
Solana Foundation guide linked above, and the `x402-solana` / `@x402/svm` npm
packages for confirming what real implementations actually do differently from the
spec's letter.
