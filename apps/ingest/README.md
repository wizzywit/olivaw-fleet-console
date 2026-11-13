# ingest

Receives robot telemetry, decides what each robot's state means, and serves the fleet to the console.

```
robots ──MQTT (VDA 5050)──▶ protocols/ ──RobotObservation──▶ store/ ──▶ transport/ ──REST + WebSocket──▶ console
                                                              │
                                                     robot/ (rules)
```

- `protocols/`: one adapter per external protocol; the only code that knows a wire format.
- `robot/`: the robot domain. Pure functions, no I/O, time passed in.
- `store/`: latest state per robot, change tracking, stale sweep, patch log.
- `transport/`: MQTT broker, HTTP API, live WebSocket.

## Rules owned

| Rule                                                                                                                                                                                       | Where                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Attention reasons and their order (emergency stop, error at URGENT or above, battery below the critical threshold while not charging, stopped with a task longer than the stuck threshold) | `robot/attention.ts` `deriveAttentionReasons`, `attentionReasonOrder` |
| Attention priority per reason (high: emergency stop, reported error, critical battery; medium: stopped with a task); groups sort by priority, then size                                    | `robot/attention.ts` `attentionPriority`, `robot/aggregates.ts`       |
| Staleness (no report for longer than 3 × the report interval)                                                                                                                              | `robot/status.ts` `isStale`                                           |
| Status precedence (offline, attention, charging, working, idle)                                                                                                                            | `robot/status.ts` `deriveStatus`                                      |
| Fleet counts per status and site; attention groups and their worst robot                                                                                                                   | `robot/aggregates.ts` `computeAggregates`                             |

Thresholds come from `config.ts` (environment variables with defaults) and are sent to the console in the snapshot.
