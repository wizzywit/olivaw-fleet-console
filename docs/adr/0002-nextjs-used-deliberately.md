# 0002. Next.js, used deliberately

- Status: accepted
- Date: 2026-11-13

## Context

The console is a live, client-heavy screen: most of what it shows changes every second over a WebSocket. Olivaw's frontend runs on Next.js, and the role asks for React and Next.js at architecture level.

## Decision

Use Next.js (App Router) and keep the server's role small and explicit: route files, the first fleet snapshot prefetched on the server through the same repository query options and adapter the client uses (handed over with TanStack Query's `HydrationBoundary`), and a rewrite that proxies `/api/*` to ingest so the browser has one origin. Everything live runs on the client.

## Options considered

- Vite + React SPA: the cleanest fit for a live console and a static bundle that runs on any customer server; does not match Olivaw's stack.
- Next.js with server components for data (rejected): a second data path next to TanStack Query and the live store, which breaks the rule that only adapters talk to the outside.
- Next.js used deliberately (chosen): matches the stack, keeps one data path.

## Consequences

- Server rendering delivers the snapshot with the page, so hydration needs no extra request; the first paint is the loading state because the live store is seeded on the client only (it is module state shared across requests on the server). The five-layer rules hold unchanged.
- On-prem: `output: 'standalone'` produces one Node image; a static export is possible if the prefetch is dropped.
