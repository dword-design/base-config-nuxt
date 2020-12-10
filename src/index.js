import depcheckParserSass from '@dword-design/depcheck-parser-sass'
import packageName from 'depcheck-package-name'
import depcheckParserVue from 'depcheck-parser-vue'
import depcheckSpecialNuxt from 'depcheck-special-nuxt'
import outputFiles from 'output-files'

import analyze from './analyze'
import dev from './dev'
import eslintConfig from './eslint.config'
import lint from './lint'
import prepublishOnly from './prepublish-only'
import start from './start'

export default {
  allowedMatches: [
    'api',
    'assets',
    'components',
    'content',
    'i18n',
    'layouts',
    'middleware',
    'model',
    'modules',
    'nuxt.config.js',
    'pages',
    'plugins',
    'static',
    'store',
    'types',
  ],
  commands: {
    analyze,
    dev,
    prepublishOnly,
    start,
  },
  depcheckConfig: {
    parsers: {
      '*.scss': depcheckParserSass,
      '*.vue': depcheckParserVue,
    },
    specials: [depcheckSpecialNuxt],
  },
  editorIgnore: ['.eslintrc.json', '.stylelintrc.json', '.nuxt', 'dist'],
  gitignore: ['/.eslintrc.json', '/.stylelintrc.json', '/.nuxt', '/dist'],
  lint,
  npmPublish: true,
  packageConfig: {
    main: 'dist/index.js',
  },
  prepare: () =>
    outputFiles({
      '.eslintrc.json': JSON.stringify(eslintConfig, undefined, 2),
      '.stylelintrc.json': JSON.stringify(
        {
          extends: packageName`@dword-design/stylelint-config`,
        },
        undefined,
        2
      ),
    }),
  useJobMatrix: true,
}
