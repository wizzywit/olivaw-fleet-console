import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const slicedLayers = 'pages|widgets|features|entities';
const segments = ['ui', 'use-cases', 'repository', 'services', 'adapter', 'types'];
const segment = (name) => ({
  type: name,
  pattern: `src/(${slicedLayers})/(*)/${name}`,
  capture: ['layer', 'slice'],
});
const sameSlice = { layer: '{{ from.captured.layer }}', slice: '{{ from.captured.slice }}' };
const toOwnSlice = (...list) => ({ to: { element: { types: { anyOf: list }, captured: sameSlice } } });
const lowerLayers = {
  pages: 'widgets|features|entities',
  widgets: 'features|entities',
  features: 'entities',
};
const toLowerPublicApi = (layer) => ({
  from: { element: { types: { anyOf: segments }, captured: { layer } } },
  allow: { to: { element: { type: 'public-api', captured: { layer: `(${lowerLayers[layer]})` } } } },
});
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
        ...segments.map(segment),
        { type: 'cross-entity-api', pattern: 'src/entities/(*)/@x', capture: ['slice'] },
        // Matched after the segments, so only files directly in the slice folder (its index.ts) land here.
        { type: 'public-api', pattern: `src/(${slicedLayers})/(*)`, capture: ['layer', 'slice'] },
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
            { from: { element: { type: 'public-api' } }, allow: toOwnSlice(...segments) },
            { from: { element: { type: 'ui' } }, allow: toOwnSlice('ui', 'use-cases', 'types') },
            {
              from: { element: { type: 'use-cases' } },
              allow: toOwnSlice('services', 'repository', 'types'),
            },
            {
              from: { element: { type: 'repository' } },
              allow: toOwnSlice('repository', 'adapter', 'services', 'types'),
            },
            { from: { element: { type: 'services' } }, allow: toOwnSlice('services', 'types') },
            { from: { element: { type: 'adapter' } }, allow: toOwnSlice('types') },
            { from: { element: { type: 'types' } }, allow: toOwnSlice('types') },
            toLowerPublicApi('pages'),
            toLowerPublicApi('widgets'),
            toLowerPublicApi('features'),
            {
              from: { element: { types: { anyOf: segments }, captured: { layer: 'entities' } } },
              allow: { to: { element: { type: 'cross-entity-api' } } },
            },
            {
              from: { element: { type: 'cross-entity-api' } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ['types', 'services'] },
                    captured: { layer: 'entities', slice: '{{ from.captured.slice }}' },
                  },
                },
              },
            },
            {
              from: { element: { types: { anyOf: segments } } },
              allow: types('shared-lib', 'shared-config'),
            },
            { from: { element: { type: 'ui' } }, allow: types('shared-ui') },
            { from: { element: { type: 'adapter' } }, allow: types('shared-api') },
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
