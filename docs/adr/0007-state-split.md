# 0007. Where state lives: TanStack Query, Zustand, Context, URL

- Status: accepted
- Date: 2026-11-13

## Context

The console has four kinds of state with very different lifetimes: the fleet snapshot (server state, fetched once and on resync), live robot values (change many times per second), a few long-lived objects (the store instance, theme), and the user's view (filters, sort, view mode) that should survive a reload and be shareable.

## Decision

- **TanStack Query** holds server state: the fleet snapshot and robot detail. The snapshot query keeps the wire DTO in the cache and maps it to the domain with `select`, so the server can prefetch and dehydrate it as plain JSON. `staleTime` is infinite because live patches keep it current; a `resync` invalidates it.
- **Zustand** holds live robots in one store created once at module level (`fleetLiveStore` in `entities/fleet/repository/fleetLiveStore.ts`) and imported directly by the repository hooks, as Zustand intends (its README: it "doesn't wrap your app in context providers"). The server never writes to it, because seeding happens in a client effect (`FleetLiveConnection`), so Zustand's warning about shared module state on the server does not apply. A `reset()` action keeps tests isolated. Patches are queued and applied once per animation frame, so a burst of updates causes one render. Components subscribe with selectors (one robot, the aggregates), so a patch re-renders only what changed. The queue is held while the tab is hidden or the user paused live updates, and applied in order when they resume.
- **React Context** holds values that rarely change and are not store-shaped: the theme.
- **The URL** holds filters, sort and view mode.
- Lint keeps `zustand` and `@tanstack/react-query` inside `repository/` segments (and the app providers).

Domain types reuse contract types where the shapes are identical (sites, aggregates, config) and map where they differ (robots: ISO strings become `Date`s, battery fields are grouped).

## Options considered

- Everything in TanStack Query (patching the cache with `setQueryData`): one tool, but every patch would rebuild a large cached object and re-render every subscriber.
- Everything in Zustand, including fetching: loses Query's request lifecycle, retries and dehydration.
- Redux Toolkit: capable, but more ceremony than this needs.

An earlier version wrapped the store instance in a React context; it was replaced because the context added indirection without a benefit here.

## Consequences

- Fetching, caching and live updates each have one owner; views read through use cases.
- Pausing, hidden-tab handling and resync are behavior of the store, covered by tests with an injected scheduler.
