# 0015. Theme from a cookie and the system preference

- Status: accepted
- Date: 2026-11-13

## Context

The console has a light and a dark theme. The first version stored the choice in `localStorage` and ran an inline script (`dangerouslySetInnerHTML`) before the first paint to set `data-theme`, with `suppressHydrationWarning` on `<html>`. That works, but it needs an inline script (a Content Security Policy then needs a nonce or hash for it), hides real hydration mismatches on `<html>`, and puts theme logic in a string nobody type-checks.

The layout already renders on every request (`connection()` for live fleet data), so reading a request cookie costs nothing extra.

## Decision

- The toggle writes the choice to the cookie `olivaw-theme` (`Path=/`, one year, `SameSite=Lax`) and sets `data-theme` on `<html>`.
- `RootLayout` reads the cookie with Next.js `cookies()` and renders `data-theme` in the first HTML. The parsing lives in the `toggle-theme` adapter (`readThemeCookie`), which takes the cookie store as an argument so no client bundle imports `next/headers`.
- Without a cookie, `data-theme` is absent and the generated `tokens.css` applies the dark tokens under `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }`. `color-scheme: light dark` lets form controls and scrollbars follow.
- The toggle state comes from `useSyncExternalStore`: the server snapshot is the cookie theme (light when absent), the client snapshot is `data-theme` or the system preference, and it re-reads when the system preference changes.

## Options considered

- Inline bootstrap script with `localStorage`: works on static pages, but needs an inline script and hides hydration warnings.
- Cookie plus CSS `prefers-color-scheme` (chosen): no script, correct first paint for both an explicit choice and the system default, standard browser features only.
- A library such as `next-themes`: well tested, but it is the same inline-script technique behind an API.

## Consequences

- No flash and no inline script. A strict Content Security Policy needs nothing for the theme.
- The page must render per request to read the cookie. That is already true here; a statically rendered page would need the script approach instead.
- Without a cookie, the server renders the toggle for light while CSS may already show dark. The toggle label switches right after hydration; colours are correct from the first paint.

## Sources

- MDN, `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- MDN, `color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme
- Next.js, `cookies()`: https://nextjs.org/docs/app/api-reference/functions/cookies
