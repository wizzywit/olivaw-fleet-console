# 0019. Scaling live views that need position and report times

- Status: proposed (not built; the design to follow when a view needs these fields at 100× or more)
- Date: 2026-11-13

## Context

ADR 0018 took `position` out of the fleet stream and made `lastReportAt` ride along with real changes, because broadcasting them to every console put almost the whole fleet in every patch. Some views do need them: a fleet map needs live positions, the robot detail needs one robot at full rate, and a freshness view needs report ages. At 100× (hundreds of thousands of robots, many consoles) a broadcast of these fields cannot work: the bytes grow with robots times consoles, and every client would decode and hold data it never draws.

## Decision

Each view subscribes to what it shows, at the detail and rate it can show it, and the server does the narrowing.

1. **Subscriptions on the live socket.** Next to `hello`, the client sends `subscribe` and `unsubscribe` for channels such as `robot:<id>` (full rate, for the detail page, replacing its one-second refresh), `site:<id>/positions` (a map) and `fleet/summary` (the overview, as today). Each channel has its own snapshot, sequence and resync, following ADR 0006.
2. **Scoped to what is on screen.** A map subscribes to its visible area and zoom, not a whole site. The server keeps a spatial index per floor map. Zoomed out, it sends counts per grid square (density or clusters with the worst status); zoomed in, individual robots inside the visible area.
3. **Pixel-based change thresholds.** A position is sent only when it moves about one pixel at the current zoom, coalesced into one batch every 250–500 ms.
4. **Binary frames for high-volume channels.** Robot ids map to small integers sent once per subscription; positions are 16-bit integers relative to the map; about 6–8 bytes per update instead of about 60 in JSON. The client decodes in a Web Worker.
5. **Report times as events.** Robots that keep reporting are "Live" and cost nothing. Going offline sends the status change with the last report time (ADR 0018). Freshness views subscribe to aggregates (for example, the share of robots silent for more than 10 s, per site), not to per-robot ages; the client computes "2 min ago" from a time that no longer changes.
6. **Servers built for fan-out.** Ingest runs as several processes split by site behind an MQTT broker cluster with shared subscriptions, and publishes robot changes to a message stream (NATS JetStream or Kafka) on subjects per site and per robot. Separate WebSocket gateways subscribe only to the subjects their consoles asked for. For slow clients a gateway keeps the latest value per robot and drops outdated frames instead of queueing them.
7. **A client that holds only what is on screen.** Subscribed positions live in typed arrays outside React and are drawn with WebGL once per animation frame, interpolated between updates so 2 updates per second still look smooth. React renders the surrounding interface and the focused robot. At this scale the table is filtered, sorted and paged on the server, and the client keeps only the visible window.
8. **History out of the live path.** Trails and charts come from a time-series store with downsampling, fetched on demand for the robot or area in view.

## Options considered

- Put the fields back into the fleet broadcast: simplest, but this is exactly what ADR 0018 measured at 1 MB per second for 10,000 robots; at 100× it grows with every console.
- Polling per view (as the detail page does today): fine for one robot, but a map polling a site re-sends unchanged positions and cannot follow a moving viewport cheaply.
- Server-Sent Events per channel: simple fan-out, but one connection per channel and no way for the client to change its area or zoom on the same connection.
- Subscriptions on the existing WebSocket with viewport scoping (chosen): one connection, the server sends only what each view draws, and the existing sequence and resync rules carry over per channel.

## Consequences

- Bytes and client work grow with what is on screen, not with fleet size or the number of consoles.
- The server gets more state: subscriptions per connection, a spatial index per map and per-channel sequences. Gateways become their own tier to deploy and monitor.
- The protocol needs versioned channel and frame definitions in `packages/contracts`, including the binary layout and its tests.
- The fleet map listed under "With more time" in the README is the first consumer; the detail page's one-second refresh moves to a `robot:<id>` channel.
