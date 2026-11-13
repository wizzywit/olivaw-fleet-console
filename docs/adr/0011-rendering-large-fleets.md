# 0011. Rendering large fleets

- Status: accepted
- Date: 2026-11-13

## Context

The overview must stay usable with thousands of robots updating every second, without losing table semantics for screen readers or moving rows under the user's hands.

## Decision

- **Virtualized semantic table.** `RobotTable` keeps a real `<table>` (column headers, row headers, caption; the caption states the sort) and renders only the visible rows with TanStack Virtual, using spacer rows above and below. `aria-rowcount` and `aria-rowindex` tell assistive technology the true size.
- **Updates in place, order held while working.** Live patches change values in place. While the pointer or focus is in the list, the order is held (`services/stableOrder.ts`): new robots are appended, removed ones dropped, and "Order paused · N updates · Re-sort" offers the new order on request. Changing a filter re-sorts immediately because the user asked for it.
- **One frame per burst.** The live store applies queued patches once per animation frame, and components subscribe to slices, so a burst of patches costs one render of the affected rows.
- **Server-computed counts.** Site tiles, status chips and attention groups come from server aggregates; the client never scans the fleet to count.
- **Keyboard.** The table region is focusable; `j`/`k` or the arrow keys move the active row, Enter opens the robot, and a polite live line reads the active row.
- **Canvas grid (tier 2).** `RobotGrid` draws one cell per robot on a single `<canvas>`, grouped by site, in the same held order as the table. The canvas is hidden from assistive technology; the region around it is one tab stop with arrow keys, Home/End and Enter, and the live line reads the focused robot ("Hotel Isar, 4 of 179: DLV-0087, Needs attention, battery 12%"). Layout, movement and hit testing are pure services (`services/gridLayout.ts`). Each status has a shape as well as a colour (attention triangle, charging circle, offline hollow square, last-known hatch) and a legend explains them. Drawing happens once per animation frame, at device pixel ratio, with colours read from the theme tokens and redrawn when the theme changes.
- **View switch.** Table or grid lives in the URL (`view=grid`), switched with a segmented control or `g`.

## Options considered

- 10,000 DOM cells for the grid: simple hit testing and native focus, but every patch would touch thousands of nodes; one canvas costs one draw.
- Plain table without virtualization: simplest, but thousands of DOM rows make every update and scroll slow.
- A grid component library: features we do not need, and a weaker accessibility story than a semantic table.
- Div-based virtual list: easier positioning, but loses table semantics.

## Consequences

- jsdom has no layout, so tests stub element sizes to let the virtualizer render rows (see `src/test/setup.ts`).
- jsdom has no canvas, so grid tests drive the accessible layer and the layout services; drawing is checked in the browser.
- The 10,000-robot profile is recorded in the README.
