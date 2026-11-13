import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const sliceLayers = '{pages,widgets,features,entities}';
const segment = (name) => ({ type: name, pattern: `src/${sliceLayers}/*/${name}` });
const stateLibraries = {
  zustand: { name: 'zustand', message: 'Client state lives in a repository/ segment.' },
  query: { name: '@tanstack/react-query', message: 'Server state lives in a repository/ segment.' },
};
const reactAria = { name: 'react-aria-components', message: 'Use the components in shared/ui.' };
const types = (...list) => ({ to: { element: { types: { anyOf: list } } } });

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    // Five-layer rules inside slices (ARCHITECTURE.md §4). Steiger enforces the FSD rules between slices.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        segment('ui'),
        segment('use-cases'),
        segment('repository'),
        segment('services'),
        segment('adapter'),
        segment('types'),
        { type: 'public-api', pattern: `src/${sliceLayers}/*/index.ts` },
        { type: 'cross-entity-api', pattern: 'src/entities/*/@x/*.ts' },
        { type: 'shared-ui', pattern: 'src/shared/ui' },
        { type: 'shared-api', pattern: 'src/shared/api' },
        { type: 'shared-lib', pattern: 'src/shared/lib' },
        { type: 'shared-config', pattern: 'src/shared/config' },
      ],
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      'boundaries/dependencies': [
        2,
        {
          default: 'disallow',
          policies: [
            { from: { element: { type: 'app' } }, allow: { to: { element: { type: '*' } } } },
            {
              from: { element: { type: 'public-api' } },
              allow: types('ui', 'use-cases', 'repository', 'services', 'types'),
            },
            { from: { element: { type: 'cross-entity-api' } }, allow: types('types', 'services') },
            {
              from: { element: { type: 'ui' } },
              allow: types(
                'ui',
                'use-cases',
                'types',
                'public-api',
                'shared-ui',
                'shared-lib',
                'shared-config',
              ),
            },
            {
              from: { element: { type: 'use-cases' } },
              allow: types('services', 'repository', 'types', 'public-api', 'shared-lib', 'shared-config'),
            },
            {
              from: { element: { type: 'repository' } },
              allow: types(
                'repository',
                'adapter',
                'services',
                'types',
                'public-api',
                'cross-entity-api',
                'shared-lib',
                'shared-api',
                'shared-config',
              ),
            },
            {
              from: { element: { type: 'services' } },
              allow: types('services', 'types', 'public-api', 'cross-entity-api', 'shared-lib'),
            },
            {
              from: { element: { type: 'adapter' } },
              allow: types('types', 'cross-entity-api', 'shared-api', 'shared-lib', 'shared-config'),
            },
            { from: { element: { type: 'types' } }, allow: types('types', 'cross-entity-api') },
            { from: { element: { type: 'shared-ui' } }, allow: types('shared-ui', 'shared-lib') },
            {
              from: { element: { type: 'shared-api' } },
              allow: types('shared-api', 'shared-config', 'shared-lib'),
            },
            { from: { element: { type: 'shared-lib' } }, allow: types('shared-lib') },
            { from: { element: { type: 'shared-config' } }, allow: types('shared-config') },
          ],
        },
      ],
    },
  },
  // Libraries pinned to their layer: state libraries in repositories (ARCHITECTURE.md §7), React Aria in shared/ui.
  {
    files: ['src/shared/ui/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: [stateLibraries.zustand, stateLibraries.query] }] },
  },
  {
    files: ['src/**/repository/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: [reactAria] }] },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/shared/ui/**',
      'src/**/repository/**',
      'src/app/**',
      'src/**/*.test.{ts,tsx}',
      'src/test/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [stateLibraries.zustand, stateLibraries.query, reactAria] },
      ],
    },
  },
  { files: ['**/*.{js,mjs,cjs}'], ...tseslint.configs.disableTypeChecked },
  prettier,
);
