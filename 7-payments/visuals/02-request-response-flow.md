# x402 request/response flow

The core mechanic — four steps, no code, no account, no human:

```
Agent requests a resource
        ↓
Server replies: 402, here's what it costs
        ↓
Agent signs a payment
        ↓
Server verifies, settles, returns the resource
```

Two design choices make this real instead of a neat idea:
- **Stateless** — no session, no stored card, no API key sitting around waiting to leak.
- **Cheap enough to matter** — settlement has to cost less than the API call itself, or the whole idea is dead on arrival. That's the constraint that makes the choice of network the whole story, not a footnote.
