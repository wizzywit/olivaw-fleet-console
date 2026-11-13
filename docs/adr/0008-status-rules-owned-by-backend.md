# 0008. Status rules are owned by the backend

- Status: accepted
- Date: 2026-11-13

## Context

"Needs attention" is the console's core business rule: it decides what a fleet manager looks at first. The same rule feeds the status column, the counts per site and the attention groups. If the client and the server each computed it, a robot could be "offline" in a row while still counted as "working" in a tile, and two implementations would drift.

Time also matters: a robot that stops reporting changes state without sending anything.

## Decision

The ingest service owns status, attention reasons, counts and attention groups (`apps/ingest/src/robot`). It runs a stale sweep every second, so a silent robot becomes `offline` on the server and the change reaches the console as an ordinary patch. Thresholds live in server config and are sent to the client in the snapshot, for display only.

The client owns exactly one rule: data freshness. When its own live connection is lost, it shows everything as last known and disables actions. It does not flip robots to `offline`, because the broken link is the console's, not the robots'.

## Options considered

- Server owns the rules (chosen): one implementation, counts and rows always agree, and the work does not grow with the number of open consoles.
- Client derives status from raw fields: no server logic, but every client scans the whole fleet on every update and the rule is duplicated or shipped as a shared package that both sides must run identically.
- Both, with a shared package: one source of code, but two places to keep in sync at runtime, and the client still pays the computation cost at 100×.

## Consequences

- Every rule has unit tests at its exact boundaries without mocks.
- Changing a threshold is a config change on one service.
- A console that has lost its connection shows old but consistent data, clearly marked.
