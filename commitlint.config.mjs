const scopes = [
  'repo',
  'ci',
  'docs',
  'adr',
  'protocols',
  'contracts',
  'demo-world',
  'ingest',
  'simulator',
  'web',
];

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-empty': [2, 'always'],
    'footer-empty': [2, 'always'],
    'header-max-length': [2, 'always', 72],
    'scope-empty': [2, 'never'],
    'scope-enum': [0],
    'olivaw-scope': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'olivaw-scope': ({ scope }) => {
          const valid = scope !== null && (scopes.includes(scope) || /^web\/[a-z0-9-]+$/.test(scope));
          return [valid, `scope must be one of ${scopes.join(', ')} or web/<slice>`];
        },
      },
    },
  ],
};
