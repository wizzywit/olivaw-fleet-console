import { z } from 'zod';

const themedValue = z.union([z.string(), z.record(z.string(), z.string())]);
const tokenList = z.object({ tokens: z.array(z.object({ name: z.string(), value: themedValue })) });

const tokenFileSchema = z.object({
  color: z.object({
    themes: z.array(z.object({ id: z.string() })).min(1),
    tokens: z.array(z.object({ name: z.string(), value: themedValue })),
  }),
  type: z.object({ families: z.record(z.string(), z.string()) }),
  spacing: tokenList,
  radius: tokenList,
  size: tokenList,
  shadow: tokenList,
});

type TokenFile = z.infer<typeof tokenFileSchema>;
type ThemedToken = TokenFile['color']['tokens'][number];

const toCssValue = (value: string) => value.replace(/^\{(.+)\}$/, 'var(--$1)');

function valueFor(token: ThemedToken, themeId: string, firstThemeId: string): string | undefined {
  if (typeof token.value === 'string') return themeId === firstThemeId ? token.value : undefined;
  return token.value[themeId] ?? (themeId === firstThemeId ? undefined : token.value[firstThemeId]);
}

const declarations = (entries: [string, string][]) =>
  entries.map(([name, value]) => `  --${name}: ${toCssValue(value)};`).join('\n');

export function buildTokensCss(input: unknown): string {
  const tokens = tokenFileSchema.parse(input);
  const [firstTheme, ...otherThemes] = tokens.color.themes;
  if (firstTheme === undefined) throw new Error('tokens need at least one theme');
  const themed = [...tokens.color.tokens, ...tokens.shadow.tokens];

  const themeBlock = (themeId: string) =>
    declarations(
      themed.flatMap((token) => {
        const value = valueFor(token, themeId, firstTheme.id);
        return value === undefined ? [] : [[token.name, value] as [string, string]];
      }),
    );

  const plain = [...tokens.spacing.tokens, ...tokens.radius.tokens, ...tokens.size.tokens].map(
    (token): [string, string] => [token.name, typeof token.value === 'string' ? token.value : ''],
  );
  const fonts = Object.entries(tokens.type.families).map(([key, stack]): [string, string] => [
    `font-${key}`,
    stack,
  ]);

  return [
    '/* Generated from design/tokens.json by scripts/build-tokens.ts. Do not edit by hand. */',
    `:root, [data-theme="${firstTheme.id}"] {\n${themeBlock(firstTheme.id)}\n}`,
    ...otherThemes.map((theme) => `[data-theme="${theme.id}"] {\n${themeBlock(theme.id)}\n}`),
    ...otherThemes
      .filter((theme) => theme.id === 'dark')
      .map(
        (theme) =>
          `@media (prefers-color-scheme: dark) {\n:root:not([data-theme]) {\n${themeBlock(theme.id)}\n}\n}`,
      ),
    `:root {\n${declarations([...plain, ...fonts])}\n}`,
    '',
  ].join('\n\n');
}
