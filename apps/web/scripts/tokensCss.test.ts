// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildTokensCss } from './tokensCss';

const tokens: unknown = JSON.parse(
  readFileSync(new URL('../../../design/tokens.json', import.meta.url), 'utf8'),
);

const block = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf('}', start));
};

describe('buildTokensCss', () => {
  const css = buildTokensCss(tokens);

  it('declares light colours on :root and the light theme', () => {
    expect(block(css, ':root, [data-theme="light"]')).toContain('--accent: #4338ca;');
  });

  it('overrides colours for the dark theme', () => {
    expect(block(css, '[data-theme="dark"]')).toContain('--accent: #8b93ff;');
  });

  it('turns aliases into variable references', () => {
    expect(css).toContain('--focus-ring: var(--accent);');
  });

  it('declares spacing, radius, size, font and shadow tokens', () => {
    expect(css).toContain('--space-4: 16px;');
    expect(css).toContain('--radius-lg: 14px;');
    expect(css).toContain('--target-min: 44px;');
    expect(css).toContain('--font-sans: Inter, system-ui');
    expect(block(css, '[data-theme="dark"]')).toContain('--shadow-overlay: 0 24px 64px rgba(0, 0, 0, 0.50);');
  });

  it('rejects input that is not a token file', () => {
    expect(() => buildTokensCss({ color: 'nope' })).toThrow();
  });
});
