# entities/fleet

The live fleet: the snapshot, live patches, the live connection and its status.

- `adapter/` talks to ingest: `GET /api/fleet` and `WS /live` (hello with the last sequence, then patches or a resync).
- `repository/` owns the state: the snapshot in TanStack Query (wire DTO, mapped with `select`) and the live robots in a Zustand store that applies patches once per animation frame, holds them while the tab is hidden or the user paused, and reseeds after a resync.

## Rules owned

| Rule                                                                                                      | Where                                                      |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| The console counts as live only while its socket is open                                                  | `services/liveness.ts` `isLive`                            |
| The link is down while reconnecting or offline (not while first connecting)                               | `services/liveness.ts` `isLinkDown`                        |
| A value is shown as last known when the console is not live or the robot is offline                       | `services/liveness.ts` `isLastKnownValue`                  |
| A patch applies only if it is newer than everything known; a new snapshot keeps only newer queued patches | `services/patchSequence.ts` `isNewerPatch`, `patchesAfter` |
| Total robots from status counts                                                                           | `services/statusCounts.ts` `totalOf`                       |
