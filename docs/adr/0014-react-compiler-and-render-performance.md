# 0014. React Compiler and render performance

- Status: accepted
- Date: 2026-11-13

## Context

The console re-renders often: patches arrive every 500 ms, relative times tick every second, and the fleet can reach thousands of robots. Hand-written `useMemo`/`useCallback` everywhere is noisy and easy to get wrong.

## Decision

- Enable the React Compiler (`reactCompiler: true` in `next.config.ts`, `babel-plugin-react-compiler` 1.0). It memoizes components and hooks automatically. `eslint-plugin-react-hooks` runs its compiler rules, so code that would stop the compiler shows up as a lint finding; the one known case is `RobotTable`, because TanStack Virtual is reported as incompatible, and it runs as plain React.
- Keep the structural performance choices the compiler cannot make:
  - Patches are applied once per animation frame (`fleetLiveStore`), so a burst is one render.
  - Components subscribe to store slices (one robot, the aggregates), so unrelated rows do not re-render.
  - The table is virtualized, so only visible rows exist in the DOM.
  - Counts come from the server, so the client never scans the fleet to count.
  - The clock that drives "5 s ago" labels is read only by visible rows: row view models carry the timestamp and the table formats it, so 1,000 hidden rows are not reformatted every second.
- Explicit `useMemo` remains where it marks a deliberate, expensive step (filtering and sorting the fleet).

## Options considered

- Manual memoization only: works, but noisy and fragile.
- React Compiler without structural changes: the compiler cannot batch network updates or virtualize lists.

## Consequences

- Fewer manual memo hooks to review.
- Tests run without the compiler (Vitest transforms without the Babel plugin); the production build and lint cover compiler compatibility.
- The 10,000-robot measurements and the fixes they led to are in the README ("Performance at 10,000 robots") and ADR 0018.
