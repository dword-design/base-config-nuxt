import depcheckConfig from '@dword-design/depcheck-config-vue'
import depcheckSpecial from 'depcheck-special-nuxt'
import getPackageName from 'get-package-name'
import outputFiles from 'output-files'

import analyze from './analyze'
import dev from './dev'
import eslintConfig from './eslint.config'
import lint from './lint'
import nuxtConfig from './nuxt.config'
import prepublishOnly from './prepublish-only'
import start from './start'

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
  editorIgnore: ['.eslintrc.json', '.stylelintrc.json', '.nuxt', 'dist'],
  packageConfig: {
    main: 'dist/index.js',
  },
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
