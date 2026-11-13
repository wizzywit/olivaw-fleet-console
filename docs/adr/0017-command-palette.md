# 0017. Command palette

- Status: accepted
- Date: 2026-11-13

## Context

Operators who know what they want should not have to scroll a list of 1,200 robots or click through chips. The spec asks for a ⌘K palette with three groups (robots, filters, actions) where Tab turns a search into a filter.

## Decision

- `shared/ui/CommandMenu` wraps React Aria `Autocomplete` with a sectioned `Menu` inside a `Modal`: arrow keys move, Enter runs, Escape clears and then closes, focus returns to where it was. It knows nothing about robots.
- The palette lives in the `app-header` widget (`use-cases/useCommandPalette.ts`), because the header owns search and the ⌘K hint; a separate widget would need shared open state for one consumer.
- Robots: at most 8, matched with the same rules as the fleet search (`matchesFleetSearch` in `features/filter-fleet`), most urgent first.
- Filters (fleet page only): one entry per status and "Search the fleet for …"; Tab does the same from anywhere.
- Actions: switch table and grid (fleet page), go to the fleet (other pages), pause or resume live updates, switch theme.
- ⌘K or Ctrl+K opens it anywhere, even inside a text field; the ⌘K hint inside the header search field opens it with the pointer.
- Robot commands such as "Send to dock" are not palette actions yet: they stay on the robot page, which selects the robot first and checks the live connection.

## Options considered

- A library such as cmdk: polished, but a second accessibility model next to React Aria.
- Building the combobox by hand: more code to get focus and announcements right.
- React Aria `Autocomplete` + `Menu` (chosen): same primitives as the rest of the UI.

## Consequences

- One matcher for search and palette; a change to the query syntax reaches both.
- View mode moved to `features/switch-fleet-view` so the page and the palette share it; the `g` shortcut is registered once, by the page.
- Contextual robot commands (only when one robot is in context, with the robot id in the label and the same confirmation as the detail page) are the next step if needed.
