# 0003. Feature-Sliced Design and the five layers inside Next.js

- Status: accepted
- Date: 2026-11-13

## Context

`apps/web/ARCHITECTURE.md` combines Feature-Sliced Design (where code lives) with five layers inside each slice (view, use case, repository, services, adapter). Next.js has its own `app/` routing folder and would treat `src/pages` as a Pages Router, both of which collide with FSD's `app` and `pages` layers.

## Decision

- Next's routing lives in the root `apps/web/app/` as thin files that only re-export from `src/pages/<page>` (and `src/app/entrypoint` for the root layout).
- An empty root `apps/web/pages/` (with a README) stops Next from treating `src/pages` as routes.
- All FSD layers live under `src/`. The FSD `app` layer uses FSD's own segment names: `entrypoint` (root layout, providers) and `styles` (global styles, generated design tokens).
- Rules are enforced, not just written down:
  - Steiger checks the FSD rules between slices (import direction, no cross-slice imports, public API only).
  - `eslint-plugin-boundaries` checks the five-layer rules inside slices (for example, a view may not import an adapter).
  - `no-restricted-imports` pins libraries to their layer: Zustand and TanStack Query only in `repository/` (and app providers), React Aria only in `shared/ui`.
- Live connection state lives in `entities/fleet` (its adapter owns the WebSocket) rather than a separate `entities/live-connection`, because only fleet data travels on that socket.

## Consequences

- The architecture is checked on every lint run; probes with deliberate violations were used to confirm each rule fires.
- Known limit: lint cannot see through a slice's `index.ts`, so a view importing another slice's repository hook through its public API is caught in review, not by lint.
