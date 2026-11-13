# 0013. Commit convention

- Status: accepted
- Date: 2026-11-13

## Context

The reviewer reads commit history as evidence of how the work was done. A history of small, well-named steps shows the decisions; a few large commits hide them.

## Decision

Conventional Commits with a required scope, title only: `type(scope): summary`, imperative, lowercase, at most 72 characters, no body and no footer. Scopes follow the repository layout: `repo`, `ci`, `docs`, `adr`, `protocols`, `contracts`, `demo-world`, `ingest`, `simulator`, `web`, and `web/<slice>` for frontend slices (for example `web/fleet-overview`).

Enforced by commitlint (`commitlint.config.mjs`, including a custom scope rule) in a Husky `commit-msg` hook.

## Options considered

- Conventional Commits without scopes: simpler, but the history no longer says where a change landed.
- Free-form messages: no tooling cost, no consistency.

## Consequences

- The history can be read as the architecture being built, slice by slice.
- Reasoning that does not fit a title goes into ADRs and the README, not commit bodies.
