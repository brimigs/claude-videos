# Hook visual — agents that spend, not just act

Two agents hitting the same paywalled API, side by side.

## Without x402 — the agent just stops
```
Agent  →  GET /api/v1/forecast
Server →  402 Payment Required
Agent  →  no account, no API key, no way to pay
Agent  →  gives up
```

## With x402 — the agent pays and keeps going
```
Agent  →  GET /api/v1/forecast
Server →  402 Payment Required — here's what it costs
Agent  →  signs a payment, retries
Server →  verifies, settles, returns 200 OK + the forecast
```

Every agent in the series so far reads things, writes things, and calls things.
This is the first time one of them spends something.
