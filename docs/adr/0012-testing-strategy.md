# 0012. Testing strategy

- Status: accepted
- Date: 2026-11-13

## Context

The code that matters most is the business rules (status, attention, freshness), the protocol boundary (malformed messages from many vendors), and the live journeys (patches, reconnects, held order). Tests should prove those, not the mocks around them.

## Decision

Test each layer with the kind of test that fits it (`apps/web/ARCHITECTURE.md` §10):

| Layer                            | Test                                                                                 | Examples                                                                                                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain services (ingest and web) | Vitest unit tests, no mocks, exact boundaries                                        | stale after exactly 3000 ms vs 3001 ms; battery 15% vs 14.9%; stuck after 120 000 ms vs 120 001 ms; patch sequence rules; stable ordering                                                                                                                              |
| Adapters                         | Vitest with fixtures from the official VDA 5050 3.0 schemas and the console contract | 3.0 field mapping; 2.x message rejected; out-of-range battery dropped and logged; serial/topic mismatch dropped                                                                                                                                                        |
| Ingest end to end                | Integration test against the real service on random ports                            | real MQTT publish → snapshot; live patch over WebSocket; last will → offline; resync; 404; command validation                                                                                                                                                          |
| Web journeys                     | React Testing Library with MSW for HTTP and WebSocket                                | overview shows sites, attention groups and urgency order; chips filter and update the URL; a live patch updates a row in place; held order and re-sort; empty and error states; resync refetches; detail page, unknown robot, commands disabled while the link is down |
| Design-system components         | RTL by role, name and state                                                          | disabled buttons, radio-group chips, meter names, Escape clears search                                                                                                                                                                                                 |

Practices:

- Tests are written first and watched failing. Where a test was written after its code, a mutation (breaking the behavior on purpose) proved the test catches it; these cases are listed in the README.
- Time is injected (`now`), so no test sleeps on real clocks except the live socket journeys, which wait for conditions.
- jsdom has no layout, so the web test setup stubs element sizes for the virtualized table.

## Options considered

- Mock-heavy unit tests of use cases and repositories: fast, but they mostly test the mocks.
- End-to-end only: realistic, but slow and poor at pinning boundaries.

## Consequences

- 305 tests across the workspace run in seconds.
- Playwright end-to-end tests (`apps/e2e`, `pnpm test:e2e`, a separate CI job) run against the real system: ingest, a 300-robot simulator and a production build. They cover the live overview, opening a robot from the keyboard, losing and regaining the live connection (`page.routeWebSocket`), and axe checks against WCAG 2.2 A/AA on the overview, grid, palette and robot detail in light and dark. Local runs use the installed Chrome; CI installs Playwright's Chromium.
