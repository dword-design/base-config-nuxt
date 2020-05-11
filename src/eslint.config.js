import getPackageName from 'get-package-name'

export default {
  extends: getPackageName(require.resolve('@dword-design/eslint-config')),
  settings: {
    'import/resolver': {
      [getPackageName(require.resolve('eslint-import-resolver-nuxt'))]: {
        nuxtSrcDir: 'src',
      },
    },
  },
}
