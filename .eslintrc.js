module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:@typescript-eslint/recommended'],
  plugins: ['boundaries', 'unused-imports'],
  rules: {
    // ❌ No unused imports
    'unused-imports/no-unused-imports': 'error',

    // ❌ No any
    '@typescript-eslint/no-explicit-any': 'error',

    // Keep global rules minimal; token-style restrictions are enforced in UI overrides.
  },

  settings: {
    'boundaries/elements': [
      { type: 'ui', pattern: 'src/modules/*/ui/**' },
      { type: 'store', pattern: 'src/modules/*/store/**' },
      { type: 'domain', pattern: 'src/modules/*/domain/**' },
      { type: 'data', pattern: 'src/modules/*/data/**' },
      { type: 'infrastructure', pattern: 'src/infrastructure/**' },
    ],
  },

  overrides: [
    {
      files: ['src/modules/**/*'],
      rules: {
        // ❌ No hardcoded colors in feature modules (dark-theme safe)
        'no-restricted-syntax': [
          'error',
          {
            selector: 'Literal[value=/^#([0-9a-fA-F]{3}){1,2}$/]',
            message:
              'Do not use hardcoded colors in feature UI. Use theme tokens from useTheme().',
          },
        ],
        'boundaries/element-types': [
          'error',
          {
            default: 'disallow',
            rules: [
              { from: 'ui', allow: ['store'] },
              { from: 'store', allow: ['domain'] },
              { from: 'domain', allow: [] },
              { from: 'data', allow: ['domain', 'infrastructure'] },
            ],
          },
        ],
      },
    },
  ],
};
