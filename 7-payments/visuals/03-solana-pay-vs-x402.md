# Solana Pay vs. x402 — the one people actually confuse

| | Solana Pay | x402 |
|---|---|---|
| Who's paying | A human, usually scanning a QR code | Software — an agent or another service |
| Where it lives | Point-of-sale, checkout flows | HTTP requests, API responses |
| What triggers it | A merchant request | An HTTP 402 status code |
| What it's for | Buying a coffee | An agent buying an API call |

Solana Pay is older, and it solves a genuinely different problem: human checkout.
x402 is built for the case this channel cares about — an agent paying for something
with nobody watching the transaction happen.
