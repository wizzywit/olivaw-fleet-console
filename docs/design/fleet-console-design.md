# Olivaw fleet console: design

Date: 2026-11-13 · Status: draft for approval

## 1. Intent

A take-home for Olivaw Robotics (Senior Full Stack Engineer, frontend focus). The CTO reviews it for structure, naming, boundaries, tests and commit history, then the on-site deep dive walks through it line by line. The goal is to show frontend expertise at architecture level: a console for a large mixed fleet that feels simple, stays fast as the fleet grows 100×, is accessible, and is built with visible, defensible decisions. The backend is thin but real, so the conversation about ingestion, storage and scale has code behind it.

Every line must be explainable by the author. Prefer less code that is clearly right over more code.

### The brief (Olivaw Engineering Challenge)
- Three parts: robot simulator, server side (ingestion, storage, business logic behind an interface), user interface (state of the fleet, one robot in detail). Pick at least one; whatever is built must run; the rest may be faked.
- "Note that we have described what the system is for, not what it must do": deciding what the system needs is part of the challenge.
- Time: "should not take more than few hours", longer only by choice. Tooling: "Anything you like, AI included", but the candidate must stand behind every decision.
- Delivery: a repository link. The README must say what was built and why, what was faked or left out and why that was the right trade, and what would change with more time or in production.
- From the candidate pack: the CTO reads structure, naming, boundaries and commit history; "single-commit, AI-generated submissions don't land well"; frontend candidates should go beyond a list and a detail page and show how the UI stays fast with a very large fleet.

Working out what the system needs and does not need is part of the challenge, and is documented in `docs/product/needs-analysis.md`: the fleet manager's questions, what each part (simulator, server, UI) therefore needs and deliberately does not, and a trace from each need to this design and its build tiers. Goals and non-goals below follow from it.

## 2. Goals, non-goals, anti-goals

Goals
- Fleet overview (table and grid views) and robot detail, with the states a real console needs: live, stale, connection lost, empty results.
- Live updates from simulated robots that speak real robot protocols, normalised to one vendor-neutral model.
- Holds up with 10,000 simulated robots on a laptop, with a written path to 100,000.
- Accessible (WCAG 2.2 AA), light and dark themes, keyboard first.
- Clean FSD + five-layer architecture, enforced by lint.
- Tests at the right level for each layer; Playwright for critical flows.
- Small, conventional commits; ADRs for every significant decision; a README that answers the challenge's questions.

Non-goals
- Sending real commands to robots (actions like "Send to dock" are wired to a stub endpoint that records the request).
- Authentication, multi-tenancy, user management.
- Maps editing, orders and task planning, building integrations, the Skill Store.
- Production deployment and infrastructure.

Anti-goals (would make this a failure even if it works)
- A single big commit, or commits that read as AI-generated.
- Code the author cannot explain; clever abstractions with one user.
- Business rules duplicated across slices or layers.
- A console that reorders rows under the user's cursor or hides that data is stale.
- `any`, unchecked casts, or comments restating the code.

## 3. Constraints (decided)

- Monorepo in `/Users/wep/WebstormProjects/olivaw-fleet-console`, pushed to GitHub account `wizzywit` over SSH; commits authored with `wisdompraise968@gmail.com` (repo-local git config).
- Commit messages: Conventional Commits with scopes, title only, no body, no AI references or co-author trailers. Enforced by commitlint and a Husky `commit-msg` hook.
- TypeScript strict everywhere, no `any` (lint rule `@typescript-eslint/no-explicit-any: error`, plus `no-unsafe-*` rules).
- Frontend: Next.js (App Router), React 19, TanStack Query for server state, Zustand for frequently changing client state, React Context for rarely changing values.
- FSD + five-layer architecture exactly as in `FRONTEND_ARCHITECTURE.md` (to be copied into the repo as `apps/web/ARCHITECTURE.md`).
- Styling: CSS Modules reading CSS custom properties generated from the design-system tokens. Each component in its own folder with its `.module.css` and test beside it.
- Accessible primitives: React Aria Components.
- Comments only where the code cannot say it.

## 4. Approaches considered

| Decision | Options | Picked | Why |
| --- | --- | --- | --- |
| Scope | Frontend only with a faked backend · thin real TS backend · Go backend | Thin real TS backend | Frontend gets most of the time; ingestion, storage and the 100× story still have real code |
| Framework | Vite + React · Next.js | Next.js, used deliberately | Matches Olivaw's stack and the role ("Next.js at architecture level"); server only prefetches the first snapshot through the same repository and adapter, so the five-layer rules hold |
| Protocols | VDA 5050 at the edge · plus a second protocol · own JSON | VDA 5050 3.0 plus a second protocol | Proves the vendor-neutral thesis in running code: two protocols in, one model out |
| Commits | Conventional with scopes · without scopes | With scopes | History shows where each change landed |
| Styling | Tailwind v4 · CSS Modules · vanilla-extract | CSS Modules | Clean markup, plain CSS, no build magic |
| Primitives | React Aria · Radix · own | React Aria | Most complete accessibility, combobox and grid support, unstyled with `data-*` states |
| Design | Five directions on the canvas | Mix: Calm Ledger overview, Telemetry Grid scale view, Live Floorplan detail | Attention-first overview, a view that scales to 100k, a rich single-robot story |

References: design canvas "Olivaw Fleet Console Directions" (https://claude.ai/artifact/Bx9YVdqAFKWqtW42Mprf7b, section "Final direction"), design system "Olivaw Console" (https://claude.ai/artifact/3woV2rTdfDWTHxMQmcRoLy). Where the canvas screens and the design-system tokens differ (border and idle colours), the design system wins.

## 5. The product

### Fleet overview (`/`)
- Header: product name, main navigation, search with ⌘K hint, live connection status, theme toggle. Navigation has only real destinations: "Fleet" (`/`) and "Needs attention" with its count (`/?status=attention`). Sites are the tiles on the overview, not a separate page. No dead links.
- Site summary: one tile per site with a status distribution bar and counts. Tiles filter the fleet.
- "Needs your attention": robots needing attention, grouped by reason, with count, worst example and one action per group.
- Robot list as a table (default) or grid (one cell per robot, grouped by site). The view, filters and sort live in the URL so a view can be shared and survives reload.
- Status filter chips with live counts; text search and filter syntax (`site:`, `status:`, `battery:<20`, `vendor:`).
- Live behaviour: values update in place; ordering changes are held while the user interacts (hover, focus or keyboard in the list) and shown as "Order paused · N updates · Re-sort".
- Keyboard: `j`/`k` move, `Enter` opens, `g` toggles grid, ⌘K opens the command palette.

### Robot detail (`/robots/[robotId]`)
- Breadcrumb, ID, status badge, vendor, model, serial, site and zone, protocol it speaks.
- Primary action "Send to dock" (stub), secondary "Pause" (stub), more menu.
- Alert banner when the robot needs attention, with what happened, the estimate and context.
- State tiles: battery with time-left estimate, operating mode and speed, current order progress, telemetry rate.
- Battery chart (1 h / 6 h / 24 h) with the warning threshold line.
- Activity: status changes and errors over time.
- Location: site floor map with the robot's position, heading and recent trail.
- Reported errors, and the raw last message in its original protocol (collapsible).

### States
- Connection lost: banner with reconnect countdown and "Retry now"; every value shown as last known (stale badge variant, greyed values); actions disabled.
- Robot stale: a robot whose reports stop becomes Offline after the stale threshold, even before the broker reports it.
- No results: removable filter chips, an explanation, a next step.
- Loading: skeletons sized like the content; no layout shift when data arrives.
- Error: a failed snapshot request shows a retry with the error in plain words.

### Command palette (widget)
Groups: robots, filters, actions. `Tab` turns a search into a filter. Built on React Aria combobox/listbox patterns.

### Mobile
Attention-first single column, bottom navigation. Table becomes a list of robot rows; grid stays available.

## 6. Domain

### Model (vendor neutral)
`Robot`: `id`, `displayName`, `vendor`, `model`, `serialNumber`, `protocol` (`vda5050` or `massrobotics`), `siteId`, `zone`, `status`, `attention` (reasons, or none), `battery` (`percent`, `charging`, `rangeMeters?`), `position` (`x`, `y`, `headingRad`, `mapId`), `speedMps`, `operatingMode`, `currentTask?` (`id`, `progress`), `errors` (normalised level and code), `lastReportAt`, `connection` (`online`, `offline`, `broken`).

`Site`: `id`, `name`, `maps` (id, name, floor outline for the map view).

### Status rules (one owner: backend `robot` domain)
Status is one of `working`, `charging`, `idle`, `attention`, `offline`, in this precedence:
1. `offline` when the connection is `broken` or `offline`, or no report for longer than `staleAfter` (default 3 × the expected report interval).
2. `attention` when any attention reason applies:
   - `battery-critical`: battery below the critical threshold (default 15%) and not charging
   - `error-reported`: an error at level URGENT, CRITICAL or FATAL (VDA 5050) or the equivalent normalised level
   - `emergency-stop`: an active emergency stop
   - `stuck`: has a task, not moving, for longer than the stuck threshold (default 2 min)
3. `charging` when charging.
4. `working` when it has an active task or is driving.
5. `idle` otherwise.

The server owns status, attention reasons, aggregates and attention groups. It runs a stale sweep every second, so a silent robot becomes `offline` on the server and the change reaches the client as a normal patch; counts, groups and rows always agree. Thresholds are sent in the snapshot for display (for example the warning line on the battery chart).

The client owns one rule, data freshness: when its own live connection is lost, everything on screen is shown as last known (stale badge variant, greyed values, age since the last patch) and actions are disabled. It does not flip robots to `offline`, because the problem is the console's link, not the robots. The client never recomputes status, counts or groups; its attention list renders the server's groups.

### Protocol adapters (ingest service)
- Source of truth for VDA 5050: the official 3.0.0 JSON schemas in github.com/VDA5050/VDA5050 (tag `3.0.0`, commit e9ba560; `json_schemas/state.schema`, `connection.schema`, `visualization.schema`), already checked on 2026-11-13. Pin to that tag and keep copies of the example messages as fixtures; the VDA PDF wins if it differs.
- VDA 5050 3.0: `state`, `visualization`, `connection` over MQTT (`vda5050/v3/{manufacturer}/{serialNumber}/{topic}`). Mapping uses 3.0 names: `powerSupply`, `mobileRobotPosition`, `errors[].errorLevel` (WARNING, URGENT, CRITICAL, FATAL), `operatingMode`, `safetyState.activeEmergencyStop`, `driving`, `orderId`. The connection last will (`CONNECTION_BROKEN`) drives the broken connection state.
- Second protocol: MassRobotics AMR Interoperability Standard status messages over WebSocket, as that standard specifies. First implementation task: read its published schema (github.com/MassRobotics-AMR/AMR_Interop_Standard) and map only fields we use. If the schema cannot be confirmed, use a small documented "vendor JSON over WebSocket" format instead and say so in the ADR.
- Each adapter has fixture tests built from the specs' example messages.

## 7. System architecture

```
apps/simulator ──MQTT (VDA 5050)──▶ apps/ingest ──REST + WebSocket──▶ apps/web
               ──WS (MassRobotics)─▶   │
                                       └─ SQLite (history)
```

Monorepo with pnpm workspaces.
- `apps/web`: Next.js console.
- `apps/ingest`: Node + TypeScript service. Embedded MQTT broker (Aedes) and a WebSocket endpoint for robots; protocol adapters; robot domain (status rules); in-memory latest-state store; SQLite history via `node:sqlite`; HTTP API and live WebSocket for the console.
- `apps/simulator`: Node + TypeScript. Simulates N robots across 3 sites and 5 vendors with deterministic seeds: battery drain and charge cycles, tasks, movement on site maps, injected faults (low battery, stuck, errors, emergency stop) and dropouts (closing the MQTT connection fires the last will). Configurable count and rate.
- `packages/contracts`: the console API contract (DTO types and zod schemas) shared by ingest and web. The web adapter still maps DTOs to its own domain types.
- `packages/protocols`: VDA 5050 3.0 and MassRobotics message types (the subset we use), shared by simulator and ingest.

Console API
- `GET /api/fleet` → snapshot: all robots (compact), sites, aggregates (counts by status and site, attention groups), config (thresholds), and a `sequence` number.
- `GET /api/robots/:id` → full robot including the last raw message.
- `GET /api/robots/:id/history?range=1h|6h|24h` → downsampled battery series and events.
- `POST /api/robots/:id/commands` → stub, records the request, returns 202.
- `WS /live` → batched patches every 500 ms: changed robots only (field-level), updated aggregates, `sequence`. On reconnect the client sends its last sequence; the server replies with patches since then or tells it to refetch the snapshot.

Storage
- Latest state in memory (a map by robot ID) is the source for snapshots and patches.
- History in SQLite: battery and position samples downsampled to one per robot per 10 s, status changes and errors as events, kept 24 h. The history endpoint returns the battery series, the position trail (last 10 minutes) and events; the detail page appends live positions to the trail.

Scale notes (README "at 100×")
- Coalescing per window bounds the patch rate by robots changed, not messages received.
- Aggregates are computed on the server, so the client never scans 100k robots to draw counts.
- Next steps beyond this build: server-side filtering and paging for the table, subscription per view (detail gets high rate, overview gets coalesced), sharding ingest by site, a real broker cluster and a time-series store.

## 8. Frontend architecture

FSD layers with the five segments, as in `FRONTEND_ARCHITECTURE.md`. Next's routing folder `app/` lives at the web app root as thin route files that re-export pages from `src/pages`; an empty root `pages/` folder stops Next treating `src/pages` as the Pages Router (verify against the FSD Next.js guide during scaffolding; record the outcome in the ADR).

Initial slices (pages first; move down only when a second consumer exists):
- `pages/fleet-overview`, `pages/robot-detail`
- `widgets/app-header`, `widgets/command-palette`
- `features/filter-fleet` (used by overview table, grid and palette), `features/toggle-theme`, `features/send-robot-command` (detail, attention list, palette)
- `entities/robot` (types, repository, presentational status badge; services only for client-owned rules such as last-known display and the battery time-left estimate), `entities/site`, `entities/live-connection` (connection state and reconnect)
- `shared/ui` (design-system components, one folder each), `shared/api` (HTTP client, WebSocket client with backoff), `shared/lib` (formatting, time), `shared/config`, `shared/styles` (tokens.css generated from the design-system tokens, global reset)

State
- TanStack Query: fleet snapshot, robot detail, history. Query keys next to their repositories. The route's server component prefetches the snapshot through the same query options and passes it with `HydrationBoundary`.
- Zustand: the live robot map, patched from the WebSocket at most once per animation frame; components subscribe per robot or per derived slice so a patch re-renders only affected rows. Also the "order paused" queue.
- Context: theme, live-connection client instance.
- URL: view, filters, sort.

Performance
- Table virtualized with TanStack Virtual, semantic `<table>` kept, `aria-rowcount`/`aria-rowindex`.
- Grid drawn on a canvas (one draw per frame), with one tab stop and arrow-key navigation and an announced focused robot.
- Derived lists (filtered, sorted) memoised from store slices; sorting only on explicit re-sort or filter change while live.
- Measured target: 10,000 robots at 1 Hz stays interactive (input delay under 100 ms) on a laptop; documented with a profile in the README.

## 9. Code quality rules (apply to every layer, checked in every task)

- Before writing a service, repository, use case, hook or component: search the codebase for similar logic by name patterns (`is*`, `can*`, `calculate*`, `to*`, `use*`) and domain words.
- If similar logic exists, reuse it, extend it to cover the new case, or move it to its rightful owner in the same change (entity for domain rules used by two or more slices; `shared/lib` for logic without business meaning). Never add a second version.
- One file per business concept in `services/`; each entity README has a "Rules owned" list kept current.
- Every implementation step ends with a consolidation check: does anything just written duplicate or overlap existing code, and does anything now have a second consumer and need to move down?
- Safety nets in CI: Steiger (FSD rules), `eslint-plugin-boundaries` (segment rules), jscpd (copy detection), typecheck, tests.

## 10. Testing

- Domain services (web and ingest): Vitest unit tests without mocks, boundaries covered (exactly at threshold, exactly stale).
- Adapters: Vitest with fixtures (VDA 5050 and MassRobotics example messages; console API responses).
- Journeys: React Testing Library with MSW (HTTP and WebSocket mocks): overview shows attention groups; filter narrows the list; live patch updates a row without reordering while focused; connection loss shows stale state.
- Ingest integration: start the service, publish VDA messages with an MQTT client, assert snapshot and patches.
- End to end (Playwright, against simulator + ingest + web): overview loads and shows live data; open a robot from the attention list; connection lost and recovered; axe accessibility checks on each screen in both themes.

## 11. Delivery

- GitHub repository under `wizzywit` (visibility to confirm before creating).
- CI with GitHub Actions: install, lint (ESLint, Steiger, jscpd, stylelint), typecheck, unit and integration tests, build, Playwright.
- `docs/adr/` with numbered ADRs (MADR format). Planned: 0001 monorepo and thin TS backend · 0002 Next.js used deliberately · 0003 FSD + five layers in Next.js · 0004 VDA 5050 3.0 and second protocol behind adapters · 0005 MQTT broker embedded with Aedes · 0006 live transport: snapshot + sequenced patches over WebSocket · 0007 state split: TanStack Query, Zustand, Context, URL · 0008 status rules owned by the backend, freshness on the client · 0009 CSS Modules with token variables · 0010 React Aria · 0011 rendering large fleets (virtual table, canvas grid) · 0012 testing strategy · 0013 commit convention.
- README: what was built and why, what was faked or left out and why, how to run (one command), the 100× section, what I would do with more time.
- One command to run everything locally (`pnpm dev` starts simulator, ingest and web).

## 12. Build order (decided: tiered vertical slices)

Each slice works end to end, has its tests and ADRs, and is committed in small steps before the next one starts. If time runs out, what remains of the last tier moves to the README's "with more time" section instead of shipping half-built.

1. Core: monorepo and tooling (lint, boundaries, commitlint, CI) · design tokens and the `shared/ui` components the core needs · VDA 5050 simulator → ingest (adapter, status rules, stale sweep, in-memory store) → snapshot API and live patches → overview table with site tiles, attention groups, filters and search → robot detail (without history) → connection-lost and empty states · unit, adapter and journey tests · ADRs for every decision made in this tier.
2. Scale: canvas grid view with keyboard navigation · 10,000-robot profile and fixes · command palette.
3. Depth: MassRobotics second protocol · SQLite history (battery chart, trail, activity) · mobile layout · Playwright end-to-end with axe in both themes.

## 13. My calls (override any while reviewing)

- Repo name `olivaw-fleet-console`.
- SQLite via Node's built-in `node:sqlite` (available in the installed Node 24), no ORM.
- Aedes as the embedded MQTT broker; WebSocket (not SSE) to the console because the client sends its last sequence on reconnect.
- 500 ms patch window; stale threshold 3 × report interval; critical battery 15%; stuck after 2 minutes.
- Default simulator: 1,200 robots, 3 sites, 5 vendors, ~80% VDA 5050 and ~20% MassRobotics; a `--robots 10000` flag for the performance demo.
- zod for runtime validation at every boundary (protocol messages, API responses).
- Robot IDs in the UI are illustrative; vendor names are made up.
- Server owns status, aggregates and attention groups (with a 1 s stale sweep); the client only marks data as last known when its own connection drops.
- Position samples stored every 10 s for the detail trail.
- Navigation has only "Fleet" and "Needs attention"; no Sites or Incidents pages.

## 14. Left to the builder

- Exact component APIs in `shared/ui` within the design-system guidelines.
- Simulator movement model details.
- Table columns beyond the designed ones.
- Exact chart implementation (SVG by hand or a small library), provided it meets the accessibility rules.
