# 0010. React Aria Components for interactive primitives

- Status: accepted
- Date: 2026-11-13

## Context

The console relies on keyboard use and screen readers: chip filters, search, buttons, meters, and in tier 2 a command palette (combobox and listbox) and a keyboard-navigable grid. Getting focus management and ARIA roles right by hand is a large, risky amount of code.

## Decision

Interactive components in `shared/ui` are built on React Aria Components and styled with CSS Modules through their `data-*` state attributes (`[data-focus-visible]`, `[data-selected]`, `[data-disabled]`). Lint keeps `react-aria-components` inside `shared/ui`, so the rest of the app depends on our components, not on the library.

Notable outcomes:

- A single-choice chip group renders as a `radiogroup` of `radio` items with `aria-checked`, which is the correct semantics for "pick exactly one status" (the design system README had described `aria-pressed`; the code follows the library's more accurate pattern).
- The battery value uses `role="meter"` with an accessible name that states the meaning ("Battery 12%, below the 15% threshold"), so the bar is not the only carrier of information.

## Options considered

- React Aria Components (chosen): the most complete accessibility, combobox and grid support, unstyled.
- Radix Primitives: smaller API; no combobox and no keyboard grid, so the palette and grid would be hand-built.
- Own components: full control, most risk.

## Consequences

- Behaviour such as Escape-to-clear, arrow-key movement in groups and focus-visible handling comes from the library and is covered by component tests.
- Bundle size is larger than Radix; acceptable for an internal operations console.
