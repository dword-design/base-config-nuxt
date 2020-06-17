import getPackageName from 'get-package-name'

export default {
  extends: getPackageName(require.resolve('@dword-design/eslint-config')),
  rules: {
    'import/no-webpack-loader-syntax': 'off',
  },
}
