import packageName from 'depcheck-package-name';

export default config => ({
  extends: packageName`@dword-design/eslint-config`,
  globals: { $fetch: 'readonly' },
  overrides: [
    { files: 'pages/**/*.vue', globals: { definePageMeta: 'readonly' } },
  ],
  rules: {
    'import/extensions': [
      'error',
      'always',
      {
        ignorePackages: true,
        pathGroupOverrides: [{ action: 'ignore', pattern: '#*/**' }],
      },
    ],
    'import/no-unresolved': [
      'error',
      { ignore: ['#imports', '#components', ...config.importAliases] },
    ],
    'import/no-webpack-loader-syntax': 'off',
  },
});
