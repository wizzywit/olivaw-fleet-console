# 0001. Monorepo with a thin TypeScript backend

- Status: accepted
- Date: 2026-11-13

## Context

The challenge has three parts (simulator, server, UI) and asks candidates to pick at least one. The role is frontend-focused, but the on-site interview covers real-time updates and how the design holds up at 100× fleet size, and that conversation is weak if the backend is a fixture.

## Decision

Build all three parts in one pnpm workspace: `apps/simulator`, `apps/ingest`, `apps/web`, plus shared packages for protocol types (`packages/protocols`), the console API contract (`packages/contracts`) and demo sites (`packages/demo-world`). The backend is TypeScript and deliberately thin: one process with clear internal boundaries (protocol adapters, robot domain, store, transport).

## Options considered

- Frontend only, with mocked data: every hour goes to the UI, but ingestion, staleness and live transport would be invented, not shown.
- Thin TypeScript backend (chosen): the frontend still gets most of the time; contracts are shared and type-checked end to end; the scale story has code behind it.
- Go backend: the strongest backend signal for Olivaw's stack, but it costs the most time and splits types across two languages.

## Consequences

- One `pnpm dev` runs the whole system; one CI pipeline checks it.
- Shared contracts make API drift a compile error, while each consumer still maps DTOs to its own domain types.
- The ingest process is a single node by design; ADR 0005 and the README describe where it would split.
