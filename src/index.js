import depcheckConfig from '@dword-design/depcheck-config-vue'
import outputFiles from 'output-files'
import getPackageName from 'get-package-name'
import nuxtConfig from './nuxt.config'
import dev from './dev'
import lint from './lint'
import prepublishOnly from './prepublish-only'
import analyze from './analyze'
import start from './start'
import depcheckSpecial from './depcheck-special'
import eslintConfig from './eslint.config'

export default {
  depcheckConfig: {
    ...depcheckConfig,
    specials: [...depcheckConfig.specials, depcheckSpecial],
  },
  allowedMatches: [
    'api',
    'assets',
    'components',
    'i18n',
    'layouts',
    'model',
    'modules',
    'nuxt.config.js',
    'pages',
    'plugins',
    'static',
    'store',
    'types',
  ],
  gitignore: ['/.eslintrc.json', '/.stylelintrc.json', '/.nuxt', '/dist'],
  main: 'dist/index.js',
  prepare: () =>
    outputFiles({
      '.eslintrc.json': JSON.stringify(eslintConfig, undefined, 2),
      '.stylelintrc.json': JSON.stringify(
        {
          extends: getPackageName(
            require.resolve('@dword-design/stylelint-config')
          ),
        },
        undefined,
        2
      ),
    }),
  lint,
  commands: {
    dev,
    prepublishOnly,
    analyze,
    start,
  },
  nuxtConfig,
  nuxtConfigFilename: require.resolve('./nuxt.config'),
  npmPublish: true,
  useJobMatrix: true,
}
