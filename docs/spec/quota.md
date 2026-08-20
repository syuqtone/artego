# Storage, Quota & Fair Use

Limits keep the platform inside free service tiers during the academic phase.

| Limit | Academic phase (FYP demo) | Public launch | Enforcement |
|---|---|---|---|
| Artworks per artist | 50 | 500 | Blocked at creation with a clear message |
| Storage per artist | 1 GB | 5 GB | Derivatives plus master — not yet enforced (no byte tracking; deferred) |
| Image size per upload | 10 MB | 10 MB | Rejected before upload begins |
| Wall photos per artist | 10 | 100 | User may delete oldest |
| Publications per artist | 100 | Unlimited | Archived publications still count |
| Artworks per virtual gallery | 20 | 50 | Selection capped in the interface |
| AI generations | 50 / month | By plan | See ai-engine.md |
| PDF generations | 100 / month | By plan | Queued and counted |

## Behaviour at the limit

- Show usage in Account Settings as a figure and a bar: "412 MB of 1 GB used".
- **Warn at 80%**, not only at 100%.
- On reaching a limit: say which limit, show current usage, offer a route to free space.
- Never fail an upload silently. Never lose entered form data when an upload is rejected.
- **Images referenced by a published snapshot count against retention but must never be deleted to free quota.**
- An admin may raise an individual limit, written to the audit log. *(Deferred — no override mechanism built yet.)*
