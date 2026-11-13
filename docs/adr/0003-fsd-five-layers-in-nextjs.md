# 0003. Feature-Sliced Design and the five layers inside Next.js

- Status: accepted
- Date: 2026-11-13

## Context

`apps/web/ARCHITECTURE.md` combines Feature-Sliced Design (where code lives) with five layers inside each slice (view, use case, repository, services, adapter). Next.js has its own `app/` routing folder and would treat `src/pages` as a Pages Router, both of which collide with FSD's `app` and `pages` layers.

## Decision

- Next's routing lives in the root `apps/web/app/` as thin files that only re-export from `src/pages/<page>` (and `src/app/entrypoint` for the root layout).
- An empty root `apps/web/pages/` (with a README) stops Next from treating `src/pages` as routes.
- All FSD layers live under `src/`. The FSD `app` layer uses FSD's own segment names: `entrypoint` (root layout, providers) and `styles` (global styles, generated design tokens).
- Rules are enforced, not just written down, mostly by `eslint-plugin-boundaries`:
  - Inside a slice, segments follow ARCHITECTURE.md §4 (for example, a view may not import an adapter), and only within the same slice.
  - Across slices, only the public API (`index.ts`) of a lower layer may be imported: no upward, sideways or deep imports. Entities reach each other only through `@x`.
  - Only adapters may use `shared/api`; `no-restricted-imports` keeps Zustand and TanStack Query in `repository/` and React Aria in `shared/ui`.
  - Steiger runs as a second net for FSD rules. Two of its rules are off: Steiger only recognises FSD's `ui/api/lib/model/config` segment names, so it would reject the five-layer names this architecture requires and would not treat slices without a `ui` segment as slices.
- Live connection state lives in `entities/fleet` (its adapter owns the WebSocket) rather than a separate `entities/live-connection`, because only fleet data travels on that socket.

## Consequences

- The architecture is checked on every lint run. Probes with deliberate violations (upward, sideways, deep, entity-to-entity, view-to-adapter, view-to-shared/api) confirmed each rule fires, and a control probe confirmed the same-slice filter is evaluated.
- Known limits: lint cannot see through a slice's `index.ts` (a view importing another slice's repository hook through its public API is caught in review), and it cannot tell which entity an `@x` file is meant for.
- Known limit: lint cannot see through a slice's `index.ts`, so a view importing another slice's repository hook through its public API is caught in review, not by lint.
