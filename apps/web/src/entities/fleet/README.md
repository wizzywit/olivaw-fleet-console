# entities/fleet

The live fleet: the snapshot, live patches, the live connection and its status.

- `adapter/` talks to ingest: `GET /api/fleet` and `WS /live` (hello with the last sequence, then patches or a resync).
- `repository/` owns the state: the snapshot in TanStack Query (wire DTO, mapped with `select`) and the live robots in a Zustand store that applies patches once per animation frame, holds them while the tab is hidden or the user paused, and reseeds after a resync.

## Rules owned

| Rule                                                     | Where                           |
| -------------------------------------------------------- | ------------------------------- |
| The console counts as live only while its socket is open | `services/liveness.ts` `isLive` |
