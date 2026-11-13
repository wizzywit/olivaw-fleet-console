export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['src/app/styles/tokens.css'],
  rules: {
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
    'selector-class-pattern': null,
    'declaration-no-important': true,
  },
  overrides: [
    {
      files: ['**/*.module.css'],
      rules: { 'color-no-hex': true, 'color-named': 'never' },
    },
    {
      files: ['src/app/styles/global.css'],
      rules: { 'declaration-no-important': null },
    },
  ],
};
