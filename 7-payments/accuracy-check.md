# Accuracy check — before recording

The script itself flags this: "treat all market-share and volume figures cited
anywhere in this script as a snapshot, not a stable fact — verify against current
data before quoting a number on camera." Here's that check, run 2026-06-30.

## Needs a script change — these are wrong, not just stale

**Solana finality is not "roughly four hundred milliseconds."** Current Solana
finality is ~12–13 seconds. Firedancer (live on ~20%+ of mainnet validators) is a
validator-performance upgrade and doesn't change finality time on its own. The
~150ms figure exists, but it's the *target* of a separate, not-yet-live consensus
upgrade called Alpenglow (passed governance at 98.27% approval; mainnet activation
was projected for "as soon as Q3 2026" as of May 2026). Suggested fix: say "~12
seconds today, with a pending upgrade (Alpenglow) targeting ~150ms later this
year" — or cut the specific number and just say sub-second is the target, current
is seconds.
Sources: [Solana Compass on Alpenglow](https://solanacompass.com/learn/Lightspeed/alpenglow-solanas-largest-protocol-upgrade-ever-brennan-watt-anza), [Sanctum speed guide 2026](https://sanctum.so/blog/solana-speed-guide-2026)

**MPP isn't "pre-authorize a session, then stream smaller payments."** Per
Stripe's own MPP docs, it's the same shape as x402 — a per-request HTTP 402
challenge-response flow (request → 402 challenge → pay → receive resource). There's
no session/spending-ceiling/streaming primitive in Stripe's description. The
"pre-authorized session" framing actually matches AP2's Mandate model better, not
MPP. The protocol-landscape table in `visuals/04-protocol-landscape.md` currently
repeats the script's framing — fix the script first, then I'll update the table to
match.
Sources: [Stripe: Introducing MPP](https://stripe.com/blog/machine-payments-protocol), [Stripe MPP docs](https://docs.stripe.com/payments/machine/mpp)

## Needs a wording tweak — directionally right, specifics drifted

**"Two networks carry almost all of the real volume — Base and Solana"** was true
through most of late 2025/early 2026, but by February 2026 Polygon surged and
commentary shifted to a "triopoly" (Solana/Base/Polygon). Shares have swung hard —
Solana from ~88% to ~49.7% in the same month. Two more things worth knowing before
you quote a number on camera: by dollar volume Base actually led Solana as of
mid-Feb ($21.5M vs $16.4M), and a large share of recorded x402 volume (78–98% in
some periods) is flagged as non-organic/wash activity, not real usage. Given how
fast and how fake some of this number is, I'd lean on the script's own instinct —
"anchor on unit economics, not a market-share screenshot" — rather than naming
Base/Solana as a stable duopoly.
Sources: [ainvest: 92% volume collapse](https://www.ainvest.com/news/solana-base-x402-market-share-battle-92-volume-collapse-2602/), [SolanaFloor](https://solanafloor.com/news/solana-commands-49-of-x402-market-share-as-the-race-for-micropayment-dominance-intensifies), [ainvest: triopoly](https://www.ainvest.com/news/x402-triopoly-solana-base-polygon-lead-agent-payments-2026-2602/)

**"USDC dominating... the rest of crypto payments right now"** overstates it. By
raw market cap, USDT is still larger (~$190B vs. USDC's ~$75B as of mid-2026).
USDC's actual edge is narrower and more specific: it's the preferred settlement
asset in institutional and regulated payment corridors — which is plausibly true
for x402-style agentic payments specifically — but "dominates crypto payments" as a
blanket claim isn't accurate. Narrower framing ("preferred for institutional/agentic
corridors specifically") would hold up better.
Sources: [Forbes: USD-backed stablecoin dominance](https://www.forbes.com/sites/danielwebber/2026/06/29/will-usd-backed-stablecoins-always-dominate-the-market/), [Forbes: USDT/USDC/USD1 share war](https://www.forbes.com/sites/boazsobrado/2026/03/12/usdt-usdc-usd1-the-stablecoin-market-share-war/)

**x402 was "incubated by Coinbase"** — soft nuance, not wrong: Coinbase contributed
it to the Linux Foundation, but it was originally developed jointly by Coinbase,
Cloudflare, and Stripe. Worth a half-sentence credit to the other two if you want to
be precise, but not worth cutting the line over.
Source: [Linux Foundation press release](https://www.linuxfoundation.org/press/linux-foundation-is-launching-the-x402-foundation-and-welcoming-the-contribution-of-the-x402-protocol)

## Confirmed as written — no change needed

- **x402 → Linux Foundation transfer (April 2, 2026) and the backer list** (Visa, Stripe, Mastercard, Shopify, Google, Cloudflare, AWS) — confirmed. Source: [CoinDesk](https://www.coindesk.com/tech/2026/04/02/coinbase-s-ai-payments-system-joins-linux-foundation-gathers-support-from-google-stripe-aws-and-others)
- **AP2** — Google, announced Sept 16, 2025, the "agents prove what they're authorized to spend without moving money themselves" description matches its Mandate model exactly. Source: [Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
- **ACP** — Stripe + OpenAI, open-sourced (Apache 2.0), live in ChatGPT's Instant Checkout. Description matches. Source: [Stripe blog](https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce)
