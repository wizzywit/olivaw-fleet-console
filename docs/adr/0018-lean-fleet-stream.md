# 0018. A lean fleet stream

- Status: accepted
- Date: 2026-11-13

## Context

The 10,000-robot profile (README, "Performance at 10,000 robots") showed each patch carrying about 9,700 of 10,000 robots, about 1 MB per second. Two fields caused it: `lastReportAt` changed in 100% of robots per patch (every report moves it) and `position` in 84% (every moving robot). The overview shows neither at that rate: position appears only on the robot detail page, and "last report" matters for robots that stopped reporting. Applying a 1 MB patch cost the console about 65 ms of main thread per second in the table and about 100 ms in the grid.

## Decision

- `position` leaves the fleet summary and is part of the robot detail. The open detail page refreshes its detail every second, which is the simple form of "the detail page subscribes to one robot at full rate".
- `lastReportAt` stays in the summary but no longer decides whether a robot changed. It is sent along with any other change, including going offline, where it is the time of the robot's last report.
- The table's "Last report" column shows "Live" for robots that are not offline and the time since the last report for offline ones; the detail page shows the exact time from its refreshed detail.

## Options considered

- Rounding `lastReportAt` (for example to 10 s): fewer changes, but labels for live robots would jump between "just now" and "9 s ago".
- Keeping position in the stream and throttling it: still every moving robot every few seconds, for a value no overview view draws.
- Per-view subscriptions over the socket: the right shape at 100×, more protocol than this size needs.

## Consequences

- Patches carry only real changes: about 360 robots and 29 KB per second at 10,000 robots (from 9,700 robots and 1 MB). The snapshot shrank from 4.3 MB to 3.6 MB.
- The table applies patches without slow frames; the grid redraws its canvas only when robots change.
- A future overview view that needs live positions (the fleet map) has to subscribe to them, for one site at a time.
