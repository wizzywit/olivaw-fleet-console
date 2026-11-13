# 0006. Live transport: snapshot plus sequenced patches

- Status: accepted
- Date: 2026-11-13

## Context

Robots report about once per second. The console needs the whole fleet when it opens, then only what changes, and it must survive a dropped connection without missing or double-applying a change. Sending every robot message to every console does not scale with fleet size or with the number of open consoles.

## Decision

- `GET /api/fleet` returns a snapshot: all robots (compact summary), sites, server-computed aggregates, display config, and the current `sequence`.
- `WS /live` sends patches. Every 500 ms the server drains changed robots, sends only the fields that changed (a robot new since the last patch is sent in full), the updated aggregates, and `sequence + 1`.
- The client opens the socket with `hello { lastSequence, instanceId }`. The server replies with the patches it missed from a log covering the resume window (`RESUME_WINDOW_MS`, one minute: 120 patches at 500 ms), or with `resync` when the client comes from another ingest run (different `instanceId`), is ahead, or is too far behind. On `resync` the client drops queued patches and refetches the snapshot.
- The server sends a heartbeat every 5 s. The client treats 15 s of silence as a lost connection and reconnects, which catches half-open sockets after sleep or a network change.
- Patches are broadcast only to sockets that have said hello, so catch-up and live patches never interleave.
- Summary values are rounded (whole battery percent, 0.1 m, 0.1 m/s), so changes too small to see do not produce patches.

## Options considered

- Snapshot + sequenced patches over WebSocket (chosen): bounded rate (per window, per changed robot), correct resume, one connection.
- Server-Sent Events: simpler server, automatic reconnect with `Last-Event-ID`; but one-way, so the resume handshake and future per-view subscriptions (detail at full rate, overview coalesced) would need a second channel.
- Forward every robot message: simplest, but the rate grows with fleet size times consoles, and the client would have to compute aggregates.
- Polling the snapshot: robust and simple, but wasteful and either laggy or heavy at 10,000 robots.

## Consequences

- The patch rate is bounded by robots that changed, not messages received.
- A restarted server is detected (`resync`) instead of silently corrupting client state.
- Next steps at 100×: per-view subscriptions (the detail page subscribes to one robot at full rate, the overview to coalesced summaries), dropping position from the fleet stream when no view needs it, binary encoding, and fan-out through a pub/sub layer when ingest runs as several instances.
