# 0009. CSS Modules with design-token variables

- Status: accepted
- Date: 2026-11-13

## Context

The design system (`design/tokens.json`) defines colors for light and dark themes, spacing, radii, sizes and shadows, with contrast measured per token.

## Decision

- `scripts/build-tokens.ts` generates `src/app/styles/tokens.css` from `design/tokens.json`: light values on `:root, [data-theme="light"]`, dark overrides on `[data-theme="dark"]` and, when no theme is chosen, under `prefers-color-scheme: dark` (ADR 0015), aliases such as `{accent}` as `var(--accent)`.
- Components use CSS Modules, one stylesheet next to each component in its own folder, reading only these variables. Stylelint forbids hex and named colors in `*.module.css`.
- Switching theme changes one attribute on `<html>`; no component re-renders.

## Options considered

- Tailwind CSS v4: fast to write, utility-heavy markup.
- vanilla-extract: type-safe tokens, adds a build plugin and does not work with server components out of the box.
- CSS Modules (chosen): plain CSS, clean markup, no runtime.

## Consequences

- One source of truth for tokens; the generator has tests.
- Fonts come from `next/font` (self-hosted at build time) and are wired into `--font-sans` and `--font-mono`.
