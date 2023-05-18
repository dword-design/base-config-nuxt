import packageName from 'depcheck-package-name'

export default {
  extends: packageName`@dword-design/eslint-config`,
  rules: {
    'import/no-unresolved': ['error', { ignore: ['#app'] }],
    'import/no-webpack-loader-syntax': 'off',
  },
}
