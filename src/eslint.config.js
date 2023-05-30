import packageName from 'depcheck-package-name'

export default {
  extends: packageName`@dword-design/eslint-config`,
  "globals": {
    "$fetch": "readonly",
  },
  rules: {
    'import/no-unresolved': ['error', { ignore: ['#imports'] }],
    'import/no-webpack-loader-syntax': 'off',
  },
}
