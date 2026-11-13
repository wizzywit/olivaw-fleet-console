# Olivaw fleet console

A live console for a mixed fleet of service robots from different manufacturers: a simulator that speaks VDA 5050 3.0 over MQTT, an ingest service that turns telemetry into one vendor-neutral model and decides what needs attention, and a Next.js console that shows the fleet and one robot in detail, live.

```bash
pnpm install
pnpm dev          # ingest on :4000 (MQTT :1883), 1,200 simulated robots, console on http://localhost:3000
pnpm demo:10k     # the same with 10,000 robots and a production build of the console
```

Node 24 and pnpm 12 are required. `pnpm test`, `pnpm lint`, `pnpm typecheck` and `pnpm build` run across the workspace.

## What a fleet manager needs, and what it does not

I started from the fleet manager's job, not from features: someone who glances at the console between other work and needs to know quickly whether anything needs them. The full reasoning, with sources, is in [docs/product/needs-analysis.md](docs/product/needs-analysis.md). In short:

- **Needs:** problems first, each with a priority and the action expected; honest freshness (last-known values clearly marked, a banner when the console's own link drops); fast at thousands of robots; rows that never move under your hands; keyboard and screen-reader support; light and dark.
- **Does not need here:** a fleet-wide map as the default (it answers "where", not "what's wrong"), animating every robot, historical analytics.
- **Core need, deferred for scope:** notifications, alert rules and incident handling. A console that is only glanced at cannot tell anyone what happened while they looked away, so this is the first thing to build next. The attention groups already carry reason, priority and required action, which is what an alarm needs.

## What I built, and why

All three parts of the challenge, with most of the effort on the frontend:

```
apps/simulator ──MQTT (VDA 5050 3.0)──▶ apps/ingest ──REST snapshot + WebSocket patches──▶ apps/web
```

- **Simulator** (`apps/simulator`): 1,200 seeded robots across three sites and five made-up vendors. Batteries drain and charge, robots get stuck, report errors, hit emergency stops and drop off the network. Each robot has its own MQTT connection with a `CONNECTION_BROKEN` last will, as VDA 5050 intends.
- **Ingest** (`apps/ingest`): an embedded MQTT broker; a VDA 5050 adapter that validates every message and maps it to a vendor-neutral observation; the robot domain that decides status, attention reasons and priority; a stale sweep; and a console API: a snapshot over REST, then coalesced, sequenced patches every 500 ms over WebSocket with resume and resync.
- **Console** (`apps/web`): fleet overview (site tiles, attention groups, a filterable virtualized table) and robot detail (status, alert, battery, map position, errors, raw protocol message, commands), with connection-lost, empty, loading and error states.

Why this shape: the role is frontend-focused, but the interesting frontend problems here (live data, freshness, scale) only show up against a real stream. A thin real backend made those problems real instead of simulated in a fixture.

### Frontend architecture

Feature-Sliced Design decides where code lives, and five layers inside each slice decide what code may do ([apps/web/ARCHITECTURE.md](apps/web/ARCHITECTURE.md)):

```
src/
  app/        providers, root layout (no business code)
  pages/      fleet-overview, robot-detail
  widgets/    app-header, live-connection-banner
  features/   filter-fleet, toggle-theme
  entities/   robot, fleet
  shared/     ui (design system), api, lib, config
```

Inside a slice: `ui` (views) → `use-cases` (view models) → `repository` (TanStack Query for server state, one Zustand store for live robots) and `services` (business rules, pure) → `adapter` (the only code that talks to HTTP, WebSocket or storage).

The rules are enforced by lint, not just written down: `eslint-plugin-boundaries` checks segment rules within a slice and lower-layer-public-API-only across slices; `no-restricted-imports` keeps Zustand and TanStack Query in repositories and React Aria in the design system; Steiger adds the FSD checks it supports. Each rule was tested with deliberate violations (ADR 0003).

### Decisions

Every significant decision has an ADR in [docs/adr](docs/adr), including the options I rejected:

| ADR                                                                  | Decision                                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [0001](docs/adr/0001-monorepo-thin-ts-backend.md)                    | Monorepo with a thin TypeScript backend                                       |
| [0002](docs/adr/0002-nextjs-used-deliberately.md)                    | Next.js, with the server only for the first snapshot                          |
| [0003](docs/adr/0003-fsd-five-layers-in-nextjs.md)                   | FSD and five layers inside Next.js, enforced by lint                          |
| [0004](docs/adr/0004-vda5050-and-second-protocol-behind-adapters.md) | VDA 5050 3.0 behind adapters (and two bugs found in the official 3.0 schemas) |
| [0005](docs/adr/0005-embedded-mqtt-broker.md)                        | Embedded MQTT broker for real last-will semantics                             |
| [0006](docs/adr/0006-live-transport-snapshot-and-patches.md)         | Snapshot plus sequenced patches over WebSocket                                |
| [0007](docs/adr/0007-state-split.md)                                 | TanStack Query, Zustand, Context and the URL, each for one kind of state      |
| [0008](docs/adr/0008-status-rules-owned-by-backend.md)               | Status rules owned by the server; the client owns freshness only              |
| [0009](docs/adr/0009-css-modules-with-token-variables.md)            | CSS Modules with generated design tokens                                      |
| [0010](docs/adr/0010-react-aria-primitives.md)                       | React Aria for accessible primitives                                          |
| [0011](docs/adr/0011-rendering-large-fleets.md)                      | Rendering large fleets                                                        |
| [0012](docs/adr/0012-testing-strategy.md)                            | Testing strategy                                                              |
| [0013](docs/adr/0013-commit-convention.md)                           | Commit convention                                                             |
| [0014](docs/adr/0014-react-compiler-and-render-performance.md)       | React Compiler and render performance                                         |
| [0015](docs/adr/0015-theme-from-cookie-and-system-preference.md)     | Theme from a cookie and the system preference                                 |
| [0016](docs/adr/0016-shared-acknowledgement.md)                      | Shared acknowledgement of attention groups                                    |
| [0017](docs/adr/0017-command-palette.md)                             | Command palette                                                               |
| [0018](docs/adr/0018-lean-fleet-stream.md)                           | A lean fleet stream                                                           |

## What I faked or left out, and why that was the right trade

- **Commands are accepted but not forwarded.** "Send to dock" and "Pause" are validated and logged by ingest; translating them into VDA 5050 `order`/`instantActions` is the production step. The UI path (disabled while the link is down, confirmation) is real.
- **Sites, maps and vendors are static demo data** (`packages/demo-world`). In production they are customer configuration.
- **No authentication or tenants.** Essential in production, but they add nothing to what this exercise shows.
- **In-memory state only.** History (battery trend, trail, activity) needs storage; it is the next tier.
- **One protocol so far.** The adapter seam is built and documented for a second (MassRobotics); it is the next tier.

### Build tiers

The work was planned in vertical slices so that whatever is finished is complete:

1. **Core (done):** everything above.
2. **Scale (in progress):** a canvas grid view of the whole fleet with keyboard navigation, a measured 10,000-robot profile, a command palette, shared acknowledgement of attention groups.
3. **Depth:** MassRobotics as a second protocol, SQLite history (battery chart, trail, activity), mobile layout, Playwright end-to-end tests with axe in both themes.

## Performance at 10,000 robots

Measured with `pnpm demo:10k` (production build, 10,000 simulated robots reporting once a second) in Chromium on an Apple M1 Pro with 32 GB. Long frames are from the Long Animation Frame API; interaction times from the Event Timing API.

Table: Before and after the fixes in ADR 0018 and the grid redraw change.

| Measure                                 | Before                 | After                |
| --------------------------------------- | ---------------------- | -------------------- |
| Robots per patch                        | 9,713 of 10,000        | 358                  |
| Live stream                             | 1,063 KB/s             | 29 KB/s              |
| Snapshot                                | 4.3 MB, 175 ms         | 3.6 MB, 67 ms        |
| Table, idle: frames over 33 ms in 10 s  | 10 (about 65 ms each)  | 0 (worst 15 ms)      |
| Grid, idle: frames over 33 ms in 10 s   | 10 (about 100 ms each) | 1 to 5 (worst 56 ms) |
| Grid, arrow keys: key events over 16 ms | 63 of 70 (worst 64 ms) | 1 of 70 (40 ms)      |
| Typing in search and in the palette     | worst 32 ms            | not re-measured      |

What the profile found and what changed:

- **Patches carried the whole fleet.** Every report moved `lastReportAt` and every moving robot moved `position`, fields the overview does not show at that rate. Position now comes with the robot detail, and the report time rides along with real changes (ADR 0018).
- **Moving focus redrew 10,000 cells.** The grid canvas now redraws only when robots, layout or theme change; the focus outline is a separate element on top.
- **One patch per second, not two.** The simulator publishes all robots in one burst per second, so every second 500 ms window is empty. That is the simulator's rhythm, not ingest falling behind.

The spec's target, input delay under 100 ms at 10,000 robots, holds before and after; the fixes remove the once-a-second long frames and cut the stream by 36 times.

## At 100×

What breaks first with hundreds of thousands of robots, and what I would change:

- **One process, one event loop.** Move to an external MQTT broker cluster with shared subscriptions and run several ingest instances, sharded by site.
- **Every console gets every change.** Add per-view subscriptions: the overview gets coalesced summaries, a detail page subscribes to one robot at full rate (today it refreshes its detail every second; position already left the fleet stream, ADR 0018). Fan out through a pub/sub layer.
- **The client holds the whole fleet.** At 100k, filter, sort and page on the server and keep only the visible window on the client.
- **History in memory.** Use a time-series store with downsampling.

## Testing

227 tests: exact-boundary unit tests for every rule, adapter tests against fixtures from the official schemas, an ingest integration test over real MQTT and WebSocket, and React Testing Library journeys with MSW for HTTP and WebSocket ([ADR 0012](docs/adr/0012-testing-strategy.md)). Tests were written first; where one was written after its code, I broke the behavior on purpose to see it fail (the resync handler, the disabled command buttons).

I also ran the whole system in a browser: live updates, filters, the held order, the detail page, and killing and restarting ingest while the console was open. That run found two real bugs that unit tests had missed: a hydration mismatch in the theme toggle and simulated robots not reconnecting after a broker restart. Both are fixed, with a regression test for the first.

## How I used AI tools

I used Claude Code as a pair: research (VDA 5050 3.0, Open-RMF, MassRobotics; evidence for the UI claims), drafting, and implementation from a written plan. What kept it honest:

- Every decision is mine and written down with alternatives (ADRs, needs analysis).
- Primary sources over memory: the VDA 5050 schemas were read from the official repository; that is how the two schema bugs and a wrong field name in an early draft were caught.
- Tests first, architecture enforced by lint, small commits, and a review of every change. I asked for several structural changes along the way (the store as a module singleton, repositories as hooks only, rules moved into services with single owners, React Compiler), each recorded in the history.

## With more time

Tiers 2 and 3 above, then notifications and incident handling, real command execution, authentication and tenants, and an on-prem build (`output: 'standalone'`).
